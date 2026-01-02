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
/* 主容器 */
.ewm-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 1.5rem;
  overflow-x: hidden;
}

/* 卡片容器 */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* 标题区域 */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.step-badge {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 800;
  font-size: 1.125rem;
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  line-height: 1;
  letter-spacing: 0.5px;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

/* 描述文本 */
.description-text {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 1.25rem;
  padding: 0.875rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.highlight-text {
  color: #dc2626;
  font-weight: 600;
  margin-top: 0.5rem;
  display: block;
}

/* 操作区域 */
.action-area {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.full-width {
  width: 100%;
  margin-top: 1rem;
}

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  font-size: 0.875rem;
}

.file-label {
  font-weight: 600;
  color: #1e40af;
}

.file-name {
  color: #1e40af;
  font-weight: 500;
}

/* 错误卡片 */
.error-card {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #991b1b;
  font-weight: 600;
}

.error-icon {
  font-size: 1.25rem;
}

.error-text {
  flex: 1;
}

/* 数据预览区域 */
.data-preview-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.preview-title {
  font-weight: 700;
  color: #111827;
  font-size: 1.05rem;
}

.preview-stats {
  display: flex;
  gap: 0.5rem;
}

.stat-badge {
  background: #e5e7eb;
  color: #4b5563;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* 滚动表格 */
.scroll-table {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  max-height: 200px;
  overflow-y: auto;
}

.matrix-row {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
}

.matrix-row:last-child {
  border-bottom: none;
}

.matrix-row.header {
  background: #f9fafb;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 10;
}

.matrix-cell {
  flex: 1;
  min-width: 80px;
  padding: 0.625rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  border-right: 1px solid #f3f4f6;
}

.matrix-cell:last-child {
  border-right: none;
}

.matrix-cell.fixed-col {
  min-width: 100px;
  background: #f9fafb;
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 5;
}

/* 指标类型样式 */
.positive {
  color: #059669;
  font-weight: 700;
}

.negative {
  color: #dc2626;
  font-weight: 700;
}

/* 步骤区域 */
.step-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.step-number {
  background: #3b82f6;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
}

.step-title {
  font-weight: 700;
  color: #111827;
  font-size: 1.05rem;
}

/* 计算卡片 */
.calculation-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.875rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.calc-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.calc-badge {
  background: #3b82f6;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  line-height: 1;
}

.calc-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9375rem;
}

/* 公式框 */
.formula-box {
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  text-align: center;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formula {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.formula-info {
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
  text-align: left;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 2px solid #3b82f6;
}

/* 结果卡片 */
.result-card {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.result-label {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.result-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #2563eb;
  text-align: center;
}

/* 向量网格 */
.vector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.vector-item {
  background: white;
  padding: 0.625rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.vector-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.vector-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
}

/* 对比表格 */
.comparison-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-top: 0.75rem;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  background: linear-gradient(135deg, #1f2937, #111827);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.table-header .th {
  padding: 0.75rem;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.table-header .th:last-child {
  border-right: none;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 0.625rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f9fafb;
}

.td {
  padding: 0.5rem;
  text-align: center;
  color: #374151;
  font-weight: 500;
}

/* 最终结果表格 */
.final-result-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-top: 0.75rem;
}

.final-table-header {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1fr 1fr;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.final-table-header .th-col {
  padding: 0.75rem;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.final-table-header .th-col:last-child {
  border-right: none;
}

.final-table-row {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1fr 1fr;
  padding: 0.625rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  transition: background 0.2s ease;
}

.final-table-row:last-child {
  border-bottom: none;
}

.final-table-row:hover {
  background: #f0fdf4;
}

.td-col {
  padding: 0.5rem;
  text-align: center;
  color: #374151;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-col {
  font-weight: 800;
  color: #059669;
  font-size: 1rem;
}

.weight-col {
  font-weight: 800;
  color: #059669;
  font-size: 1rem;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .ewm-container {
    background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  }
  
  .section-card {
    background: #1f2937;
    border-color: #374151;
  }
  
  .section-title {
    color: #f9fafb;
  }
  
  .description-text {
    background: #374151;
    color: #d1d5db;
    border-left-color: #60a5fa;
  }
  
  .highlight-text {
    color: #fca5a5;
  }
  
  .error-card {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fecaca;
  }
  
  .data-preview-section {
    background: #374151;
    border-color: #4b5563;
  }
  
  .preview-title {
    color: #f9fafb;
  }
  
  .stat-badge {
    background: #4b5563;
    color: #e5e7eb;
  }
  
  .scroll-table,
  .comparison-table,
  .final-result-table {
    background: #374151;
    border-color: #4b5563;
  }
  
  .matrix-row {
    border-color: #4b5563;
  }
  
  .matrix-row.header {
    background: #4b5563;
  }
  
  .matrix-cell {
    background: #374151;
    color: #e5e7eb;
    border-color: #4b5563;
  }
  
  .matrix-cell.fixed-col {
    background: #4b5563;
  }
  
  .step-section {
    background: #374151;
    border-color: #4b5563;
  }
  
  .step-header {
    border-color: #4b5563;
  }
  
  .calculation-card {
    background: #374151;
    border-color: #4b5563;
  }
  
  .formula-box {
    background: #4b5563;
    border-color: #6b7280;
  }
  
  .formula {
    color: #f9fafb;
  }
  
  .formula-info {
    background: #374151;
    color: #9ca3af;
    border-left-color: #60a5fa;
  }
  
  .result-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
    border-color: #60a5fa;
  }
  
  .result-label {
    color: #bfdbfe;
  }
  
  .result-value {
    color: #93c5fd;
  }
  
  .vector-item {
    background: #374151;
    border-color: #4b5563;
  }
  
  .vector-label {
    color: #9ca3af;
  }
  
  .vector-value {
    color: #f9fafb;
  }
  
  .table-header {
    background: linear-gradient(135deg, #374151, #1f2937);
  }
  
  .table-row {
    border-color: #4b5563;
  }
  
  .table-row:hover {
    background: #374151;
  }
  
  .td {
    color: #e5e7eb;
  }
  
  .final-table-header {
    background: linear-gradient(135deg, #059669, #047857);
  }
  
  .final-table-row:hover {
    background: rgba(5, 150, 105, 0.1);
  }
  
  .td-col {
    color: #e5e7eb;
  }
  
  .rank-col,
  .weight-col {
    color: #34d399;
  }
}
</style>
