import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, STORAGE_KEYS } from '../utils/storage'
import { generateId, roundToTwo } from '../utils/calc'

const FRIENDS_INITIALIZED_KEY = 'repayment_friends_initialized_v2'

/** 默认 Demo 私人借款数据 */
const DEMO_FRIENDS = [
  // { id: 'p1', name: '爸爸', totalBorrowed: 82000, remaining: 82000, status: 'active', remark: '' },
  // { id: 'p2', name: '妈妈', totalBorrowed: 22000, remaining: 22000, status: 'active', remark: '' },
  // { id: 'p3', name: '姐姐', totalBorrowed: 15000, remaining: 15000, status: 'active', remark: '' },
  // { id: 'p4', name: '徐文超', totalBorrowed: 20000, remaining: 18214.74, status: 'active', remark: '' },
  // { id: 'p5', name: '郭明航', totalBorrowed: 6800, remaining: 0, status: 'settled', remark: '' },
  // { id: 'p6', name: '饶延红', totalBorrowed: 2000, remaining: 0, status: 'settled', remark: '' },
  // { id: 'p7', name: '熊希逸', totalBorrowed: 14000, remaining: 0, status: 'settled', remark: '' },
  // { id: 'p8', name: '白小虎', totalBorrowed: 4000, remaining: 0, status: 'settled', remark: '' }
]

/** 默认 Demo 还款事件数据 */
const DEMO_EVENTS = [
  // { id: 'e1', friendId: 'p4', date: '2025-05-15', amount: 1785.26, remark: '部分还款' },
  // { id: 'e2', friendId: 'p5', date: '2025-03-01', amount: 6800, remark: '全部还清' },
  // { id: 'e3', friendId: 'p6', date: '2025-02-20', amount: 2000, remark: '全部还清' },
  // { id: 'e4', friendId: 'p7', date: '2025-04-10', amount: 14000, remark: '全部还清' },
  // { id: 'e5', friendId: 'p8', date: '2025-01-25', amount: 4000, remark: '全部还清' }
]

/**
 * 私人借款追踪 store
 */
