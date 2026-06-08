<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-content">
        <view class="nav-title">
          <text class="title-text">上岸计划</text>
          <text class="title-sub">早日自由，轻装前行</text>
        </view>
        <view class="nav-icon" @click="showInfo">
          <text class="icon-text">i</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }">
      <view class="overview-card">
        <view class="overview-bg"></view>
        <view class="overview-content">
          <view class="overview-row">
            <view class="overview-item">
              <text class="overview-label">待还总本金</text>
              <text class="overview-value text-green">{{ formatMoneyWithSymbol(totalPrincipal) }}</text>
            </view>
            <view class="overview-divider"></view>
            <view class="overview-item">
              <text class="overview-label">{{ isBeforeStart ? '下月需还' : '本月需还' }}</text>
              <text class="overview-value text-orange">{{ formatMoneyWithSymbol(totalMonthlyPayment) }}</text>
            </view>
          </view>
          <view class="progress-section">
            <view class="progress-header">
              <text class="progress-title">总还款进度</text>
              <text class="progress-percent">{{ totalProgress }}%</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: totalProgress + '%' }"></view>
            </view>
          </view>
          <view class="overview-row overview-row--footer">
            <view class="overview-item-sm">
              <text class="overview-label-sm">{{ isBeforeStart ? '下月利息' : '本月利息' }}</text>
              <text class="overview-value-sm">{{ formatMoneyWithSymbol(totalMonthlyInterest) }}</text>
            </view>
            <view class="overview-item-sm">
              <text class="overview-label-sm">活跃平台</text>
              <text class="overview-value-sm">{{ activePlatformCount }}个</text>
            </view>
            <view class="overview-item-sm">
              <text class="overview-label-sm">私人欠款</text>
              <text class="overview-value-sm">{{ formatMoneyWithSymbol(friendTotalRemaining) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">{{ isBeforeStart ? '下月待还' : '本月待还' }}</text>
          <text class="section-count">{{ activePlatformCount }}项</text>
        </view>
        <view v-if="sortedPlatforms.length === 0" class="empty-tip">
          <text class="empty-text">暂无待还平台，已全部上岸！</text>
        </view>
        <view
          v-for="platform in sortedPlatforms"
          :key="platform.id"
          class="task-card"
          :class="{ 'task-paid': isPlatformPaidThisMonth(platform.id) }"
          @click="goToDetail(platform.id)"
        >
          <view class="task-top">
            <view class="task-left">
              <view class="task-name-row">
                <text class="task-name">{{ platform.name }}</text>
                <view v-if="isPlatformPaidThisMonth(platform.id)" class="paid-badge">
                  <text class="paid-badge-text">已还</text>
                </view>
              </view>
              <text class="task-principal">待还本金 {{ formatMoneyWithSymbol(platform.principal) }}</text>
            </view>
            <view class="task-right">
              <text class="task-payment">{{ formatMoneyWithSymbol(getMonthlyPayment(platform)) }}</text>
              <text class="task-payment-label">月供</text>
            </view>
          </view>
          <view class="task-bottom">
            <view class="task-progress-wrap">
              <view class="task-progress-bar">
                <view class="task-progress-fill" :style="{ width: getTaskProgress(platform) + '%' }"></view>
              </view>
              <text class="task-progress-text">{{ getTaskProgress(platform) }}%</text>
            </view>
            <view
              class="task-due"
              :class="{
                'due-urgent': getUrgency(platform) === 'urgent',
                'due-warning': getUrgency(platform) === 'warning'
              }"
            >
              <text class="task-due-text">{{ getDueLabel(platform) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">亲友借款</text>
          <text class="section-link" @click="goToFriends">查看全部 ></text>
        </view>
        <view v-if="topActiveFriends.length === 0" class="empty-tip">
          <text class="empty-text">暂无亲友借款</text>
        </view>
        <view v-else class="friend-list">
          <view v-for="f in topActiveFriends" :key="f.id" class="friend-item">
            <view class="friend-avatar">
              <text class="friend-avatar-text">{{ f.name.charAt(0) }}</text>
            </view>
            <view class="friend-info">
              <text class="friend-name">{{ f.name }}</text>
              <text class="friend-remaining">欠 {{ formatMoneyWithSymbol(f.remaining) }}</text>
            </view>
            <view class="friend-progress-mini">
              <view class="friend-progress-bar-mini">
                <view class="friend-progress-fill-mini" :style="{ width: getFriendProgress(f) + '%' }"></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>

    <view class="music-fab" @click="goToMusic">
      <text class="music-fab-icon">♪</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../../store/tasks'
import { useFriendStore } from '../../store/friends'
import {
  formatMoneyWithSymbol,
  calcTaskProgress,
  getUrgencyLevel,
  daysUntilDue,
  getCurrentYearMonth
} from '../../utils/calc'

const taskStore = useTaskStore()
const friendStore = useFriendStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(600)

const totalPrincipal = computed(() => taskStore.totalPrincipal)
const totalProgress = computed(() => taskStore.totalProgress)
const friendTotalRemaining = computed(() => friendStore.totalRemaining)
const isBeforeStart = computed(() => taskStore.isBeforeRepayStart())
const displayMonth = computed(() => taskStore.getNextRepayMonth())

const totalMonthlyPayment = computed(() => taskStore.getMonthlyPaymentForMonth(displayMonth.value))
const totalMonthlyInterest = computed(() => taskStore.getMonthlyInterestForMonth(displayMonth.value))
const activePlatformCount = computed(() => taskStore.getActivePlatformsForMonth(displayMonth.value).length)

const sortedPlatforms = computed(() => {
  const started = taskStore.getActivePlatformsForMonth(displayMonth.value)
  return [...started].sort((a, b) => {
    const ua = getUrgencyLevel(a.dueDay)
    const ub = getUrgencyLevel(b.dueDay)
    const order = { urgent: 0, warning: 1, normal: 2 }
    if (order[ua] !== order[ub]) return order[ua] - order[ub]
    return a.dueDay - b.dueDay
  })
})

const topActiveFriends = computed(() => {
  return friendStore.activeFriends.slice(0, 4)
})

function getMonthlyPayment(platform) {
  return (platform.monthlyPrincipal || 0) + (platform.monthlyInterest || 0)
}

function getTaskProgress(platform) {
  return calcTaskProgress(platform.totalInstallments, platform.remainingInstallments)
}

function getDueLabel(platform) {
  if (isBeforeStart.value) {
    return '未到期'
  }
  const days = daysUntilDue(platform.dueDay)
  if (days === 0) return '今天还款'
  if (days === 1) return '明天还款'
  return `${days}天后还款`
}

function getUrgency(platform) {
  if (isBeforeStart.value) return 'normal'
  return getUrgencyLevel(platform.dueDay)
}

function isPlatformPaidThisMonth(platformId) {
  const checkMonth = taskStore.getNextRepayMonth()
  return taskStore.records.some(r => {
    return r.platformId === platformId && r.date && r.date.startsWith(checkMonth)
  })
}

function getPlatformPaidAmount(platformId) {
  const checkMonth = taskStore.getNextRepayMonth()
  const records = taskStore.records.filter(r => {
    return r.platformId === platformId && r.date && r.date.startsWith(checkMonth)
  })
  return records.reduce((sum, r) => sum + (r.total || 0), 0)
}

function getFriendProgress(friend) {
  if (!friend.totalBorrowed) return 0
  const paid = friend.totalBorrowed - friend.remaining
  return Math.round((paid / friend.totalBorrowed) * 1000) / 10
}

function goToDetail(id) {
  uni.navigateTo({ url: `/pages/tasks/detail?id=${id}` })
}

function goToFriends() {
  uni.switchTab({ url: '/pages/friends/index' })
}

function goToMusic() {
  uni.navigateTo({ url: '/pages/music/index' })
}

function showInfo() {
  uni.showModal({
    title: '上岸计划',
    content: '记录每一笔还款，追踪上岸进度。\n数据保存在本地，安全可靠。',
    showCancel: false,
    confirmText: '知道了',
    confirmColor: '#4CAF50'
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
    .title-text {
      font-size: 40rpx;
      font-weight: 700;
      color: $accent-green;
    }
    .title-sub {
      display: block;
      font-size: 24rpx;
      color: $text-muted;
      margin-top: 4rpx;
    }
  }

  .nav-icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background-color: $bg-card;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon-text {
      font-size: 30rpx;
      font-weight: 700;
      color: $accent-green;
      font-style: italic;
    }
  }
}

.scroll-content {
  padding: 0 24rpx;
  box-sizing: border-box;
}

.overview-card {
  position: relative;
  margin-top: 20rpx;
  border-radius: $radius-lg;
  overflow: hidden;

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

.overview-row {
  display: flex;
  align-items: center;

  &--footer {
    margin-top: 28rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.06);
  }
}

.overview-item {
  flex: 1;

  .overview-label {
    display: block;
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: 8rpx;
  }

  .overview-value {
    display: block;
    font-size: $font-xl;
    font-weight: 700;
  }
}

.text-green {
  color: $accent-green;
}

.text-orange {
  color: $accent-orange;
}

.overview-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.08);
  margin: 0 30rpx;
}

.overview-item-sm {
  flex: 1;

  .overview-label-sm {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 4rpx;
  }

  .overview-value-sm {
    display: block;
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
  }
}

.progress-section {
  margin-top: 30rpx;

  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12rpx;
  }

  .progress-title {
    font-size: $font-sm;
    color: $text-secondary;
  }

  .progress-percent {
    font-size: $font-md;
    font-weight: 700;
    color: $accent-green;
  }
}

