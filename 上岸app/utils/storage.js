/**
 * 本地存储工具模块
 * 封装 uni.setStorageSync / uni.getStorageSync，提供统一的数据持久化接口
 */

const STORAGE_KEYS = {
  TASKS: 'repayment_tasks',
  REPAY_RECORDS: 'repayment_records',
  MONTHLY: 'repayment_monthly',
  FRIENDS: 'repayment_friends',
  FRIEND_EVENTS: 'repayment_friend_events',
  INITIALIZED: 'repayment_initialized',
  MUSIC_SETTINGS: 'music_settings'
}

/**
 * 从本地存储获取数据
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 存储的数据或默认值
 */
export function getStorage(key, defaultValue = null) {
  try {
    const data = uni.getStorageSync(key)
    if (data === '' || data === null || data === undefined) {
      return defaultValue
    }
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (e) {
    console.error(`读取存储失败 [${key}]:`, e)
    return defaultValue
  }
}

/**
 * 将数据保存到本地存储
 * @param {string} key - 存储键名
 * @param {*} value - 要存储的数据
 * @returns {boolean} 是否保存成功
 */
export function setStorage(key, value) {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`写入存储失败 [${key}]:`, e)
    return false
  }
}

/**
 * 从本地存储删除数据
 * @param {string} key - 存储键名
 */
export function removeStorage(key) {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.error(`删除存储失败 [${key}]:`, e)
  }
}

/**
 * 清除所有还款相关存储数据
 */
export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorage(key)
  })
}

/**
 * 检查是否已初始化过 Demo 数据
 * @returns {boolean}
 */
export function isInitialized() {
  return getStorage(STORAGE_KEYS.INITIALIZED, false)
}

/**
 * 标记已初始化
 */
export function markInitialized() {
  setStorage(STORAGE_KEYS.INITIALIZED, true)
}

export { STORAGE_KEYS }
