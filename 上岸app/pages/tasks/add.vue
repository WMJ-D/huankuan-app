<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <view class="nav-content">
        <view class="nav-back" @click="goBack">
          <text class="back-icon">←</text>
          <text class="back-text">返回</text>
        </view>
        <text class="nav-title">{{ isEdit ? '编辑贷款' : '新增贷款' }}</text>
        <view class="nav-placeholder"></view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" :style="{ height: scrollHeight + 'px' }">
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">平台名称 <text class="required">*</text></text>
          <input
            class="form-input"
            v-model="form.name"
            placeholder="请输入平台名称"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="form-item">
          <text class="form-label">借款总额 <text class="required">*</text></text>
          <view class="input-with-unit">
            <input
              class="form-input"
              v-model="form.totalPrincipal"
              type="digit"
              placeholder="0.00"
              placeholder-class="input-placeholder"
              @blur="onTotalPrincipalBlur"
            />
            <text class="input-unit">元</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">待还本金</text>
          <view class="input-with-unit">
            <input
              class="form-input"
              v-model="form.principal"
              type="digit"
              placeholder="默认等于借款总额"
              placeholder-class="input-placeholder"
            />
            <text class="input-unit">元</text>
          </view>
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">月供本金</text>
            <view class="input-with-unit">
              <input
                class="form-input"
                v-model="form.monthlyPrincipal"
                type="digit"
                placeholder="0.00"
                placeholder-class="input-placeholder"
              />
              <text class="input-unit">元</text>
            </view>
          </view>
          <view class="form-item half">
            <text class="form-label">月供利息</text>
            <view class="input-with-unit">
              <input
                class="form-input"
                v-model="form.monthlyInterest"
                type="digit"
                placeholder="0.00"
                placeholder-class="input-placeholder"
              />
              <text class="input-unit">元</text>
            </view>
          </view>
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">总分期数</text>
            <view class="input-with-unit">
              <input
                class="form-input"
                v-model="form.totalInstallments"
                type="number"
                placeholder="12"
                placeholder-class="input-placeholder"
              />
              <text class="input-unit">期</text>
            </view>
          </view>
          <view class="form-item half">
            <text class="form-label">剩余分期数</text>
            <view class="input-with-unit">
              <input
                class="form-input"
                v-model="form.remainingInstallments"
                type="number"
                placeholder="12"
                placeholder-class="input-placeholder"
              />
              <text class="input-unit">期</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">年化利率</text>
          <view class="input-with-unit">
            <input
              class="form-input"
              v-model="form.annualRate"
              type="digit"
              placeholder="如 9.8"
              placeholder-class="input-placeholder"
            />
            <text class="input-unit">%</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">每月还款日</text>
          <view class="input-with-unit">
            <input
              class="form-input"
              v-model="form.dueDay"
              type="digit"
              placeholder="1-31"
              placeholder-class="input-placeholder"
            />
            <text class="input-unit">号</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">还款开始日期 <text class="required">*</text></text>
          <view class="form-row">
            <view class="form-item half">
              <input
                class="form-input"
                v-model="form.startYear"
                type="number"
                placeholder="2026"
                placeholder-class="input-placeholder"
              />
            </view>
            <text class="form-separator">年</text>
            <view class="form-item half">
              <input
                class="form-input"
                v-model="form.startMonth"
                type="number"
                placeholder="6"
                placeholder-class="input-placeholder"
              />
            </view>
            <text class="form-separator">月</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <input
            class="form-input"
            v-model="form.remark"
            placeholder="添加备注信息..."
            placeholder-class="input-placeholder"
          />
        </view>
      </view>

      <view class="btn-save-wrap">
        <view class="btn-save" @click="handleSave">
          <text class="btn-save-text">保存</text>
        </view>
      </view>

      <view class="safe-bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTaskStore } from '../../store/tasks'

const taskStore = useTaskStore()

const statusBarHeight = ref(0)
const scrollHeight = ref(600)
const isEdit = ref(false)
const editId = ref('')

const form = reactive({
  name: '',
  totalPrincipal: '',
  principal: '',
  monthlyPrincipal: '',
  monthlyInterest: '',
  totalInstallments: '',
  remainingInstallments: '',
  annualRate: '',
  dueDay: '',
  startYear: '2026',
  startMonth: '6',
  remark: ''
})

