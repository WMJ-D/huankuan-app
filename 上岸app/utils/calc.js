/**
 * 还款计算工具模块
 * 包含利率计算、进度计算、金额格式化等功能
 */

/**
 * 四舍五入保留两位小数，解决浮点精度问题
 * @param {number} num
 * @returns {number}
 */
export function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * 格式化金额为千分位显示
 * @param {number} amount - 金额
 * @param {number} decimals - 小数位数，默认2
 * @returns {string} 格式化后的金额字符串
 */
export function formatMoney(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00'
  const num = Number(amount)
  const fixed = num.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart ? `${formatted}.${decPart}` : formatted
}

/**
 * 格式化金额带￥符号
 * @param {number} amount
 * @param {number} decimals
 * @returns {string}
 */
export function formatMoneyWithSymbol(amount, decimals = 2) {
  return `￥${formatMoney(amount, decimals)}`
}

/**
 * 计算总还款进度百分比
 * @param {number} paidAmount - 已还金额
 * @param {number} totalAmount - 总金额
 * @returns {number} 0-100的百分比
 */
export function calcProgress(paidAmount, totalAmount) {
  if (!totalAmount || totalAmount === 0) return 0
  const progress = (paidAmount / totalAmount) * 100
  return Math.min(Math.max(Math.round(progress * 10) / 10, 0), 100)
}

/**
 * 计算单笔贷款的还款进度
 * @param {number} totalInstallments - 总分期数
 * @param {number} remainingInstallments - 剩余分期数
 * @returns {number} 0-100的百分比
 */
export function calcTaskProgress(totalInstallments, remainingInstallments) {
  if (!totalInstallments || totalInstallments === 0) return 0
  const paid = totalInstallments - remainingInstallments
  return calcProgress(paid, totalInstallments)
}

/**
 * 计算月利率
 * @param {number} annualRate - 年化利率(%)
 * @returns {number} 月利率(%)
 */
export function calcMonthlyRate(annualRate) {
  if (!annualRate) return 0
  return annualRate / 12
}

/**
 * 根据年化利率和剩余本金估算下月利息
 * @param {number} principal - 剩余本金
 * @param {number} annualRate - 年化利率(%)
 * @returns {number} 估算月利息
 */
export function estimateMonthlyInterest(principal, annualRate) {
  if (!principal || !annualRate) return 0
  return principal * (annualRate / 100) / 12
}

/**
 * 根据还款日判断距离下次还款的天数
 * @param {number} dueDay - 每月还款日(1-31)
 * @returns {number} 距离下次还款的天数，0表示今天
 */
export function daysUntilDue(dueDay) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  let targetDate = new Date(currentYear, currentMonth, dueDay)
  if (targetDate.getDate() !== dueDay) {
    // 如果设置的日期超过当月最大天数，取当月最后一天
    targetDate = new Date(currentYear, currentMonth + 1, 0)
  }

  // 如果本月还款日已过，算下个月
  if (currentDay > dueDay) {
    targetDate = new Date(currentYear, currentMonth + 1, dueDay)
    if (targetDate.getDate() !== dueDay) {
      targetDate = new Date(currentYear, currentMonth + 2, 0)
    }
  }

  const diffTime = targetDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 0)
}

/**
 * 判断还款紧急程度
 * @param {number} dueDay - 还款日
 * @returns {string} 'urgent' | 'warning' | 'normal'
 */
export function getUrgencyLevel(dueDay) {
  const days = daysUntilDue(dueDay)
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'warning'
  return 'normal'
}

/**
 * 获取贷款类型标签
 * @param {string} type - 类型标识
 * @returns {string} 中文标签
 */
export function getTypeLabel(type) {
  const labels = {
    online: '网贷',
    creditCard: '信用卡分期',
    personal: '私人借款'
  }
  return labels[type] || type
}

/**
 * 获取贷款类型对应的 badge 样式类
 * @param {string} type
 * @returns {string}
 */
export function getTypeBadgeClass(type) {
  const classes = {
    online: 'badge-orange',
    creditCard: 'badge-blue',
    personal: 'badge-purple'
  }
  return classes[type] || 'badge-green'
}

/**
 * 获取当前年月字符串
 * @returns {string} 如 "2025-07"
 */
export function getCurrentYearMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 获取月份显示名称
 * @param {string} yearMonth - "2025-07" 格式
 * @returns {string} "2025年7月"
 */
export function getMonthDisplayName(yearMonth) {
  if (!yearMonth) return ''
  const [year, month] = yearMonth.split('-')
  return `${year}年${parseInt(month)}月`
}

/**
 * 计算预计结清日期
 * @param {number} remainingInstallments - 剩余期数
 * @returns {string} 预计结清的年月，如 "2026-02"
 */
export function estimateSettleDate(remainingInstallments) {
  if (!remainingInstallments || remainingInstallments <= 0) return '已结清'
  const now = new Date()
  const settleDate = new Date(now.getFullYear(), now.getMonth() + remainingInstallments, 1)
  const year = settleDate.getFullYear()
  const month = String(settleDate.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
