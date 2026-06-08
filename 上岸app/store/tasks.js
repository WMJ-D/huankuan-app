import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, STORAGE_KEYS } from '../utils/storage'
import { generateId, roundToTwo, getCurrentYearMonth } from '../utils/calc'

const TASKS_INITIALIZED_KEY = 'repayment_tasks_initialized_v3'
const REPAY_RECORDS_INITIALIZED_KEY = 'repayment_records_initialized_v3'

const DEMO_PLATFORMS = [
  {
    id: 'p1',
    name: '全民分期乐',
    totalPrincipal: 50000,
    principal: 43750.01,
    monthlyPrincipal: 2083.33,
    monthlyInterest: 245,
    totalInstallments: 24,
    remainingInstallments: 21,
    annualRate: 9.8,
    dueDay: 19,
    repayStartYearMonth: '2026-06',
    status: 'active',
    remark: ''
  },
  {
    id: 'p2',
    name: '借呗',
    totalPrincipal: 16198.2,
    principal: 13789.14,
    monthlyPrincipal: 1349.85,
    monthlyInterest: 64.11,
    totalInstallments: 12,
    remainingInstallments: 10,
    annualRate: 5.4,
    dueDay: 10,
    repayStartYearMonth: '2026-06',
    status: 'active',
    remark: ''
  },
  {
    id: 'p3',
    name: '交行惠民贷',
    totalPrincipal: 48104.7,
    principal: 39964.98,
    monthlyPrincipal: 2030.55,
    monthlyInterest: 155.86,
    totalInstallments: 24,
    remainingInstallments: 19,
    annualRate: 4.68,
    dueDay: 25,
    repayStartYearMonth: '2026-06',
    status: 'active',
    remark: ''
  }
]

const DEMO_RECORDS = []

