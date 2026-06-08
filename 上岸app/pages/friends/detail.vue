<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-content">
        <view class="nav-back" @click="goBack">
          <text class="back-text">← 返回</text>
        </view>
        <text class="nav-title">借款详情</text>
        <view class="nav-right" @click="confirmDelete">
          <text class="delete-text">删除</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }" v-if="friend">
      <view class="profile-header" :class="{ 'profile-settled': friend.status === 'settled' }">
        <view class="profile-avatar">
          <text class="avatar-text">{{ friend.name.charAt(0) }}</text>
        </view>
        <view class="profile-info">
          <view class="profile-name-row">
            <text class="profile-name">{{ friend.name }}</text>
            <view v-if="friend.status === 'settled'" class="badge badge-settled">
              <text class="badge-text">已结清</text>
            </view>
          </view>
          <text class="profile-remaining">剩余欠款 {{ formatMoneyWithSymbol(friend.remaining) }}</text>
        </view>
      </view>

      <view class="progress-card">
        <view class="progress-ring-container">
          <view class="progress-circle">
            <view class="progress-circle-bg"></view>
            <view class="progress-circle-track" :style="{ '--deg': progressDeg + 'deg' }"></view>
            <view class="progress-circle-text">
              <text class="circle-percent">{{ progressPercent }}</text>
              <text class="circle-unit">%</text>
            </view>
          </view>
        </view>
        <view class="progress-details">
          <view class="progress-detail-item">
            <text class="detail-label">借款总额</text>
            <text class="detail-value">{{ formatMoneyWithSymbol(friend.totalBorrowed) }}</text>
          </view>
          <view class="progress-detail-item">
            <text class="detail-label">已还金额</text>
            <text class="detail-value text-green">{{ formatMoneyWithSymbol(friend.totalBorrowed - friend.remaining) }}</text>
          </view>
          <view class="progress-detail-item">
            <text class="detail-label">剩余金额</text>
            <text class="detail-value text-orange">{{ formatMoneyWithSymbol(friend.remaining) }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">还款记录</text>
          <view v-if="friend.status === 'active'" class="add-event-btn" @click="showAddEvent = true">
            <text class="add-event-text">+ 记录还款</text>
          </view>
        </view>

        <view v-if="events.length === 0" class="empty-tip">
          <text class="empty-text">暂无还款记录</text>
        </view>

        <view class="event-timeline">
          <view v-for="(event, index) in events" :key="event.id" class="event-item">
            <view class="event-dot"></view>
            <view class="event-line" v-if="index < events.length - 1"></view>
            <view class="event-content">
              <view class="event-top">
                <text class="event-date">{{ event.date }}</text>
                <text class="event-amount text-green">-{{ formatMoneyWithSymbol(event.amount) }}</text>
              </view>
              <text class="event-remark" v-if="event.remark">{{ event.remark }}</text>
              <view class="event-delete" @click="deleteEvent(event.id)">
                <text class="event-delete-text">删除</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section" v-if="friend.remark">
        <view class="remark-card">
          <text class="remark-label">备注</text>
          <text class="remark-text">{{ friend.remark }}</text>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>

    <view v-else class="empty-state">
      <text class="empty-text">未找到该借款人</text>
    </view>

    <view class="modal-overlay" v-if="showAddEvent" @click="showAddEvent = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">记录还款</text>
          <view class="modal-close" @click="showAddEvent = false">
            <text class="close-text">x</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">还款日期</text>
            <input class="form-input" v-model="eventForm.date" placeholder="2025-07-15" placeholder-class="input-placeholder" />
          </view>
          <view class="form-item">
            <text class="form-label">还款金额 <text class="required">*</text></text>
            <view class="input-with-unit">
              <input class="form-input" v-model="eventForm.amount" type="digit" placeholder="0.00" placeholder-class="input-placeholder" />
              <text class="input-unit">元</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <input class="form-input" v-model="eventForm.remark" placeholder="备注（可选）" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn-save" @click="saveEvent">
            <text class="btn-save-text">保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFriendStore } from '../../store/friends'
import { formatMoneyWithSymbol } from '../../utils/calc'

const friendStore = useFriendStore()

const friendId = ref('')
const friend = ref(null)
const events = ref([])
const statusBarHeight = ref(0)
const scrollHeight = ref(600)
const showAddEvent = ref(false)

const eventForm = reactive({
  date: '',
  amount: '',
  remark: ''
})

const progressPercent = computed(() => {
  if (!friend.value || !friend.value.totalBorrowed) return 0
  const paid = friend.value.totalBorrowed - friend.value.remaining
  return Math.round((paid / friend.value.totalBorrowed) * 1000) / 10
})

const progressDeg = computed(() => {
  return (progressPercent.value / 100) * 360
})

function goBack() {
  uni.navigateBack()
}

function confirmDelete() {
  uni.showModal({
    title: '确认删除',
    content: `删除后不可恢复，确认删除 ${friend.value?.name || '该借款人'} 的所有记录？`,
    confirmColor: '#f44336',
    success: (res) => {
      if (res.confirm) {
        friendStore.deleteFriend(friendId.value)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 500)
      }
    }
  })
}

