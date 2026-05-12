const params = new URLSearchParams(window.location.search);
const video = document.getElementById('storyVideo');
const skipBtn = document.getElementById('skipVideoBtn');
const nowPlaying = document.getElementById('videoNowPlaying');

const src = params.get('src') || 'assets/videos/1.mp4';
const next = params.get('next') || 'index.html?start=campaign';
const resolvedSrc = new URL(src, window.location.href);
const videoName = resolvedSrc.pathname.split('/').pop() || src;

function goNext() {
  window.location.href = next;
}

video.src = resolvedSrc.href;
if (nowPlaying) nowPlaying.textContent = `Playing MP4: ${videoName}`;
console.info(`[Road to Agartha] Playing MP4: ${src}`);
video.addEventListener('ended', goNext);
skipBtn.addEventListener('click', goNext);
video.addEventListener('play', () => {
  if (nowPlaying) nowPlaying.textContent = `Playing MP4: ${videoName}`;
});
video.addEventListener('error', () => {
  if (nowPlaying) nowPlaying.textContent = `MP4 missing or blocked: ${videoName}`;
  skipBtn.textContent = 'Continue';
});

video.play().catch(() => {
  skipBtn.textContent = 'Play / Skip';
});
