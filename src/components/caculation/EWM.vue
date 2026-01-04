<template>
  <div class="ewm-container">

    <div class="section-card">
      <div class="section-header">
        <span class="step-badge">①</span>
        <span class="section-title">上传 Excel 数据文件</span>
      </div>
      <div class="description-text">
        <div>文件要求：包含两个 Sheet 页。</div>
        <div class="highlight-text">• Sheet1：历史数据（第1列样本名，第2列起为指标数值）</div>
        <div class="highlight-text">• Sheet2：指标说明（第1列指标名称，第2列类型"正向/负向"）</div>
      </div>
      <div class="action-area">
        <button class="btn-primary" @click="chooseFile">选择文件</button>
        <button v-if="file" class="btn-success" @click="parseExcel">解析文件</button>
      </div>
      <div v-if="fileName" class="file-info">
        <span class="file-label">已选文件：</span>
        <span class="file-name">{{ fileName }}</span>
      </div>
    </div>

    <div v-if="errorMsg" class="error-card">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMsg }}</span>
    </div>

    <div v-if="entropyData && entropyData.isReady" class="section-card">
      <div class="section-header">
        <span class="step-badge">②</span>
        <span class="section-title">数据预览与指标匹配</span>
      </div>

      <!-- Sheet1 数据预览 -->
      <div class="data-preview-section">
        <div class="preview-header">
          <span class="preview-title">Sheet1 - 历史数据</span>
          <div class="preview-stats">
            <span class="stat-badge">样本数：{{ entropyData.n }}</span>
            <span class="stat-badge">指标数：{{ entropyData.m + 1 }}</span>
          </div>
        </div>
        <div class="scroll-table">
          <div class="matrix-row header">
            <div class="matrix-cell fixed-col">样本名</div>
            <div v-for="(header, j) in entropyData.sheet1Headers" :key="'h'+j" class="matrix-cell">
              {{ header }}
            </div>
          </div>
          <div v-for="(row, i) in entropyData.sheet1DataPreview" :key="i" class="matrix-row">
            <div class="matrix-cell fixed-col">{{ row[0] }}</div>
            <div v-for="(val, j) in row.slice(1)" :key="'v'+j" class="matrix-cell">
              {{ val }}
            </div>
          </div>
        </div>
      </div>

      <!-- Sheet2 数据预览 -->
      <div class="data-preview-section">
        <div class="preview-header">
          <span class="preview-title">Sheet2 - 指标说明</span>
          <div class="preview-stats">
            <span class="stat-badge">指标数量：{{ entropyData.indicators.length }}</span>
          </div>
        </div>
        <div class="scroll-table">
          <div class="matrix-row header">
            <div class="matrix-cell">指标名称</div>
            <div class="matrix-cell">类型</div>
          </div>
          <div v-for="(ind, j) in entropyData.sheet2Data" :key="'s2'+j" class="matrix-row">
            <div class="matrix-cell">{{ ind.name }}</div>
            <div class="matrix-cell" :class="ind.type">{{ ind.typeDisplay }}</div>
          </div>
        </div>
      </div>

      <div v-if="entropyData.currentStep === 0" class="action-area" style="margin-top: 1rem;">
        <button @click="nextStep" class="btn-primary">
          确认无误，开始计算
        </button>
        <button @click="expandAll" class="btn-secondary">
          全部展开
        </button>
      </div>
    </div>

    <div v-if="entropyData && entropyData.currentStep > 0" class="section-card">
      <div class="section-header">
        <span class="step-badge">③</span>
        <span class="section-title">熵值法计算过程</span>
      </div>

      <!-- 原始数据矩阵 -->
      <div class="step-section">
        <div class="step-header">
          <span class="step-number">原始数据</span>
          <span class="step-title">原始数据矩阵</span>
        </div>
        <div class="scroll-table">
          <div class="matrix-row header">
            <div class="matrix-cell fixed-col">样本 \ 指标</div>
            <div v-for="ind in entropyData.indicators" :key="ind.name" class="matrix-cell">
              {{ ind.name }}
            </div>
          </div>
          <div v-for="(row, i) in entropyData.rawMatrix" :key="i" class="matrix-row">
            <div class="matrix-cell fixed-col">{{ entropyData.sampleNames[i] }}</div>
            <div v-for="(val, j) in row" :key="j" class="matrix-cell">
              {{ format(val) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="entropyData.currentStep >= 1" class="step-section">
        <div class="step-header">
          <span class="step-number">第一步</span>
          <span class="step-title">极差标准化结果</span>
        </div>
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">标准化公式</span>
          </div>
          <div class="formula-box">
            <span class="formula">x'ᵢⱼ = Norm(xᵢⱼ)</span>
          </div>
          <div class="formula-info">其中：i 表示样本，j 表示指标，x'ᵢⱼ 为标准化后的值</div>
        </div>

        <div class="scroll-table">
          <div class="matrix-row header">
            <div class="matrix-cell fixed-col">样本 \ 指标</div>
            <div v-for="ind in entropyData.indicators" :key="ind.name" class="matrix-cell">
              {{ ind.name }}
            </div>
          </div>
          <div v-for="(row, i) in entropyData.steps.normalizedMatrix" :key="i" class="matrix-row">
            <div class="matrix-cell fixed-col">{{ entropyData.sampleNames[i] }}</div>
            <div v-for="(val, j) in row" :key="j" class="matrix-cell">
              {{ format(val) }}
            </div>
          </div>
        </div>

        <div class="calculation-card" style="margin-top: 1rem;">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">非负平移结果</span>
          </div>
          <div class="formula-box">
            <span class="formula">x''ᵢⱼ = x'ᵢⱼ + {{ EPSILON }}</span>
          </div>
          <div class="formula-info">其中：ε={{ EPSILON }} 为平移常数，确保所有值为正</div>
        </div>

        <div class="scroll-table" style="margin-top: 0.75rem;">
          <div class="matrix-row header">
            <div class="matrix-cell fixed-col">样本 \ 指标</div>
            <div v-for="ind in entropyData.indicators" :key="ind.name" class="matrix-cell">
              {{ ind.name }}
            </div>
          </div>
          <div v-for="(row, i) in entropyData.steps.stdMatrix" :key="i" class="matrix-row">
            <div class="matrix-cell fixed-col">{{ entropyData.sampleNames[i] }}</div>
            <div v-for="(val, j) in row" :key="j" class="matrix-cell">
              {{ format(val) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="entropyData.currentStep >= 2" class="step-section">
        <div class="step-header">
          <span class="step-number">第二步</span>
          <span class="step-title">计算特征比重 (概率矩阵)</span>
        </div>
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">概率矩阵公式</span>
          </div>
          <div class="formula-box">
            <span class="formula">pᵢⱼ = (x''ᵢⱼ)/(∑ₖ₌₁ⁿ x''ₖⱼ)</span>
          </div>
          <div class="formula-info">其中：i 表示样本，j 表示指标，k 为求和变量</div>
        </div>

        <div class="result-card" style="margin-top: 0.75rem;">
          <div class="result-label">各列(指标)之和 Sⱼ：</div>
          <div class="vector-grid">
            <div v-for="(sum, j) in entropyData.steps.colSums" :key="j" class="vector-item">
              <span class="vector-label">S{{ j + 1 }}</span>
              <span class="vector-value">{{ format(sum) }}</span>
            </div>
          </div>
        </div>

        <div class="scroll-table" style="margin-top: 0.75rem;">
          <div class="matrix-row header">
            <div class="matrix-cell fixed-col">P矩阵</div>
            <div v-for="ind in entropyData.indicators" :key="ind.name" class="matrix-cell">
              {{ ind.name }}
            </div>
          </div>
          <div v-for="(row, i) in entropyData.steps.pMatrix" :key="i" class="matrix-row">
            <div class="matrix-cell fixed-col">{{ entropyData.sampleNames[i] }}</div>
            <div v-for="(val, j) in row" :key="j" class="matrix-cell">
              {{ format(val) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="entropyData.currentStep >= 3" class="step-section">
        <div class="step-header">
          <span class="step-number">第三步</span>
          <span class="step-title">计算信息熵 Eⱼ</span>
        </div>
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">信息熵公式</span>
          </div>
          <div class="formula-box">
            <span class="formula">k = -1/ln({{ entropyData.n }}) ≈ {{ format(Math.abs(entropyData.steps.k)) }}</span>
            <span class="formula" style="margin-top: 0.5rem;">Eⱼ = -k ∑ pᵢⱼ ln(pᵢⱼ)</span>
          </div>
          <div class="formula-info">其中：i 表示样本，j 表示指标，Eⱼ 表示指标j的信息熵</div>
        </div>

        <div class="comparison-table">
          <div class="table-header">
            <div class="th">指标</div>
            <div class="th">信息熵 (Eⱼ)</div>
            <div class="th">信息冗余度 (dⱼ = 1 - Eⱼ)</div>
          </div>
          <div v-for="(eVal, j) in entropyData.steps.E_list" :key="j" class="table-row">
            <div class="td">{{ entropyData.indicators[j].name }}</div>
            <div class="td">{{ format(eVal) }}</div>
            <div class="td">{{ format(1 - eVal) }}</div>
          </div>
        </div>

        <div class="calculation-card" style="margin-top: 1rem;">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">差异系数表格</span>
          </div>
          <div class="formula-box">
            <span class="formula">dⱼ = 1 - Eⱼ</span>
          </div>
        </div>

        <div class="comparison-table" style="margin-top: 0.75rem;">
          <div class="table-header">
            <div class="th">指标</div>
            <div class="th">差异系数 (dⱼ)</div>
          </div>
          <div v-for="(dVal, j) in entropyData.steps.d_list" :key="j" class="table-row">
            <div class="td">{{ entropyData.indicators[j].name }}</div>
            <div class="td">{{ format(dVal) }}</div>
          </div>
        </div>
      </div>

      <div v-if="entropyData.currentStep >= 4" class="step-section">
        <div class="step-header">
          <span class="step-number">第四步</span>
          <span class="step-title">计算最终权重 Wⱼ</span>
        </div>
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">权重计算公式</span>
          </div>
          <div class="formula-box">
            <span class="formula">wⱼ = (dⱼ)/(∑ dⱼ)</span>
          </div>
          <div class="formula-info">其中：wⱼ 为指标j的权重，dⱼ 为指标j的差异系数</div>
        </div>

        <div class="result-card" style="margin-top: 0.75rem;">
          <div class="result-label">冗余度总和 ∑ dⱼ =</div>
          <div class="result-value">{{ format(entropyData.steps.sumD) }}</div>
        </div>

        <div class="final-result-table">
          <div class="final-table-header">
            <div class="th-col">排名</div>
            <div class="th-col">指标名称</div>
            <div class="th-col">权重值</div>
            <div class="th-col">百分比</div>
          </div>
          <div v-for="(item, j) in entropyData.steps.sortedWeights" :key="j" class="final-table-row">
            <div class="td-col rank-col">{{ item.rank }}</div>
            <div class="td-col">{{ item.name }}</div>
            <div class="td-col weight-col">{{ format(item.weight) }}</div>
            <div class="td-col">{{ item.percentage }}</div>
          </div>
        </div>
      </div>

      <button
          v-if="entropyData.currentStep < 4"
          @click="nextStep"
          class="btn-primary full-width"
      >
        {{ getNextStepName(entropyData.currentStep) }}
      </button>

    </div>
  </div>
</template>

<script setup>
import * as XLSX from 'xlsx'
import { ref } from 'vue'
import {
  parseAndMatch,
  calculateNextStep,
  formatNum,
  EPSILON
} from './EWM.js'

const file = ref(null)
const fileName = ref('')
const errorMsg = ref('')
const entropyData = ref(null) // 核心数据对象

// 格式化函数
function format(val) {
  return formatNum(val)
}

// 按钮文案
function getNextStepName(step) {
  const names = [
    '下一步：计算概率矩阵',
    '下一步：计算信息熵',
    '下一步：计算最终权重',
    '计算完成'
  ]
  return names[step] || '下一步'
}

function chooseFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx'
  input.onchange = e => {
    if (e.target.files && e.target.files[0]) {
      file.value = e.target.files[0]
      fileName.value = file.value.name
      errorMsg.value = ''
      entropyData.value = null
    }
  }
  input.click()
}

async function parseExcel() {
  if (!file.value) return;

  try {
    const buffer = await file.value.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })

    if (wb.SheetNames.length < 2) {
      errorMsg.value = '错误：Excel 文件必须至少包含两个 Sheet 页（数据页 + 指标说明页）。'
      return
    }

    // 1. 读取数据
    const sheet1Name = wb.SheetNames[0]
    const sheet2Name = wb.SheetNames[1]

    const sheet1Data = XLSX.utils.sheet_to_json(wb.Sheets[sheet1Name], { header: 1 })
    const sheet2Data = XLSX.utils.sheet_to_json(wb.Sheets[sheet2Name], { header: 1 })

    // 2. 解析与匹配
    const result = parseAndMatch(sheet1Data, sheet2Data)

    if (!result.isReady) {
      errorMsg.value = '解析失败：未能匹配到有效指标。请检查 Sheet1 表头与 Sheet2 指标名称是否一致，并确保 Sheet2 第二列包含"正向"或"负向"。'
      return
    }

    // 3. 初始化数据对象
    entropyData.value = {
      ...result,
      currentStep: 0,
      steps: {} // 存放计算中间结果
    }
    errorMsg.value = ''

  } catch (e) {
    console.error(e)
    errorMsg.value = '文件解析发生异常：' + e.message
  }
}

function nextStep() {
  if (entropyData.value) {
    calculateNextStep(entropyData.value)
  }
}

// 全部展开 - 自动执行所有计算步骤
function expandAll() {
  if (!entropyData.value) return
  
  // 重置当前步骤
  entropyData.value.currentStep = 0
  
  // 执行步骤1-4
  while (entropyData.value.currentStep < 4) {
    calculateNextStep(entropyData.value)
  }
  
  console.log('全部展开完成，熵值法计算已执行完毕')
}
</script>

<style scoped>
/* 主容器 - 玻璃拟态风格 */
.ewm-container {
  min-height: 100vh;
  background: transparent;
  padding: var(--space-6);
  overflow-x: hidden;
}

/* 卡片容器 - 玻璃拟态设计 */
.section-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  transition: all var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
}

.section-card:hover {
  background: var(--card-bg-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}

/* 标题区域 */
.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--gray-200);
}

.step-badge {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-weight: 800;
  font-size: var(--text-lg);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  line-height: 1;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--gray-900);
  letter-spacing: -0.02em;
}

