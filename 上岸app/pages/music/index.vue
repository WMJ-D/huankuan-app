<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-content">
        <view class="nav-back" @click="goBack">
          <text class="back-arrow">←</text>
        </view>
        <text class="nav-title">音乐播放器</text>
        <view class="nav-action" @click="togglePlayMode">
          <text class="mode-icon">{{ musicStore.getPlayModeIcon() }}</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }">
      <view class="player-section" v-if="musicStore.currentSong || showPlayerPlaceholder">
        <view class="cover-container">
          <view class="disc" :class="{ 'disc-spinning': musicStore.isPlaying }">
            <image
              v-if="musicStore.currentSong && musicStore.currentSong.pic"
              class="disc-cover"
              :src="musicStore.currentSong.pic"
              mode="aspectFill"
            />
            <view v-else class="disc-inner">
              <text class="disc-icon">♪</text>
            </view>
          </view>
          <view class="disc-glow" v-if="musicStore.isPlaying"></view>
        </view>

        <view class="song-info">
          <text class="song-name">{{ musicStore.currentSong ? musicStore.currentSong.name : '未选择歌曲' }}</text>
          <text class="song-artist" v-if="musicStore.currentSong">{{ musicStore.currentSong.artist }}</text>
        </view>

        <view class="lrc-section" v-if="musicStore.currentLrc.length > 0">
          <scroll-view
            scroll-y
            class="lrc-scroll"
            :scroll-top="lrcScrollTop"
            :scroll-with-animation="false"
          >
            <view class="lrc-inner">
              <view class="lrc-spacer"></view>
              <view
                v-for="(line, i) in musicStore.currentLrc"
                :key="i"
                class="lrc-line"
                :class="{ 'lrc-active': i === musicStore.currentLrcIndex }"
                :id="'lrc-' + i"
              >
                <text class="lrc-text" :class="{ 'lrc-text-active': i === musicStore.currentLrcIndex }">{{ line.text }}</text>
              </view>
              <view class="lrc-spacer"></view>
            </view>
          </scroll-view>
        </view>

        <view class="progress-section">
          <text class="time-text">{{ formatTime(musicStore.currentTime) }}</text>
          <view class="progress-bar-wrap" @click="onProgressClick">
            <view class="progress-track">
              <view class="progress-fill" :style="{ width: musicStore.progress + '%' }"></view>
            </view>
            <view class="progress-thumb" :style="{ left: musicStore.progress + '%' }"></view>
          </view>
          <text class="time-text">{{ formatTime(musicStore.duration) }}</text>
        </view>

        <view class="controls">
          <view class="ctrl-btn ctrl-mode" @click="togglePlayMode">
            <text class="ctrl-icon">{{ musicStore.getPlayModeIcon() }}</text>
            <text class="ctrl-label">{{ musicStore.getPlayModeLabel() }}</text>
          </view>
          <view class="ctrl-btn" @click="playPrev">
            <text class="ctrl-icon-lg">⏮</text>
          </view>
          <view class="ctrl-btn ctrl-play" @click="togglePlay">
            <text class="ctrl-play-icon">{{ musicStore.isPlaying ? '⏸' : '▶' }}</text>
          </view>
          <view class="ctrl-btn" @click="playNext">
            <text class="ctrl-icon-lg">⏭</text>
          </view>
          <view class="ctrl-btn ctrl-empty">
            <text class="ctrl-icon"> </text>
          </view>
        </view>
      </view>

      <view class="search-section">
        <view class="search-bar">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索歌曲名称"
            placeholder-style="color: #6b6b7b"
            confirm-type="search"
            @confirm="onSearch"
          />
          <view class="search-btn" @click="onSearch" :class="{ 'search-btn-disabled': musicStore.isSearching }">
            <text class="search-btn-text">{{ musicStore.isSearching ? '...' : '搜索' }}</text>
          </view>
        </view>
        <view class="platform-tabs">
          <view
            v-for="p in platforms"
            :key="p.value"
            class="platform-tab"
            :class="{ 'platform-active': currentPlatform === p.value }"
            @click="switchPlatform(p.value)"
          >
            <text class="platform-text">{{ p.label }}</text>
          </view>
        </view>
      </view>

      <view class="list-section">
        <view class="list-header">
          <text class="section-title">{{ isSearchMode ? '搜索结果' : '搜索歌曲开始播放' }}</text>
          <view class="list-actions" v-if="musicStore.playlist.length > 0">
            <view class="action-btn action-clear" @click="confirmClear">
              <text class="action-text-clear">清空列表</text>
            </view>
          </view>
        </view>

        <view v-if="musicStore.isSearching || musicStore.isLoadingDetail" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>

        <view v-else-if="musicStore.searchResults.length === 0 && isSearchMode" class="empty-state">
          <text class="empty-icon">♫</text>
          <text class="empty-text">未找到相关歌曲</text>
          <text class="empty-hint">换个关键词试试</text>
        </view>

        <view v-else-if="musicStore.searchResults.length === 0 && !isSearchMode" class="empty-state">
          <text class="empty-icon">♫</text>
          <text class="empty-text">搜索你喜欢的音乐</text>
          <text class="empty-hint">输入歌曲名或歌手名开始搜索</text>
        </view>

        <view v-else class="song-list">
          <view
            v-for="(song, index) in musicStore.searchResults"
            :key="song.apiId + song.apiServer"
            class="song-item"
            @click="onResultClick(song, index)"
          >
            <view class="song-item-left">
              <view class="song-index-wrap">
                <text class="song-item-index">{{ index + 1 }}</text>
              </view>
              <view class="song-item-info">
                <text class="song-item-name">{{ song.name }}</text>
                <text class="song-item-artist">{{ song.artist }}{{ song.album ? ' · ' + song.album : '' }}</text>
              </view>
            </view>
            <view class="song-item-right" @click.stop="onAddClick(song, index)">
              <text class="song-add">+</text>
            </view>
          </view>
        </view>

        <view class="playlist-divider" v-if="musicStore.playlist.length > 0"></view>

        <view class="list-header" v-if="musicStore.playlist.length > 0">
          <text class="section-title">播放列表</text>
          <text class="section-count">{{ musicStore.playlist.length }} 首</text>
        </view>

        <view v-if="musicStore.playlist.length > 0" class="song-list">
          <view
            v-for="(song, index) in musicStore.playlist"
            :key="song.id"
            class="song-item"
            :class="{ 'song-active': index === musicStore.currentIndex }"
            @click="onPlaylistClick(index)"
          >
            <view class="song-item-left">
              <view class="song-index-wrap" v-if="index !== musicStore.currentIndex || !musicStore.isPlaying">
                <text class="song-item-index">{{ index + 1 }}</text>
              </view>
              <view class="song-playing-icon" v-else>
                <text class="playing-wave">♫</text>
              </view>
              <image v-if="song.pic" class="song-thumb" :src="song.pic" mode="aspectFill" />
              <view class="song-thumb-placeholder" v-else>
                <text class="thumb-icon">♪</text>
              </view>
              <view class="song-item-info">
                <text class="song-item-name" :class="{ 'text-active': index === musicStore.currentIndex }">{{ song.name }}</text>
                <text class="song-item-artist">{{ song.artist }}</text>
              </view>
            </view>
            <view class="song-item-right" @click.stop="removeSong(song.id)">
              <text class="song-remove">×</text>
            </view>
          </view>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useMusicStore } from '../../store/music'

