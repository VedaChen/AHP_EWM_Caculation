<template>
  <div class="content-area">
    <!-- 加载状态覆盖层 -->
    <div v-if="isLoading" class="loading-overlay" role="alert" aria-live="assertive">
      <div class="loading-content">
        <div class="loading-spinner" aria-hidden="true"></div>
        <div class="loading-text">{{ loadingMessage }}</div>
        <div class="loading-subtext">正在准备计算环境，请稍候...</div>
      </div>
    </div>

    <!-- 步骤0：选择计算方法 -->
    <div v-if="step === 0" class="step-container" :class="{ 'fade-in': showContent }">
      <!-- Navigation Bar -->
      <nav class="nav-bar" role="navigation" aria-label="主导航">
        <div class="nav-content">
          <div class="nav-title">AHP-熵值法权重计算平台</div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content" role="main">
        <div class="section-header">
          <h1 class="title">选择计算方法</h1>
          <p class="subtitle">请选择适合您需求的权重计算方法</p>
        </div>

        <!-- Method Cards Grid -->
        <div class="method-grid" role="list" aria-label="计算方法列表">
          <div 
            class="method-card" 
            role="listitem"
            tabindex="0"
            @click="selectMethod('ahp')"
            @keydown.enter="selectMethod('ahp')"
            @keydown.space.prevent="selectMethod('ahp')"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
            :class="{ 'is-active': touchActive }"
            aria-label="AHP层次分析法，适用于定性分析场景"
          >
            <div class="card-icon ahp-icon" aria-hidden="true">
              <span class="icon-text">AHP</span>
            </div>
            <div class="card-content">
              <div class="card-title">AHP层次分析法</div>
              <div class="card-description">基于判断矩阵计算权重，适用于定性分析场景</div>
              <div class="card-tags">
                <span class="tag tag-primary">主观赋权</span>
                <span class="tag">矩阵构建</span>
                <span class="tag">一致性检验</span>
              </div>
            </div>
            <div class="card-arrow" aria-hidden="true">›</div>
          </div>

          <div 
            class="method-card" 
            role="listitem"
            tabindex="0"
            @click="selectMethod('ewm')"
            @keydown.enter="selectMethod('ewm')"
            @keydown.space.prevent="selectMethod('ewm')"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
            :class="{ 'is-active': touchActive }"
            aria-label="熵值法，适用于定量分析场景"
          >
            <div class="card-icon ewm-icon" aria-hidden="true">
              <span class="icon-text">熵</span>
            </div>
            <div class="card-content">
              <div class="card-title">熵值法</div>
              <div class="card-description">基于数据差异程度计算权重，适用于定量分析场景</div>
              <div class="card-tags">
                <span class="tag tag-success">客观赋权</span>
                <span class="tag">数据标准化</span>
                <span class="tag">差异分析</span>
              </div>
            </div>
            <div class="card-arrow" aria-hidden="true">›</div>
          </div>

          <div 
            class="method-card" 
            role="listitem"
            tabindex="0"
            @click="selectMethod('fusion')"
            @keydown.enter="selectMethod('fusion')"
            @keydown.space.prevent="selectMethod('fusion')"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
            :class="{ 'is-active': touchActive }"
            aria-label="AHP-熵值法融合，结合主观判断与客观数据"
          >
            <div class="card-icon fusion-icon" aria-hidden="true">
              <span class="icon-text">融合</span>
            </div>
            <div class="card-content">
              <div class="card-title">AHP-熵值法融合</div>
              <div class="card-description">结合主观判断与客观数据，获得更全面的权重结果</div>
              <div class="card-tags">
                <span class="tag tag-warning">综合赋权</span>
                <span class="tag">主客观结合</span>
                <span class="tag">优化调整</span>
              </div>
            </div>
            <div class="card-arrow" aria-hidden="true">›</div>
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section" role="region" aria-label="使用提示">
          <div class="info-card">
            <div class="info-icon" aria-hidden="true">💡</div>
            <div class="info-text">
              <div class="info-title">使用提示</div>
              <div class="info-list">
                <div>• AHP适用于专家打分、多准则决策场景</div>
                <div>• 熵值法适用于数据完整、需要客观赋权的场景</div>
                <div>• 融合方法可兼顾主观经验与客观数据优势</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 步骤1：显示对应的计算组件 -->
    <div v-if="step === 1" class="step-container" :class="{ 'fade-in': showContent }">
      <div class="component-wrapper">
        <!-- 返回按钮 -->
        <div class="back-button-container">
          <button 
            class="back-button" 
            @click="handleBack"
            aria-label="返回选择页面"
          >
            <span class="back-icon">←</span>
            <span>返回选择</span>
          </button>
        </div>

        <!-- AHP 组件 -->
        <div v-if="selectedMethod === 'ahp'" class="component-container">
          <AHP @back="handleBackFromChild" />
        </div>
        
        <!-- 熵值法组件 -->
        <div v-if="selectedMethod === 'ewm'" class="component-container">
          <EWM @back="handleBackFromChild" />
        </div>
        
        <!-- 融合计算组件 -->
        <div v-if="selectedMethod === 'fusion'" class="component-container">
          <AHP_EWM @back="handleBackFromChild" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AHP from './caculation/AHP.vue'