/* 描述文本 */
.description-text {
  font-size: var(--text-sm);
  color: var(--gray-600);
  line-height: 1.7;
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--primary-500);
  backdrop-filter: blur(5px);
}

.highlight-text {
  color: var(--danger-600);
  font-weight: 600;
  margin-top: var(--space-2);
  display: block;
}

/* 操作区域 */
.action-area {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}

/* 按钮系统 - 玻璃拟态风格 */
.btn-primary {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(5px);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-success {
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  backdrop-filter: blur(5px);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--gray-700);
  border: 2px solid var(--gray-200);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
}

.btn-secondary:hover {
  border-color: var(--primary-500);
  color: var(--primary-500);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  background: var(--card-bg-hover);
}

.full-width {
  width: 100%;
  margin-top: var(--space-4);
}

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: linear-gradient(135deg, var(--primary-50), rgba(59, 130, 246, 0.1));
  border-radius: var(--radius-lg);
  border: 1px solid var(--primary-200);
  font-size: var(--text-xs);
  backdrop-filter: blur(5px);
}

.file-label {
  font-weight: 600;
  color: var(--primary-800);
}

.file-name {
  color: var(--primary-700);
  font-weight: 500;
}

/* 错误卡片 */
.error-card {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
  border: 1px solid var(--danger-500);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--danger-600);
  font-weight: 600;
  backdrop-filter: blur(5px);
}