.progress-bar {
  height: 16rpx;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $accent-green-dark, $accent-green-light);
  border-radius: 8rpx;
  transition: width 0.6s ease;
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

.section-link {
  font-size: $font-sm;
  color: $accent-green;
}

.task-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-card;
  border-left: 6rpx solid transparent;

  &.task-paid {
    border-left-color: $accent-green;
    opacity: 0.85;
  }
}

.task-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.paid-badge {
  background-color: rgba(76, 175, 80, 0.2);
  padding: 2rpx 12rpx;
  border-radius: 12rpx;

  .paid-badge-text {
    font-size: 20rpx;
    color: $accent-green;
    font-weight: 600;
  }
}

.task-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.task-left {
  flex: 1;
}

.task-name {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.task-principal {
  font-size: $font-sm;
  color: $text-secondary;
}

.task-right {
  text-align: right;

  .task-payment {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $accent-orange;
  }

  .task-payment-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-top: 4rpx;
  }
}

.task-bottom {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.04);
}

.task-progress-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}

.task-progress-bar {
  flex: 1;
  height: 10rpx;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 5rpx;
  overflow: hidden;
  margin-right: 16rpx;
}

.task-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $accent-green-dark, $accent-green-light);
  border-radius: 5rpx;
  transition: width 0.5s ease;
}

