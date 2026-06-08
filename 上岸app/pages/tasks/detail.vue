<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-content">
        <view class="nav-back" @click="goBack">
          <text class="back-text">← 返回</text>
        </view>
        <text class="nav-title">贷款详情</text>
        <view class="nav-right" @click="confirmDelete">
          <text class="delete-text">删除</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }" v-if="platform">
      <view class="platform-header">
        <view class="platform-header-top">
          <text class="platform-name">{{ platform.name }}</text>
          <view :class="['badge', platform.status === 'settled' ? 'badge-green' : 'badge-orange']">
            <text class="badge-text">{{ platform.status === 'settled' ? '已结清' : '还款中' }}</text>
          </view>
        </view>
        <view class="platform-remaining">
          <text class="remaining-label">待还本金</text>
          <text class="remaining-amount">{{ formatMoneyWithSymbol(platform.principal) }}</text>
        </view>
      </view>

      <view class="info-card">
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">借款总额</text>
            <text class="info-value">{{ formatMoneyWithSymbol(platform.totalPrincipal) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">待还本金</text>
            <text class="info-value text-orange">{{ formatMoneyWithSymbol(platform.principal) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">月供(本金+利息)</text>
            <text class="info-value text-green">{{ formatMoneyWithSymbol(roundToTwo(platform.monthlyPrincipal + platform.monthlyInterest)) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">年化利率</text>
            <text class="info-value">{{ platform.annualRate ? platform.annualRate + '%' : '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">还款日</text>
            <text class="info-value">每月{{ platform.dueDay }}日</text>
          </view>
          <view class="info-item">
            <text class="info-label">还款开始</text>
            <text class="info-value">{{ platform.repayStartYearMonth || '未设置' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">剩余期数/总期数</text>
            <text class="info-value">{{ platform.remainingInstallments }} / {{ platform.totalInstallments }} 期</text>
          </view>
          <view class="info-item full-width">
            <text class="info-label">预计结清日期</text>
            <text class="info-value">{{ estimateSettleDate(platform.remainingInstallments) }}</text>
          </view>
        </view>
      </view>

      <view class="tab-bar">
        <view :class="['tab-item', { active: activeTab === 'plan' }]" @click="activeTab = 'plan'">
          <text class="tab-text">还款计划</text>
        </view>
        <view :class="['tab-item', { active: activeTab === 'records' }]" @click="activeTab = 'records'">
          <text class="tab-text">还款记录</text>
        </view>
      </view>

      <view v-if="activeTab === 'plan'" class="plan-section">
        <view v-if="repaymentPlan.length === 0" class="empty-tip">
          <text class="empty-text">暂无还款计划</text>
        </view>
        <view v-else class="plan-table">
          <view class="plan-header-row">
            <text class="plan-cell cell-period">期数</text>
            <text class="plan-cell cell-ym">年月</text>
            <text class="plan-cell cell-day">还款日</text>
            <text class="plan-cell cell-num">本金</text>
            <text class="plan-cell cell-num">利息</text>
            <text class="plan-cell cell-num">合计</text>
            <text class="plan-cell cell-num">剩余本金</text>
          </view>
          <view v-for="item in repaymentPlan" :key="item.period" class="plan-data-row">
            <text class="plan-cell cell-period">{{ item.period }}</text>
            <text class="plan-cell cell-ym">{{ item.yearMonth }}</text>
            <text class="plan-cell cell-day">{{ item.dueDay }}日</text>
            <text class="plan-cell cell-num">{{ formatMoney(item.principal) }}</text>
            <text class="plan-cell cell-num">{{ formatMoney(item.interest) }}</text>
            <text class="plan-cell cell-num cell-total">{{ formatMoney(item.total) }}</text>
            <text class="plan-cell cell-num">{{ formatMoney(item.remainingAfter) }}</text>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'records'" class="records-section">
        <view class="records-header">
          <text class="section-title">还款记录</text>
          <view v-if="platform.status === 'active'" class="add-record-btn" @click="openAddModal">
            <text class="add-record-text">+ 记录还款</text>
          </view>
        </view>

        <view v-if="records.length === 0" class="empty-tip">
          <text class="empty-text">暂无还款记录</text>
        </view>

        <view v-for="record in records" :key="record.id" class="record-item">
          <view class="record-top">
            <view class="record-top-left">
              <text class="record-date">{{ record.date }}</text>
              <view :class="['record-type-tag', record.type === 'prepay' ? 'tag-prepay' : 'tag-installment']">
                <text class="record-type-text">{{ record.type === 'prepay' ? '提前还款' : '还当期' }}</text>
              </view>
            </view>
            <text class="record-total text-green">-{{ formatMoneyWithSymbol(record.total) }}</text>
          </view>
          <view class="record-detail">
            <text class="record-detail-text">本金 {{ formatMoneyWithSymbol(record.principal) }}</text>
            <text class="record-detail-text">利息 {{ formatMoneyWithSymbol(record.interest) }}</text>
          </view>
          <text class="record-remark" v-if="record.remark">{{ record.remark }}</text>
          <view class="record-delete" @click="deleteRecord(record.id)">
            <text class="record-delete-text">删除</text>
          </view>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>

    <view v-else class="empty-state">
      <text class="empty-text">未找到该贷款平台</text>
    </view>

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
import { onLoad } from '@dcloudio/uni-app'
import { useTaskStore } from '../../store/tasks'
import { formatMoneyWithSymbol, formatMoney, roundToTwo, calcTaskProgress, estimateSettleDate } from '../../utils/calc'

const taskStore = useTaskStore()

const platformId = ref('')
const platform = ref(null)
const records = ref([])
const statusBarHeight = ref(0)
const scrollHeight = ref(600)
const activeTab = ref('plan')
const showAddModal = ref(false)

const recordForm = reactive({
  type: 'installment',
  date: '',
  principal: '',
  interest: '',
  remark: ''
})

const repaymentPlan = computed(() => {
  if (!platformId.value) return []
  return taskStore.generateRepaymentPlan(platformId.value)
})

const progressPercent = computed(() => {
  if (!platform.value) return 0
  return calcTaskProgress(platform.value.totalInstallments, platform.value.remainingInstallments)
})

function goBack() {
  uni.navigateBack()
}

function refreshData() {
  platform.value = taskStore.getPlatformById(platformId.value)
  records.value = taskStore.getRecordsByPlatformId(platformId.value)
}

function openAddModal() {
  recordForm.type = 'installment'
  recordForm.date = new Date().toISOString().slice(0, 10)
  recordForm.principal = ''
  recordForm.interest = ''
  recordForm.remark = ''
  showAddModal.value = true
}

function saveRecord() {
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
  taskStore.addRecord(platformId.value, {
    type: recordForm.type,
    date: recordForm.date || today,
    principal: Number(recordForm.principal),
    interest: interest,
    remark: recordForm.remark
  })

  showAddModal.value = false
  refreshData()
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
        refreshData()
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

function confirmDelete() {
  uni.showModal({
    title: '确认删除',
    content: `删除后不可恢复，确认删除 ${platform.value?.name || '该贷款平台'} 及所有记录？`,
    confirmColor: '#f44336',
    success: (res) => {
      if (res.confirm) {
        taskStore.deletePlatform(platformId.value)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 500)
      }
    }
  })
}

onLoad((options) => {
  platformId.value = options?.id || ''
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44

  taskStore.initTasks()

  if (platformId.value) {
    refreshData()
  }
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

.platform-header {
  background: linear-gradient(135deg, #1e3a5f, #1a2a45);
  border-radius: $radius-lg;
  padding: 36rpx;
  margin-top: 20rpx;
}

.platform-header-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.platform-name {
  font-size: $font-xl;
  font-weight: 700;
  color: $text-primary;
}

.badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;

  .badge-text {
    font-size: $font-xs;
    font-weight: 500;
  }
}

.badge-green {
  background-color: rgba(76, 175, 80, 0.2);

  .badge-text {
    color: $accent-green;
  }
}

.badge-orange {
  background-color: rgba(255, 152, 0, 0.2);

  .badge-text {
    color: $accent-orange;
  }
}

.platform-remaining {
  text-align: center;

  .remaining-label {
    display: block;
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: 8rpx;
  }

  .remaining-amount {
    font-size: 56rpx;
    font-weight: 700;
    color: $accent-orange;
  }
}

.info-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx;
  margin-top: 24rpx;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
}

.info-item {
  width: 50%;
  margin-bottom: 20rpx;

  &.full-width {
    width: 100%;
  }

  .info-label {
    display: block;
    font-size: $font-xs;
    color: $text-muted;
    margin-bottom: 6rpx;
  }

  .info-value {
    font-size: $font-md;
    color: $text-primary;
    font-weight: 500;
  }
}

.text-orange {
  color: $accent-orange !important;
}

.text-green {
  color: $accent-green !important;
}

.tab-bar {
  display: flex;
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 8rpx;
  margin-top: 24rpx;
  gap: 8rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: $radius-md;

  &.active {
    background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  }

  .tab-text {
    font-size: $font-md;
    color: $text-secondary;
    font-weight: 500;
  }

  &.active .tab-text {
    color: #fff;
    font-weight: 600;
  }
}

.plan-section {
  margin-top: 24rpx;
}

.plan-table {
  background-color: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
}

.plan-header-row {
  display: flex;
  padding: 18rpx 12rpx;
  background-color: $bg-card-hover;
  border-bottom: 1rpx solid $border-color;
}

.plan-data-row {
  display: flex;
  padding: 18rpx 12rpx;
  border-bottom: 1rpx solid $divider-color;

  &:last-child {
    border-bottom: none;
  }
}

.plan-cell {
  font-size: $font-xs;
  color: $text-secondary;

  .plan-header-row & {
    color: $text-muted;
    font-weight: 500;
  }

  .plan-data-row & {
    color: $text-primary;
  }
}

.cell-period {
  width: 60rpx;
  text-align: center;
}

.cell-ym {
  width: 140rpx;
  text-align: center;
}

.cell-day {
  width: 80rpx;
  text-align: center;
}

.cell-num {
  flex: 1;
  text-align: right;
}

.cell-total {
  color: $accent-green;
  font-weight: 600;
}

.records-section {
  margin-top: 24rpx;
}

.records-header {
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

.add-record-btn {
  background-color: rgba(76, 175, 80, 0.15);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;

  .add-record-text {
    font-size: $font-sm;
    color: $accent-green;
  }
}

.record-item {
  background-color: $bg-card;
  border-radius: $radius-md;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.record-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-top-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.record-type-tag {
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
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
  font-size: $font-sm;
  color: $text-secondary;
}

.record-total {
  font-size: $font-md;
  font-weight: 600;
}

.record-detail {
  display: flex;
  gap: 24rpx;
  margin-top: 10rpx;

  .record-detail-text {
    font-size: $font-xs;
    color: $text-muted;
  }
}

.record-remark {
  display: block;
  font-size: $font-sm;
  color: $text-muted;
  margin-top: 8rpx;
}

.record-delete {
  margin-top: 12rpx;
  text-align: right;

  .record-delete-text {
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
