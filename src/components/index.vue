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
          <div class="nav-brand">
            <div class="brand-text">
              <div class="brand-title">AHP-EWM 权重计算平台</div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content" role="main">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="title-highlight">选择计算方法</span>
            </h1>
            <p class="hero-subtitle">基于层次分析法与熵值法的专业权重计算工具</p>
          </div>
          <div class="hero-decoration">
            <div class="decoration-circle"></div>
          </div>
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
            <div class="card-header">
              <div class="card-icon ahp-icon" aria-hidden="true">
                <span class="icon-text">AHP</span>
              </div>
              <div class="card-badge">推荐</div>
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
            <div class="card-footer">
              <span class="card-action">开始计算</span>
              <div class="card-arrow">→</div>
            </div>
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
            <div class="card-header">
              <div class="card-icon ewm-icon" aria-hidden="true">
                <span class="icon-text">熵</span>
              </div>
              <div class="card-badge">客观</div>
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
            <div class="card-footer">
              <span class="card-action">开始计算</span>
              <div class="card-arrow">→</div>
            </div>
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
            <div class="card-header">
              <div class="card-icon fusion-icon" aria-hidden="true">
                <span class="icon-text">融合</span>
              </div>
              <div class="card-badge">综合</div>
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
            <div class="card-footer">
              <span class="card-action">开始计算</span>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section" role="region" aria-label="使用提示">
          <div class="info-grid">
            <div class="info-card">
              <div class="info-icon" aria-hidden="true">🎯</div>
              <div class="info-content">
                <div class="info-title">AHP适用场景</div>
                <div class="info-text">专家打分、多准则决策、定性分析</div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-icon" aria-hidden="true">📈</div>
              <div class="info-content">
                <div class="info-title">熵值法适用场景</div>
                <div class="info-text">数据完整、客观赋权、定量分析</div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-icon" aria-hidden="true">⚡</div>
              <div class="info-content">
                <div class="info-title">融合方法优势</div>
                <div class="info-text">兼顾主客观优势，结果更全面</div>
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
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

/* 加载状态覆盖层 - 玻璃拟态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--duration-normal) ease-out;
}

.loading-content {
  text-align: center;
  padding: var(--space-8);
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow-lg);
  border: 1px solid var(--card-border);
  min-width: 320px;
  animation: slideUp var(--duration-normal) ease-out;
}

.loading-spinner {
  width: 56px;
  height: 56px;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary-500);
  border-radius: 50%;
  margin: 0 auto var(--space-4);
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--space-2);
}

.loading-subtext {
  font-size: var(--text-sm);
  color: var(--gray-500);
}

/* 步骤容器 */
.step-container {
  min-height: 100vh;
  animation: fadeIn var(--duration-slow) ease-out;
}

.step-container.fade-in {
  animation: fadeIn var(--duration-slow) ease-out;
}

/* 导航栏 - 玻璃拟态 */
.nav-bar {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.brand-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: var(--text-xl);
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-weight: 500;
}

/* 主内容区 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8);
}

/* Hero Section */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-10);
  padding: var(--space-8);
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  border-radius: var(--radius-2xl);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--primary-200);
}

.hero-content {
  flex: 1;
  z-index: 1;
}

.hero-title {
  font-size: var(--text-3xl);
  font-weight: 900;
  color: var(--primary-900);
  margin-bottom: var(--space-3);
  line-height: 1.1;
}

.title-highlight {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--gray-600);
  font-weight: 500;
  line-height: 1.5;
}

.hero-decoration {
  position: absolute;
  right: -50px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 0;
}

.decoration-circle {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--primary-300), transparent);
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.6;
  animation: pulse 4s ease-in-out infinite;
}

/* 方法卡片网格 */
.method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-10);
}

/* 方法卡片 - 玻璃拟态 */
.method-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  cursor: pointer;
  transition: all var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--card-shadow);
}

.method-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-50), transparent);
  opacity: 0;
  transition: opacity var(--duration-normal) ease;
  z-index: 0;
}

.method-card:hover::before {
  opacity: 1;
}

.method-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
  border-color: var(--primary-300);
}

.method-card.is-active {
  transform: translateY(-2px) scale(0.98);
  border-color: var(--primary-600);
}

.method-card:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--text-sm);
  color: white;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.ahp-icon {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
}

.ewm-icon {
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
}