.task-progress-text {
  font-size: $font-xs;
  color: $accent-green;
  font-weight: 600;
  min-width: 60rpx;
  text-align: right;
}

.task-due {
  margin-left: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  background-color: rgba(255, 255, 255, 0.04);

  &.due-urgent {
    background-color: rgba(244, 67, 54, 0.15);
    .task-due-text {
      color: $accent-red;
    }
  }

  &.due-warning {
    background-color: rgba(255, 152, 0, 0.15);
    .task-due-text {
      color: $accent-orange;
    }
  }

  .task-due-text {
    font-size: $font-xs;
    color: $text-muted;
  }
}

.friend-list {
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 8rpx 0;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
}

.friend-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;

  .friend-avatar-text {
    font-size: $font-md;
    font-weight: 600;
    color: #fff;
  }
}

.friend-info {
  flex: 1;

  .friend-name {
    display: block;
    font-size: $font-md;
    color: $text-primary;
    font-weight: 500;
  }

  .friend-remaining {
    display: block;
    font-size: $font-sm;
    color: $accent-orange;
    margin-top: 4rpx;
  }
}

.friend-progress-mini {
  width: 120rpx;

  .friend-progress-bar-mini {
    height: 8rpx;
    background-color: rgba(255, 255, 255, 0.06);
    border-radius: 4rpx;
    overflow: hidden;
  }

  .friend-progress-fill-mini {
    height: 100%;
    background: linear-gradient(90deg, $accent-green-dark, $accent-green-light);
    border-radius: 4rpx;
    transition: width 0.5s ease;
  }
}

.empty-tip {
  padding: 40rpx;
  text-align: center;

  .empty-text {
    font-size: $font-md;
    color: $text-muted;
  }
}

.safe-bottom-space {
  height: 30rpx;
}

.music-fab {
  position: fixed;
  right: 36rpx;
  bottom: 140rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba(76, 175, 80, 0.45);
  z-index: 100;

  .music-fab-icon {
    font-size: 44rpx;
    color: #fff;
  }
}
</style>