export const useFriendStore = defineStore('friends', () => {
  /** @type {import('vue').Ref<Array>} 私人借款列表 */
  const friends = ref([])

  /** @type {import('vue').Ref<Array>} 还款事件列表 */
  const events = ref([])

  /** 活跃借款（未还清） */
  const activeFriends = computed(() => friends.value.filter(f => f.status === 'active'))

  /** 已结清借款 */
  const settledFriends = computed(() => friends.value.filter(f => f.status === 'settled'))

  /** 总私人借款余额 */
  const totalRemaining = computed(() => {
    return roundToTwo(activeFriends.value.reduce((sum, f) => sum + (f.remaining || 0), 0))
  })

  /** 总私人借款原始金额 */
  const totalBorrowed = computed(() => {
    return roundToTwo(friends.value.reduce((sum, f) => sum + (f.totalBorrowed || 0), 0))
  })

  /** 私人借款还款进度 */
  const friendProgress = computed(() => {
    if (!totalBorrowed.value) return 0
    const totalPaid = roundToTwo(totalBorrowed.value - totalRemaining.value)
    return Math.round((totalPaid / totalBorrowed.value) * 1000) / 10
  })

  /**
   * 初始化私人借款数据
   */
  function initFriends() {
    const wasInitialized = getStorage(FRIENDS_INITIALIZED_KEY, false)
    if (wasInitialized) {
      friends.value = getStorage(STORAGE_KEYS.FRIENDS, [])
      events.value = getStorage(STORAGE_KEYS.FRIEND_EVENTS, [])
    } else {
      friends.value = [...DEMO_FRIENDS]
      events.value = [...DEMO_EVENTS]
      saveFriends()
      saveEvents()
      setStorage(FRIENDS_INITIALIZED_KEY, true)
    }
  }

  /**
   * 保存借款人到本地
   */
  function saveFriends() {
    setStorage(STORAGE_KEYS.FRIENDS, friends.value)
  }

  /**
   * 保存事件到本地
   */
  function saveEvents() {
    setStorage(STORAGE_KEYS.FRIEND_EVENTS, events.value)
  }

  /**
   * 新增借款人
   * @param {Object} friendData
   */
  function addFriend(friendData) {
    const newFriend = {
      id: generateId(),
      name: friendData.name || '',
      totalBorrowed: roundToTwo(Number(friendData.totalBorrowed) || 0),
      remaining: roundToTwo(Number(friendData.remaining) || Number(friendData.totalBorrowed) || 0),
      status: 'active',
      remark: friendData.remark || ''
    }
    if (newFriend.remaining <= 0) {
      newFriend.remaining = 0
      newFriend.status = 'settled'
    }
    friends.value.push(newFriend)
    saveFriends()
    return newFriend
  }

  /**
   * 更新借款人信息
   * @param {string} id
   * @param {Object} updateData
   */
  function updateFriend(id, updateData) {
    const index = friends.value.findIndex(f => f.id === id)
    if (index !== -1) {
      friends.value[index] = { ...friends.value[index], ...updateData }
      if (updateData.remaining !== undefined) {
        friends.value[index].remaining = roundToTwo(Number(updateData.remaining) || 0)
      }
      if (updateData.totalBorrowed !== undefined) {
        friends.value[index].totalBorrowed = roundToTwo(Number(updateData.totalBorrowed) || 0)
      }
      if (friends.value[index].remaining <= 0) {
        friends.value[index].remaining = 0
        friends.value[index].status = 'settled'
      }
      saveFriends()
      return friends.value[index]
    }
    return null
  }

  /**
   * 删除借款人
   * @param {string} id
   */
  function deleteFriend(id) {
    friends.value = friends.value.filter(f => f.id !== id)
    events.value = events.value.filter(e => e.friendId !== id)
    saveFriends()
    saveEvents()
  }

  /**
   * 添加还款事件
   * @param {string} friendId - 借款人 ID
   * @param {Object} eventData - { date, amount, remark }
   */
  function addEvent(friendId, eventData) {
    const newEvent = {
      id: generateId(),
      friendId: friendId,
      date: eventData.date || new Date().toISOString().slice(0, 10),
      amount: roundToTwo(Number(eventData.amount) || 0),
      remark: eventData.remark || ''
    }
    events.value.push(newEvent)

    const friend = friends.value.find(f => f.id === friendId)
    if (friend) {
      friend.remaining = roundToTwo(Math.max(0, friend.remaining - newEvent.amount))
      if (friend.remaining <= 0) {
        friend.remaining = 0
        friend.status = 'settled'
      }
      saveFriends()
    }

    saveEvents()
    return newEvent
  }

  /**
   * 删除还款事件
   * @param {string} eventId
   */
  function removeEvent(eventId) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      const friend = friends.value.find(f => f.id === event.friendId)
      if (friend) {
        friend.remaining = roundToTwo(friend.remaining + event.amount)
        if (friend.remaining > 0) {
          friend.status = 'active'
        }
        saveFriends()
      }
      events.value = events.value.filter(e => e.id !== eventId)
      saveEvents()
    }
  }

  /**
   * 获取指定借款人的还款事件
   * @param {string} friendId
   * @returns {Array}
   */
  function getEventsByFriendId(friendId) {
    return events.value
      .filter(e => e.friendId === friendId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  function recalculateRemaining(friendId) {
    const friend = friends.value.find(f => f.id === friendId)
    if (!friend) return

    const paidAmount = events.value
      .filter(e => e.friendId === friendId)
      .reduce((sum, e) => sum + (e.amount || 0), 0)

    friend.remaining = roundToTwo(Math.max(0, friend.totalBorrowed - paidAmount))
    friend.status = friend.remaining <= 0 ? 'settled' : 'active'
    saveFriends()
  }

  function recalculateAllRemaining() {
    friends.value.forEach(friend => {
      const paidAmount = events.value
        .filter(e => e.friendId === friend.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0)

      friend.remaining = roundToTwo(Math.max(0, friend.totalBorrowed - paidAmount))
      friend.status = friend.remaining <= 0 ? 'settled' : 'active'
    })
    saveFriends()
  }

  /**
   * 根据 ID 获取借款人
   * @param {string} id
   * @returns {Object|null}
   */
  function getFriendById(id) {
    return friends.value.find(f => f.id === id) || null
  }

  return {
    friends,
    events,
    activeFriends,
    settledFriends,
    totalRemaining,
    totalBorrowed,
    friendProgress,
    initFriends,
    addFriend,
    updateFriend,
    deleteFriend,
    addEvent,
    removeEvent,
    getEventsByFriendId,
    getFriendById,
    recalculateRemaining,
    recalculateAllRemaining
  }
})
