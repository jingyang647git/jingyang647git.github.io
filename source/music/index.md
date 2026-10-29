---
title: music
---

<style>
.music-page {
min-height: 60vh;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 40px 20px;
}

/* 封面 */
.music-cover {
width: 340px;
height: 340px;
border-radius: 20px;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background-size: cover;
background-position: center;
box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
display: flex;
align-items: center;
justify-content: center;
font-size: 96px;
color: rgba(255, 255, 255, 0.9);
margin-bottom: 28px;
position: relative;
overflow: hidden;
}
.music-cover.playing {
animation: rotate 8s linear infinite, pulse 2s ease-in-out infinite;
}
@keyframes rotate {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}
@keyframes pulse {
0%, 100% { box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4), 0 0 0 0 rgba(73, 177, 245, 0.5); }
50% { box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4), 0 0 0 16px rgba(73, 177, 245, 0); }
}

/* 歌曲信息 */
.music-title {
font-size: 28px;
font-weight: 700;
color: var(--font-color, #4c4948);
margin: 0 0 8px 0;
text-align: center;
text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.music-artist {
font-size: 17px;
color: #888;
margin: 0 0 32px 0;
text-align: center;
text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

/* 自定义播放器 */
.custom-player {
width: 100%;
max-width: 640px;
padding: 20px 24px;
border-radius: 20px;
background: rgba(255, 255, 255, 0.12);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
[data-theme="dark"] .custom-player {
background: rgba(0, 0, 0, 0.3);
border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 进度条 */
.player-progress {
position: relative;
height: 6px;
margin-bottom: 8px;
cursor: pointer;
border-radius: 3px;
}
.progress-bg,
.progress-loaded,
.progress-played {
position: absolute;
top: 0;
left: 0;
height: 100%;
border-radius: 3px;
}
.progress-bg {
width: 100%;
background: rgba(255, 255, 255, 0.2);
}
[data-theme="dark"] .progress-bg {
background: rgba(255, 255, 255, 0.1);
}
.progress-loaded {
background: rgba(255, 255, 255, 0.3);
}
.progress-played {
width: 0;
background: linear-gradient(90deg, #667eea, #764ba2);
position: relative;
}
.progress-thumb {
position: absolute;
right: -7px;
top: 50%;
transform: translateY(-50%);
width: 14px;
height: 14px;
border-radius: 50%;
background: #fff;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
opacity: 0;
transition: opacity 0.2s;
}
.player-progress:hover .progress-thumb {
opacity: 1;
}

/* 时间显示 */
.player-time {
display: flex;
justify-content: space-between;
font-size: 12px;
color: rgba(255, 255, 255, 0.85);
margin-bottom: 16px;
font-family: 'Courier New', monospace;
text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
[data-theme="dark"] .player-time {
color: rgba(255, 255, 255, 0.7);
}

/* 控制按钮 */
.player-controls {
display: flex;
justify-content: center;
align-items: center;
gap: 28px;
}
.control-btn {
background: transparent;
border: none;
color: #fff;
font-size: 18px;
cursor: pointer;
padding: 8px;
border-radius: 50%;
transition: all 0.2s;
text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.control-btn:hover {
transform: scale(1.15);
background: rgba(255, 255, 255, 0.15);
}
.control-btn:active {
transform: scale(0.95);
}
.control-btn-play {
width: 52px;
height: 52px;
font-size: 22px;
background: linear-gradient(135deg, #667eea, #764ba2);
box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}
.control-btn-play:hover {
box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

/* 暗色模式 - 文字 */
[data-theme="dark"] .music-title {
color: #c0c0c0;
}
[data-theme="dark"] .music-artist {
color: #999;
}

/* 移动端 */
@media (max-width: 600px) {
.music-cover {
width: 260px;
height: 260px;
font-size: 72px;
}
.music-title {
font-size: 22px;
}
.custom-player {
padding: 16px 18px;
border-radius: 16px;
}
.player-controls {
gap: 20px;
}
.control-btn-play {
width: 46px;
height: 46px;
font-size: 18px;
}
.control-btn {
font-size: 16px;
}
}
</style>

<div class="music-page">
<div class="music-cover" id="musicCover" style="background-image: url('https://y.gtimg.cn/music/photo_new/T002R300x300M000002jLGWe16Tf1H_1.jpg?max_age=2592000');">
<div class="music-disc"></div>
</div>
<p class="music-title" id="musicTitle">退后</p>
<p class="music-artist" id="musicArtist">周杰伦</p>

<!-- 自定义播放器 -->
<div class="custom-player" id="customPlayer">

<!-- 进度条 -->
<div class="player-progress" id="playerProgress">
<div class="progress-bg"></div>
<div class="progress-loaded" id="progressLoaded"></div>
<div class="progress-played" id="progressPlayed">
<div class="progress-thumb" id="progressThumb"></div>
</div>
</div>

<!-- 时间显示 -->
<div class="player-time">
<span id="currentTime">00:00</span>
<span id="durationTime">00:00</span>
</div>

<!-- 控制按钮 -->
<div class="player-controls">
<button class="control-btn" id="prevBtn" title="上一首" aria-label="上一首">
<i class="fa-solid fa-backward-step"></i>
</button>
<button class="control-btn control-btn-play" id="playBtn" title="播放/暂停" aria-label="播放或暂停">
<i class="fa-solid fa-play" id="playIcon"></i>
</button>
<button class="control-btn" id="nextBtn" title="下一首" aria-label="下一首">
<i class="fa-solid fa-forward-step"></i>
</button>
</div>

</div>

<!-- 隐藏的 audio 元素 -->
<p><audio id="musicPlayer" preload="metadata"></audio></p>
</div>

<script>
(function() {
var playlist = [
{
title: '退后',
artist: '周杰伦',
src: '/music/退后 - 周杰伦.mp3',
cover: 'https://y.gtimg.cn/music/photo_new/T002R300x300M000002jLGWe16Tf1H_1.jpg?max_age=2592000'
}
];

var currentIndex = 0;
var player = document.getElementById('musicPlayer');
var cover = document.getElementById('musicCover');
var titleEl = document.getElementById('musicTitle');
var artistEl = document.getElementById('musicArtist');
var playBtn = document.getElementById('playBtn');
var playIcon = document.getElementById('playIcon');
var prevBtn = document.getElementById('prevBtn');
var nextBtn = document.getElementById('nextBtn');
var progressBar = document.getElementById('playerProgress');
var progressPlayed = document.getElementById('progressPlayed');
var progressLoaded = document.getElementById('progressLoaded');
var currentTimeEl = document.getElementById('currentTime');
var durationEl = document.getElementById('durationTime');

var isDragging = false;

function loadSong(index) {
var song = playlist[index];
titleEl.textContent = song.title;
artistEl.textContent = song.artist;
cover.style.backgroundImage = "url('" + song.cover + "')";
player.src = song.src;
player.load();
setPlayIcon(false);
progressPlayed.style.width = '0%';
progressLoaded.style.width = '0%';
currentTimeEl.textContent = '00:00';
}

function setPlayIcon(isPlaying) {
playIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}

function formatTime(sec) {
if (isNaN(sec) || sec < 0) return '00:00';
var m = Math.floor(sec / 60);
var s = Math.floor(sec % 60);
return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function updateProgress() {
if (isDragging) return;
var ratio = (player.currentTime / player.duration) * 100;
if (!isNaN(ratio)) {
progressPlayed.style.width = ratio + '%';
}
currentTimeEl.textContent = formatTime(player.currentTime);
}

function togglePlay() {
if (player.paused) {
player.play();
} else {
player.pause();
}
}

function prevSong() {
if (playlist.length <= 1) {
player.currentTime = 0;
player.play();
return;
}
currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
loadSong(currentIndex);
player.play();
}

function nextSong() {
if (playlist.length <= 1) {
player.currentTime = 0;
player.play();
return;
}
currentIndex = (currentIndex + 1) % playlist.length;
loadSong(currentIndex);
player.play();
}

function seekTo(clientX) {
var rect = progressBar.getBoundingClientRect();
var ratio = (clientX - rect.left) / rect.width;
ratio = Math.max(0, Math.min(1, ratio));
if (player.duration) {
player.currentTime = ratio * player.duration;
progressPlayed.style.width = (ratio * 100) + '%';
}
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

progressBar.addEventListener('mousedown', function(e) {
isDragging = true;
seekTo(e.clientX);
});
document.addEventListener('mousemove', function(e) {
if (isDragging) seekTo(e.clientX);
});
document.addEventListener('mouseup', function() {
isDragging = false;
});

progressBar.addEventListener('touchstart', function(e) {
isDragging = true;
seekTo(e.touches[0].clientX);
}, { passive: true });
progressBar.addEventListener('touchmove', function(e) {
if (isDragging) seekTo(e.touches[0].clientX);
}, { passive: true });
progressBar.addEventListener('touchend', function() {
isDragging = false;
});

player.addEventListener('play', function() {
setPlayIcon(true);
cover.classList.add('playing');
});
player.addEventListener('pause', function() {
setPlayIcon(false);
cover.classList.remove('playing');
});
player.addEventListener('ended', function() {
cover.classList.remove('playing');
nextSong();
});
player.addEventListener('timeupdate', updateProgress);
player.addEventListener('loadedmetadata', function() {
durationEl.textContent = formatTime(player.duration);
});
player.addEventListener('progress', function() {
if (player.buffered.length > 0 && player.duration) {
var buffered = player.buffered.end(player.buffered.length - 1);
progressLoaded.style.width = (buffered / player.duration * 100) + '%';
}
});

loadSong(currentIndex);
})();
</script>
