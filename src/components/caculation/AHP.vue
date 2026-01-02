<template>
  <div class="ahp-container">

    <div class="section-card">
      <div class="section-header">
        <span class="step-badge">①</span>
        <span class="section-title">上传 Excel（判断矩阵）</span>
      </div>
      <div class="description-text">
        <div>请上传包含判断矩阵的 Excel 文件。</div>
        <div class="highlight-text">须遵循以下格式：第一个Sheet页为准则层，第二个Sheet页开始为指标层</div>
      </div>
      <div class="action-area">
        <button class="btn-primary" @click="chooseFile">选择文件</button>
        <button v-if="file" class="btn-success" @click="parseExcel">解析文件</button>
        <button v-if="matrices.length" class="btn-secondary" @click="expandAll">全部展开</button>
      </div>
      <div v-if="fileName" class="file-info">
        <span class="file-label">已选文件：</span>
        <span class="file-name">{{ fileName }}</span>
      </div>
    </div>

    <div v-if="matrices.length" class="section-card">
      <div class="section-header">
        <span class="step-badge">②</span>
        <span class="section-title">判断矩阵确认</span>
      </div>
      <div v-for="m in matrices" :key="m.name" class="matrix-preview">
        <div class="matrix-header">
          <span class="matrix-name">{{ m.name }}</span>
          <span class="matrix-type">{{ m.type }}</span>
        </div>
        <div class="scroll-table">
          <div v-for="(row, i) in m.matrix" :key="i" class="matrix-row">
            <div v-for="(cell, j) in row" :key="j" class="matrix-cell">
              {{ format(cell) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-for="m in matrices" :key="m.name" class="section-card">
      <div class="section-header">
        <span class="step-badge">③</span>
        <span class="section-title">{{ m.name }} 计算过程</span>
      </div>

      <div v-if="m.currentStep >= 1" class="step-section">
        <div class="step-header">
          <span class="step-number">第一步</span>
          <span class="step-title">列归一化处理</span>
        </div>

        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">计算矩阵 A 每一列的元素之和 Sⱼ</span>
          </div>
          <div class="formula-box">
            <span class="formula">Sⱼ = ∑ᵢ₌₁ⁿ aᵢⱼ</span>
          </div>
          <div class="vector-grid">
            <div v-for="(s, j) in m.steps.Sj" :key="j" class="vector-item">
              <span class="vector-label">S{{ j + 1 }}</span>
              <span class="vector-value">{{ format(s) }}</span>
            </div>
          </div>
        </div>

        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">归一化矩阵 B (bᵢⱼ = aᵢⱼ / Sⱼ)</span>
          </div>
          <div class="scroll-table">
            <div v-for="(row, i) in m.steps.normMatrix" :key="i" class="matrix-row">
              <div v-for="(cell, j) in row" :key="j" class="matrix-cell">
                {{ format(cell) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="m.currentStep >= 2" class="step-section">
        <div class="step-header">
          <span class="step-number">第二步</span>
          <span class="step-title">行求和与权重计算（算术平均法）</span>
        </div>

        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">计算每一行的元素之和 W'ᵢ</span>
          </div>
          <div class="formula-box">
            <span class="formula">W'ᵢ = ∑ⱼ₌₁ⁿ bᵢⱼ</span>
          </div>
          <div class="vector-grid">
            <div v-for="(w, i) in m.steps.W_prime" :key="i" class="vector-item">
              <span class="vector-label">W'{{ i + 1 }}</span>
              <span class="vector-value">{{ format(w) }}</span>
            </div>
          </div>
        </div>

        <div class="calculation-card highlight-card">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">归一化得到最终权重 W (Wᵢ = W'ᵢ / n)</span>
          </div>
          <div class="vector-grid highlight-grid">
            <div v-for="(w, i) in m.steps.weights" :key="i" class="vector-item highlight-item">
              <span class="vector-label">W{{ i + 1 }}</span>
              <span class="vector-value highlight-value">{{ format(w) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="m.currentStep >= 3" class="step-section">
        <div class="step-header">
          <span class="step-number">第三步</span>
          <span class="step-title">计算最大特征值 λₘₐₓ</span>
        </div>

        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">计算向量 AW</span>
          </div>
          <div class="vector-grid">
            <div v-for="(aw, i) in m.steps.AW" :key="i" class="vector-item">
              <span class="vector-label">(AW){{ i + 1 }}</span>
              <span class="vector-value">{{ format(aw) }}</span>
            </div>
          </div>
        </div>

        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">计算比值向量 (AW)ᵢ / Wᵢ</span>
          </div>
          <div class="vector-grid">
            <div v-for="(ratio, i) in m.steps.AW_div_W" :key="i" class="vector-item">
              <span class="vector-value">{{ format(ratio) }}</span>
            </div>
          </div>
        </div>

        <div class="result-card">
          <div class="result-label">最大特征值 λₘₐₓ (比值平均值)</div>
          <div class="result-value">{{ format(m.steps.lambdaMax) }}</div>
        </div>
      </div>

      <div v-if="m.currentStep >= 4" class="step-section">
        <div class="step-header">
          <span class="step-number">第四步</span>
          <span class="step-title">一致性检验</span>
        </div>
        <div class="description-text">
          <div>判定准则：若 CR < 0.1，则一致性通过；否则需调整矩阵。</div>
        </div>

        <div class="ri-table-card">
          <div class="ri-table-header">附表：随机一致性指标 RI</div>
          <div class="ri-table">
            <div class="ri-row header">
              <div class="ri-cell">阶数 n</div>
              <div class="ri-cell" v-for="n in 15" :key="n">{{ n }}</div>
            </div>
            <div class="ri-row">
              <div class="ri-cell header">RI 值</div>
              <div class="ri-cell">0.00</div>
              <div class="ri-cell">0.00</div>
              <div class="ri-cell">0.58</div>
              <div class="ri-cell">0.90</div>
              <div class="ri-cell">1.12</div>
              <div class="ri-cell">1.24</div>
              <div class="ri-cell">1.32</div>
              <div class="ri-cell">1.41</div>
              <div class="ri-cell">1.45</div>
              <div class="ri-cell">1.49</div>
              <div class="ri-cell">1.51</div>
              <div class="ri-cell">1.54</div>
              <div class="ri-cell">1.56</div>
              <div class="ri-cell">1.58</div>
              <div class="ri-cell">1.59</div>
            </div>
          </div>
        </div>

        <div class="consistency-card">
          <div class="consistency-grid">
            <div class="consistency-item">
              <span class="label">指标 CI</span>
              <span class="value">{{ format(m.steps.CI) }}</span>
            </div>
            <div class="consistency-item">
              <span class="label">指标 RI</span>
              <span class="value">{{ format(m.steps.RI) }}</span>
            </div>
            <div class="consistency-item">
              <span class="label">比率 CR</span>
              <span class="value">{{ format(m.steps.CR) }}</span>
            </div>
          </div>

          <div class="final-verdict" :class="{ 'pass': m.steps.isConsistent, 'fail': !m.steps.isConsistent }">
            <span class="icon">{{ m.steps.isConsistent ? '✅' : '❌' }}</span>
            <span class="verdict-text">
              判定结论：CR = {{ format(m.steps.CR) }} {{ m.steps.isConsistent ? '＜ 0.1，一致性检验通过' : '≥ 0.1，一致性检验未通过' }}
            </span>
          </div>
        </div>
      </div>

      <button
          v-if="m.currentStep < 4"
          class="btn-primary full-width"
          @click="calcNext(m)"
      >
        下一步
      </button>
    </div>

    <!-- 最终结果表格 -->
    <div v-if="allMatricesCalculated && finalRanking.length > 0" class="section-card">
      <div class="section-header">
        <span class="step-badge">④</span>
        <span class="section-title">最终权重排序</span>
      </div>
      <div class="description-text">
        <div>总排序权重 = 准则层权重 × 指标层权重（局部）</div>
        <div v-if="matrices.length > 0 && matrices[0].header.length > 0" class="header-info">
          准则层表头: {{ matrices[0].header.join(', ') }}
        </div>
        <div v-if="matrices.length > 1 && matrices[1].header.length > 0" class="header-info">
          指标层表头: {{ matrices[1].header.join(', ') }}
        </div>
      </div>

      <div class="final-table">
        <div class="final-table-header">
          <div class="th-col">准则层</div>
          <div class="th-col">准则层权重</div>
          <div class="th-col">指标层</div>
          <div class="th-col">指标层权重（局部）</div>
          <div class="th-col">总排序权重</div>
        </div>

        <div class="final-table-body">
          <div
            v-for="(item, index) in finalRanking"
            :key="index"
            class="final-table-row"
            :class="{ 'highlight-row': index === 0 }"
          >
            <div class="td-col">{{ item.criterion }}</div>
            <div class="td-col">{{ format(item.criterionWeight) }}</div>
            <div class="td-col">{{ item.indicator }}</div>
            <div class="td-col">{{ format(item.indicatorWeight) }}</div>
            <div class="td-col weight-value">{{ (item.totalWeight * 100).toFixed(2) }}%</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import * as XLSX from 'xlsx'
import {
  stepNormalize,
  stepWeights,
  stepAW,
  stepConsistency,
  calculateNextStep
} from './AHP.js'

import { ref, computed } from 'vue'

const file = ref(null)
const fileName = ref('')
const matrices = ref([])

// 计算所有矩阵是否已完成计算
const allMatricesCalculated = computed(() => {
  return matrices.value.length > 0 && matrices.value.every(m => m.currentStep >= 4)
})

// 计算最终排名
const finalRanking = computed(() => {
  if (!allMatricesCalculated.value) return []

  const result = []
  const criteriaMatrix = matrices.value[0] // 第一个矩阵是准则层

  // 遍历每个准则层
  for (let i = 0; i < criteriaMatrix.steps.weights.length; i++) {
    // 从准则层表头获取准则名称，如果没有表头则使用默认名称
    const criterionName = criteriaMatrix.header && criteriaMatrix.header[i] 
      ? criteriaMatrix.header[i] 
      : `${criteriaMatrix.name}_${i + 1}`
    const criterionWeight = criteriaMatrix.steps.weights[i]

    // 找到对应的指标层矩阵（从第二个矩阵开始）
    const indicatorMatrix = matrices.value[i + 1]
    if (indicatorMatrix && indicatorMatrix.steps.weights) {
      // 遍历该准则下的所有指标
      for (let j = 0; j < indicatorMatrix.steps.weights.length; j++) {
        // 从指标层表头获取指标名称，如果没有表头则使用默认名称
        const indicatorName = indicatorMatrix.header && indicatorMatrix.header[j] 
          ? indicatorMatrix.header[j] 
          : `${indicatorMatrix.name}_${j + 1}`
        const indicatorWeight = indicatorMatrix.steps.weights[j]
        const totalWeight = criterionWeight * indicatorWeight

        result.push({
          target: '总目标',
          criterion: criterionName,
          criterionWeight: criterionWeight,
          indicator: indicatorName,
          indicatorWeight: indicatorWeight,
          totalWeight: totalWeight
        })
      }
    }
  }

  // 按总排序权重降序排序
  return result.sort((a, b) => b.totalWeight - a.totalWeight)
})

// 格式化函数：保留5位小数，四舍五入
function format(val) {
  if (typeof val !== 'number') return val
  return val.toFixed(5)
}

function chooseFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx'
  input.onchange = e => {
    if(e.target.files[0]){
      file.value = e.target.files[0]
      fileName.value = file.value.name
    }
  }
  input.click()
}

async function parseExcel() {
  if(!file.value) return
  const buffer = await file.value.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  matrices.value = wb.SheetNames.map((name, i) => {
    const rawData = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 })
    
    console.log(`${name} 原始数据:`, rawData)
    
    // 第一行是表头，提取表头信息
    const header = rawData.length > 0 ? rawData[0] : []
    
    // 跳过第一行（表头），从第二行开始处理数据
    const dataWithoutHeader = rawData.slice(1)
    
    // 过滤空行，并将每个元素转换为数字
    const data = dataWithoutHeader
      .filter(row => row.length > 0) // 过滤空行
      .map(row => 
        row.map(cell => {
          const num = Number(cell)
          if (isNaN(num)) {
            console.warn(`${name} - 无法转换为数字的单元格:`, cell)
          }
          return num
        })
      )
    
    console.log(`${name} 处理后的矩阵:`, data)
    console.log(`${name} 矩阵维度: ${data.length} x ${data[0]?.length || 0}`)
    console.log(`${name} 表头:`, header)

    return {
      name,
      type: i === 0 ? '准则层' : '方案层',
      matrix: data,
      header: header,  // 保存表头信息
      steps: {},
      currentStep: 0
    }
  })
}

function nextStep() {
  // 仅进入计算流程，实际逻辑可在此扩展
}

function calcNext(m) {
  calculateNextStep(m)
}

// 全部展开 - 自动执行所有计算步骤
function expandAll() {
  if (!matrices.value.length) return
  
  // 对每个矩阵执行所有步骤
  matrices.value.forEach(m => {
    // 重置当前步骤
    m.currentStep = 0
    
    // 执行步骤1-4
    while (m.currentStep < 4) {
      calculateNextStep(m)
    }
  })
  
  console.log('全部展开完成，所有矩阵已计算完毕')
}
</script>

<style scoped>
/* 主容器 */
.ahp-container {
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
}

.header-info {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
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

/* 矩阵预览 */
.matrix-preview {
  margin-bottom: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
}

.matrix-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.matrix-name {
  font-weight: 700;
  color: #111827;
  font-size: 1.05rem;
}

.matrix-type {
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

.matrix-cell {
  flex: 1;
  min-width: 60px;
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

.calculation-card.highlight-card {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
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
  margin-bottom: 0.75rem;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.formula {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

/* 向量网格 */
.vector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.vector-grid.highlight-grid {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.05));
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.vector-item {
  background: #f9fafb;
  padding: 0.625rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.vector-item.highlight-item {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.vector-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}

.vector-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
}

.vector-item.highlight-item .vector-value {
  color: #2563eb;
  font-size: 1rem;
}

/* 结果卡片 */
.result-card {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 1.25rem;
  border-radius: 10px;
  text-align: center;
  margin-top: 0.75rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.result-label {
  font-size: 0.875rem;
  opacity: 0.95;
  margin-bottom: 0.5rem;
  display: block;
}

.result-value {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* RI表格卡片 */
.ri-table-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #e5e7eb;
}

.ri-table-header {
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  text-align: center;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.ri-table {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.ri-row {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
}

.ri-row:last-child {
  border-bottom: none;
}

.ri-cell {
  flex: 1;
  min-width: 45px;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  border-right: 1px solid #f3f4f6;
}

.ri-cell:last-child {
  border-right: none;
}

.ri-cell.header {
  background: #f9fafb;
  font-weight: 700;
  color: #111827;
}

/* 一致性结果卡片 */
.consistency-card {
  background: #f9fafb;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 0.75rem;
  border: 1px solid #e5e7eb;
}

.consistency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.consistency-item {
  background: white;
  padding: 0.875rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.consistency-item .label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.375rem;
}

.consistency-item .value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

/* 最终判定 */
.final-verdict {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
}

.final-verdict.pass {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.final-verdict.fail {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.final-verdict .icon {
  font-size: 1.25rem;
}

/* 最终结果表格 */
.final-table {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-top: 1rem;
}

.final-table-header {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr 1fr 1fr;
  background: linear-gradient(135deg, #1f2937, #111827);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.th-col {
  padding: 0.875rem 0.75rem;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.th-col:last-child {
  border-right: none;
}

.final-table-body {
  max-height: 400px;
  overflow-y: auto;
}

.final-table-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr 1fr 1fr;
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s ease;
}

.final-table-row:last-child {
  border-bottom: none;
}

.final-table-row:hover {
  background: #f9fafb;
}

.final-table-row.highlight-row {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  font-weight: 700;
}

.td-col {
  padding: 0.5rem 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weight-value {
  font-weight: 800;
  color: #2563eb;
  font-size: 1rem;
}

.final-table-row.highlight-row .weight-value {
  color: #1e40af;
  font-size: 1.125rem;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .ahp-container {
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
  
  .header-info {
    color: #9ca3af;
  }
  
  .matrix-preview {
    background: #374151;
    border-color: #4b5563;
  }
  
  .matrix-name {
    color: #f9fafb;
  }
  
  .matrix-type {
    background: #4b5563;
    color: #e5e7eb;
  }
  
  .scroll-table,
  .final-table {
    background: #374151;
    border-color: #4b5563;
  }
  
  .matrix-row {
    border-color: #4b5563;
  }
  
  .matrix-cell {
    background: #374151;
    color: #e5e7eb;
    border-color: #4b5563;
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
  
  .calculation-card.highlight-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
    border-color: #60a5fa;
  }
  
  .formula-box {
    background: #4b5563;
    border-color: #6b7280;
  }
  
  .formula {
    color: #f9fafb;
  }
  
  .vector-item {
    background: #374151;
    border-color: #4b5563;
  }
  
  .vector-item.highlight-item {
    background: #1f2937;
    border-color: #60a5fa;
  }
  
  .vector-label {
    color: #9ca3af;
  }
  
  .vector-value {
    color: #f9fafb;
  }
  
  .result-card {
    background: linear-gradient(135deg, #059669, #047857);
  }
  
  .ri-table-card {
    background: #374151;
    border-color: #4b5563;
  }
  
  .ri-table-header {
    background: #4b5563;
    color: #f9fafb;
  }
  
  .ri-table {
    border-color: #4b5563;
  }
  
  .ri-row {
    border-color: #4b5563;
  }
  
  .ri-cell {
    background: #374151;
    color: #e5e7eb;
    border-color: #4b5563;
  }
  
  .ri-cell.header {
    background: #4b5563;
    color: #f9fafb;
  }
  
  .consistency-card {
    background: #374151;
    border-color: #4b5563;
  }
  
  .consistency-item {
    background: #1f2937;
    border-color: #4b5563;
  }
  
  .consistency-item .label {
    color: #9ca3af;
  }
  
  .consistency-item .value {
    color: #f9fafb;
  }
  
  .final-verdict.pass {
    background: #064e3b;
    color: #a7f3d0;
    border-color: #059669;
  }
  
  .final-verdict.fail {
    background: #7f1d1d;
    color: #fecaca;
    border-color: #dc2626;
  }
  
  .final-table-header {
    background: linear-gradient(135deg, #374151, #1f2937);
  }
  
  .final-table-row {
    border-color: #4b5563;
  }
  
  .final-table-row:hover {
    background: #374151;
  }
  
  .final-table-row.highlight-row {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
  }
  
  .td-col {
    color: #e5e7eb;
  }
  
  .weight-value {
    color: #93c5fd;
  }
  
  .final-table-row.highlight-row .weight-value {
    color: #bfdbfe;
  }
}
</style>