const musicStore = useMusicStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(600)
const searchKeyword = ref('')
const isSearchMode = ref(false)
const showPlayerPlaceholder = ref(true)
const lrcScrollTop = ref(0)
const currentPlatform = ref('wy')

const platforms = [
  { label: '网易云', value: 'netease' },
  { label: 'QQ音乐', value: 'tencent' }
]

let lrcLineHeights = []
const LRC_LINE_HEIGHT = 56

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function goBack() {
  uni.navigateBack()
}

function togglePlay() {
  musicStore.togglePlay()
}

function playNext() {
  musicStore.playNext()
}

function playPrev() {
  musicStore.playPrev()
}

function togglePlayMode() {
  musicStore.togglePlayMode()
  uni.showToast({
    title: musicStore.getPlayModeLabel(),
    icon: 'none',
    duration: 1000
  })
}

function switchPlatform(val) {
  currentPlatform.value = val
  if (isSearchMode.value) {
    onSearch()
  }
}

function onSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    isSearchMode.value = false
    musicStore.searchResults = []
    return
  }
  isSearchMode.value = true
  musicStore.searchMusic(keyword, currentPlatform.value)
}

function onResultClick(song, index) {
  musicStore.playSongFromSearch(song, index)
}

function onAddClick(song, index) {
  musicStore.addToPlaylistFromSearch(song, index)
}

