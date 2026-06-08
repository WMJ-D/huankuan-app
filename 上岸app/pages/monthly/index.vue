<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-content">
        <text class="nav-title">月度记录</text>
        <view class="nav-action" @click="openAddModal">
          <text class="nav-add-text">+ 记一笔</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }">
      <view class="month-selector">
        <view class="month-arrow" :class="{ 'arrow-disabled': isAtRepayStart }" @click="prevMonth">
          <text class="arrow-text">&lt;</text>
        </view>
        <view class="month-display">
          <text class="month-display-text">{{ getMonthDisplayName(selectedYearMonth) }}</text>
          <view v-if="isCurrentMonth" class="current-badge">
            <text class="current-badge-text">本月</text>
          </view>
        </view>
        <view class="month-arrow" :class="{ 'arrow-disabled': isCurrentMonth }" @click="nextMonth">
          <text class="arrow-text">&gt;</text>
        </view>
      </view>

      <view class="overview-card">
        <view class="overview-bg"></view>
        <view class="overview-content">
          <view class="overview-main">
            <text class="overview-label">{{ isBeforeRepayStart ? '应还总额' : '本月应还总额' }}</text>
            <text class="overview-total">{{ formatMoneyWithSymbol(monthlyTotalPayment) }}</text>
          </view>
          <view class="overview-status">
            <text class="status-label">已还</text>
            <text class="status-value text-green">{{ formatMoneyWithSymbol(monthlyPaidTotal) }}</text>
            <text class="status-divider">/</text>
            <text class="status-label">待还</text>
            <text class="status-value text-orange">{{ formatMoneyWithSymbol(monthlyUnpaidTotal) }}</text>
          </view>
          <view class="progress-section">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: monthlyProgress + '%' }"></view>
            </view>
            <text class="progress-text">{{ monthlyProgress }}%</text>
          </view>
          <view class="overview-divider"></view>
          <view class="overview-row">
            <view class="overview-item">
              <text class="overview-item-label">已还本金</text>
              <text class="overview-item-value text-green">{{ formatMoneyWithSymbol(monthlyPaidPrincipal) }}</text>
            </view>
            <view class="overview-item">
              <text class="overview-item-label">已还利息</text>
              <text class="overview-item-value text-orange">{{ formatMoneyWithSymbol(monthlyPaidInterest) }}</text>
            </view>
            <view class="overview-item">
              <text class="overview-item-label">私人欠款</text>
              <text class="overview-item-value">{{ formatMoneyWithSymbol(friendStore.totalRemaining) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">各平台还款状态</text>
          <text class="section-count">{{ activePlatformsForMonth.length }}项</text>
        </view>
        <view v-if="activePlatformsForMonth.length === 0" class="empty-tip">
          <text class="empty-text">暂无待还平台</text>
        </view>
        <view
          v-for="platform in activePlatformsForMonth"
          :key="platform.id"
          class="platform-card"
          @click="openAddModalForPlatform(platform)"
        >
          <view class="platform-top">
            <view class="platform-left">
              <text class="platform-name">{{ platform.name }}</text>
              <text class="platform-due">每月{{ platform.dueDay }}日还款</text>
            </view>
            <view class="platform-right">
              <text class="platform-total">{{ formatMoneyWithSymbol(getPlatformMonthlyTotal(platform)) }}</text>
            </view>
          </view>
          <view class="platform-status">
            <view class="status-tag" :class="getPlatformStatusClass(platform.id)">
              <text class="status-tag-text">{{ getPlatformStatusText(platform.id) }}</text>
            </view>
          </view>
          <view class="platform-bottom">
            <view class="platform-split">
              <text class="split-label">待还本金</text>
              <text class="split-value text-green">{{ formatMoneyWithSymbol(platform.principal) }}</text>
            </view>
            <view class="platform-split">
              <text class="split-label">月供本金</text>
              <text class="split-value">{{ formatMoneyWithSymbol(platform.monthlyPrincipal) }}</text>
            </view>
            <view class="platform-split">
              <text class="split-label">月供利息</text>
              <text class="split-value text-orange">{{ formatMoneyWithSymbol(platform.monthlyInterest) }}</text>
            </view>
            <view class="platform-split">
              <text class="split-label">剩余</text>
              <text class="split-value">{{ platform.remainingInstallments }}期</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">{{ getMonthDisplayName(selectedYearMonth) }}还款记录</text>
          <text class="section-count">{{ filteredRecords.length }}笔</text>
        </view>
        <view v-if="filteredRecords.length === 0" class="empty-tip">
          <text class="empty-text">本月暂无还款记录，点击上方平台或"记一笔"添加</text>
        </view>
        <view
          v-for="record in filteredRecords"
          :key="record.id"
          class="record-card"
        >
          <view class="record-top">
            <view class="record-left">
              <view class="record-name-row">
                <text class="record-name">{{ getPlatformName(record.platformId) }}</text>
                <view :class="['record-type-tag', record.type === 'prepay' ? 'tag-prepay' : 'tag-installment']">
                  <text class="record-type-text">{{ record.type === 'prepay' ? '提前还款' : '还当期' }}</text>
                </view>
              </view>
              <text class="record-date">{{ record.date }}</text>
            </view>
            <view class="record-right">
              <text class="record-total">-{{ formatMoneyWithSymbol(record.total) }}</text>
            </view>
          </view>
          <view class="record-bottom">
            <view class="record-split">
              <text class="split-label">本金</text>
              <text class="split-value text-green">{{ formatMoneyWithSymbol(record.principal) }}</text>
            </view>
            <view class="record-split">
              <text class="split-label">利息</text>
              <text class="split-value text-orange">{{ formatMoneyWithSymbol(record.interest) }}</text>
            </view>
            <view class="record-split" v-if="record.remark">
              <text class="split-label">备注</text>
              <text class="split-value remark-text">{{ record.remark }}</text>
            </view>
            <view class="record-delete" @click="deleteRecord(record.id)">
              <text class="record-delete-text">删除</text>
            </view>
          </view>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>

    <view class="modal-overlay" v-if="showAddModal" @click="showAddModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">记录还款</text>
          <view class="modal-close" @click="showAddModal = false">
            <text class="close-text">x</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">还款类型 <text class="required">*</text></text>
            <view class="type-selector">
              <view :class="['type-btn', recordForm.type === 'installment' ? 'type-active' : '']" @click="recordForm.type = 'installment'">
                <text class="type-btn-text">还当期</text>
              </view>
              <view :class="['type-btn', recordForm.type === 'prepay' ? 'type-active' : '']" @click="recordForm.type = 'prepay'">
                <text class="type-btn-text">提前还款</text>
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">选择平台 <text class="required">*</text></text>
            <picker :range="platformNames" @change="onPlatformChange" :value="selectedPlatformIndex">
              <view class="picker-input">
                <text class="picker-text">{{ selectedPlatformName || '请选择还款平台' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">还款日期</text>
            <view class="form-input disabled">
              <text class="form-input-text">{{ recordForm.date }}</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">还款本金 <text class="required">*</text></text>
            <view class="input-with-unit">
              <input class="form-input" v-model="recordForm.principal" type="digit" placeholder="0.00" placeholder-class="input-placeholder" />
              <text class="input-unit">元</text>
            </view>
          </view>
          <view class="form-item" v-if="recordForm.type === 'installment'">
            <text class="form-label">还款利息 <text class="required">*</text></text>
            <view class="input-with-unit">
              <input class="form-input" v-model="recordForm.interest" type="digit" placeholder="0.00" placeholder-class="input-placeholder" />
              <text class="input-unit">元</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <input class="form-input" v-model="recordForm.remark" placeholder="备注（可选）" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn-save" @click="saveRecord">
            <text class="btn-save-text">保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTaskStore } from '../../store/tasks'
import { useFriendStore } from '../../store/friends'
import { formatMoneyWithSymbol, roundToTwo, getCurrentYearMonth, getMonthDisplayName } from '../../utils/calc'

const taskStore = useTaskStore()
const friendStore = useFriendStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(600)
const showAddModal = ref(false)
const selectedPlatformIndex = ref(0)
const selectedPlatformId = ref('')

const currentYearMonth = getCurrentYearMonth()
const nextRepayMonth = taskStore.getNextRepayMonth()
const initYearMonth = nextRepayMonth <= currentYearMonth ? nextRepayMonth : currentYearMonth
const [initYear, initMonth] = initYearMonth.split('-').map(Number)
const selectedYear = ref(initYear)
const selectedMonth = ref(initMonth)

const recordForm = reactive({
  type: 'installment',
  date: '',
  principal: '',
  interest: '',
  remark: ''
})

const selectedYearMonth = computed(() => {
  return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
})

const isCurrentMonth = computed(() => {
  return selectedYearMonth.value === getCurrentYearMonth()
})

const isAtRepayStart = computed(() => {
  return selectedYearMonth.value === taskStore.getEarliestRepayStart()
})

const isBeforeRepayStart = computed(() => {
  return selectedYearMonth.value < taskStore.getEarliestRepayStart()
})

const filteredRecords = computed(() => {
  const ym = selectedYearMonth.value
  return taskStore.records
    .filter(r => r.date && r.date.startsWith(ym))
    .sort((a, b) => b.date.localeCompare(a.date))
})

const activePlatformsForMonth = computed(() => {
  return taskStore.getActivePlatformsForMonth(selectedYearMonth.value)
})

const monthlyTotalPayment = computed(() => {
  return taskStore.getMonthlyPaymentForMonth(selectedYearMonth.value)
})

const monthlyPaidTotal = computed(() => {
  return roundToTwo(filteredRecords.value.reduce((sum, r) => sum + (r.total || 0), 0))
})

const monthlyUnpaidTotal = computed(() => {
  return roundToTwo(Math.max(0, monthlyTotalPayment.value - monthlyPaidTotal.value))
})

const monthlyProgress = computed(() => {
  if (!monthlyTotalPayment.value) return 0
  return Math.round((monthlyPaidTotal.value / monthlyTotalPayment.value) * 1000) / 10
})

const monthlyPaidPrincipal = computed(() => {
  return roundToTwo(filteredRecords.value.reduce((sum, r) => sum + (r.principal || 0), 0))
})

const monthlyPaidInterest = computed(() => {
  return roundToTwo(filteredRecords.value.reduce((sum, r) => sum + (r.interest || 0), 0))
})

const platformNames = computed(() => {
  return activePlatformsForMonth.value.map(p => p.name)
})

const selectedPlatformName = computed(() => {
  if (selectedPlatformId.value) {
    const p = taskStore.getPlatformById(selectedPlatformId.value)
    return p ? p.name : ''
  }
  if (activePlatformsForMonth.value.length > 0 && selectedPlatformIndex.value < activePlatformsForMonth.value.length) {
    return activePlatformsForMonth.value[selectedPlatformIndex.value].name
  }
  return ''
})

function prevMonth() {
  if (isAtRepayStart.value) return
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value -= 1
  } else {
    selectedMonth.value -= 1
  }
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value += 1
  } else {
    selectedMonth.value += 1
  }
}

function getPlatformMonthlyTotal(platform) {
  return roundToTwo((platform.monthlyPrincipal || 0) + (platform.monthlyInterest || 0))
}

function getPlatformName(platformId) {
  const platform = taskStore.platforms.find(p => p.id === platformId)
  return platform ? platform.name : '未知平台'
}

function getPlatformStatusText(platformId) {
  const platform = taskStore.platforms.find(p => p.id === platformId)
  if (platform && platform.repayStartYearMonth && platform.repayStartYearMonth > selectedYearMonth.value) {
    return '未到期'
  }
  const records = taskStore.records.filter(r => {
    return r.platformId === platformId && r.date && r.date.startsWith(selectedYearMonth.value)
  })
  if (records.length > 0) {
    const total = records.reduce((sum, r) => sum + (r.principal || 0), 0)
    return `已还 ${formatMoneyWithSymbol(total)}`
  }
  return '未还'
}

function getPlatformStatusClass(platformId) {
  const records = taskStore.records.filter(r => {
    return r.platformId === platformId && r.date && r.date.startsWith(selectedYearMonth.value)
  })
  return records.length > 0 ? 'status-paid' : 'status-unpaid'
}

function onPlatformChange(e) {
  selectedPlatformIndex.value = e.detail.value
  const platform = activePlatformsForMonth.value[selectedPlatformIndex.value]
  if (platform) {
    selectedPlatformId.value = platform.id
    recordForm.principal = String(platform.monthlyPrincipal || '')
    recordForm.interest = String(platform.monthlyInterest || '')
  }
}

function openAddModal() {
  selectedPlatformId.value = ''
  selectedPlatformIndex.value = 0
  recordForm.type = 'installment'
  recordForm.date = new Date().toISOString().slice(0, 10)
  recordForm.principal = ''
  recordForm.interest = ''
  recordForm.remark = ''

  if (activePlatformsForMonth.value.length > 0) {
    const platform = activePlatformsForMonth.value[0]
    selectedPlatformId.value = platform.id
    recordForm.principal = String(platform.monthlyPrincipal || '')
    recordForm.interest = String(platform.monthlyInterest || '')
  }

  showAddModal.value = true
}

function openAddModalForPlatform(platform) {
  selectedPlatformId.value = platform.id
  selectedPlatformIndex.value = activePlatformsForMonth.value.findIndex(p => p.id === platform.id)
  recordForm.type = 'installment'
  recordForm.date = new Date().toISOString().slice(0, 10)
  recordForm.principal = String(platform.monthlyPrincipal || '')
  recordForm.interest = String(platform.monthlyInterest || '')
  recordForm.remark = ''
  showAddModal.value = true
}

function saveRecord() {
  if (!selectedPlatformId.value) {
    uni.showToast({ title: '请选择还款平台', icon: 'none' })
    return
  }
  if (!recordForm.principal || Number(recordForm.principal) <= 0) {
    uni.showToast({ title: '请输入还款本金', icon: 'none' })
    return
  }
  if (recordForm.type === 'installment' && (!recordForm.interest || Number(recordForm.interest) < 0)) {
    uni.showToast({ title: '请输入还款利息', icon: 'none' })
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  const interest = recordForm.type === 'installment' ? Number(recordForm.interest) : 0
  taskStore.addRecord(selectedPlatformId.value, {
    type: recordForm.type,
    date: recordForm.date || today,
    principal: Number(recordForm.principal),
    interest: interest,
    remark: recordForm.remark
  })

  showAddModal.value = false
  uni.showToast({ title: '记录成功', icon: 'success' })
}

function deleteRecord(recordId) {
  uni.showModal({
    title: '确认删除',
    content: '删除此还款记录？余额将相应恢复。',
    confirmColor: '#f44336',
    success: (res) => {
      if (res.confirm) {
        taskStore.removeRecord(recordId)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44 - 50

  taskStore.initTasks()
  friendStore.initFriends()
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

  .nav-title {
    font-size: 38rpx;
    font-weight: 700;
    color: $text-primary;
  }

  .nav-action {
    background: linear-gradient(135deg, $accent-green, $accent-green-dark);
    padding: 12rpx 28rpx;
    border-radius: 30rpx;

    .nav-add-text {
      font-size: $font-sm;
      font-weight: 600;
      color: #fff;
    }
  }
}

.scroll-content {
  padding: 0 24rpx;
  box-sizing: border-box;
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
  padding: 16rpx 0;
  gap: 40rpx;
}

.month-arrow {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: $bg-card;
  display: flex;
  align-items: center;
  justify-content: center;

  .arrow-text {
    font-size: $font-lg;
    color: $text-primary;
    font-weight: 600;
  }

  &.arrow-disabled {
    opacity: 0.3;
  }
}

.month-display {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .month-display-text {
    font-size: $font-lg;
    font-weight: 700;
    color: $text-primary;
  }
}

.current-badge {
  background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;

  .current-badge-text {
    font-size: $font-xs;
    font-weight: 600;
    color: #fff;
  }
}

.overview-card {
  position: relative;
  border-radius: $radius-lg;
  overflow: hidden;
  margin-top: 10rpx;

  .overview-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #1e3a5f 0%, #1a2a45 50%, #1e2a45 100%);
  }

  .overview-content {
    position: relative;
    padding: 36rpx;
  }
}

.overview-main {
  text-align: center;
  margin-bottom: 16rpx;

  .overview-label {
    display: block;
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: 8rpx;
  }

  .overview-total {
    display: block;
    font-size: 52rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.overview-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 16rpx;

  .status-label {
    font-size: $font-xs;
    color: $text-muted;
  }

  .status-value {
    font-size: $font-md;
    font-weight: 600;
  }

  .status-divider {
    font-size: $font-sm;
    color: $text-muted;
  }
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;

  .progress-bar {
    flex: 1;
    height: 12rpx;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 6rpx;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $accent-green-dark, $accent-green);
    border-radius: 6rpx;
    transition: width 0.6s ease;
  }

  .progress-text {
    font-size: $font-sm;
    font-weight: 600;
    color: $accent-green;
    min-width: 80rpx;
    text-align: right;
  }
}

.overview-divider {
  height: 1rpx;
  background-color: rgba(255, 255, 255, 0.06);
  margin-bottom: 20rpx;
}

.overview-row {
  display: flex;
  gap: 20rpx;
}

.overview-item {
  flex: 1;
  text-align: center;

  .overview-item-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 6rpx;
  }

  .overview-item-value {
    display: block;
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
  }
}

.text-green {
  color: $accent-green;
}

.text-orange {
  color: $accent-orange;
}

.section {
  margin-top: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 4rpx;
}

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.section-count {
  font-size: $font-sm;
  color: $text-muted;
}

.platform-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-card;
}

.platform-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.platform-left {
  flex: 1;

  .platform-name {
    display: block;
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 6rpx;
  }

  .platform-due {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
  }
}

.platform-right {
  text-align: right;

  .platform-total {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $accent-orange;
  }
}

.platform-status {
  margin-top: 16rpx;

  .status-tag {
    display: inline-block;
    padding: 4rpx 16rpx;
    border-radius: 16rpx;

    .status-tag-text {
      font-size: $font-xs;
      font-weight: 500;
    }

    &.status-paid {
      background-color: rgba(76, 175, 80, 0.15);

      .status-tag-text {
        color: $accent-green;
      }
    }

    &.status-unpaid {
      background-color: rgba(255, 152, 0, 0.15);

      .status-tag-text {
        color: $accent-orange;
      }
    }
  }
}

.platform-bottom {
  display: flex;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.04);
  gap: 20rpx;
}

.platform-split {
  flex: 1;

  .split-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 4rpx;
  }

  .split-value {
    display: block;
    font-size: $font-sm;
    font-weight: 500;
    color: $text-primary;
  }
}

.record-card {
  background-color: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.record-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-left {
  .record-name-row {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .record-name {
    font-size: $font-md;
    font-weight: 500;
    color: $text-primary;
  }

  .record-type-tag {
    padding: 2rpx 12rpx;
    border-radius: 6rpx;
    font-size: 20rpx;
  }

  .tag-installment {
    background-color: rgba(76, 175, 80, 0.1);
    .record-type-text { color: $accent-green; }
  }

  .tag-prepay {
    background-color: rgba(255, 152, 0, 0.1);
    .record-type-text { color: $accent-orange; }
  }

  .record-type-text {
    font-size: 20rpx;
  }

  .record-date {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-top: 6rpx;
  }
}

.record-right {
  text-align: right;

  .record-total {
    display: block;
    font-size: $font-md;
    font-weight: 600;
    color: $accent-green;
  }
}

.record-bottom {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.04);
  gap: 20rpx;
}

.record-split {
  .split-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 4rpx;
  }

  .split-value {
    display: block;
    font-size: $font-sm;
    font-weight: 500;
    color: $text-primary;
  }
}

.record-delete {
  margin-left: auto;

  .record-delete-text {
    font-size: $font-xs;
    color: $accent-red;
  }
}

.remark-text {
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tip {
  text-align: center;
  padding: 40rpx;

  .empty-text {
    font-size: $font-md;
    color: $text-muted;
  }
}

.safe-bottom-space {
  height: 30rpx;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  background-color: $bg-secondary;
  border-radius: $radius-xl $radius-xl 0 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid $border-color;

  .modal-title {
    font-size: $font-lg;
    font-weight: 600;
    color: $text-primary;
  }

  .modal-close {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background-color: $bg-card;
    display: flex;
    align-items: center;
    justify-content: center;

    .close-text {
      font-size: $font-md;
      color: $text-muted;
    }
  }
}

.modal-body {
  padding: 24rpx 30rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: 10rpx;

  .required {
    color: $accent-red;
  }
}

.type-selector {
  display: flex;
  gap: 16rpx;
}

.type-btn {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background-color: $bg-input;
  border: 1rpx solid $border-color;
}

.type-btn.type-active {
  background-color: rgba(76, 175, 80, 0.1);
  border-color: $accent-green;
}

.type-btn-text {
  font-size: $font-md;
  color: $text-secondary;
}

.type-btn.type-active .type-btn-text {
  color: $accent-green;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 76rpx;
  background-color: $bg-input;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: 0 20rpx;
  color: $text-primary;
  font-size: $font-md;

  &.disabled {
    display: flex;
    align-items: center;
    background-color: $bg-secondary;
    opacity: 0.7;
  }
}

.form-input-text {
  color: $text-primary;
  font-size: $font-md;
}

.input-placeholder {
  color: $text-muted;
}

.input-with-unit {
  display: flex;
  align-items: center;
  background-color: $bg-input;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding-right: 20rpx;

  .form-input {
    border: none;
    background: transparent;
    flex: 1;
  }

  .input-unit {
    font-size: $font-sm;
    color: $text-muted;
  }
}

.picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76rpx;
  background-color: $bg-input;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: 0 20rpx;

  .picker-text {
    font-size: $font-md;
    color: $text-primary;
  }

  .picker-arrow {
    font-size: $font-xs;
    color: $text-muted;
  }
}

.modal-footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $border-color;
}

.btn-save {
  background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  padding: 24rpx;
  border-radius: $radius-md;
  text-align: center;

  .btn-save-text {
    font-size: $font-md;
    font-weight: 600;
    color: #fff;
  }
}
</style>
