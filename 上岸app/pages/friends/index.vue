<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-content">
        <text class="nav-title">亲友借款</text>
        <view class="nav-action" @click="showAddFriend = true">
          <text class="nav-add-text">+ 新增</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }">
      <view class="overview-card">
        <view class="overview-bg"></view>
        <view class="overview-content">
          <view class="overview-row">
            <view class="overview-item">
              <text class="overview-label">私人借款总额</text>
              <text class="overview-value text-orange">{{ formatMoneyWithSymbol(totalBorrowed) }}</text>
            </view>
            <view class="overview-divider"></view>
            <view class="overview-item">
              <text class="overview-label">待还余额</text>
              <text class="overview-value text-red">{{ formatMoneyWithSymbol(totalRemaining) }}</text>
            </view>
          </view>
          <view class="progress-section">
            <view class="progress-header">
              <text class="progress-title">还款进度</text>
              <text class="progress-percent">{{ friendProgress }}%</text>
            </view>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: friendProgress + '%' }"></view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="activeFriends.length > 0" class="section">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-dot active-dot"></view>
            <text class="section-title">待还款</text>
          </view>
          <text class="section-count">{{ activeFriends.length }}人</text>
        </view>
        <view
          v-for="friend in activeFriends"
          :key="friend.id"
          class="friend-card"
          @click="goToDetail(friend.id)"
        >
          <view class="friend-avatar">
            <text class="friend-avatar-text">{{ friend.name.charAt(0) }}</text>
          </view>
          <view class="friend-main">
            <view class="friend-top">
              <text class="friend-name">{{ friend.name }}</text>
              <text class="friend-remaining">{{ formatMoneyWithSymbol(friend.remaining) }}</text>
            </view>
            <view class="friend-progress-row">
              <view class="friend-progress-bar">
                <view class="friend-progress-fill" :style="{ width: getFriendProgress(friend) + '%' }"></view>
              </view>
              <text class="friend-progress-text">{{ getFriendProgress(friend) }}%</text>
            </view>
            <text class="friend-total">借款总额 {{ formatMoneyWithSymbol(friend.totalBorrowed) }}</text>
          </view>
          <view class="friend-arrow">
            <text class="arrow-icon">›</text>
          </view>
        </view>
      </view>

      <view v-if="activeFriends.length === 0 && settledFriends.length === 0" class="empty-state">
        <text class="empty-icon">🤝</text>
        <text class="empty-text">暂无亲友借款</text>
        <view class="empty-action" @click="showAddFriend = true">
          <text class="empty-action-text">+ 添加第一条记录</text>
        </view>
      </view>

      <view v-if="settledFriends.length > 0" class="section">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-dot settled-dot"></view>
            <text class="section-title">已结清</text>
          </view>
          <text class="section-count">{{ settledFriends.length }}人</text>
        </view>
        <view
          v-for="friend in settledFriends"
          :key="friend.id"
          class="friend-card settled-card"
          @click="goToDetail(friend.id)"
        >
          <view class="friend-avatar settled-avatar">
            <text class="friend-avatar-text">✓</text>
          </view>
          <view class="friend-main">
            <view class="friend-top">
              <text class="friend-name">{{ friend.name }}</text>
              <view class="badge badge-settled">
                <text class="badge-text">已结清</text>
              </view>
            </view>
            <text class="friend-total">借款总额 {{ formatMoneyWithSymbol(friend.totalBorrowed) }}</text>
          </view>
          <view class="friend-arrow">
            <text class="arrow-icon">›</text>
          </view>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>

    <view class="modal-overlay" v-if="showAddFriend" @click="showAddFriend = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新增借款人</text>
          <view class="modal-close" @click="showAddFriend = false">
            <text class="close-text">x</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">姓名 <text class="required">*</text></text>
            <input class="form-input" v-model="addForm.name" placeholder="请输入姓名" placeholder-class="input-placeholder" />
          </view>
          <view class="form-item">
            <text class="form-label">借款总额 <text class="required">*</text></text>
            <view class="input-with-unit">
              <input class="form-input" v-model="addForm.totalBorrowed" type="digit" placeholder="0.00" placeholder-class="input-placeholder" />
              <text class="input-unit">元</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">当前剩余（默认等于总额）</text>
            <view class="input-with-unit">
              <input class="form-input" v-model="addForm.remaining" type="digit" placeholder="0.00" placeholder-class="input-placeholder" />
              <text class="input-unit">元</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <input class="form-input" v-model="addForm.remark" placeholder="备注信息" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn-save" @click="saveNewFriend">
            <text class="btn-save-text">保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useFriendStore } from '../../store/friends'