function onPlaylistClick(index) {
  if (index === musicStore.currentIndex && musicStore.isPlaying) {
    musicStore.pause()
  } else {
    musicStore.playSong(index)
  }
}

function removeSong(songId) {
  musicStore.removeSong(songId)
}

function onProgressClick(e) {
  if (!musicStore.currentSong || musicStore.duration <= 0) return
  const query = uni.createSelectorQuery().in(getCurrentInstance())
  query.select('.progress-track').boundingClientRect((rect) => {
    if (!rect) return
    const x = e.detail.x - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    const seekTime = ratio * musicStore.duration
    musicStore.seekTo(seekTime)
  }).exec()
}

function confirmClear() {
  uni.showModal({
    title: '清空播放列表',
    content: '确定要清空所有音乐吗？',
    confirmColor: '#f44336',
    success: (res) => {
      if (res.confirm) {
        musicStore.clearPlaylist()
      }
    }
  })
}

watch(() => musicStore.currentLrcIndex, (newIdx) => {
  if (newIdx >= 0 && musicStore.currentLrc.length > 0) {
    const containerHeight = 300
    const lineCenter = newIdx * LRC_LINE_HEIGHT + LRC_LINE_HEIGHT / 2
    const scrollTop = Math.max(0, lineCenter - containerHeight / 2)
    lrcScrollTop.value = scrollTop
  }
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44

  musicStore.initAudioContext()
  musicStore.initSettings()

  // #ifdef APP-PLUS
  try {
    const main = plus.android.runtimeMainActivity()
    const audioManager = plus.android.invoke(main, 'getSystemService', 'audio')
    plus.android.invoke(audioManager, 'requestAudioFocus', null, 3, 1)
  } catch (e) {
    console.log('音频焦点请求:', e)
  }
  // #endif
})

onUnmounted(() => {
  // 不暂停，保持后台播放
})
</script>

<style lang="scss" scoped>
.page-container {
  background-color: $bg-primary;
  min-height: 100vh;
}

.status-bar {
  background-color: $bg-secondary;
}

.nav-bar {
  background-color: $bg-secondary;
  padding: 10rpx 30rpx 20rpx;

  .nav-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .back-arrow {
      font-size: 40rpx;
      color: $text-primary;
    }
  }

  .nav-title {
    font-size: $font-lg;
    font-weight: 600;
    color: $text-primary;
  }

  .nav-action {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .mode-icon {
      font-size: 36rpx;
      color: $accent-green;
    }
  }
}

.scroll-content {
  padding: 0 24rpx;
  box-sizing: border-box;
}

.player-section {
  padding: 30rpx 20rpx 20rpx;
}

.cover-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30rpx;
  position: relative;
}

.disc {
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a3a55, #1a2a45);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(76, 175, 80, 0.2);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.disc-spinning {
  animation: spin 12s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.disc-cover {
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
}

.disc-inner {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  display: flex;
  align-items: center;
  justify-content: center;

  .disc-icon {
    font-size: 52rpx;
    color: #fff;
  }
}

.disc-glow {
  position: absolute;
  width: 320rpx;
  height: 320rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.15) 0%, transparent 70%);
  z-index: 1;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
}

.song-info {
  text-align: center;
  margin-bottom: 20rpx;

  .song-name {
    display: block;
    font-size: $font-xl;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  .song-artist {
    display: block;
    font-size: $font-sm;
    color: $text-secondary;
  }
}

.lrc-section {
  margin-bottom: 20rpx;
}

.lrc-scroll {
  height: 300rpx;
  overflow: hidden;
}

.lrc-inner {
  padding: 0 20rpx;
}

.lrc-spacer {
  height: 130rpx;
}

.lrc-line {
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.lrc-text {
  font-size: $font-sm;
  color: $text-muted;
  text-align: center;
  line-height: 1.4;
}

.lrc-text-active {
  font-size: $font-md;
  color: $accent-green;
  font-weight: 600;
}

.progress-section {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 0 10rpx;

  .time-text {
    font-size: $font-xs;
    color: $text-muted;
    min-width: 80rpx;
    text-align: center;
  }
}

.progress-bar-wrap {
  flex: 1;
  height: 60rpx;
  display: flex;
  align-items: center;
  position: relative;
  margin: 0 10rpx;
}

.progress-track {
  width: 100%;
  height: 8rpx;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $accent-green-dark, $accent-green-light);
  border-radius: 4rpx;
  transition: width 0.3s linear;
}

.progress-thumb {
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background-color: $accent-green;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8rpx rgba(76, 175, 80, 0.5);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 20rpx;
}

.ctrl-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 100rpx;

  .ctrl-icon {
    font-size: 36rpx;
    color: $text-secondary;
  }

  .ctrl-icon-lg {
    font-size: 44rpx;
    color: $text-primary;
  }

  .ctrl-label {
    font-size: 20rpx;
    color: $text-muted;
    margin-top: 4rpx;
  }
}