.error-icon {
  font-size: var(--text-xl);
}

.error-text {
  flex: 1;
}

/* 数据预览区域 */
.data-preview-section {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
}

.preview-title {
  font-weight: 700;
  color: var(--gray-900);
  font-size: var(--text-lg);
}

.preview-stats {
  display: flex;
  gap: var(--space-2);
}

.stat-badge {
  background: var(--gray-200);
  color: var(--gray-700);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

/* 滚动表格 */
.scroll-table {
  overflow-x: auto;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  max-height: 200px;
  overflow-y: auto;
  backdrop-filter: blur(5px);
}

.matrix-row {
  display: flex;
  border-bottom: 1px solid var(--gray-200);
}

.matrix-row:last-child {
  border-bottom: none;
}

.matrix-row.header {
  background: var(--gray-50);
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 10;
}

.matrix-cell {
  flex: 1;
  min-width: 80px;
  padding: var(--space-2);
  text-align: center;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--gray-700);
  border-right: 1px solid var(--gray-200);
  background: var(--card-bg);
}

.matrix-cell:last-child {
  border-right: none;
}

.matrix-cell.fixed-col {
  min-width: 100px;
  background: var(--gray-50);
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 5;
}

.matrix-row:hover .matrix-cell {
  background: var(--gray-50);
}

