import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, STORAGE_KEYS } from '../utils/storage'
import { getCurrentYearMonth, generateId } from '../utils/calc'

/**
 * 月度还款记录 store
 * 每月一条记录，记录该月的还款详情和收支情况
 */
export const useMonthlyStore = defineStore('monthly', () => {
  /** @type {import('vue').Ref<Array>} 月度记录列表 */
  const records = ref([])

  /** 按年月降序排列的记录 */
  const sortedRecords = computed(() => {
    return [...records.value].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
  })

  /** 当前月份的记录 */
  const currentMonthRecord = computed(() => {
    const current = getCurrentYearMonth()
    return records.value.find(r => r.yearMonth === current) || null
  })

  /**
   * 初始化月度记录
   */
  function initMonthly() {
    const stored = getStorage(STORAGE_KEYS.MONTHLY, [])
    records.value = stored
  }

  /**
   * 保存到本地存储
   */
  function saveRecords() {
    setStorage(STORAGE_KEYS.MONTHLY, records.value)
  }

  /**
   * 获取或创建指定月份的记录
   * @param {string} yearMonth - 年月，如 "2025-07"
   * @returns {Object}
   */
  function getOrCreateRecord(yearMonth) {
    let record = records.value.find(r => r.yearMonth === yearMonth)
    if (!record) {
      record = {
        id: generateId(),
        yearMonth: yearMonth,
        income: 0,
        fixedExpense: 0,
        payments: [],
        totalPaid: 0,
        note: ''
      }
      records.value.push(record)
      saveRecords()
    }
    return record
  }

  /**
   * 更新月度记录
   * @param {string} id - 记录 ID
   * @param {Object} updateData - 更新数据
   */
  function updateRecord(id, updateData) {
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      records.value[index] = { ...records.value[index], ...updateData }
      // 重新计算已还总额
      const rec = records.value[index]
      rec.totalPaid = (rec.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
      saveRecords()
      return records.value[index]
    }
    return null
  }

  /**
   * 添加还款记录到某月
   * @param {string} yearMonth - 年月
   * @param {Object} payment - 还款详情 { taskId, taskName, amount, date }
   */
  function addPayment(yearMonth, payment) {
    const record = getOrCreateRecord(yearMonth)
    const newPayment = {
      id: generateId(),
      taskId: payment.taskId || '',
      taskName: payment.taskName || '',
      amount: Number(payment.amount) || 0,
      date: payment.date || '',
      remark: payment.remark || ''
    }
    record.payments.push(newPayment)
    record.totalPaid = record.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    saveRecords()
    return record
  }

  /**
   * 从某月记录中删除还款项
   * @param {string} yearMonth - 年月
   * @param {string} paymentId - 还款项 ID
   */
  function removePayment(yearMonth, paymentId) {
    const record = records.value.find(r => r.yearMonth === yearMonth)
    if (record) {
      record.payments = record.payments.filter(p => p.id !== paymentId)
      record.totalPaid = record.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      saveRecords()
    }
  }

  /**
   * 获取指定月份的记录
   * @param {string} yearMonth
   * @returns {Object|null}
   */
  function getRecord(yearMonth) {
    return records.value.find(r => r.yearMonth === yearMonth) || null
  }

  return {
    records,
    sortedRecords,
    currentMonthRecord,
    initMonthly,
    getOrCreateRecord,
    updateRecord,
    addPayment,
    removePayment,
    getRecord
  }
})
