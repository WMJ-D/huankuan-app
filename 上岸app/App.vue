<script>
export default {
  onLaunch() {
    console.log('上岸计划 App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 全局样式 */
page {
  background-color: #1a1a2e;
  color: #e8e8e8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  line-height: 1.6;
  min-height: 100vh;
}

/* 通用暗色主题 CSS 变量 */
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #1e2a45;
  --bg-card-hover: #253352;
  --bg-input: #0f1a30;
  --text-primary: #e8e8e8;
  --text-secondary: #a0a0b0;
  --text-muted: #6b6b7b;
  --accent-green: #4CAF50;
  --accent-green-light: #66BB6A;
  --accent-green-dark: #388E3C;
  --accent-orange: #FF9800;
  --accent-red: #f44336;
  --accent-blue: #2196F3;
  --border-color: #2a3a55;
}

/* 通用工具类 */
.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-1 {
  flex: 1;
}

.text-green {
  color: #4CAF50;
}

.text-orange {
  color: #FF9800;
}

.text-red {
  color: #f44336;
}

.text-muted {
  color: #6b6b7b;
}

.text-secondary {
  color: #a0a0b0;
}

.card {
  background-color: #1e2a45;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #e8e8e8;
  margin-bottom: 20rpx;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.badge-green {
  background-color: rgba(76, 175, 80, 0.15);
  color: #66BB6A;
}

.badge-orange {
  background-color: rgba(255, 152, 0, 0.15);
  color: #FF9800;
}

.badge-red {
  background-color: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

.badge-blue {
  background-color: rgba(33, 150, 243, 0.15);
  color: #2196F3;
}

.badge-purple {
  background-color: rgba(156, 39, 176, 0.15);
  color: #CE93D8;
}

/* 通用按钮 */
.btn-primary {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 20rpx 40rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}

.btn-secondary {
  background-color: #2a3a55;
  color: #e8e8e8;
  border: none;
  border-radius: 16rpx;
  padding: 20rpx 40rpx;
  font-size: 30rpx;
  font-weight: 500;
  text-align: center;
}

/* 导航栏占位 */
.nav-placeholder {
  height: 88rpx;
  width: 100%;
}

/* 安全区域底部 */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