.fusion-icon {
  background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
}

.card-badge {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-content {
  z-index: 1;
}

.card-title {
  font-size: var(--text-xl);
  font-weight: 800;
  color: var(--gray-900);
  margin-bottom: var(--space-2);
  line-height: 1.2;
}

.card-description {
  font-size: var(--text-sm);
  color: var(--gray-600);
  line-height: 1.5;
  margin-bottom: var(--space-3);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--gray-100);
  color: var(--gray-700);
  font-weight: 600;
  border: 1px solid var(--gray-200);
}

.tag.tag-primary {
  background: var(--primary-100);
  color: var(--primary-800);
  border-color: var(--primary-200);
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

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
  padding-top: var(--space-3);
  border-top: 1px solid var(--gray-200);
}

.card-action {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--primary-600);
}

.card-arrow {
  color: var(--primary-600);
  font-size: var(--text-lg);
  transition: transform var(--duration-normal) ease;
}

.method-card:hover .card-arrow {
  transform: translateX(4px);
}

/* 信息区域 */
.info-section {
  margin-top: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--gray-200);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}

.info-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  transition: all var(--duration-normal) ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.info-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
  line-height: 1;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--space-1);
}

.info-text {
  font-size: var(--text-sm);
  color: var(--gray-600);
  line-height: 1.5;
}

/* 返回按钮容器 */
.back-button-container {
  margin-bottom: var(--space-6);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--gray-700);
  cursor: pointer;
  transition: all var(--duration-normal) ease;
  box-shadow: var(--card-shadow);
}

.back-button:hover {
  border-color: var(--primary-400);
  color: var(--primary-600);
  transform: translateX(-2px);
  box-shadow: var(--card-shadow-hover);
}

.back-button:active {
  transform: translateX(-1px);
}

.back-icon {
  font-size: var(--text-lg);
  font-weight: 800;
}

/* 组件包装器 */
.component-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8);
}

.component-container {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--card-shadow-lg);
  border: 1px solid var(--card-border);
  animation: slideUp var(--duration-normal) ease-out;
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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .loading-overlay {
    background: rgba(15, 23, 42, 0.8);
  }

  .loading-content {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .loading-text {
    color: var(--dark-text-primary);
  }

  .loading-subtext {
    color: var(--dark-text-secondary);
  }

  .nav-bar {
    background: var(--dark-card-bg);
    border-bottom-color: var(--dark-card-border);
  }

  .brand-title {
    background: linear-gradient(135deg, var(--primary-300), var(--primary-500));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-subtitle {
    color: var(--gray-400);
  }

  .hero-section {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
    border-color: rgba(59, 130, 246, 0.2);
  }

  .hero-title {
    color: var(--primary-200);
  }

  .hero-subtitle {
    color: var(--gray-400);
  }

  .method-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .method-card::before {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), transparent);
  }

  .card-title {
    color: var(--dark-text-primary);
  }

  .card-description {
    color: var(--dark-text-secondary);
  }

  .tag {
    background: rgba(255, 255, 255, 0.05);
    color: var(--dark-text-secondary);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .card-footer {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .info-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .info-title {
    color: var(--dark-text-primary);
  }

  .info-text {
    color: var(--dark-text-secondary);
  }

  .back-button {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
    color: var(--dark-text-secondary);
  }

  .back-button:hover {
    border-color: var(--primary-400);
    color: var(--primary-300);
  }

  .component-container {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .nav-content {
    padding: var(--space-4) var(--space-4);
  }

  .brand-title {
    font-size: var(--text-lg);
  }

  .main-content {
    padding: var(--space-4);
  }

  .hero-section {
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
    text-align: center;
  }

  .hero-decoration {
    position: static;
    transform: none;
    margin-top: var(--space-4);
  }

  .decoration-circle {
    width: 120px;
    height: 120px;
  }

  .method-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .component-wrapper {
    padding: var(--space-4);
  }

  .component-container {
    padding: var(--space-4);
  }
}

@media (max-width: 480px) {
  .nav-brand {
    gap: var(--space-2);
  }

  .brand-icon {
    font-size: 1.5rem;
  }

  .hero-title {
    font-size: var(--text-2xl);
  }

  .method-card {
    padding: var(--space-4);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    font-size: var(--text-xs);
  }

  .card-title {
    font-size: var(--text-lg);
  }
}
</style>