export const useTaskStore = defineStore('tasks', () => {
  const platforms = ref([])
  const records = ref([])

  const activePlatforms = computed(() => platforms.value.filter(p => p.status === 'active'))
  const settledPlatforms = computed(() => platforms.value.filter(p => p.status === 'settled'))

  const totalPrincipal = computed(() => {
    return roundToTwo(activePlatforms.value.reduce((sum, p) => sum + (p.principal || 0), 0))
  })

  const totalMonthlyPrincipal = computed(() => {
    return roundToTwo(activePlatforms.value.reduce((sum, p) => sum + (p.monthlyPrincipal || 0), 0))
  })

  const totalMonthlyInterest = computed(() => {
    return roundToTwo(activePlatforms.value.reduce((sum, p) => sum + (p.monthlyInterest || 0), 0))
  })

  const totalMonthlyPayment = computed(() => {
    return roundToTwo(totalMonthlyPrincipal.value + totalMonthlyInterest.value)
  })

  const totalProgress = computed(() => {
    const totalOriginal = platforms.value.reduce((sum, p) => sum + (p.totalPrincipal || 0), 0)
    if (!totalOriginal) return 0
    const totalPaid = roundToTwo(totalOriginal - totalPrincipal.value)
    return Math.round((totalPaid / totalOriginal) * 1000) / 10
  })

  const activePlatformCount = computed(() => activePlatforms.value.length)

  function initTasks() {
    const wasInitialized = getStorage(TASKS_INITIALIZED_KEY, false)
    if (wasInitialized) {
      platforms.value = getStorage(STORAGE_KEYS.TASKS, [])
      records.value = getStorage(STORAGE_KEYS.REPAY_RECORDS, [])
    } else {
      platforms.value = [...DEMO_PLATFORMS]
      records.value = [...DEMO_RECORDS]
      savePlatforms()
      saveRecords()
      setStorage(TASKS_INITIALIZED_KEY, true)
      setStorage(REPAY_RECORDS_INITIALIZED_KEY, true)
    }
  }

  function savePlatforms() {
    setStorage(STORAGE_KEYS.TASKS, platforms.value)
  }

  function saveRecords() {
    setStorage(STORAGE_KEYS.REPAY_RECORDS, records.value)
  }

  function addPlatform(data) {
    const monthlyPayment = roundToTwo(Number(data.monthlyPrincipal) + Number(data.monthlyInterest))
    const newPlatform = {
      id: generateId(),
      name: data.name || '',
      totalPrincipal: roundToTwo(Number(data.totalPrincipal) || 0),
      principal: roundToTwo(Number(data.principal) || Number(data.totalPrincipal) || 0),
      monthlyPrincipal: roundToTwo(Number(data.monthlyPrincipal) || 0),
      monthlyInterest: roundToTwo(Number(data.monthlyInterest) || 0),
      totalInstallments: Number(data.totalInstallments) || 0,
      remainingInstallments: Number(data.remainingInstallments) || Number(data.totalInstallments) || 0,
      annualRate: Number(data.annualRate) || 0,
      dueDay: Number(data.dueDay) || 1,
      repayStartYearMonth: data.repayStartYearMonth || '',
      status: 'active',
      remark: data.remark || ''
    }
    if (newPlatform.principal <= 0) {
      newPlatform.principal = 0
      newPlatform.status = 'settled'
    }
    platforms.value.push(newPlatform)
    savePlatforms()
    return newPlatform
  }

  function updatePlatform(id, data) {
    const index = platforms.value.findIndex(p => p.id === id)
    if (index !== -1) {
      const updated = { ...platforms.value[index] }
      if (data.name !== undefined) updated.name = data.name
      if (data.totalPrincipal !== undefined) updated.totalPrincipal = roundToTwo(Number(data.totalPrincipal))
      if (data.principal !== undefined) updated.principal = roundToTwo(Number(data.principal))
      if (data.monthlyPrincipal !== undefined) updated.monthlyPrincipal = roundToTwo(Number(data.monthlyPrincipal))
      if (data.monthlyInterest !== undefined) updated.monthlyInterest = roundToTwo(Number(data.monthlyInterest))
      if (data.totalInstallments !== undefined) updated.totalInstallments = Number(data.totalInstallments)
      if (data.remainingInstallments !== undefined) updated.remainingInstallments = Number(data.remainingInstallments)
      if (data.annualRate !== undefined) updated.annualRate = Number(data.annualRate)
      if (data.dueDay !== undefined) updated.dueDay = Number(data.dueDay)
      if (data.repayStartYearMonth !== undefined) updated.repayStartYearMonth = data.repayStartYearMonth
      if (data.remark !== undefined) updated.remark = data.remark

      if (updated.principal <= 0) {
        updated.principal = 0
        updated.remainingInstallments = 0
        updated.status = 'settled'
      } else {
        updated.status = 'active'
      }

      platforms.value[index] = updated
      savePlatforms()
      return updated
    }
    return null
  }

  function deletePlatform(id) {
    platforms.value = platforms.value.filter(p => p.id !== id)
    records.value = records.value.filter(r => r.platformId !== id)
    savePlatforms()
    saveRecords()
  }

  function addRecord(platformId, data) {
    const newRecord = {
      id: generateId(),
      platformId: platformId,
      type: data.type || 'installment',
      date: data.date || new Date().toISOString().slice(0, 10),
      principal: roundToTwo(Number(data.principal) || 0),
      interest: roundToTwo(Number(data.interest) || 0),
      remark: data.remark || ''
    }
    newRecord.total = roundToTwo(newRecord.principal + newRecord.interest)
    records.value.push(newRecord)

    const platform = platforms.value.find(p => p.id === platformId)
    if (platform) {
      platform.principal = roundToTwo(Math.max(0, platform.principal - newRecord.principal))
      if (newRecord.type === 'installment') {
        platform.remainingInstallments = Math.max(0, platform.remainingInstallments - 1)
      }
      if (platform.principal <= 0 || platform.remainingInstallments <= 0) {
        platform.principal = 0
        platform.remainingInstallments = 0
        platform.status = 'settled'
      }
      savePlatforms()
    }

    saveRecords()
    return newRecord
  }

  function removeRecord(recordId) {
    const record = records.value.find(r => r.id === recordId)
    if (record) {
      const platform = platforms.value.find(p => p.id === record.platformId)
      if (platform) {
        platform.principal = roundToTwo(platform.principal + record.principal)
        if (record.type === 'installment') {
          platform.remainingInstallments = platform.remainingInstallments + 1
        }
        if (platform.principal > 0) {
          platform.status = 'active'
        }
        savePlatforms()
      }
      records.value = records.value.filter(r => r.id !== recordId)
      saveRecords()
    }
  }

  function getRecordsByPlatformId(platformId) {
    return records.value
      .filter(r => r.platformId === platformId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  function getPlatformById(id) {
    return platforms.value.find(p => p.id === id) || null
  }

  function generateRepaymentPlan(platformId) {
    const platform = platforms.value.find(p => p.id === platformId)
    if (!platform || !platform.repayStartYearMonth) return []

    const plan = []
    let remainingPrincipal = platform.principal
    const monthlyRate = platform.annualRate / 100 / 12

    const [startYear, startMonth] = platform.repayStartYearMonth.split('-').map(Number)

    for (let i = 0; i < platform.remainingInstallments; i++) {
      const month = new Date(startYear, startMonth - 1 + i, 1)
      const year = month.getFullYear()
      const m = month.getMonth() + 1

      const interest = roundToTwo(remainingPrincipal * monthlyRate)
      const principal = i === platform.remainingInstallments - 1
        ? roundToTwo(remainingPrincipal)
        : roundToTwo(platform.monthlyPrincipal)
      const total = roundToTwo(principal + interest)

      plan.push({
        period: platform.totalInstallments - platform.remainingInstallments + i + 1,
        yearMonth: `${year}-${String(m).padStart(2, '0')}`,
        dueDay: platform.dueDay,
        principal: principal,
        interest: interest,
        total: total,
        remainingAfter: roundToTwo(Math.max(0, remainingPrincipal - principal))
      })

      remainingPrincipal = roundToTwo(remainingPrincipal - principal)
    }

    return plan
  }

  function getEarliestRepayStart() {
    const active = activePlatforms.value
    if (active.length === 0) return getCurrentYearMonth()
    const dates = active
      .map(p => p.repayStartYearMonth)
      .filter(d => d)
      .sort()
    return dates.length > 0 ? dates[0] : getCurrentYearMonth()
  }

  function isBeforeRepayStart() {
    const now = new Date()
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return currentYearMonth < getEarliestRepayStart()
  }

  function getNextRepayMonth() {
    if (isBeforeRepayStart()) {
      return getEarliestRepayStart()
    }
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  function getActivePlatformsForMonth(yearMonth) {
    return activePlatforms.value.filter(p => {
      if (!p.repayStartYearMonth) return true
      return p.repayStartYearMonth <= yearMonth
    })
  }

  function isPlatformStarted(platformId, yearMonth) {
    const p = platforms.value.find(item => item.id === platformId)
    if (!p || !p.repayStartYearMonth) return true
    const target = yearMonth || getCurrentYearMonth()
    return p.repayStartYearMonth <= target
  }

  function getMonthlyPaymentForMonth(yearMonth) {
    const started = getActivePlatformsForMonth(yearMonth)
    return roundToTwo(started.reduce((sum, p) => sum + (p.monthlyPrincipal || 0) + (p.monthlyInterest || 0), 0))
  }

  function getMonthlyInterestForMonth(yearMonth) {
    const started = getActivePlatformsForMonth(yearMonth)
    return roundToTwo(started.reduce((sum, p) => sum + (p.monthlyInterest || 0), 0))
  }

  function getPrincipalForMonth(yearMonth) {
    const started = getActivePlatformsForMonth(yearMonth)
    return roundToTwo(started.reduce((sum, p) => sum + (p.principal || 0), 0))
  }

  function getPlatformsSummary() {
    return activePlatforms.value.map(p => ({
      id: p.id,
      name: p.name,
      principal: p.principal,
      monthlyPayment: roundToTwo(p.monthlyPrincipal + p.monthlyInterest),
      dueDay: p.dueDay,
      remainingInstallments: p.remainingInstallments,
      totalInstallments: p.totalInstallments
    }))
  }

  return {
    platforms,
    records,
    activePlatforms,
    settledPlatforms,
    totalPrincipal,
    totalMonthlyPrincipal,
    totalMonthlyInterest,
    totalMonthlyPayment,
    totalProgress,
    activePlatformCount,
    initTasks,
    addPlatform,
    updatePlatform,
    deletePlatform,
    addRecord,
    removeRecord,
    getRecordsByPlatformId,
    getPlatformById,
    generateRepaymentPlan,
    getPlatformsSummary,
    getEarliestRepayStart,
    isBeforeRepayStart,
    getNextRepayMonth,
    getActivePlatformsForMonth,
    isPlatformStarted,
    getMonthlyPaymentForMonth,
    getMonthlyInterestForMonth,
    getPrincipalForMonth
  }
})
