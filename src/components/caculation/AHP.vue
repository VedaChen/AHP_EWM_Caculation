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
/* 主容器 - 玻璃拟态风格 */
.ahp-container {
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

.header-info {
  color: var(--gray-500);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
  font-style: italic;
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

/* 矩阵预览 */
.matrix-preview {
  margin-bottom: var(--space-6);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.matrix-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
}

.matrix-name {
  font-weight: 700;
  color: var(--gray-900);
  font-size: var(--text-lg);
}

.matrix-type {
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

.matrix-cell {
  flex: 1;
  min-width: 60px;
  padding: var(--space-2);
  text-align: center;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--gray-700);
  border-right: 1px solid var(--gray-200);
  background: var(--card-bg);
}

.matrix-cell:last-child {
  border-right: none;
}

.matrix-row:hover .matrix-cell {
  background: var(--gray-50);
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

.calculation-card.highlight-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border-color: var(--primary-400);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
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
  margin-bottom: var(--space-3);
  text-align: center;
  border: 1px solid var(--gray-200);
  backdrop-filter: blur(3px);
}

.formula {
  font-family: 'Courier New', monospace;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--gray-900);
}

/* 向量网格 */
.vector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-2);
}

.vector-grid.highlight-grid {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.05));
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--primary-200);
}

.vector-item {
  background: var(--card-bg);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  backdrop-filter: blur(3px);
}

.vector-item.highlight-item {
  background: var(--card-bg-hover);
  border-color: var(--primary-500);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.vector-label {
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-weight: 600;
}

.vector-value {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--gray-900);
}

.vector-item.highlight-item .vector-value {
  color: var(--primary-600);
  font-size: var(--text-base);
}

/* 结果卡片 */
.result-card {
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  text-align: center;
  margin-top: var(--space-3);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  backdrop-filter: blur(5px);
}

.result-label {
  font-size: var(--text-sm);
  opacity: 0.95;
  margin-bottom: var(--space-2);
  display: block;
}

.result-value {
  font-size: var(--text-3xl);
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* RI表格卡片 */
.ri-table-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin: var(--space-4) 0;
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.ri-table-header {
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  text-align: center;
  padding: var(--space-2);
  background: var(--gray-100);
  border-radius: var(--radius-md);
}

.ri-table {
  overflow-x: auto;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}

.ri-row {
  display: flex;
  border-bottom: 1px solid var(--gray-200);
}

.ri-row:last-child {
  border-bottom: none;
}

.ri-cell {
  flex: 1;
  min-width: 45px;
  padding: var(--space-2);
  text-align: center;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--gray-700);
  border-right: 1px solid var(--gray-200);
  background: var(--card-bg);
}

.ri-cell:last-child {
  border-right: none;
}

.ri-cell.header {
  background: var(--gray-50);
  font-weight: 700;
  color: var(--gray-900);
}

.ri-row:hover .ri-cell {
  background: var(--gray-50);
}

/* 一致性结果卡片 */
.consistency-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-top: var(--space-3);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.consistency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.consistency-item {
  background: var(--card-bg-hover);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  text-align: center;
  backdrop-filter: blur(3px);
}

.consistency-item .label {
  display: block;
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.consistency-item .value {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--gray-900);
}

/* 最终判定 */
.final-verdict {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: var(--text-sm);
  backdrop-filter: blur(5px);
}

.final-verdict.pass {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
  color: var(--success-600);
  border: 1px solid var(--success-500);
}

.final-verdict.fail {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
  color: var(--danger-600);
  border: 1px solid var(--danger-500);
}

.final-verdict .icon {
  font-size: var(--text-xl);
}

/* 最终结果表格 */
.final-table {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--card-border);
  margin-top: var(--space-4);
  backdrop-filter: blur(5px);
}

.final-table-header {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr 1fr 1fr;
  background: linear-gradient(135deg, var(--gray-800), var(--gray-900));
  color: white;
  font-weight: 700;
  font-size: var(--text-sm);
}

.th-col {
  padding: var(--space-3) var(--space-3);
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
  padding: var(--space-3);
  border-bottom: 1px solid var(--gray-200);
  transition: background var(--duration-normal) ease;
}

.final-table-row:last-child {
  border-bottom: none;
}

.final-table-row:hover {
  background: var(--gray-50);
}

.final-table-row.highlight-row {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
  font-weight: 700;
}

.td-col {
  padding: var(--space-2) var(--space-3);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--gray-700);
  display: flex;
  align-items: center;
  justify-content: center;
}

.weight-value {
  font-weight: 800;
  color: var(--primary-600);
  font-size: var(--text-base);
}

.final-table-row.highlight-row .weight-value {
  color: var(--primary-800);
  font-size: var(--text-lg);
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .ahp-container {
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

  .header-info {
    color: var(--gray-400);
  }

  .matrix-preview {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .matrix-name {
    color: var(--dark-text-primary);
  }

  .matrix-type {
    background: var(--gray-700);
    color: var(--dark-text-secondary);
  }

  .scroll-table,
  .final-table {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .matrix-row {
    border-color: var(--gray-700);
  }

  .matrix-cell {
    background: var(--dark-card-bg);
    color: var(--dark-text-secondary);
    border-color: var(--gray-700);
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

  .calculation-card.highlight-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
    border-color: var(--primary-400);
  }

  .formula-box {
    background: var(--gray-800);
    border-color: var(--gray-700);
  }

  .formula {
    color: var(--dark-text-primary);
  }

  .vector-item {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .vector-item.highlight-item {
    background: var(--gray-800);
    border-color: var(--primary-400);
  }

  .vector-label {
    color: var(--gray-400);
  }

  .vector-value {
    color: var(--dark-text-primary);
  }

  .result-card {
    background: linear-gradient(135deg, var(--success-600), #047857);
  }

  .ri-table-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .ri-table-header {
    background: var(--gray-700);
    color: var(--dark-text-primary);
  }

  .ri-table {
    border-color: var(--gray-700);
  }

  .ri-row {
    border-color: var(--gray-700);
  }

  .ri-cell {
    background: var(--dark-card-bg);
    color: var(--dark-text-secondary);
    border-color: var(--gray-700);
  }

  .ri-cell.header {
    background: var(--gray-800);
    color: var(--dark-text-primary);
  }

  .ri-row:hover .ri-cell {
    background: rgba(55, 65, 81, 0.6);
  }

  .consistency-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .consistency-item {
    background: var(--gray-800);
    border-color: var(--dark-card-border);
  }

  .consistency-item .label {
    color: var(--gray-400);
  }

  .consistency-item .value {
    color: var(--dark-text-primary);
  }

  .final-verdict.pass {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
    color: var(--success-300);
    border-color: var(--success-500);
  }

  .final-verdict.fail {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
    color: var(--danger-300);
    border-color: var(--danger-500);
  }

  .final-table-header {
    background: linear-gradient(135deg, var(--gray-700), var(--gray-800));
  }

  .final-table-row {
    border-color: var(--gray-700);
  }

  .final-table-row:hover {
    background: rgba(55, 65, 81, 0.6);
  }

  .final-table-row.highlight-row {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.25));
  }

  .td-col {
    color: var(--dark-text-secondary);
  }

  .weight-value {
    color: var(--primary-300);
  }

  .final-table-row.highlight-row .weight-value {
    color: var(--primary-200);
  }
}
</style>
