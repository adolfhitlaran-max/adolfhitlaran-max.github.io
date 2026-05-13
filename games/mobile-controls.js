(() => {
  const keyMap = {
    ArrowUp: { key: "ArrowUp" },
    ArrowDown: { key: "ArrowDown" },
    ArrowLeft: { key: "ArrowLeft" },
    ArrowRight: { key: "ArrowRight" },
    Escape: { key: "Escape" },
    ShiftLeft: { key: "Shift" },
    Space: { key: " " },
    KeyA: { key: "a" },
    KeyD: { key: "d" },
    KeyE: { key: "e" },
    KeyF: { key: "f" },
    KeyJ: { key: "j" },
    KeyP: { key: "p" },
    KeyQ: { key: "q" },
    KeyR: { key: "r" },
    KeyS: { key: "s" },
    KeyW: { key: "w" }
  };

  const activeKeys = new Set();

  function eventFor(type, code) {
    const meta = keyMap[code] || { key: code };
    return new KeyboardEvent(type, {
      key: meta.key,
      code,
      bubbles: true,
      cancelable: true
    });
  }

  function press(code) {
    if (!code || activeKeys.has(code)) return;
    activeKeys.add(code);
    window.dispatchEvent(eventFor("keydown", code));
  }

  function release(code) {
    if (!code || !activeKeys.has(code)) return;
    activeKeys.delete(code);
    window.dispatchEvent(eventFor("keyup", code));
  }

  function tap(code) {
    if (!code) return;
    window.dispatchEvent(eventFor("keydown", code));
    window.dispatchEvent(eventFor("keyup", code));
  }

  function releaseAll() {
    for (const code of [...activeKeys]) release(code);
  }

  function bindButton(button) {
    const code = button.dataset.mobileKey;
    const mode = button.dataset.mobileMode || "hold";
    if (!code) return;

    const end = (event) => {
      event.preventDefault();
      button.classList.remove("is-held");
      if (mode !== "tap") release(code);
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("is-held");
      if (mode === "tap") tap(code);
      else press(code);
    });

    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("lostpointercapture", () => {
      button.classList.remove("is-held");
      if (mode !== "tap") release(code);
    });

    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function init() {
    document.querySelectorAll("[data-mobile-key]").forEach(bindButton);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) releaseAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