function goBack() {
  uni.navigateBack()
}

function onTotalPrincipalBlur() {
  if (form.totalPrincipal && !form.principal) {
    form.principal = form.totalPrincipal
  }
}

function handleSave() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入平台名称', icon: 'none' })
    return
  }
  if (!form.totalPrincipal || Number(form.totalPrincipal) <= 0) {
    uni.showToast({ title: '请输入借款总额', icon: 'none' })
    return
  }
  if (!form.startYear || !form.startMonth || Number(form.startMonth) < 1 || Number(form.startMonth) > 12) {
    uni.showToast({ title: '请输入正确的还款开始日期', icon: 'none' })
    return
  }

  const repayStartYearMonth = `${form.startYear}-${String(form.startMonth).padStart(2, '0')}`

  const data = {
    name: form.name.trim(),
    totalPrincipal: Number(form.totalPrincipal) || 0,
    principal: Number(form.principal) || Number(form.totalPrincipal) || 0,
    monthlyPrincipal: Number(form.monthlyPrincipal) || 0,
    monthlyInterest: Number(form.monthlyInterest) || 0,
    totalInstallments: Number(form.totalInstallments) || 0,
    remainingInstallments: Number(form.remainingInstallments) || 0,
    annualRate: Number(form.annualRate) || 0,
    dueDay: Number(form.dueDay) || 1,
    repayStartYearMonth: repayStartYearMonth,
    remark: form.remark || ''
  }

  if (isEdit.value && editId.value) {
    taskStore.updatePlatform(editId.value, data)
    uni.showToast({ title: '修改成功', icon: 'success' })
  } else {
    taskStore.addPlatform(data)
    uni.showToast({ title: '添加成功', icon: 'success' })
  }

  setTimeout(() => {
    uni.navigateBack()
  }, 500)
}

onLoad((options) => {
  const id = options?.id || ''
  if (id) {
    isEdit.value = true
    editId.value = id
  }
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44

  taskStore.initTasks()

  if (isEdit.value && editId.value) {
    const platform = taskStore.getPlatformById(editId.value)
    if (platform) {
      form.name = platform.name || ''
      form.totalPrincipal = String(platform.totalPrincipal || '')
      form.principal = String(platform.principal || '')
      form.monthlyPrincipal = String(platform.monthlyPrincipal || '')
      form.monthlyInterest = String(platform.monthlyInterest || '')
      form.totalInstallments = String(platform.totalInstallments || '')
      form.remainingInstallments = String(platform.remainingInstallments || '')
      form.annualRate = platform.annualRate ? String(platform.annualRate) : ''
      form.dueDay = String(platform.dueDay || '')
      if (platform.repayStartYearMonth) {
        const [y, m] = platform.repayStartYearMonth.split('-')
        form.startYear = y || '2026'
        form.startMonth = String(Number(m)) || '6'
      }
      form.remark = platform.remark || ''
    }
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
    display: flex;
    align-items: center;

    .back-icon {
      font-size: $font-lg;
      color: $accent-green;
      margin-right: 8rpx;
    }

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

  .nav-placeholder {
    width: 100rpx;
  }
}

.scroll-content {
  padding: 0 24rpx;
  box-sizing: border-box;
}

.form-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  padding: 30rpx;
  margin-top: 20rpx;
}

.form-item {
  margin-bottom: 28rpx;

  &.half {
    flex: 1;
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: 12rpx;

  .required {
    color: $accent-orange;
  }
}

.form-input {
  width: 100%;
  height: 80rpx;
  background-color: $bg-secondary;
  border: 1rpx solid transparent;
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
  background-color: $bg-secondary;
  border: 1rpx solid transparent;
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
    margin-left: 8rpx;
  }
}

.form-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 28rpx;
  align-items: center;
}

.form-separator {
  font-size: $font-sm;
  color: $text-muted;
  flex-shrink: 0;
}

.btn-save-wrap {
  margin-top: 40rpx;
  padding: 0 20rpx;
}

.btn-save {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, $accent-green, $accent-green-dark);
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.85;
  }

  .btn-save-text {
    font-size: $font-lg;
    font-weight: 600;
    color: #fff;
  }
}

.safe-bottom-space {
  height: 60rpx;
}
</style>
