<template>
  <div id="app" class="app-container">
    <!-- 装饰性背景元素 -->
    <div class="bg-decoration">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
      <div class="bg-blob blob-3"></div>
    </div>

    <!-- 主要内容区域 -->
    <Index />

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-content">
        <span>AHP-EWM 权重计算系统</span>
        <span class="divider">•</span>
        <span>现代化 UI 设计</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import Index from './components/index.vue'
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: var(--bg-surface);
}

/* 装饰性背景元素 - 玻璃拟态风格 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--primary-300), transparent);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, var(--success-500), transparent);
  bottom: -100px;
  right: -50px;
  animation-delay: -5s;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--warning-500), transparent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* 页脚样式 */
.app-footer {
  position: relative;
  z-index: 1;
  padding: var(--space-6) var(--space-4);
  text-align: center;
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  font-size: var(--text-sm);
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.divider {
  color: var(--gray-400);
  font-weight: 300;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .app-footer {
    background: var(--dark-card-bg);
    border-top-color: var(--dark-card-border);
  }

  .footer-content {
    color: var(--dark-text-secondary);
  }

  .bg-blob {
    opacity: 0.3;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .app-footer {
    padding: var(--space-4) var(--space-3);
  }

  .footer-content {
    flex-direction: column;
    gap: var(--space-1);
  }

  .bg-blob {
    filter: blur(40px);
  }

  .blob-1, .blob-2, .blob-3 {
    width: 250px;
    height: 250px;
  }
}
</style>