function deleteEvent(eventId) {
  uni.showModal({
    title: '确认删除',
    content: '删除此还款记录？余额将相应恢复。',
    confirmColor: '#f44336',
    success: (res) => {
      if (res.confirm) {
        friendStore.removeEvent(eventId)
        refreshData()
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

function saveEvent() {
  if (!eventForm.amount || Number(eventForm.amount) <= 0) {
    uni.showToast({ title: '请输入还款金额', icon: 'none' })
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  friendStore.addEvent(friendId.value, {
    date: eventForm.date || today,
    amount: Number(eventForm.amount),
    remark: eventForm.remark
  })

  eventForm.date = new Date().toISOString().slice(0, 10)
  eventForm.amount = ''
  eventForm.remark = ''
  showAddEvent.value = false
  refreshData()
  uni.showToast({ title: '记录成功', icon: 'success' })
}

function refreshData() {
  if (!friendId.value) return
  friend.value = friendStore.getFriendById(friendId.value)
  events.value = friendStore.getEventsByFriendId(friendId.value)
}

onLoad((options) => {
  friendId.value = options?.id || ''
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44

  friendStore.initFriends()

  if (friendId.value) {
    refreshData()
  }

  eventForm.date = new Date().toISOString().slice(0, 10)
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
    .back-text {
      font-size: $font-md;
      color: $accent-green;
    }
  }

  .nav-title {
    font-size: $font-lg;
    font-weight: 600;
    color: $text-primary;
  }

  .nav-right {
    .delete-text {
      font-size: $font-md;
      color: $accent-red;
    }
  }
}

.scroll-content {
  padding: 0 24rpx;
  box-sizing: border-box;
}

.profile-header {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1e3a5f, #1a2a45);
  border-radius: $radius-lg;
  padding: 36rpx;
  margin-top: 20rpx;

  &.profile-settled {
    background: linear-gradient(135deg, #1a3a2e, #1a2a25);
  }
}

.profile-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $accent-orange, #e65100);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 28rpx;
  flex-shrink: 0;

  .avatar-text {
    font-size: $font-xxl;
    font-weight: 700;
    color: #fff;
  }
}

.profile-info {
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.profile-name {
  font-size: $font-xl;
  font-weight: 700;
  color: $text-primary;
}

.profile-remaining {
  font-size: $font-md;
  color: $accent-orange;
  font-weight: 600;
}

.badge {
  padding: 4rpx 14rpx;
  border-radius: 16rpx;

  .badge-text {
    font-size: 20rpx;
    font-weight: 500;
  }

  &.badge-settled {
    background-color: rgba(76, 175, 80, 0.15);

    .badge-text {
      color: $accent-green;
    }
  }
}

.progress-card {
  display: flex;
  align-items: center;
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 30rpx;
  margin-top: 20rpx;
  box-shadow: $shadow-card;
}

.progress-ring-container {
  margin-right: 30rpx;
}

.progress-circle {
  width: 160rpx;
  height: 160rpx;
  position: relative;

  .progress-circle-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 12rpx solid rgba(76, 175, 80, 0.1);
  }

  .progress-circle-track {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 12rpx solid transparent;
    border-top-color: $accent-green;
    border-right-color: $accent-green;
    transform: rotate(calc(var(--deg) - 90deg));
    transition: transform 0.6s ease;
  }

  .progress-circle-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: baseline;

    .circle-percent {
      font-size: $font-xl;
      font-weight: 700;
      color: $accent-green;
    }

    .circle-unit {
      font-size: $font-sm;
      color: $accent-green;
      margin-left: 2rpx;
    }
  }
}

.progress-details {
  flex: 1;
}

.progress-detail-item {
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .detail-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 4rpx;
  }

  .detail-value {
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
  margin-top: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.add-event-btn {
  background-color: rgba(76, 175, 80, 0.15);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;

  .add-event-text {
    font-size: $font-sm;
    color: $accent-green;
  }
}

.event-timeline {
  position: relative;
  padding-left: 32rpx;
}

.event-item {
  position: relative;
  padding-bottom: 30rpx;
}

.event-dot {
  position: absolute;
  left: -32rpx;
  top: 8rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: $accent-green;
  z-index: 1;
}

.event-line {
  position: absolute;
  left: -23rpx;
  top: 28rpx;
  width: 4rpx;
  bottom: 0;
  background-color: rgba(76, 175, 80, 0.2);
}

.event-content {
  background-color: $bg-card;
  border-radius: $radius-md;
  padding: 20rpx;
  box-shadow: $shadow-card;
}

.event-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-date {
  font-size: $font-sm;
  color: $text-secondary;
}

.event-amount {
  font-size: $font-md;
  font-weight: 600;
}

.event-remark {
  display: block;
  font-size: $font-sm;
  color: $text-muted;
  margin-top: 8rpx;
}

.event-delete {
  margin-top: 12rpx;
  text-align: right;

  .event-delete-text {
    font-size: $font-xs;
    color: $accent-red;
  }
}

.empty-tip {
  text-align: center;
  padding: 40rpx;

  .empty-text {
    font-size: $font-md;
    color: $text-muted;
  }
}

.remark-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 24rpx;
  box-shadow: $shadow-card;

  .remark-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 8rpx;
  }

  .remark-text {
    font-size: $font-md;
    color: $text-secondary;
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;

  .empty-text {
    font-size: $font-md;
    color: $text-muted;
  }
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

.form-input {
  width: 100%;
  height: 76rpx;
  background-color: $bg-input;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: 0 20rpx;
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

.safe-bottom-space {
  height: 60rpx;
}
</style>
