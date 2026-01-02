<template>
  <div class="fusion-container">

    <!-- ============ AHP 部分 ============ -->
    <div class="section-card">
      <div class="section-header">
        <span class="step-badge">①</span>
        <span class="section-title">AHP 权重计算</span>
      </div>
      <div class="description-text">
        <div>上传 Excel 文件并计算 AHP 权重</div>
        <div class="highlight-text">格式：Sheet1=准则层，Sheet2+=各指标层判断矩阵</div>
      </div>
      <div class="action-area">
        <button class="btn-primary" @click="chooseAHPFile">选择文件</button>
        <button v-if="ahpFile" class="btn-success" @click="parseAndCalculateAHP">直接计算</button>
        <button v-if="ahpFile" class="btn-secondary" @click="parseAndShowAHPDetails">查看详细过程</button>
      </div>
      <div v-if="ahpFileName" class="file-info">
        <span class="file-label">AHP文件：</span>
        <span class="file-name">{{ ahpFileName }}</span>
      </div>
    </div>

    <!-- AHP 最终结果表格（直接计算模式） -->
    <div v-if="ahpTotalWeights.length > 0 && !showAHPDetails" class="section-card">
      <div class="section-header">
        <span class="step-badge">②</span>
        <span class="section-title">AHP 权重结果</span>
      </div>
      <div class="final-result-table">
        <div class="final-table-header">
          <div class="th-col">指标</div>
          <div class="th-col">权重</div>
          <div class="th-col">百分比</div>
        </div>
        <div v-for="(item, i) in ahpTotalWeights" :key="i" class="final-table-row">
          <div class="td-col">{{ item.indicator }}</div>
          <div class="td-col">{{ format(item.weight) }}</div>
          <div class="td-col">{{ (item.weight * 100).toFixed(2) }}%</div>
        </div>
      </div>
    </div>

    <!-- AHP 详细计算过程（查看详细过程模式） -->
    <div v-if="showAHPDetails && ahpMatrices.length > 0" class="section-card">
      <div class="section-header">
        <span class="step-badge">②</span>
        <span class="section-title">AHP 详细计算过程</span>
      </div>
      
      <!-- 判断矩阵确认 -->
      <div v-if="ahpMatrices.length > 0" class="step-section">
        <div class="step-header">
          <span class="step-number">矩阵</span>
          <span class="step-title">判断矩阵</span>
        </div>
        <div v-for="m in ahpMatrices" :key="m.name" class="matrix-card">
          <div class="matrix-header">
            <span class="matrix-name">{{ m.name }}</span>
            <span class="matrix-type">{{ m.type }}</span>
          </div>
          <div class="data-table-wrapper">
            <div class="data-table">
              <div class="data-row header">
                <div class="data-cell th">指标</div>
                <div v-for="(col, j) in m.header" :key="j" class="data-cell th">
                  {{ col }}
                </div>
              </div>
              <div v-for="(row, i) in m.matrix" :key="i" class="data-row">
                <div class="data-cell th">{{ m.header[i] || `行${i+1}` }}</div>
                <div v-for="(cell, j) in row" :key="j" class="data-cell">
                  {{ format(cell) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细计算步骤 -->
      <div v-for="m in ahpMatrices" :key="m.name" class="step-section">
        <div class="step-header">
          <span class="step-number">{{ m.name }}</span>
          <span class="step-title">计算过程</span>
        </div>

        <!-- 第一步：列归一化 -->
        <div v-if="m.currentStep >= 1" class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">第一步</span>
            <span class="calc-title">列归一化处理</span>
          </div>
          
          <!-- 列和计算 -->
          <div class="summary-box">
            <div class="summary-title">各列元素之和 Sⱼ</div>
            <div class="summary-grid">
              <div v-for="(s, j) in m.steps.Sj" :key="j" class="summary-item">
                <span class="summary-label">S{{ j + 1 }}</span>
                <span class="summary-value">{{ format(s) }}</span>
                <span class="summary-sub">{{ m.header[j] || `列${j+1}` }}</span>
              </div>
            </div>
          </div>

          <!-- 归一化矩阵 -->
          <div class="summary-box">
            <div class="summary-title">归一化矩阵 B (bᵢⱼ = aᵢⱼ / Sⱼ)</div>
            <div class="data-table-wrapper">
              <div class="data-table">
                <div class="data-row header">
                  <div class="data-cell th">指标</div>
                  <div v-for="(col, j) in m.header" :key="j" class="data-cell th">
                    {{ col }}
                  </div>
                </div>
                <div v-for="(row, i) in m.steps.normMatrix" :key="i" class="data-row">
                  <div class="data-cell th">{{ m.header[i] || `行${i+1}` }}</div>
                  <div v-for="(cell, j) in row" :key="j" class="data-cell">
                    {{ format(cell) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 第二步：权重计算 -->
        <div v-if="m.currentStep >= 2" class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">第二步</span>
            <span class="calc-title">行求和与权重计算</span>
          </div>
          
          <!-- 行求和 -->
          <div class="summary-box">
            <div class="summary-title">每行元素之和 W'ᵢ</div>
            <div class="summary-grid">
              <div v-for="(w, i) in m.steps.W_prime" :key="i" class="summary-item">
                <span class="summary-label">W'{{ i + 1 }}</span>
                <span class="summary-value">{{ format(w) }}</span>
                <span class="summary-sub">{{ m.header[i] || `行${i+1}` }}</span>
              </div>
            </div>
          </div>

          <!-- 最终权重 -->
          <div class="summary-box highlight-box">
            <div class="summary-title">最终权重 W (Wᵢ = W'ᵢ / n)</div>
            <div class="summary-grid">
              <div v-for="(w, i) in m.steps.weights" :key="i" class="summary-item highlight-item">
                <span class="summary-label">W{{ i + 1 }}</span>
                <span class="summary-value highlight-value">{{ format(w) }}</span>
                <span class="summary-sub">{{ m.header[i] || `行${i+1}` }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 第三步：最大特征值 -->
        <div v-if="m.currentStep >= 3" class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">第三步</span>
            <span class="calc-title">计算最大特征值 λₘₐₓ</span>
          </div>
          
          <!-- AW向量 -->
          <div class="summary-box">
            <div class="summary-title">向量 AW</div>
            <div class="summary-grid">
              <div v-for="(aw, i) in m.steps.AW" :key="i" class="summary-item">
                <span class="summary-label">(AW){{ i + 1 }}</span>
                <span class="summary-value">{{ format(aw) }}</span>
              </div>
            </div>
          </div>

          <!-- 比值向量 -->
          <div class="summary-box">
            <div class="summary-title">比值向量 (AW)ᵢ / Wᵢ</div>
            <div class="summary-grid">
              <div v-for="(ratio, i) in m.steps.AW_div_W" :key="i" class="summary-item">
                <span class="summary-label">比值 {{ i + 1 }}</span>
                <span class="summary-value">{{ format(ratio) }}</span>
              </div>
            </div>
          </div>

          <!-- 最大特征值结果 -->
          <div class="result-card">
            <div class="result-label">最大特征值 λₘₐₓ (比值平均值)</div>
            <div class="result-value">{{ format(m.steps.lambdaMax) }}</div>
          </div>
        </div>

        <!-- 第四步：一致性检验 -->
        <div v-if="m.currentStep >= 4" class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">第四步</span>
            <span class="calc-title">一致性检验</span>
          </div>
          
          <!-- 检验指标 -->
          <div class="consistency-grid">
            <div class="consistency-item">
              <span class="consistency-label">一致性指标 CI</span>
              <span class="consistency-value">{{ format(m.steps.CI) }}</span>
            </div>
            <div class="consistency-item">
              <span class="consistency-label">平均随机一致性指标 RI</span>
              <span class="consistency-value">{{ format(m.steps.RI) }}</span>
            </div>
            <div class="consistency-item">
              <span class="consistency-label">一致性比率 CR</span>
              <span class="consistency-value">{{ format(m.steps.CR) }}</span>
            </div>
          </div>

          <!-- 检验结论 -->
          <div class="verdict-card" :class="{ 'pass': m.steps.isConsistent, 'fail': !m.steps.isConsistent }">
            <span class="verdict-icon">{{ m.steps.isConsistent ? '✅' : '❌' }}</span>
            <div class="verdict-content">
              <div class="verdict-title">检验结论</div>
              <div class="verdict-text">
                CR = {{ format(m.steps.CR) }} {{ m.steps.isConsistent ? '< 0.1' : '≥ 0.1' }}
              </div>
              <div class="verdict-text">
                {{ m.steps.isConsistent ? '一致性检验通过，判断矩阵有效' : '一致性检验未通过，请调整判断矩阵' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AHP 最终权重排序 -->
      <div v-if="ahpFinalRanking.length > 0" class="step-section">
        <div class="step-header">
          <span class="step-number">结果</span>
          <span class="step-title">最终权重排序</span>
        </div>
        <div class="final-result-table">
          <div class="final-table-header">
            <div class="th-col">准则层</div>
            <div class="th-col">准则权重</div>
            <div class="th-col">指标层</div>
            <div class="th-col">指标权重</div>
            <div class="th-col">总权重</div>
          </div>
          <div v-for="(item, index) in ahpFinalRanking" :key="index" class="final-table-row">
            <div class="td-col">{{ item.criterion }}</div>
            <div class="td-col">{{ format(item.criterionWeight) }}</div>
            <div class="td-col">{{ item.indicator }}</div>
            <div class="td-col">{{ format(item.indicatorWeight) }}</div>
            <div class="td-col weight-col">{{ (item.totalWeight * 100).toFixed(2) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 熵值法部分 ============ -->
    <div class="section-card">
      <div class="section-header">
        <span class="step-badge">③</span>
        <span class="section-title">熵值法权重计算</span>
      </div>
      <div class="description-text">
        <div>上传 Excel 文件并计算熵值法权重</div>
        <div class="highlight-text">Sheet1：历史数据（样本+指标值）</div>
        <div class="highlight-text">Sheet2：指标说明（名称+正向/负向）</div>
      </div>
      <div class="action-area">
        <button class="btn-primary" @click="chooseEntropyFile">选择文件</button>
        <button v-if="entropyFile" class="btn-success" @click="parseAndCalculateEntropy">直接计算</button>
        <button v-if="entropyFile" class="btn-secondary" @click="parseAndShowEntropyDetails">查看详细过程</button>
      </div>
      <div v-if="entropyFileName" class="file-info">
        <span class="file-label">熵值文件：</span>
        <span class="file-name">{{ entropyFileName }}</span>
      </div>
      <div v-if="entropyErrorMsg" class="error-card">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ entropyErrorMsg }}</span>
      </div>
    </div>

    <!-- 熵值法最终结果表格（直接计算模式） -->
    <div v-if="entropyWeights.length > 0 && !showEntropyDetails" class="section-card">
      <div class="section-header">
        <span class="step-badge">④</span>
        <span class="section-title">熵值法权重结果</span>
      </div>
      <div class="final-result-table">
        <div class="final-table-header">
          <div class="th-col">排名</div>
          <div class="th-col">指标</div>
          <div class="th-col">权重</div>
          <div class="th-col">百分比</div>
        </div>
        <div v-for="(item, i) in entropyWeights" :key="i" class="final-table-row">
          <div class="td-col">{{ item.rank }}</div>
          <div class="td-col">{{ item.name }}</div>
          <div class="td-col">{{ format(item.weight) }}</div>
          <div class="td-col">{{ item.percentage }}</div>
        </div>
      </div>
    </div>

    <!-- 熵值法详细计算过程（查看详细过程模式） -->
    <div v-if="showEntropyDetails && entropyDataDetails" class="section-card">
      <div class="section-header">
        <span class="step-badge">④</span>
        <span class="section-title">熵值法详细计算过程</span>
      </div>

      <!-- 原始数据矩阵 -->
      <div class="step-section">
        <div class="step-header">
          <span class="step-number">原始</span>
          <span class="step-title">原始数据矩阵</span>
        </div>
        <div class="data-table-wrapper">
          <div class="data-table">
            <div class="data-row header">
              <div class="data-cell th">样本 \ 指标</div>
              <div v-for="ind in entropyDataDetails.indicators" :key="ind.name" class="data-cell th">
                {{ ind.name }}
              </div>
            </div>
            <div v-for="(row, i) in entropyDataDetails.rawMatrix" :key="i" class="data-row">
              <div class="data-cell th">{{ entropyDataDetails.sampleNames[i] }}</div>
              <div v-for="(val, j) in row" :key="j" class="data-cell">
                {{ format(val) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第一步：标准化 -->
      <div class="step-section">
        <div class="step-header">
          <span class="step-number">第一步</span>
          <span class="step-title">极差标准化与非负平移</span>
        </div>
        
        <!-- 极差标准化 -->
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">极差标准化结果</span>
          </div>
          <div class="data-table-wrapper">
            <div class="data-table">
              <div class="data-row header">
                <div class="data-cell th">样本 \ 指标</div>
                <div v-for="ind in entropyDataDetails.indicators" :key="ind.name" class="data-cell th">
                  {{ ind.name }}
                </div>
              </div>
              <div v-for="(row, i) in entropyDataDetails.steps.normalizedMatrix" :key="i" class="data-row">
                <div class="data-cell th">{{ entropyDataDetails.sampleNames[i] }}</div>
                <div v-for="(val, j) in row" :key="j" class="data-cell">
                  {{ format(val) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 非负平移 -->
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">非负平移结果</span>
          </div>
          <div class="formula-box">
            <span class="formula">x''ᵢⱼ = x'ᵢⱼ + {{ EPSILON }}</span>
          </div>
          <div class="data-table-wrapper">
            <div class="data-table">
              <div class="data-row header">
                <div class="data-cell th">样本 \ 指标</div>
                <div v-for="ind in entropyDataDetails.indicators" :key="ind.name" class="data-cell th">
                  {{ ind.name }}
                </div>
              </div>
              <div v-for="(row, i) in entropyDataDetails.steps.stdMatrix" :key="i" class="data-row">
                <div class="data-cell th">{{ entropyDataDetails.sampleNames[i] }}</div>
                <div v-for="(val, j) in row" :key="j" class="data-cell">
                  {{ format(val) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二步：概率矩阵 -->
      <div v-if="entropyDataDetails.currentStep >= 2" class="step-section">
        <div class="step-header">
          <span class="step-number">第二步</span>
          <span class="step-title">计算特征比重 (概率矩阵)</span>
        </div>
        
        <!-- 各列之和 -->
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">各列(指标)之和 Sⱼ</span>
          </div>
          <div class="summary-grid">
            <div v-for="(sum, j) in entropyDataDetails.steps.colSums" :key="j" class="summary-item">
              <span class="summary-label">S{{ j + 1 }}</span>
              <span class="summary-value">{{ format(sum) }}</span>
              <span class="summary-sub">{{ entropyDataDetails.indicators[j].name }}</span>
            </div>
          </div>
        </div>

        <!-- 概率矩阵 -->
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">概率矩阵 Pᵢⱼ = x''ᵢⱼ / Sⱼ</span>
          </div>
          <div class="data-table-wrapper">
            <div class="data-table">
              <div class="data-row header">
                <div class="data-cell th">样本</div>
                <div v-for="ind in entropyDataDetails.indicators" :key="ind.name" class="data-cell th">
                  {{ ind.name }}
                </div>
              </div>
              <div v-for="(row, i) in entropyDataDetails.steps.pMatrix" :key="i" class="data-row">
                <div class="data-cell th">{{ entropyDataDetails.sampleNames[i] }}</div>
                <div v-for="(val, j) in row" :key="j" class="data-cell">
                  {{ format(val) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三步：信息熵 -->
      <div v-if="entropyDataDetails.currentStep >= 3" class="step-section">
        <div class="step-header">
          <span class="step-number">第三步</span>
          <span class="step-title">计算信息熵 Eⱼ</span>
        </div>
        
        <!-- 计算公式 -->
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">计算系数 k 和信息熵</span>
          </div>
          <div class="formula-box">
            <span class="formula">k = -1/ln({{ entropyDataDetails.n }}) ≈ {{ format(Math.abs(entropyDataDetails.steps.k)) }}</span>
            <span class="formula">Eⱼ = -k ∑ pᵢⱼ ln(pᵢⱼ)</span>
          </div>
        </div>

        <!-- 信息熵结果 -->
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">各指标信息熵计算结果</span>
          </div>
          <div class="summary-grid">
            <div v-for="(eVal, j) in entropyDataDetails.steps.E_list" :key="j" class="summary-item">
              <span class="summary-label">{{ entropyDataDetails.indicators[j].name }}</span>
              <span class="summary-value">E{{ j + 1 }} = {{ format(eVal) }}</span>
              <span class="summary-sub">d{{ j + 1 }} = {{ format(1 - eVal) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 第四步：权重计算 -->
      <div v-if="entropyDataDetails.currentStep >= 4" class="step-section">
        <div class="step-header">
          <span class="step-number">第四步</span>
          <span class="step-title">计算最终权重 Wⱼ</span>
        </div>
        
        <!-- 差异系数与权重 -->
        <div class="calculation-card">
          <div class="calc-header">
            <span class="calc-badge">1</span>
            <span class="calc-title">差异系数与权重计算</span>
          </div>
          <div class="formula-box">
            <span class="formula">wⱼ = dⱼ / ∑ dⱼ</span>
          </div>
          <div class="summary-box">
            <div class="summary-row">
              <span class="summary-label">冗余度总和 ∑ dⱼ</span>
              <span class="summary-value">{{ format(entropyDataDetails.steps.sumD) }}</span>
            </div>
          </div>
        </div>

        <!-- 最终权重排序 -->
        <div class="calculation-card highlight-card">
          <div class="calc-header">
            <span class="calc-badge">2</span>
            <span class="calc-title">最终权重排序结果</span>
          </div>
          <div class="final-result-table">
            <div class="final-table-header">
              <div class="th-col">排名</div>
              <div class="th-col">指标名称</div>
              <div class="th-col">权重值</div>
              <div class="th-col">百分比</div>
            </div>
            <div v-for="(item, j) in entropyDataDetails.steps.sortedWeights" :key="j" class="final-table-row">
              <div class="td-col">{{ item.rank }}</div>
              <div class="td-col">{{ item.name }}</div>
              <div class="td-col weight-col">{{ format(item.weight) }}</div>
              <div class="td-col">{{ item.percentage }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 融合计算 ============ -->
    <div v-if="canFuse" class="section-card">
      <div class="section-header">
        <span class="step-badge">⑤</span>
        <span class="section-title">融合权重计算</span>
      </div>
      <div class="description-text">
        <div>α 控制主观（AHP）权重占比，默认 0.5</div>
        <div>调整滑块并点击"计算融合权重"按钮</div>
      </div>
      
      <!-- 滑块控制区域 -->
      <div class="slider-card">
        <div class="slider-header">
          <span class="slider-label">主观权重系数 α</span>
          <span class="slider-value">{{ alpha.toFixed(2) }}</span>
        </div>
        <div class="slider-container">
          <input 
            type="range" 
            :value="alpha * 100" 
            @input="onAlphaChange" 
            min="0" 
            max="100" 
            step="1"
            class="slider"
          />
          <div class="slider-marks">
            <span class="mark">客观 (0)</span>
            <span class="mark">平衡 (0.5)</span>
            <span class="mark">主观 (1)</span>
          </div>
        </div>
      </div>
      
      <div class="action-area">
        <button @click="calculateFusedResults" class="btn-primary full-width">计算融合权重</button>
      </div>
    </div>

    <!-- ============ 融合结果 ============ -->
    <div v-if="fusedResults.length > 0" class="section-card">
      <div class="section-header">
        <span class="step-badge">⑥</span>
        <span class="section-title">融合权重最终结果</span>
      </div>
      <div class="final-result-table">
        <div class="final-table-header">
          <div class="th-col">指标</div>
          <div class="th-col">AHP权重(%)</div>
          <div class="th-col">熵值权重(%)</div>
          <div class="th-col">融合权重(%)</div>
        </div>
        <div v-for="(item, idx) in fusedResults" :key="idx" class="final-table-row">
          <div class="td-col">{{ item.indicator }}</div>
          <div class="td-col">{{ (item.ahpWeight * 100).toFixed(2) }}%</div>
          <div class="td-col">{{ (item.entropyWeight * 100).toFixed(2) }}%</div>
          <div class="td-col weight-col">{{ (item.fusedWeight * 100).toFixed(2) }}%</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import {
  calculateNextStep as calcAHPStep,
  stepNormalize,
  stepWeights,
  stepAW,
  stepConsistency
} from './AHP.js'

import {
  parseAndMatch,
  calculateNextStep as calcEntropyStep,
  formatNum,
  EPSILON
} from './EWM.js'

// ========== AHP ==========
const ahpFile = ref(null)
const ahpFileName = ref('')
const ahpTotalWeights = ref([])
const ahpMatrices = ref([])
const ahpFinalRanking = ref([])
const showAHPDetails = ref(false)

// ========== 熵值法 ==========
const entropyFile = ref(null)
const entropyFileName = ref('')
const entropyWeights = ref([])
const entropyDataDetails = ref(null)
const showEntropyDetails = ref(false)
const entropyErrorMsg = ref('')

// ========== 融合 ==========
const alpha = ref(0.5)
const fusedResults = ref([])

// ========== 工具 ==========
function format(val) {
  if (typeof val !== 'number') return val
  return val.toFixed(5)
}

// --- AHP 完整计算流程 ---
function chooseAHPFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx'
  input.onchange = e => {
    if (e.target.files[0]) {
      ahpFile.value = e.target.files[0]
      ahpFileName.value = ahpFile.value.name
    }
  }
  input.click()
}

async function parseAndCalculateAHP() {
  if (!ahpFile.value) {
    return
  }
  
  try {
    const buffer = await ahpFile.value.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })

    if (wb.SheetNames.length < 2) {
      throw new Error('Excel文件至少需要2个Sheet（准则层+指标层）')
    }

    const matrices = wb.SheetNames.map((name, i) => {
      const rawData = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 })
      
      if (rawData.length < 2) {
        throw new Error(`Sheet "${name}" 数据不足，至少需要表头和一行数据`)
      }
      
      const header = rawData[0]
      const data = rawData.slice(1)
          .filter(row => row.length > 0)
          .map(row => row.map(cell => Number(cell) || 0))

      if (data.length === 0 || data[0].length === 0) {
        throw new Error(`Sheet "${name}" 数据解析失败`)
      }

      return {
        name,
        type: i === 0 ? '准则层' : '指标层',
        matrix: data,
        header,
        steps: {},
        currentStep: 0
      }
    })

    matrices.forEach(m => {
      m.currentStep = 0
      while (m.currentStep < 4) {
        calcAHPStep(m)
      }
    })

    if (matrices.length > 0) {
      const criteria = matrices[0]
      const list = []
      
      if (!criteria.steps || !criteria.steps.weights) {
        throw new Error('准则层计算失败')
      }
      
      for (let i = 0; i < criteria.steps.weights.length; i++) {
        const criterionW = criteria.steps.weights[i]
        const criterionName = criteria.header?.[i] || `B${i + 1}`
        const indicatorMat = matrices[i + 1]
        
        if (!indicatorMat || !indicatorMat.steps || !indicatorMat.steps.weights) {
          continue
        }
        
        for (let j = 0; j < indicatorMat.steps.weights.length; j++) {
          const indicatorW = indicatorMat.steps.weights[j]
          const indicatorName = indicatorMat.header?.[j] || `C${j + 1}`
          list.push({
            indicator: indicatorName,
            weight: criterionW * indicatorW
          })
        }
      }
      
      if (list.length === 0) {
        throw new Error('未能提取到有效的权重数据')
      }
      
      ahpTotalWeights.value = list
    }
  } catch (e) {
    console.error('AHP计算错误:', e)
  }
}

// --- 熵值法完整计算流程 ---
function chooseEntropyFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx'
  input.onchange = e => {
    if (e.target.files[0]) {
      entropyFile.value = e.target.files[0]
      entropyFileName.value = e.target.files[0].name
    }
  }
  input.click()
}

async function parseAndCalculateEntropy() {
  if (!entropyFile.value) {
    return
  }
  
  try {
    const buffer = await entropyFile.value.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const names = wb.SheetNames
    
    if (names.length < 2) {
      throw new Error('至少需要两个Sheet（历史数据+指标说明）')
    }

    const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets[names[0]], { header: 1 })
    const sheet2 = XLSX.utils.sheet_to_json(wb.Sheets[names[1]], { header: 1 })

    if (sheet1.length < 2) {
      throw new Error('Sheet1（历史数据）数据不足')
    }
    if (sheet2.length < 2) {
      throw new Error('Sheet2（指标说明）数据不足')
    }

    const result = parseAndMatch(sheet1, sheet2)
    if (!result.isReady) {
      throw new Error('未能匹配有效指标，请检查数据格式')
    }

    const dataObj = { ...result, currentStep: 0, steps: {} }

    while (dataObj.currentStep < 4) {
      calcEntropyStep(dataObj)
    }

    if (dataObj.steps.sortedWeights && dataObj.steps.sortedWeights.length > 0) {
      entropyWeights.value = dataObj.steps.sortedWeights
      entropyErrorMsg.value = ''
    } else {
      throw new Error('权重计算失败或结果为空')
    }
  } catch (e) {
    console.error('熵值法计算错误:', e)
    entropyErrorMsg.value = '解析失败：' + e.message
  }
}

// --- 融合计算 ---
const canFuse = computed(() => {
  return ahpTotalWeights.value.length > 0 && entropyWeights.value.length > 0
})

function calculateFusedResults() {
  if (!canFuse.value) {
    return
  }

  const entropyMap = new Map()
  entropyWeights.value.forEach(item => {
    entropyMap.set(item.name, item.weight)
  })

  const results = ahpTotalWeights.value.map(item => {
    const entW = entropyMap.get(item.indicator) || 0
    const fusedW = alpha.value * item.weight + (1 - alpha.value) * entW
    return {
      indicator: item.indicator,
      ahpWeight: item.weight,
      entropyWeight: entW,
      fusedWeight: fusedW
    }
  }).sort((a, b) => b.fusedWeight - a.fusedWeight)

  fusedResults.value = results
}

function onAlphaChange(e) {
  alpha.value = e.target.value / 100
  if (fusedResults.value.length > 0) {
    calculateFusedResults()
  }
}

// --- AHP 详细过程查看 ---
async function parseAndShowAHPDetails() {
  if (!ahpFile.value) {
    return
  }
  
  try {
    const buffer = await ahpFile.value.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })

    if (wb.SheetNames.length < 2) {
      throw new Error('Excel文件至少需要2个Sheet（准则层+指标层）')
    }

    const matrices = wb.SheetNames.map((name, i) => {
      const rawData = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 })
      
      if (rawData.length < 2) {
        throw new Error(`Sheet "${name}" 数据不足，至少需要表头和一行数据`)
      }
      
      const header = rawData[0]
      const data = rawData.slice(1)
          .filter(row => row.length > 0)
          .map(row => row.map(cell => Number(cell) || 0))

      if (data.length === 0 || data[0].length === 0) {
        throw new Error(`Sheet "${name}" 数据解析失败`)
      }

      return {
        name,
        type: i === 0 ? '准则层' : '指标层',
        matrix: data,
        header,
        steps: {},
        currentStep: 0
      }
    })

    matrices.forEach(m => {
      m.currentStep = 0
      while (m.currentStep < 4) {
        calcAHPStep(m)
      }
    })

    ahpMatrices.value = matrices

    if (matrices.length > 0) {
      const criteria = matrices[0]
      const ranking = []
      
      if (criteria.steps && criteria.steps.weights) {
        for (let i = 0; i < criteria.steps.weights.length; i++) {
          const criterionW = criteria.steps.weights[i]
          const criterionName = criteria.header?.[i] || `B${i + 1}`
          const indicatorMat = matrices[i + 1]
          
          if (!indicatorMat || !indicatorMat.steps || !indicatorMat.steps.weights) {
            continue
          }
          
          for (let j = 0; j < indicatorMat.steps.weights.length; j++) {
            const indicatorW = indicatorMat.steps.weights[j]
            const indicatorName = indicatorMat.header?.[j] || `C${j + 1}`
            const totalWeight = criterionW * indicatorW
            
            ranking.push({
              target: '总目标',
              criterion: criterionName,
              criterionWeight: criterionW,
              indicator: indicatorName,
              indicatorWeight: indicatorW,
              totalWeight: totalWeight
            })
          }
        }
        
        ahpFinalRanking.value = ranking.sort((a, b) => b.totalWeight - a.totalWeight)
      }
    }

    showAHPDetails.value = true
    showEntropyDetails.value = false
  } catch (e) {
    console.error('AHP详细过程计算错误:', e)
  }
}

// --- 熵值法详细过程查看 ---
async function parseAndShowEntropyDetails() {
  if (!entropyFile.value) {
    return
  }
  
  try {
    const buffer = await entropyFile.value.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const names = wb.SheetNames
    
    if (names.length < 2) {
      throw new Error('至少需要两个Sheet（历史数据+指标说明）')
    }

    const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets[names[0]], { header: 1 })
    const sheet2 = XLSX.utils.sheet_to_json(wb.Sheets[names[1]], { header: 1 })

    if (sheet1.length < 2) {
      throw new Error('Sheet1（历史数据）数据不足')
    }
    if (sheet2.length < 2) {
      throw new Error('Sheet2（指标说明）数据不足')
    }

    const result = parseAndMatch(sheet1, sheet2)
    if (!result.isReady) {
      throw new Error('未能匹配有效指标，请检查数据格式')
    }

    const dataObj = { ...result, currentStep: 0, steps: {} }

    while (dataObj.currentStep < 4) {
      calcEntropyStep(dataObj)
    }

    entropyDataDetails.value = dataObj

    showEntropyDetails.value = true
    showAHPDetails.value = false
  } catch (e) {
    console.error('熵值法详细过程计算错误:', e)
  }
}
</script>

<style scoped>
/* 主容器 */
.fusion-container {
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
  margin-top: 0.75rem;
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

/* 矩阵卡片 */
.matrix-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.75rem;
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
  font-size: 1rem;
}

.matrix-type {
  background: #e5e7eb;
  color: #4b5563;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
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

/* 汇总框 */
.summary-box {
  background: #f9fafb;
  border-radius: 8px;
  padding: 0.875rem;
  margin-bottom: 0.75rem;
  border: 1px solid #e5e7eb;
}

.summary-box.highlight-box {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.05));
  border-color: #bfdbfe;
}

.summary-title {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}

.summary-item {
  background: white;
  padding: 0.625rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-item.highlight-item {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}

.summary-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
}

.summary-item.highlight-item .summary-value {
  color: #2563eb;
  font-size: 1rem;
}

.summary-sub {
  font-size: 0.6875rem;
  color: #9ca3af;
  font-weight: 500;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
}

.summary-multi {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  align-items: flex-end;
}

.summary-multi .summary-sub {
  margin-top: 0.125rem;
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

/* 一致性检验 */
.consistency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.consistency-item {
  background: white;
  padding: 0.875rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.consistency-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.375rem;
}

.consistency-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

/* 检验结论 */
.verdict-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  margin-top: 0.75rem;
}

.verdict-card.pass {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.verdict-card.fail {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.verdict-icon {
  font-size: 1.25rem;
}

.verdict-content {
  flex: 1;
}

.verdict-title {
  font-weight: 800;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.verdict-text {
  font-weight: 500;
  font-size: 0.875rem;
}

/* 数据表格 */
.data-table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  max-height: 250px;
  overflow-y: auto;
}

.data-table {
  min-width: 100%;
}

.data-row {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
}

.data-row:last-child {
  border-bottom: none;
}

.data-row.header {
  background: #f9fafb;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-cell {
  flex: 1;
  min-width: 80px;
  padding: 0.625rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  border-right: 1px solid #f3f4f6;
}

.data-cell:last-child {
  border-right: none;
}

.data-cell.th {
  background: #f9fafb;
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 5;
}

/* 最终结果表格 */
.final-result-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.final-table-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  background: linear-gradient(135deg, #1f2937, #111827);
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  padding: 0.625rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  transition: background 0.2s ease;
}

.final-table-row:last-child {
  border-bottom: none;
}

.final-table-row:hover {
  background: #f9fafb;
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

.weight-col {
  font-weight: 800;
  color: #2563eb;
  font-size: 1rem;
}

/* 滑块控制 */
.slider-card {
  background: #f9fafb;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid #e5e7eb;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.slider-label {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.9375rem;
}

.slider-value {
  font-weight: 800;
  color: #3b82f6;
  font-size: 1.125rem;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.mark {
  font-weight: 500;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .fusion-container {
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
  
  .file-info {
    background: #1e3a8a;
    border-color: #1e40af;
  }
  
  .file-label {
    color: #bfdbfe;
  }
  
  .file-name {
    color: #dbeafe;
  }
  
  .step-section {
    background: #374151;
    border-color: #4b5563;
  }
  
  .step-header {
    border-color: #4b5563;
  }
  
  .matrix-card {
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
  
  .calculation-card {
    background: #374151;
    border-color: #4b5563;
  }
  
  .calculation-card.highlight-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
    border-color: #60a5fa;
  }
  
  .calc-title {
    color: #f9fafb;
  }
  
  .formula-box {
    background: #4b5563;
    border-color: #6b7280;
  }
  
  .formula {
    color: #f9fafb;
  }
  
  .summary-box {
    background: #374151;
    border-color: #4b5563;
  }
  
  .summary-box.highlight-box {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
    border-color: #60a5fa;
  }
  
  .summary-title {
    color: #f9fafb;
  }
  
  .summary-item {
    background: #1f2937;
    border-color: #4b5563;
  }
  
  .summary-item.highlight-item {
    background: #1f2937;
    border-color: #60a5fa;
  }
  
  .summary-label {
    color: #9ca3af;
  }
  
  .summary-value {
    color: #f9fafb;
  }
  
  .summary-item.highlight-item .summary-value {
    color: #93c5fd;
  }
  
  .summary-sub {
    color: #6b7280;
  }
  
  .summary-row {
    background: #1f2937;
    border-color: #4b5563;
  }
  
  .result-card {
    background: linear-gradient(135deg, #059669, #047857);
  }
  
  .consistency-item {
    background: #1f2937;
    border-color: #4b5563;
  }
  
  .consistency-label {
    color: #9ca3af;
  }
  
  .consistency-value {
    color: #f9fafb;
  }
  
  .verdict-card.pass {
    background: #064e3b;
    color: #a7f3d0;
    border-color: #059669;
  }
  
  .verdict-card.fail {
    background: #7f1d1d;
    color: #fecaca;
    border-color: #dc2626;
  }
  
  .data-table-wrapper {
    background: #374151;
    border-color: #4b5563;
  }
  
  .data-row {
    border-color: #4b5563;
  }
  
  .data-row.header {
    background: #4b5563;
  }
  
  .data-cell {
    background: #374151;
    color: #e5e7eb;
    border-color: #4b5563;
  }
  
  .data-cell.th {
    background: #4b5563;
  }
  
  .final-result-table {
    background: #374151;
    border-color: #4b5563;
  }
  
  .final-table-header {
    background: linear-gradient(135deg, #374151, #1f2937);
  }
  
  .final-table-header .th-col {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .final-table-row {
    border-color: #4b5563;
  }
  
  .final-table-row:hover {
    background: #374151;
  }
  
  .td-col {
    color: #e5e7eb;
  }
  
  .weight-col {
    color: #93c5fd;
  }
  
  .slider-card {
    background: #374151;
    border-color: #4b5563;
  }
  
  .slider-label {
    color: #f9fafb;
  }
  
  .slider-value {
    color: #93c5fd;
  }
  
  .slider {
    background: #4b5563;
  }
  
  .slider::-webkit-slider-thumb {
    background: #60a5fa;
  }
  
  .slider::-moz-range-thumb {
    background: #60a5fa;
  }
  
  .slider-marks {
    color: #9ca3af;
  }
}
</style>