.ctrl-play {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  box-shadow: 0 4rpx 20rpx rgba(76, 175, 80, 0.4);

  .ctrl-play-icon {
    font-size: 52rpx;
    color: #fff;
  }
}

.ctrl-empty {
  opacity: 0;
}

.search-section {
  padding: 0 4rpx;
  margin-bottom: 24rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 16rpx 24rpx;
  gap: 16rpx;

  .search-icon {
    font-size: $font-md;
  }

  .search-input {
    flex: 1;
    font-size: $font-md;
    color: $text-primary;
    height: 48rpx;
  }

  .search-btn {
    padding: 10rpx 28rpx;
    background: linear-gradient(135deg, $accent-green, $accent-green-dark);
    border-radius: $radius-md;

    .search-btn-text {
      font-size: $font-sm;
      color: #fff;
      font-weight: 600;
    }
  }

  .search-btn-disabled {
    opacity: 0.6;
  }
}

.platform-tabs {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.platform-tab {
  padding: 8rpx 28rpx;
  border-radius: $radius-md;
  background-color: $bg-card;

  .platform-text {
    font-size: $font-sm;
    color: $text-secondary;
  }
}

.platform-active {
  background-color: rgba(76, 175, 80, 0.2);

  .platform-text {
    color: $accent-green;
    font-weight: 600;
  }
}

.list-section {
  margin-top: 10rpx;
  padding-bottom: 20rpx;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 4rpx;

  .section-title {
    font-size: $font-lg;
    font-weight: 600;
    color: $text-primary;
  }

  .section-count {
    font-size: $font-sm;
    color: $text-muted;
  }
}

.list-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  padding: 8rpx 24rpx;
  border-radius: $radius-md;
}

.action-clear {
  background-color: rgba(244, 67, 54, 0.1);

  .action-text-clear {
    font-size: $font-sm;
    color: $accent-red;
    font-weight: 500;
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60rpx 0;

  .loading-text {
    font-size: $font-md;
    color: $text-muted;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;

  .empty-icon {
    font-size: 80rpx;
    color: $text-muted;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: $font-md;
    color: $text-secondary;
    margin-bottom: 8rpx;
  }

  .empty-hint {
    font-size: $font-sm;
    color: $text-muted;
  }
}

.playlist-divider {
  height: 1rpx;
  background-color: rgba(255, 255, 255, 0.06);
  margin: 30rpx 0;
}

.song-list {
  background-color: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.song-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 28rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);

  &.song-active {
    background-color: rgba(76, 175, 80, 0.08);
  }

  &:last-child {
    border-bottom: none;
  }
}

.song-item-left {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.song-index-wrap {
  width: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;

  .song-item-index {
    font-size: $font-sm;
    color: $text-muted;
    font-weight: 500;
  }
}

.song-playing-icon {
  width: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;

  .playing-wave {
    font-size: $font-md;
    color: $accent-green;
    animation: wave 1s ease-in-out infinite;
  }
}

@keyframes wave {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

.song-thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-sm;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.song-thumb-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-sm;
  margin-right: 16rpx;
  flex-shrink: 0;
  background: linear-gradient(135deg, #2a3a55, #1a2a45);
  display: flex;
  align-items: center;
  justify-content: center;

  .thumb-icon {
    font-size: $font-lg;
    color: $text-muted;
  }
}

.song-item-info {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .song-item-name {
    font-size: $font-md;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .song-item-artist {
    font-size: $font-xs;
    color: $text-muted;
    margin-top: 4rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text-active {
    color: $accent-green;
    font-weight: 600;
  }
}

.song-item-right {
  padding: 10rpx 16rpx;
  margin-left: 16rpx;

  .song-add {
    font-size: 40rpx;
    color: $accent-green;
    font-weight: 300;
    line-height: 1;
  }

  .song-remove {
    font-size: 40rpx;
    color: $text-muted;
    line-height: 1;
  }
}

.safe-bottom-space {
  height: 60rpx;
}
</style>
