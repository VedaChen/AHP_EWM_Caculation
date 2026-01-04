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
/* 主容器 - 玻璃拟态风格 */
.fusion-container {
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
  margin-top: var(--space-3);
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

/* 矩阵卡片 */
.matrix-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
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
  font-size: var(--text-base);
}

.matrix-type {
  background: var(--gray-200);
  color: var(--gray-700);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
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

/* 汇总框 */
.summary-box {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  margin-bottom: var(--space-3);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.summary-box.highlight-box {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border-color: var(--primary-300);
}

.summary-title {
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-2);
}

.summary-item {
  background: var(--card-bg-hover);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  backdrop-filter: blur(3px);
}

.summary-item.highlight-item {
  background: var(--card-bg-hover);
  border-color: var(--primary-500);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.summary-label {
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-weight: 600;
}

.summary-value {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--gray-900);
}

.summary-item.highlight-item .summary-value {
  color: var(--primary-600);
  font-size: var(--text-base);
}

.summary-sub {
  font-size: var(--text-xs);
  color: var(--gray-400);
  font-weight: 500;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2);
  background: var(--card-bg-hover);
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  margin-bottom: var(--space-2);
}

.summary-multi {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: flex-end;
}

.summary-multi .summary-sub {
  margin-top: var(--space-1);
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

/* 一致性检验 */
.consistency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.consistency-item {
  background: var(--card-bg-hover);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  text-align: center;
  backdrop-filter: blur(3px);
}

.consistency-label {
  display: block;
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.consistency-value {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--gray-900);
}

/* 检验结论 */
.verdict-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: var(--text-sm);
  margin-top: var(--space-3);
  backdrop-filter: blur(5px);
}

.verdict-card.pass {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
  color: var(--success-600);
  border: 1px solid var(--success-500);
}

.verdict-card.fail {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
  color: var(--danger-600);
  border: 1px solid var(--danger-500);
}

.verdict-icon {
  font-size: var(--text-xl);
}

.verdict-content {
  flex: 1;
}

.verdict-title {
  font-weight: 800;
  margin-bottom: var(--space-1);
  font-size: var(--text-base);
}

.verdict-text {
  font-weight: 500;
  font-size: var(--text-sm);
}

/* 数据表格 */
.data-table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  max-height: 250px;
  overflow-y: auto;
  backdrop-filter: blur(5px);
}

.data-table {
  min-width: 100%;
}

.data-row {
  display: flex;
  border-bottom: 1px solid var(--gray-200);
}

.data-row:last-child {
  border-bottom: none;
}

.data-row.header {
  background: var(--gray-50);
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-cell {
  flex: 1;
  min-width: 80px;
  padding: var(--space-2);
  text-align: center;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--gray-700);
  border-right: 1px solid var(--gray-200);
  background: white;
}

.data-cell:last-child {
  border-right: none;
}

.data-cell.th {
  background: var(--gray-50);
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 5;
}

.data-row:hover .data-cell {
  background: var(--gray-50);
}

/* 最终结果表格 */
.final-result-table {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.final-table-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  background: linear-gradient(135deg, var(--gray-800), var(--gray-900));
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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

.weight-col {
  font-weight: 800;
  color: var(--primary-600);
  font-size: var(--text-base);
}

/* 滑块控制 */
.slider-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(5px);
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.slider-label {
  font-weight: 700;
  color: var(--gray-800);
  font-size: var(--text-base);
}

.slider-value {
  font-weight: 800;
  color: var(--primary-600);
  font-size: var(--text-xl);
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--gray-200);
  outline: none;
  -webkit-appearance: none;
  transition: background var(--duration-normal) ease;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-500);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all var(--duration-normal) ease;
}

.slider::-webkit-slider-thumb:hover {
  background: var(--primary-600);
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-500);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all var(--duration-normal) ease;
}

.slider::-moz-range-thumb:hover {
  background: var(--primary-600);
  transform: scale(1.1);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--gray-500);
  margin-top: var(--space-1);
}

.mark {
  font-weight: 500;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .fusion-container {
    background: var(--bg-surface-dark);
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

  .file-info {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
    border-color: var(--primary-600);
  }

  .file-label {
    color: var(--primary-200);
  }

  .file-name {
    color: var(--primary-100);
  }

  .step-section {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .step-header {
    border-color: var(--gray-700);
  }

  .matrix-card {
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

  .calculation-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .calculation-card.highlight-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
    border-color: var(--primary-400);
  }

  .calc-title {
    color: var(--dark-text-primary);
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

  .summary-box {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .summary-box.highlight-box {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
    border-color: var(--primary-400);
  }

  .summary-title {
    color: var(--dark-text-primary);
  }

  .summary-item {
    background: var(--dark-card-bg-hover);
    border-color: var(--dark-card-border);
  }

  .summary-item.highlight-item {
    background: var(--dark-card-bg-hover);
    border-color: var(--primary-400);
  }

  .summary-label {
    color: var(--gray-400);
  }

  .summary-value {
    color: var(--dark-text-primary);
  }

  .summary-item.highlight-item .summary-value {
    color: var(--primary-300);
  }

  .summary-sub {
    color: var(--gray-500);
  }

  .summary-row {
    background: var(--dark-card-bg-hover);
    border-color: var(--dark-card-border);
  }

  .result-card {
    background: linear-gradient(135deg, var(--success-600), #047857);
  }

  .consistency-item {
    background: var(--dark-card-bg-hover);
    border-color: var(--dark-card-border);
  }

  .consistency-label {
    color: var(--gray-400);
  }

  .consistency-value {
    color: var(--dark-text-primary);
  }

  .verdict-card.pass {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
    color: var(--success-300);
    border-color: var(--success-500);
  }

  .verdict-card.fail {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
    color: var(--danger-300);
    border-color: var(--danger-500);
  }

  .data-table-wrapper {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .data-row {
    border-color: var(--gray-700);
  }

  .data-row.header {
    background: var(--gray-700);
  }

  .data-cell {
    background: var(--dark-card-bg);
    color: var(--dark-text-secondary);
    border-color: var(--gray-700);
  }

  .data-cell.th {
    background: var(--gray-700);
  }

  .data-row:hover .data-cell {
    background: rgba(55, 65, 81, 0.6);
  }

  .final-result-table {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .final-table-header {
    background: linear-gradient(135deg, var(--gray-700), var(--gray-800));
  }

  .final-table-header .th-col {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .final-table-row {
    border-color: var(--gray-700);
  }

  .final-table-row:hover {
    background: rgba(55, 65, 81, 0.6);
  }

  .td-col {
    color: var(--dark-text-secondary);
  }

  .weight-col {
    color: var(--primary-300);
  }

  .slider-card {
    background: var(--dark-card-bg);
    border-color: var(--dark-card-border);
  }

  .slider-label {
    color: var(--dark-text-primary);
  }

  .slider-value {
    color: var(--primary-300);
  }

  .slider {
    background: var(--gray-700);
  }

  .slider::-webkit-slider-thumb {
    background: var(--primary-400);
  }

  .slider::-webkit-slider-thumb:hover {
    background: var(--primary-300);
  }

  .slider::-moz-range-thumb {
    background: var(--primary-400);
  }

  .slider::-moz-range-thumb:hover {
    background: var(--primary-300);
  }

  .slider-marks {
    color: var(--gray-400);
  }
}
</style>