import EWM from './caculation/EWM.vue'
import AHP_EWM from './caculation/AHP-EWM.vue'

// State
const step = ref(0)
const selectedMethod = ref('')
const touchActive = ref(false)
const isLoading = ref(false)
const loadingMessage = ref('')
const showContent = ref(false)

// Computed
const currentStepTitle = computed(() => {
  if (step.value === 0) return '选择计算方法'
  if (selectedMethod.value === 'ahp') return 'AHP层次分析法'
  if (selectedMethod.value === 'ewm') return '熵值法'
  if (selectedMethod.value === 'fusion') return 'AHP-熵值法融合'
  return '权重计算'
})

// Methods
const selectMethod = async (method) => {
  // 触发视觉反馈
  touchActive.value = true
  
  // 显示加载状态
  isLoading.value = true
  loadingMessage.value = getLoadingMessage(method)
  
  // 模拟加载过程（增强用户体验）
  await new Promise(resolve => setTimeout(resolve, 600))
  
  // 设置选中方法
  selectedMethod.value = method
  step.value = 1
  
  // 隐藏加载状态
  isLoading.value = false
  
  // 重置触摸状态
  setTimeout(() => {
    touchActive.value = false
  }, 100)
}

const getLoadingMessage = (method) => {
  const messages = {
    'ahp': '正在初始化AHP分析模块...',
    'ewm': '正在加载熵值计算引擎...',
    'fusion': '正在准备融合计算环境...'
  }
  return messages[method] || '正在准备计算环境...'
}

const handleBack = () => {
  if (step.value > 0) {
    // 添加返回动画
    showContent.value = false
    
    setTimeout(() => {
      step.value = 0
      selectedMethod.value = ''
      showContent.value = true
    }, 200)
    
    return true
  }
  return false
}

// 处理子组件返回事件
const handleBackFromChild = () => {
  handleBack()
}

// Touch feedback
const handleTouchStart = () => {
  touchActive.value = true
}

const handleTouchEnd = () => {
  setTimeout(() => {
    touchActive.value = false
  }, 100)
}

// 键盘导航支持
const handleKeydown = (event) => {
  if (event.key === 'Escape' && step.value > 0) {
    handleBack()
  }
}

// 生命周期
onMounted(() => {
  showContent.value = true
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

// 清理事件监听
onMounted(() => {
  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
})

defineExpose({
  handleBack
})
</script>

<style scoped>
/* 主容器 */
.content-area {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  position: relative;
  overflow-x: hidden;
}

/* 加载状态覆盖层 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.loading-content {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 280px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.loading-subtext {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 步骤容器 */
.step-container {
  min-height: 100vh;
  animation: fadeIn 0.5s ease-out;
}

.step-container.fade-in {
  animation: fadeIn 0.5s ease-out;
}

/* 导航栏 */
.nav-bar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.025em;
}

.nav-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* 主内容区 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 标题区域 */
.section-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-top: 1rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.75rem;
  letter-spacing: -0.03em;
}

.subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  font-weight: 400;
  line-height: 1.6;
}

/* 方法卡片网格 */
.method-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* 方法卡片 */
.method-card {
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  gap: 1.25rem;
}

.method-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.method-card:hover::before {
  opacity: 1;
}

.method-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.method-card.is-active {
  transform: scale(0.98);
  border-color: #2563eb;
}

.method-card:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.method-card > * {
  position: relative;
  z-index: 1;
}

/* 卡片图标 */
.card-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: white;
  letter-spacing: 0.5px;
}

.ahp-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.ewm-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.fusion-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.icon-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 卡片内容 */
.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.card-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

/* 卡片标签 */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  background: #f3f4f6;
  color: #4b5563;
  font-weight: 500;
  border: 1px solid #e5e7eb;
}

.tag.tag-primary {
  background: #dbeafe;
  color: #1e40af;
  border-color: #bfdbfe;
}

.tag.tag-success {
  background: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.tag.tag-warning {
  background: #fed7aa;
  color: #92400e;
  border-color: #fde68a;
}

/* 卡片箭头 */
.card-arrow {
  flex-shrink: 0;
  font-size: 1.5rem;
  color: #9ca3af;
  font-weight: 300;
  transition: all 0.3s ease;
  margin-left: 0.5rem;
}

.method-card:hover .card-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

/* 信息区域 */
.info-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: linear-gradient(135deg, #f0f9ff, #f5f3ff);
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 1.25rem;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.info-text {
  flex: 1;
}

.info-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 0.5rem;
}

.info-list {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.8;
}

.info-list div {
  margin-bottom: 0.25rem;
}

/* 返回按钮容器 */
.back-button-container {
  margin-bottom: 1.5rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.back-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.back-button:active {
  transform: translateX(-1px);
}

.back-icon {
  font-size: 1.125rem;
  font-weight: 700;
}

/* 组件包装器 */
.component-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.component-container {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式优化（不使用 media query，使用相对单位和弹性布局） */
.main-content {
  padding: 1.5rem;
}

.nav-content {
  padding: 1rem 1.5rem;
}

.method-card {
  padding: 1.25rem;
  gap: 1rem;
}

.card-icon {
  width: 56px;
  height: 56px;
  font-size: 0.875rem;
}

.card-title {
  font-size: 1.125rem;
}

.title {
  font-size: 2rem;
}

.subtitle {
  font-size: 1rem;
}

/* 暗色模式支持（可选） */
@media (prefers-color-scheme: dark) {
  .content-area {
    background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  }
  
  .nav-bar {
    background: #1f2937;
    border-color: #374151;
  }
  
  .nav-title {
    color: #f9fafb;
  }
  
  .nav-subtitle {
    color: #9ca3af;
  }
  
  .method-card {
    background: #1f2937;
    border-color: #374151;
  }
  
  .card-title {
    color: #f9fafb;
  }
  
  .card-description {
    color: #9ca3af;
  }
  
  .tag {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .info-card {
    background: linear-gradient(135deg, #1e3a8a, #4c1d95);
    border-color: #1e40af;
  }
  
  .info-title {
    color: #dbeafe;
  }
  
  .info-list {
    color: #d1d5db;
  }
  
  .back-button {
    background: #1f2937;
    border-color: #374151;
    color: #d1d5db;
  }
  
  .back-button:hover {
    border-color: #60a5fa;
    color: #60a5fa;
  }
  
  .component-container {
    background: #1f2937;
    border-color: #374151;
  }
  
  .loading-content {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .loading-text {
    color: #f9fafb;
  }
  
  .loading-subtext {
    color: #9ca3af;
  }
}
</style>