/* 指标类型样式 */
.positive {
  color: var(--success-600);
  font-weight: 700;
}

.negative {
  color: var(--danger-600);
  font-weight: 700;
}

/* 步骤区域 */
.step-section {
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.step-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--gray-200);
}

.step-number {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-weight: 700;
  font-size: var(--text-sm);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.step-title {
  font-weight: 700;
  color: var(--gray-900);
  font-size: var(--text-lg);
}

/* 计算卡片 */
.calculation-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(5px);
}

.calc-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.calc-badge {
  background: var(--primary-500);
  color: white;
  font-weight: 700;
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  line-height: 1;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2);
}

.calc-title {
  font-weight: 600;
  color: var(--gray-800);
  font-size: var(--text-sm);
}

/* 公式框 */
.formula-box {
  background: var(--gray-100);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  text-align: center;
  border: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  backdrop-filter: blur(3px);
}

.formula {
  font-family: 'Courier New', monospace;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--gray-900);
}

.formula-info {
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-style: italic;
  text-align: left;
  padding: var(--space-2);
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  border-left: 2px solid var(--primary-500);
}

/* 结果卡片 */
.result-card {
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  backdrop-filter: blur(5px);
}

.result-label {
  font-weight: 600;
  color: var(--primary-800);
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
}

.result-value {
  font-size: var(--text-xl);
  font-weight: 800;
  color: var(--primary-600);
  text-align: center;
}

