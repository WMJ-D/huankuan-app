<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-content">
        <text class="nav-title">贷款平台</text>
        <view class="nav-action" @click="goAdd">
          <text class="nav-add-text">+ 新增</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }">
      <view class="overview-card">
        <view class="overview-header">
          <text class="overview-title">还款概览</text>
          <text class="overview-count">{{ taskStore.activePlatformCount }}笔进行中</text>
        </view>
        <view class="overview-stats">
          <view class="stat-item">
            <text class="stat-label">总待还本金</text>
            <text class="stat-value">{{ formatMoneyWithSymbol(taskStore.totalPrincipal) }}</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-label">{{ monthlyPaymentLabel }}</text>
            <text class="stat-value accent">{{ formatMoneyWithSymbol(monthlyPayment) }}</text>
          </view>
        </view>
        <view class="overview-progress">
          <view class="progress-header">
            <text class="progress-label">总还款进度</text>
            <text class="progress-percent">{{ taskStore.totalProgress }}%</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: taskStore.totalProgress + '%' }"></view>
          </view>
        </view>
      </view>

      <view v-if="taskStore.activePlatforms.length > 0" class="section">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-dot active-dot"></view>
            <text class="section-title">还款中</text>
          </view>
          <text class="section-count">{{ taskStore.activePlatforms.length }}笔</text>
        </view>
        <view
          v-for="platform in taskStore.activePlatforms"
          :key="platform.id"
          class="platform-card"
          @click="goToDetail(platform.id)"
        >
          <view class="card-header">
            <view class="card-title-row">
              <text class="card-name">{{ platform.name }}</text>
              <view class="badge badge-installment">
                <text class="badge-text">剩余{{ platform.remainingInstallments }}期</text>
              </view>
            </view>
            <view class="card-arrow">
              <text class="arrow-icon">›</text>
            </view>
          </view>
          <view class="card-body">
            <view class="card-amounts">
              <view class="amount-item">
                <text class="amount-label">待还本金</text>
                <text class="amount-value">{{ formatMoneyWithSymbol(platform.principal) }}</text>
              </view>
              <view class="amount-item">
                <text class="amount-label">月供</text>
                <text class="amount-value orange">{{ formatMoneyWithSymbol(platform.monthlyPrincipal + platform.monthlyInterest) }}</text>
              </view>
            </view>
            <view class="card-progress">
              <view class="progress-bar small">
                <view class="progress-fill" :style="{ width: getProgress(platform) + '%' }"></view>
              </view>
              <text class="progress-text">{{ getProgress(platform) }}%</text>
            </view>
          </view>
          <view class="card-footer">
            <view :class="['due-tag', getDueUrgencyClass(platform)]">
              <text class="due-text">每月{{ platform.dueDay }}日还款</text>
              <text class="due-days">{{ getDueText(platform) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="taskStore.settledPlatforms.length > 0" class="section">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-dot settled-dot"></view>
            <text class="section-title">已结清</text>
          </view>
          <text class="section-count">{{ taskStore.settledPlatforms.length }}笔</text>
        </view>
        <view
          v-for="platform in taskStore.settledPlatforms"
          :key="platform.id"
          class="platform-card settled-card"
          @click="goToDetail(platform.id)"
        >
          <view class="card-header">
            <view class="card-title-row">
              <text class="card-name">{{ platform.name }}</text>
              <view class="badge badge-settled">
                <text class="badge-text">已结清</text>
              </view>
            </view>
            <view class="card-arrow">
              <text class="arrow-icon">›</text>
            </view>
          </view>
          <view class="card-body">
            <view class="card-amounts">
              <view class="amount-item">
                <text class="amount-label">原始本金</text>
                <text class="amount-value">{{ formatMoneyWithSymbol(platform.totalPrincipal) }}</text>
              </view>
              <view class="amount-item">
                <text class="amount-label">总期数</text>
                <text class="amount-value">{{ platform.totalInstallments }}期</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="taskStore.platforms.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无贷款平台</text>
        <view class="empty-action" @click="goAdd">
          <text class="empty-action-text">+ 添加第一个平台</text>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../../store/tasks'
import { formatMoneyWithSymbol, calcTaskProgress, daysUntilDue, getUrgencyLevel, getCurrentYearMonth } from '../../utils/calc'

const taskStore = useTaskStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(600)

const displayMonth = computed(() => taskStore.getNextRepayMonth())
const isBeforeStart = computed(() => taskStore.isBeforeRepayStart())
const monthlyPaymentLabel = computed(() => isBeforeStart.value ? '下月需还' : '本月需还')
const monthlyPayment = computed(() => taskStore.getMonthlyPaymentForMonth(displayMonth.value))

function getProgress(platform) {
  return calcTaskProgress(platform.totalInstallments, platform.remainingInstallments)
}

function isPlatformStartedNow(platform) {
  return taskStore.isPlatformStarted(platform.id, getCurrentYearMonth())
}

function getDueText(platform) {
  if (!isPlatformStartedNow(platform)) return '未到期'
  const days = daysUntilDue(platform.dueDay)
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  return `${days}天后`
}

function getDueUrgencyClass(platform) {
  if (!isPlatformStartedNow(platform)) return 'normal'
  return getUrgencyLevel(platform.dueDay)
}

function goToDetail(id) {
  uni.navigateTo({ url: `/pages/tasks/detail?id=${id}` })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/tasks/add' })
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44
  taskStore.initTasks()
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
    font-size: $font-xl;
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
  padding: 24rpx;
  box-sizing: border-box;
}

.overview-card {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(56, 142, 60, 0.08));
  border: 1rpx solid rgba(76, 175, 80, 0.2);
  border-radius: $radius-lg;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;

  .overview-title {
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
  }

  .overview-count {
    font-size: $font-xs;
    color: $accent-green;
    background-color: rgba(76, 175, 80, 0.2);
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
  }
}

.overview-stats {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.stat-item {
  flex: 1;
  text-align: center;

  .stat-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 8rpx;
  }

  .stat-value {
    font-size: $font-lg;
    font-weight: 700;
    color: $text-primary;

    &.accent {
      color: $accent-orange;
    }
  }
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.1);
}

