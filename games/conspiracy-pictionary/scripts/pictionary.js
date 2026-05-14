(() => {
  const MATCH_POINTS = 5;
  const ROUND_SECONDS = 90;
  const AUTH_MODULE_URL = new URL("../../js/supabaseClient.js", window.location.href).href;
  const LOGIN_URL = "../../pages/login.html";
  const PROFILE_URL = "../../pages/profile.html";
  const SCORE_SAVE_PREFIX = "um.pictionary.scoreSaved.";

  let auth = null;
  let supabase = null;
  let currentUser = null;
  let currentProfile = null;
  let username = "";
  let currentRoom = "";
  let roomData = null;
  let isDrawer = false;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;
  let channel = null;
  let timerId = null;
  let secondsLeft = ROUND_SECONDS;
  let booted = false;

  const clientId = crypto.randomUUID ? crypto.randomUUID() : String(Math.random());

  const els = {
    menuScreen: document.getElementById("menuScreen"),
    gameScreen: document.getElementById("gameScreen"),
    createRoomBtn: document.getElementById("createRoomBtn"),
    joinRoomBtn: document.getElementById("joinRoomBtn"),
    roomCodeInput: document.getElementById("roomCodeInput"),
    roomStatus: document.getElementById("roomStatus"),
    profileStatus: document.getElementById("profileStatus"),
    profileName: document.getElementById("profileName"),
    profileDetail: document.getElementById("profileDetail"),
    copyRoomBtn: document.getElementById("copyRoomBtn"),
    roomCodeDisplay: document.getElementById("roomCodeDisplay"),
    roleDisplay: document.getElementById("roleDisplay"),
    secretTheory: document.getElementById("secretTheory"),
    player1Name: document.getElementById("player1Name"),
    player2Name: document.getElementById("player2Name"),
    player1Score: document.getElementById("player1Score"),
    player2Score: document.getElementById("player2Score"),
    matchTarget: document.getElementById("matchTarget"),
    timer: document.getElementById("timer"),
    canvas: document.getElementById("drawingCanvas"),
    guessInput: document.getElementById("guessInput"),
    sendGuessBtn: document.getElementById("sendGuessBtn"),
    guessLog: document.getElementById("guessLog"),
    clearCanvasBtn: document.getElementById("clearCanvasBtn"),
    newRoundBtn: document.getElementById("newRoundBtn"),
    brushSize: document.getElementById("brushSize"),
    brushColor: document.getElementById("brushColor")
  };

  const ctx = els.canvas.getContext("2d");

  function setStatus(message, type = "") {
    els.roomStatus.textContent = message || "";
    els.roomStatus.className = type;
  }

  function setProfileMessage(message, detail = "", type = "") {
    els.profileStatus.className = `profile-card ${type}`.trim();
    els.profileName.textContent = message;
    els.profileDetail.replaceChildren(document.createTextNode(detail));
  }

  function setProfileLink(message, href, label) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    link.className = "inline-link";
    els.profileStatus.className = "profile-card error";
    els.profileName.textContent = message;
    els.profileDetail.replaceChildren(link);
  }

  function requireProfile() {
    if (!currentUser) {
      setStatus("Sign in before creating or joining a room.", "error");
      return false;
    }
    if (!currentProfile?.username) {
      setStatus("Create a profile username before playing.", "error");
      return false;
    }
    return true;
  }

  function generateRoomCode() {
    return Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function randomPrompt() {
    return conspiracyPrompts[Math.floor(Math.random() * conspiracyPrompts.length)];
  }

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function isParticipant(data = roomData) {
    return Boolean(data && currentUser && [data.player1_id, data.player2_id].includes(currentUser.id));
  }

  function currentPlayerScore(data = roomData) {
    if (!data || !currentUser) return 0;
    if (data.player1_id === currentUser.id) return Number(data.player1_score || 0);
    if (data.player2_id === currentUser.id) return Number(data.player2_score || 0);
    return 0;
  }

  function participantNameById(userId) {
    if (!roomData) return "Player";
    if (roomData.player1_id === userId) return roomData.player1 || "Player 1";
    if (roomData.player2_id === userId) return roomData.player2 || "Player 2";
    return "Player";
  }

  function participantSlotById(userId) {
    if (!roomData) return "";
    if (roomData.player1_id === userId) return "player1";
    if (roomData.player2_id === userId) return "player2";
    return "";
  }

  function clearCanvasLocal() {
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  }

  function setBrush() {
    ctx.lineWidth = Number(els.brushSize.value || 5);
    ctx.strokeStyle = els.brushColor.value || "#111111";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function setControls() {
    const playing = roomData?.status === "playing";
    const complete = roomData?.status === "complete";
    const waiting = roomData?.status === "waiting";
    const canDraw = isDrawer && playing;
    const canGuess = !isDrawer && playing && isParticipant();

    els.guessInput.disabled = !canGuess;
    els.sendGuessBtn.disabled = !canGuess;
    els.clearCanvasBtn.disabled = !canDraw;
    els.newRoundBtn.disabled = !(isDrawer && playing);
    els.canvas.classList.toggle("can-draw", canDraw);

    if (waiting) {
      els.guessInput.placeholder = "Waiting for player 2";
    } else if (complete) {
      els.guessInput.placeholder = "Match complete";
    } else {
      els.guessInput.placeholder = canGuess ? "Type a guess" : "Drawer cannot guess";
    }
  }

  function applyRoomData(data) {
    const previousRound = roomData?.round_number;
    roomData = data;
    isDrawer = data.drawer_id === currentUser?.id;

    els.roomCodeDisplay.textContent = data.room_code || currentRoom;
    els.player1Name.textContent = data.player1 || "P1";
    els.player2Name.textContent = data.player2 || "Waiting";
    els.player1Score.textContent = data.player1_score ?? 0;
    els.player2Score.textContent = data.player2_score ?? 0;
    els.matchTarget.textContent = `First to ${MATCH_POINTS}`;

    if (data.status === "complete") {
      const winnerName = data.winner || participantNameById(data.winner_id);
      els.roleDisplay.textContent = data.winner_id === currentUser?.id ? "YOU WON" : "MATCH COMPLETE";
      els.secretTheory.textContent = `${winnerName} wins the room.`;
      setStatus(`Match complete. ${winnerName} reached ${MATCH_POINTS}.`, "ok");
      stopTimer();
      maybeSaveFinalScore(data);
    } else if (data.status === "waiting") {
      els.roleDisplay.textContent = "WAITING";
      els.secretTheory.textContent = isDrawer ? data.theory : "Hidden until the room starts.";
      setStatus(`Room ${data.room_code} is ready. Send the code to player 2.`, "ok");
    } else {
      els.roleDisplay.textContent = isDrawer ? "DRAWER" : "GUESSER";
      els.secretTheory.textContent = isDrawer ? data.theory : "Hidden";
      setStatus(isDrawer ? "Draw the theory. Use the mark button if a guess is right." : "Guess what the drawing means.", "ok");
      startLocalTimer();
    }

    if (previousRound && previousRound !== data.round_number) {
      clearCanvasLocal();
      els.guessLog.replaceChildren();
      resetTimer();
    }

    setControls();
  }

  async function loadAuth() {
    auth = await import(AUTH_MODULE_URL);
    supabase = auth.supabase;
    const result = await auth.getCurrentUserAndProfile();

    if (result.error) {
      console.error("Pictionary profile check failed:", result.error);
      setProfileMessage("Profile check failed", result.error.message, "error");
      setStatus(result.error.message, "error");
      return;
    }

    currentUser = result.user;
    currentProfile = result.profile;

    if (!currentUser) {
      setProfileLink("Not signed in", LOGIN_URL, "Sign in to play");
      setStatus("Sign in to create or join a room.", "error");
      setMenuEnabled(false);
      return;
    }

    if (!currentProfile?.username) {
      setProfileLink("Profile missing", PROFILE_URL, "Create your profile");
      setStatus("Create a profile username before playing.", "error");
      setMenuEnabled(false);
      return;
    }

    username = auth.displayName(currentProfile, currentUser.email?.split("@")[0] || "Player");
    setProfileMessage(username, `@${currentProfile.username}`, "ok");
    setStatus("Ready. Create a room or join with a code.", "ok");
    setMenuEnabled(true);
  }

  function setMenuEnabled(enabled) {
    els.createRoomBtn.disabled = !enabled;
    els.joinRoomBtn.disabled = !enabled;
    els.roomCodeInput.disabled = !enabled;
  }

  async function createRoom() {
    if (!requireProfile()) return;

    setStatus("Creating room...");
    const roomCode = generateRoomCode();
    const theory = randomPrompt();

    const { error } = await supabase
      .from("pictionary_rooms")
      .insert({
        room_code: roomCode,
        theory,
        player1: username,
        player1_id: currentUser.id,
        player2: null,
        player2_id: null,
        drawer: username,
        drawer_id: currentUser.id,
        guesser: null,
        guesser_id: null,
        player1_score: 0,
        player2_score: 0,
        round_number: 1,
        status: "waiting",
        winner: null,
        winner_id: null,
        ended_at: null,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Could not create pictionary room:", error);
      setStatus(`Could not create room: ${error.message}. Run the pictionary Supabase setup SQL.`, "error");
      return;
    }

    currentRoom = roomCode;
    await startGame();
  }

  async function joinRoom() {
    if (!requireProfile()) return;

    const roomCode = els.roomCodeInput.value.trim().toUpperCase();
    if (!roomCode) {
      setStatus("Enter a room code to join.", "error");
      return;
    }

    setStatus("Joining room...");
    const { data, error } = await supabase
      .from("pictionary_rooms")
      .select("*")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (error || !data) {
      console.error("Pictionary room lookup failed:", error);
      setStatus(error ? `Room lookup failed: ${error.message}` : "Room not found.", "error");
      return;
    }

    if (data.player1_id === currentUser.id || data.player2_id === currentUser.id) {
      currentRoom = roomCode;
      await startGame();
      return;
    }

    if (data.player2_id) {
      setStatus("Room already has two players.", "error");
      return;
    }

    const { error: updateError } = await supabase
      .from("pictionary_rooms")
      .update({
        player2: username,
        player2_id: currentUser.id,
        guesser: username,
        guesser_id: currentUser.id,
        status: "playing",
        updated_at: new Date().toISOString()
      })
      .eq("room_code", roomCode);

    if (updateError) {
      console.error("Could not join pictionary room:", updateError);
      setStatus(`Could not join room: ${updateError.message}`, "error");
      return;
    }

    currentRoom = roomCode;
    await startGame();
  }

  async function startGame() {
    els.menuScreen.classList.add("hidden");
    els.gameScreen.classList.remove("hidden");
    els.roomCodeDisplay.textContent = currentRoom;
    window.UMGameScores?.init({
      game: "Conspiracy Pictionary",
      title: "Conspiracy Pictionary Leaderboard"
    });

    await loadRoom();
    subscribeToRoom();
  }

  async function loadRoom() {
    const { data, error } = await supabase
      .from("pictionary_rooms")
      .select("*")
      .eq("room_code", currentRoom)
      .maybeSingle();

    if (error || !data) {
      console.error("Pictionary room load failed:", error);
      setStatus(error ? `Room load failed: ${error.message}` : "Room not found.", "error");
      return;
    }

    applyRoomData(data);
  }

  function subscribeToRoom() {
    if (channel) return;

    channel = supabase.channel(`pictionary:${currentRoom}`);

    channel
      .on("broadcast", { event: "draw" }, (payload) => {
        if (payload.payload.sender === clientId) return;
        drawLine(
          payload.payload.x1,
          payload.payload.y1,
          payload.payload.x2,
          payload.payload.y2,
          payload.payload.color,
          payload.payload.size
        );
      })
      .on("broadcast", { event: "guess" }, (payload) => {
        addGuess(payload.payload.user, payload.payload.text, payload.payload.correct, payload.payload.userId);
      })
      .on("broadcast", { event: "clear" }, (payload) => {
        if (payload.payload.sender === clientId) return;
        clearCanvasLocal();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "pictionary_rooms",
        filter: `room_code=eq.${currentRoom}`
      }, (payload) => {
        applyRoomData(payload.new);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setStatus("Realtime room connected.", "ok");
      });
  }

  function getCanvasPoint(event) {
    const rect = els.canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;

    return {
      x: (point.clientX - rect.left) * (els.canvas.width / rect.width),
      y: (point.clientY - rect.top) * (els.canvas.height / rect.height)
    };
  }

  function startDrawing(event) {
    if (!isDrawer || roomData?.status !== "playing") return;
    event.preventDefault();

    const point = getCanvasPoint(event);
    drawing = true;
    lastX = point.x;
    lastY = point.y;
  }

  function stopDrawing() {
    drawing = false;
  }

  async function continueDrawing(event) {
    if (!drawing || !isDrawer || roomData?.status !== "playing") return;
    event.preventDefault();

    const point = getCanvasPoint(event);
    const color = els.brushColor.value || "#111111";
    const size = Number(els.brushSize.value || 5);

    drawLine(lastX, lastY, point.x, point.y, color, size);

    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "draw",
        payload: {
          sender: clientId,
          x1: lastX,
          y1: lastY,
          x2: point.x,
          y2: point.y,
          color,
          size
        }
      });
    }

    lastX = point.x;
    lastY = point.y;
  }

  function drawLine(x1, y1, x2, y2, color = "#111111", size = 5) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  async function clearCanvasRemote() {
    if (!isDrawer) return;
    clearCanvasLocal();

    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "clear",
        payload: { sender: clientId }
      });
    }
  }

  async function sendGuess() {
    if (isDrawer || roomData?.status !== "playing") return;

    const guess = els.guessInput.value.trim();
    if (!guess) return;

    els.guessInput.value = "";
    const correct = normalize(guess) === normalize(roomData?.theory);

    addGuess(username, guess, correct, currentUser.id);

    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "guess",
        payload: {
          user: username,
          userId: currentUser.id,
          text: guess,
          correct
        }
      });
    }

    if (correct) await handleCorrectGuess(currentUser.id);
  }

  function addGuess(user, text, correct = false, userId = "") {
    const row = document.createElement("div");
    row.className = correct ? "guess correctGuess" : "guess";

    const body = document.createElement("div");
    const name = document.createElement("b");
    name.textContent = `${user}:`;
    body.append(name, " ", document.createTextNode(text), correct ? " CORRECT" : "");
    row.appendChild(body);

    if (isDrawer && !correct && roomData?.status === "playing" && participantSlotById(userId)) {
      const mark = document.createElement("button");
      mark.type = "button";
      mark.className = "mark-correct";
      mark.textContent = "Mark correct";
      mark.addEventListener("click", () => handleCorrectGuess(userId));
      row.appendChild(mark);
    }

    els.guessLog.prepend(row);
  }

  async function handleCorrectGuess(guesserId) {
    if (!roomData || roomData.status !== "playing") return;
    const slot = participantSlotById(guesserId);
    if (!slot) return;

    const player1Score = Number(roomData.player1_score || 0) + (slot === "player1" ? 1 : 0);
    const player2Score = Number(roomData.player2_score || 0) + (slot === "player2" ? 1 : 0);
    const winnerId = player1Score >= MATCH_POINTS ? roomData.player1_id : player2Score >= MATCH_POINTS ? roomData.player2_id : null;
    const winner = winnerId ? participantNameById(winnerId) : null;

    if (winnerId) {
      await updateRoom({
        player1_score: player1Score,
        player2_score: player2Score,
        status: "complete",
        winner_id: winnerId,
        winner,
        ended_at: new Date().toISOString()
      });
      return;
    }

    await nextRound({ player1Score, player2Score });
  }

  async function nextRound(scores = {}) {
    if (!roomData || roomData.status === "complete") return;

    const nextDrawer = roomData.drawer_id === roomData.player1_id ? roomData.player2 : roomData.player1;
    const nextDrawerId = roomData.drawer_id === roomData.player1_id ? roomData.player2_id : roomData.player1_id;
    const nextGuesser = nextDrawerId === roomData.player1_id ? roomData.player2 : roomData.player1;
    const nextGuesserId = nextDrawerId === roomData.player1_id ? roomData.player2_id : roomData.player1_id;

    if (!nextDrawerId || !nextGuesserId) {
      setStatus("Waiting for both players before starting another round.", "error");
      return;
    }

    await updateRoom({
      theory: randomPrompt(),
      drawer: nextDrawer,
      drawer_id: nextDrawerId,
      guesser: nextGuesser,
      guesser_id: nextGuesserId,
      player1_score: Number.isFinite(scores.player1Score) ? scores.player1Score : roomData.player1_score,
      player2_score: Number.isFinite(scores.player2Score) ? scores.player2Score : roomData.player2_score,
      round_number: (roomData.round_number || 1) + 1,
      status: "playing"
    });
  }

  async function updateRoom(patch) {
    const { error } = await supabase
      .from("pictionary_rooms")
      .update({
        ...patch,
        updated_at: new Date().toISOString()
      })
      .eq("room_code", currentRoom);

    if (error) {
      console.error("Pictionary room update failed:", error);
      setStatus(`Room update failed: ${error.message}`, "error");
    }
  }

  function startLocalTimer() {
    if (timerId) return;

    timerId = setInterval(() => {
      if (!isDrawer || roomData?.status !== "playing") return;
      secondsLeft -= 1;
      els.timer.textContent = secondsLeft;

      if (secondsLeft <= 0) {
        resetTimer();
        nextRound();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function resetTimer() {
    secondsLeft = ROUND_SECONDS;
    els.timer.textContent = secondsLeft;
  }

  function maybeSaveFinalScore(data) {
    if (!isParticipant(data) || !window.UMGameScores) return;
    const key = `${SCORE_SAVE_PREFIX}${data.room_code}.${currentUser.id}`;
    if (localStorage.getItem(key)) return;

    const playerScore = currentPlayerScore(data);
    const winnerBonus = data.winner_id === currentUser.id ? 250 : 0;
    const score = playerScore * 100 + winnerBonus;
    window.UMGameScores.submitScore(score, {
      game: "Conspiracy Pictionary",
      reason: `match-complete:${data.room_code}`
    }).then((result) => {
      if (result?.saved) localStorage.setItem(key, "1");
    });
  }

  async function copyRoomCode() {
    const code = currentRoom || els.roomCodeDisplay.textContent.trim();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setStatus(`Copied room code ${code}.`, "ok");
    } catch (_error) {
      setStatus(`Room code: ${code}`, "ok");
    }
  }

  function bindEvents() {
    setBrush();
    els.brushSize.addEventListener("input", setBrush);
    els.brushColor.addEventListener("input", setBrush);
    els.createRoomBtn.addEventListener("click", createRoom);
    els.joinRoomBtn.addEventListener("click", joinRoom);
    els.copyRoomBtn.addEventListener("click", copyRoomCode);
    els.clearCanvasBtn.addEventListener("click", clearCanvasRemote);
    els.newRoundBtn.addEventListener("click", () => nextRound());
    els.sendGuessBtn.addEventListener("click", sendGuess);
    els.guessInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") sendGuess();
    });

    els.canvas.addEventListener("mousedown", startDrawing);
    els.canvas.addEventListener("mouseup", stopDrawing);
    els.canvas.addEventListener("mouseleave", stopDrawing);
    els.canvas.addEventListener("mousemove", continueDrawing);
    els.canvas.addEventListener("touchstart", startDrawing, { passive: false });
    els.canvas.addEventListener("touchend", stopDrawing, { passive: false });
    els.canvas.addEventListener("touchcancel", stopDrawing, { passive: false });
    els.canvas.addEventListener("touchmove", continueDrawing, { passive: false });
  }

  async function boot() {
    if (booted) return;
    booted = true;
    setMenuEnabled(false);
    setStatus("Checking sign in...");
    bindEvents();
    window.UMGameScores?.init({
      game: "Conspiracy Pictionary",
      title: "Conspiracy Pictionary Leaderboard"
    });
    await loadAuth();
  }

  boot();
})();