/* 向量网格 */
.vector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.vector-item {
  background: var(--card-bg);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  text-align: center;
  backdrop-filter: blur(3px);
}

.vector-label {
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-weight: 600;
  display: block;
  margin-bottom: var(--space-1);
}

.vector-value {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--gray-900);
}

/* 对比表格 */
.comparison-table {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--card-border);
  margin-top: var(--space-3);
  backdrop-filter: blur(5px);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  background: linear-gradient(135deg, var(--gray-800), var(--gray-900));
  color: white;
  font-weight: 700;
  font-size: var(--text-sm);
}

.table-header .th {
  padding: var(--space-3);
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.table-header .th:last-child {
  border-right: none;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
  font-size: var(--text-sm);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--gray-50);
}

.td {
  padding: var(--space-2);
  text-align: center;
  color: var(--gray-700);
  font-weight: 500;
}

/* 最终结果表格 */
.final-result-table {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--card-border);
  margin-top: var(--space-3);
  backdrop-filter: blur(5px);
}

.final-table-header {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1fr 1fr;
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
  font-weight: 700;
  font-size: var(--text-sm);
}

.final-table-header .th-col {
  padding: var(--space-3);
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.final-table-header .th-col:last-child {
  border-right: none;
}

.final-table-row {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1fr 1fr;
  padding: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
  font-size: var(--text-sm);
  transition: background var(--duration-normal) ease;
}

.final-table-row:last-child {
  border-bottom: none;
}

.final-table-row:hover {
  background: var(--gray-50);
}

.td-col {
  padding: var(--space-2);
  text-align: center;
  color: var(--gray-700);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-col {
  font-weight: 800;
  color: var(--success-600);
  font-size: var(--text-base);
}

.weight-col {
  font-weight: 800;
  color: var(--success-600);
  font-size: var(--text-base);
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .ewm-container {
    background: transparent;
  }

  .section-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .section-card:hover {
    background: var(--dark-card-bg-hover);
  }

  .section-title {
    color: var(--dark-text-primary);
  }

  .description-text {
    background: rgba(55, 65, 81, 0.8);
    color: var(--dark-text-secondary);
    border-left-color: var(--primary-400);
  }

  .highlight-text {
    color: var(--danger-400);
  }

  .error-card {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
    border-color: var(--danger-500);
    color: var(--danger-300);
  }

  .data-preview-section {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .preview-title {
    color: var(--dark-text-primary);
  }

  .stat-badge {
    background: var(--gray-700);
    color: var(--dark-text-secondary);
  }

  .scroll-table,
  .comparison-table,
  .final-result-table {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .matrix-row {
    border-color: var(--gray-700);
  }

  .matrix-row.header {
    background: var(--gray-800);
  }

  .matrix-cell {
    background: var(--dark-card-bg);
    color: var(--dark-text-secondary);
    border-color: var(--gray-700);
  }

  .matrix-cell.fixed-col {
    background: var(--gray-800);
  }

  .matrix-row:hover .matrix-cell {
    background: rgba(55, 65, 81, 0.6);
  }

  .step-section {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .step-header {
    border-color: var(--gray-700);
  }

  .calculation-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .formula-box {
    background: var(--gray-800);
    border-color: var(--gray-700);
  }

  .formula {
    color: var(--dark-text-primary);
  }

  .formula-info {
    background: var(--gray-800);
    color: var(--gray-400);
    border-left-color: var(--primary-400);
  }

  .result-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
    border-color: var(--primary-400);
  }

  .result-label {
    color: var(--primary-200);
  }

  .result-value {
    color: var(--primary-300);
  }

  .vector-item {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .vector-label {
    color: var(--gray-400);
  }

  .vector-value {
    color: var(--dark-text-primary);
  }

  .table-header {
    background: linear-gradient(135deg, var(--gray-700), var(--gray-800));
  }

  .table-row {
    border-color: var(--gray-700);
  }

  .table-row:hover {
    background: rgba(55, 65, 81, 0.6);
  }

  .td {
    color: var(--dark-text-secondary);
  }

  .final-table-header {
    background: linear-gradient(135deg, var(--success-600), #047857);
  }

  .final-table-row:hover {
    background: rgba(16, 185, 129, 0.15);
  }

  .td-col {
    color: var(--dark-text-secondary);
  }

  .rank-col,
  .weight-col {
    color: var(--success-300);
  }
}
</style>