.overview-progress {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;

    .progress-label {
      font-size: $font-xs;
      color: $text-secondary;
    }

    .progress-percent {
      font-size: $font-sm;
      font-weight: 600;
      color: $accent-green;
    }
  }
}

.progress-bar {
  height: 12rpx;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6rpx;
  overflow: hidden;

  &.small {
    height: 8rpx;
    border-radius: 4rpx;
    flex: 1;
    margin-right: 12rpx;
  }
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $accent-green-dark, $accent-green);
  border-radius: inherit;
  transition: width 0.5s ease;
}

.section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 8rpx;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &.active-dot {
    background-color: $accent-green;
    box-shadow: 0 0 10rpx rgba(76, 175, 80, 0.5);
  }

  &.settled-dot {
    background-color: $text-muted;
  }
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.section-count {
  font-size: $font-xs;
  color: $text-muted;
}

.platform-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-card;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &.settled-card {
    opacity: 0.75;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}

.card-name {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.badge {
  padding: 4rpx 14rpx;
  border-radius: 16rpx;

  .badge-text {
    font-size: 20rpx;
    font-weight: 500;
  }

  &.badge-installment {
    background-color: rgba(255, 152, 0, 0.15);

    .badge-text {
      color: $accent-orange;
    }
  }

  &.badge-settled {
    background-color: rgba(76, 175, 80, 0.15);

    .badge-text {
      color: $accent-green;
    }
  }
}

.card-arrow {
  .arrow-icon {
    font-size: 36rpx;
    color: $text-muted;
    font-weight: 300;
  }
}

.card-body {
  margin-bottom: 16rpx;
}

.card-amounts {
  display: flex;
  margin-bottom: 16rpx;
}

.amount-item {
  flex: 1;

  .amount-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 6rpx;
  }

  .amount-value {
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;

    &.orange {
      color: $accent-orange;
    }
  }
}

.card-progress {
  display: flex;
  align-items: center;

  .progress-text {
    font-size: $font-xs;
    color: $accent-green;
    font-weight: 600;
    min-width: 60rpx;
    text-align: right;
  }
}

.card-footer {
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.04);
}

.due-tag {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background-color: rgba(255, 255, 255, 0.05);

  .due-text {
    font-size: $font-xs;
    color: $text-secondary;
  }

  .due-days {
    font-size: $font-xs;
    font-weight: 600;
  }

  &.urgent {
    background-color: rgba(244, 67, 54, 0.12);

    .due-days {
      color: $accent-red;
    }
  }

  &.warning {
    background-color: rgba(255, 152, 0, 0.12);

    .due-days {
      color: $accent-orange;
    }
  }

  &.normal {
    background-color: rgba(76, 175, 80, 0.08);

    .due-days {
      color: $accent-green;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;

  .empty-icon {
    font-size: 100rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: $font-md;
    color: $text-muted;
    margin-bottom: 30rpx;
  }

  .empty-action {
    background: linear-gradient(135deg, $accent-green, $accent-green-dark);
    padding: 16rpx 40rpx;
    border-radius: 30rpx;

    .empty-action-text {
      font-size: $font-sm;
      font-weight: 600;
      color: #fff;
    }
  }
}

.safe-bottom-space {
  height: 30rpx;
}
</style>
