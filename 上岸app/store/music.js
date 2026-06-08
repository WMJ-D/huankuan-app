import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, STORAGE_KEYS } from '../utils/storage'

const METING_API = 'https://api.injahow.cn/meting/'

export const useMusicStore = defineStore('music', () => {
  const playlist = ref([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const playMode = ref('sequence')
  const currentTime = ref(0)
  const duration = ref(0)
  const currentLrc = ref([])
  const currentLrcIndex = ref(-1)

  const searchResults = ref([])
  const isSearching = ref(false)
  const isLoadingDetail = ref(false)

  let audioContext = null

  const currentSong = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < playlist.value.length) {
      return playlist.value[currentIndex.value]
    }
    return null
  })

  const hasNext = computed(() => {
    if (playMode.value === 'loop') return playlist.value.length > 0
    return currentIndex.value < playlist.value.length - 1
  })

  const hasPrev = computed(() => {
    if (playMode.value === 'loop') return playlist.value.length > 0
    return currentIndex.value > 0
  })

  const progress = computed(() => {
    if (duration.value <= 0) return 0
    return Math.min((currentTime.value / duration.value) * 100, 100)
  })

  function initAudioContext() {
    if (audioContext) return audioContext
    audioContext = uni.createInnerAudioContext()
    audioContext.autoplay = false

    audioContext.onPlay(() => {
      isPlaying.value = true
    })

    audioContext.onPause(() => {
      isPlaying.value = false
    })

    audioContext.onStop(() => {
      isPlaying.value = false
      currentTime.value = 0
    })

    audioContext.onEnded(() => {
      handleSongEnd()
    })

    audioContext.onTimeUpdate(() => {
      if (audioContext) {
        currentTime.value = audioContext.currentTime || 0
        duration.value = audioContext.duration || 0
        updateLrcIndex()
      }
    })

    audioContext.onError((err) => {
      console.error('音频播放错误:', err)
      isPlaying.value = false
      uni.showToast({ title: '播放失败', icon: 'none' })
    })

    return audioContext
  }

  function handleSongEnd() {
    if (playMode.value === 'single') {
      playCurrent()
    } else if (playMode.value === 'loop') {
      playNext()
    } else {
      if (currentIndex.value < playlist.value.length - 1) {
        playNext()
      } else {
        isPlaying.value = false
        currentTime.value = 0
      }
    }
  }

  function initSettings() {
    const settings = getStorage(STORAGE_KEYS.MUSIC_SETTINGS, {})
    if (settings.playMode) {
      playMode.value = settings.playMode
    }
  }

  function saveSettings() {
    setStorage(STORAGE_KEYS.MUSIC_SETTINGS, {
      playMode: playMode.value
    })
  }

  function parseLrc(lrcStr) {
    if (!lrcStr) return []
    const lines = lrcStr.split('\n')
    const result = []
    for (const line of lines) {
      const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/)
      if (match) {
        const min = parseInt(match[1])
        const sec = parseInt(match[2])
        const ms = parseInt(match[3])
        const time = min * 60 + sec + ms / (match[3].length === 3 ? 1000 : 100)
        const text = match[4].trim()
        if (text) {
          result.push({ time, text })
        }
      }
    }
    result.sort((a, b) => a.time - b.time)
    return result
  }

  function updateLrcIndex() {
    if (currentLrc.value.length === 0) {
      currentLrcIndex.value = -1
      return
    }
    const t = currentTime.value
    let idx = -1
    for (let i = currentLrc.value.length - 1; i >= 0; i--) {
      if (t >= currentLrc.value[i].time - 0.2) {
        idx = i
        break
      }
    }
    currentLrcIndex.value = idx
  }

  function metingRequest(params) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: METING_API,
        data: params,
        method: 'GET',
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  async function searchMusic(keyword, server) {
    if (!keyword || !keyword.trim()) {
      searchResults.value = []
      return
    }
    isSearching.value = true
    try {
      const data = await metingRequest({
        server: server || 'netease',
        type: 'search',
        name: keyword.trim()
      })
      if (Array.isArray(data)) {
        searchResults.value = data.map((item, index) => ({
          apiId: String(item.id || item.url_id || ''),
          apiServer: server || 'netease',
          name: item.name || item.title || '未知歌曲',
          artist: item.artist || '未知歌手',
          album: item.album || '',
          url: item.url || '',
          pic: item.pic || '',
          lrc: item.lrc || ''
        })).filter(item => item.apiId)
      } else {
        searchResults.value = []
      }
    } catch (err) {
      console.error('搜索音乐失败:', err)
      uni.showToast({ title: '搜索失败，请检查网络', icon: 'none' })
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  async function fetchSongDetail(song) {
    if (!song.apiId) return null
    try {
      const [urlData, picData, lrcData] = await Promise.all([
        metingRequest({ server: song.apiServer, type: 'url', id: song.apiId }),
        metingRequest({ server: song.apiServer, type: 'pic', id: song.apiId }),
        metingRequest({ server: song.apiServer, type: 'lrc', id: song.apiId })
      ])
      const url = typeof urlData === 'string' ? urlData : (urlData && urlData.url) || ''
      const pic = typeof picData === 'string' ? picData : (picData && picData.url) || ''
      const lrc = typeof lrcData === 'string' ? lrcData : (lrcData && lrcData.lrc) || ''
      return { url, pic, lrc }
    } catch (err) {
      console.error('获取歌曲详情失败:', err)
    }
    return null
  }

  async function playSongFromSearch(song, searchIndex) {
    isLoadingDetail.value = true
    try {
      const detail = await fetchSongDetail(song)
      if (!detail || !detail.url) {
        uni.showToast({ title: '无法获取播放地址', icon: 'none' })
        return
      }
      searchResults.value[searchIndex] = {
        ...searchResults.value[searchIndex],
        url: detail.url,
        pic: detail.pic,
        lrc: detail.lrc
      }
      const exists = playlist.value.findIndex(s => s.apiId === song.apiId && s.apiServer === song.apiServer)
      let targetIndex
      if (exists !== -1) {
        playlist.value[exists] = {
          ...playlist.value[exists],
          url: detail.url,
          pic: detail.pic,
          lrc: detail.lrc
        }
        targetIndex = exists
      } else {
        const newSong = {
          id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          apiId: song.apiId,
          apiServer: song.apiServer,
          name: song.name,
          artist: song.artist,
          album: song.album || '',
          pic: detail.pic,
          url: detail.url,
          lrc: detail.lrc
        }
        playlist.value = [...playlist.value, newSong]
        targetIndex = playlist.value.length - 1
      }
      playSong(targetIndex)
    } catch (err) {
      console.error('播放失败:', err)
      uni.showToast({ title: '播放失败', icon: 'none' })
    } finally {
      isLoadingDetail.value = false
    }
  }

  async function addToPlaylistFromSearch(song, searchIndex) {
    const exists = playlist.value.find(s => s.apiId === song.apiId && s.apiServer === song.apiServer)
    if (exists) {
      uni.showToast({ title: '歌曲已在播放列表中', icon: 'none' })
      return
    }
    isLoadingDetail.value = true
    try {
      const detail = await fetchSongDetail(song)
      if (!detail || !detail.url) {
        uni.showToast({ title: '无法获取播放地址', icon: 'none' })
        return
      }
      searchResults.value[searchIndex] = {
        ...searchResults.value[searchIndex],
        url: detail.url,
        pic: detail.pic,
        lrc: detail.lrc
      }
      const newSong = {
        id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        apiId: song.apiId,
        apiServer: song.apiServer,
        name: song.name,
        artist: song.artist,
        album: song.album || '',
        pic: detail.pic,
        url: detail.url,
        lrc: detail.lrc
      }
      playlist.value = [...playlist.value, newSong]
      uni.showToast({ title: '已添加到播放列表', icon: 'none' })
    } catch (err) {
      console.error('添加失败:', err)
      uni.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      isLoadingDetail.value = false
    }
  }

  function removeSong(songId) {
    const idx = playlist.value.findIndex(s => s.id === songId)
    if (idx === -1) return

    const wasCurrentSong = idx === currentIndex.value
    playlist.value = playlist.value.filter((_, i) => i !== idx)

    if (wasCurrentSong) {
      stop()
      if (playlist.value.length > 0) {
        currentIndex.value = Math.min(idx, playlist.value.length - 1)
        currentLrc.value = []
        currentLrcIndex.value = -1
      } else {
        currentIndex.value = -1
        currentLrc.value = []
        currentLrcIndex.value = -1
      }
    } else if (idx < currentIndex.value) {
      currentIndex.value--
    }
  }

  function clearPlaylist() {
    stop()
    playlist.value = []
    currentIndex.value = -1
    currentLrc.value = []
    currentLrcIndex.value = -1
  }

  function playSong(index) {
    if (index < 0 || index >= playlist.value.length) return
    const ctx = initAudioContext()
    currentIndex.value = index
    const song = playlist.value[index]
    if (!song.url) {
      uni.showToast({ title: '该歌曲暂无播放地址', icon: 'none' })
      return
    }
    ctx.src = song.url
    currentLrc.value = parseLrc(song.lrc)
    currentLrcIndex.value = -1
    ctx.play()
  }

  function playCurrent() {
    if (currentIndex.value >= 0) {
      playSong(currentIndex.value)
    }
  }

  function play() {
    if (!audioContext) {
      if (playlist.value.length > 0) {
        playSong(0)
      }
      return
    }
    if (currentIndex.value === -1 && playlist.value.length > 0) {
      playSong(0)
      return
    }
    audioContext.play()
  }

  function pause() {
    if (audioContext) {
      audioContext.pause()
    }
  }

  function togglePlay() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function stop() {
    if (audioContext) {
      audioContext.stop()
    }
    isPlaying.value = false
    currentTime.value = 0
  }

  function playNext() {
    if (playlist.value.length === 0) return
    let nextIndex
    if (playMode.value === 'shuffle') {
      nextIndex = Math.floor(Math.random() * playlist.value.length)
    } else if (playMode.value === 'loop' || playMode.value === 'single') {
      nextIndex = (currentIndex.value + 1) % playlist.value.length
    } else {
      nextIndex = currentIndex.value + 1
      if (nextIndex >= playlist.value.length) return
    }
    playSong(nextIndex)
  }

  function playPrev() {
    if (playlist.value.length === 0) return
    let prevIndex
    if (playMode.value === 'shuffle') {
      prevIndex = Math.floor(Math.random() * playlist.value.length)
    } else if (playMode.value === 'loop' || playMode.value === 'single') {
      prevIndex = (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
    } else {
      prevIndex = currentIndex.value - 1
      if (prevIndex < 0) return
    }
    playSong(prevIndex)
  }

  function seekTo(time) {
    if (audioContext) {
      audioContext.seek(time)
      currentTime.value = time
    }
  }

  function togglePlayMode() {
    const modes = ['sequence', 'loop', 'single', 'shuffle']
    const idx = modes.indexOf(playMode.value)
    playMode.value = modes[(idx + 1) % modes.length]
    saveSettings()
  }

  function getPlayModeLabel() {
    const labels = {
      sequence: '顺序播放',
      loop: '列表循环',
      single: '单曲循环',
      shuffle: '随机播放'
    }
    return labels[playMode.value] || '顺序播放'
  }

  function getPlayModeIcon() {
    const icons = {
      sequence: '→',
      loop: '↻',
      single: '①',
      shuffle: '⇄'
    }
    return icons[playMode.value] || '→'
  }

  return {
    playlist,
    currentIndex,
    isPlaying,
    playMode,
    currentTime,
    duration,
    currentLrc,
    currentLrcIndex,
    searchResults,
    isSearching,
    isLoadingDetail,
    currentSong,
    hasNext,
    hasPrev,
    progress,
    initAudioContext,
    initSettings,
    searchMusic,
    playSongFromSearch,
    addToPlaylistFromSearch,
    removeSong,
    clearPlaylist,
    playSong,
    play,
    pause,
    togglePlay,
    stop,
    playNext,
    playPrev,
    seekTo,
    togglePlayMode,
    getPlayModeLabel,
    getPlayModeIcon
  }
})