import { formatMoneyWithSymbol } from '../../utils/calc'

const friendStore = useFriendStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(600)
const showAddFriend = ref(false)

const addForm = reactive({
  name: '',
  totalBorrowed: '',
  remaining: '',
  remark: ''
})

const activeFriends = computed(() => friendStore.activeFriends)
const settledFriends = computed(() => friendStore.settledFriends)
const totalRemaining = computed(() => friendStore.totalRemaining)
const totalBorrowed = computed(() => friendStore.totalBorrowed)
const friendProgress = computed(() => friendStore.friendProgress)

function getFriendProgress(friend) {
  if (!friend.totalBorrowed) return 0
  const paid = friend.totalBorrowed - friend.remaining
  return Math.round((paid / friend.totalBorrowed) * 1000) / 10
}

function goToDetail(id) {
  uni.navigateTo({ url: `/pages/friends/detail?id=${id}` })
}

function saveNewFriend() {
  if (!addForm.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  if (!addForm.totalBorrowed || Number(addForm.totalBorrowed) <= 0) {
    uni.showToast({ title: '请输入借款金额', icon: 'none' })
    return
  }

  friendStore.addFriend({
    name: addForm.name.trim(),
    totalBorrowed: Number(addForm.totalBorrowed),
    remaining: addForm.remaining ? Number(addForm.remaining) : Number(addForm.totalBorrowed),
    remark: addForm.remark
  })

  addForm.name = ''
  addForm.totalBorrowed = ''
  addForm.remaining = ''
  addForm.remark = ''
  showAddFriend.value = false
  uni.showToast({ title: '添加成功', icon: 'success' })
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44 - 50
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
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(230, 81, 0, 0.08));
    border: 1rpx solid rgba(255, 152, 0, 0.2);
    border-radius: $radius-lg;
  }

  .overview-content {
    position: relative;
    padding: 30rpx;
  }
}

.overview-row {
  display: flex;
  align-items: center;
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

.text-orange {
  color: $accent-orange;
}

.text-red {
  color: $accent-red;
}

.overview-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0 30rpx;
}

.progress-section {
  margin-top: 24rpx;

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
    background-color: $accent-orange;
    box-shadow: 0 0 10rpx rgba(255, 152, 0, 0.5);
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

.friend-card {
  display: flex;
  align-items: center;
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 24rpx;
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

.friend-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $accent-orange, #e65100);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;

  &.settled-avatar {
    background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  }

  .friend-avatar-text {
    font-size: $font-lg;
    font-weight: 700;
    color: #fff;
  }
}

.friend-main {
  flex: 1;
  min-width: 0;
}

.friend-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.friend-name {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.friend-remaining {
  font-size: $font-md;
  font-weight: 700;
  color: $accent-orange;
}

.friend-progress-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.friend-progress-bar {
  flex: 1;
  height: 8rpx;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 4rpx;
  overflow: hidden;
  margin-right: 12rpx;
}

.friend-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $accent-green-dark, $accent-green-light);
  border-radius: 4rpx;
  transition: width 0.5s ease;
}

.friend-progress-text {
  font-size: $font-xs;
  color: $accent-green;
  font-weight: 600;
  min-width: 60rpx;
  text-align: right;
}

.friend-total {
  font-size: $font-xs;
  color: $text-muted;
}

.friend-arrow {
  margin-left: 12rpx;

  .arrow-icon {
    font-size: 36rpx;
    color: $text-muted;
    font-weight: 300;
  }
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
  height: 30rpx;
}
</style>
