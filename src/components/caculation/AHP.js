// AHP.js

const RI_TABLE = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.54, 1.56, 1.58, 1.59]

/**
 * Step 1: 列归一化 + 返回列和 Sj
 */
export function stepNormalize(matrix) {
    const n = matrix.length
    const Sj = Array(n).fill(0)

    // 验证矩阵数据有效性
    if (n === 0) {
        console.error('矩阵为空')
        return { Sj: [], normMatrix: [] }
    }

    // 计算每列和 Sj
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            const val = matrix[i][j]
            if (typeof val !== 'number' || isNaN(val)) {
                console.error(`矩阵元素[${i}][${j}]不是有效数字:`, val)
                return { Sj: [], normMatrix: [] }
            }
            Sj[j] += val
        }
        
        // 检查列和是否为0
        if (Sj[j] === 0) {
            console.error(`第${j}列的和为0，无法归一化`)
            return { Sj: [], normMatrix: [] }
        }
    }

    console.log('列和 Sj:', Sj)

    // 归一化 b_ij = a_ij / Sj
    const normMatrix = matrix.map(row =>
        row.map((val, j) => {
            const result = val / Sj[j]
            if (isNaN(result) || !isFinite(result)) {
                console.error(`归一化结果为NaN或Infinity: ${val} / ${Sj[j]}`)
            }
            return result
        })
    )

    return { Sj, normMatrix }
}

/**
 * Step 2: 行求和与权重（算术平均）
 */
export function stepWeights(normMatrix) {
    const n = normMatrix.length
    const W_prime = normMatrix.map(row =>
        row.reduce((sum, val) => sum + val, 0)
    )
    const weights = W_prime.map(w => w / n)
    return { W_prime, weights }
}

/**
 * Step 3: 计算 AW 向量 和 (AW)_i / W_i
 */
export function stepAW(matrix, weights) {
    const AW = matrix.map(row =>
        row.reduce((sum, aij, j) => sum + aij * weights[j], 0)
    )
    const AW_div_W = AW.map((aw, i) => aw / weights[i])
    return { AW, AW_div_W }
}

/**
 * Step 4: 一致性检验（需原矩阵阶数 n 和 AW_div_W）
 */
export function stepConsistency(n, AW_div_W) {
    const lambdaMax = AW_div_W.reduce((sum, val) => sum + val, 0) / n
    const CI = (lambdaMax - n) / (n - 1)
    const RI = n <= RI_TABLE.length ? RI_TABLE[n-1] : 1.59
    const CR = RI === 0 ? 0 : CI / RI
    const isConsistent = CR < 0.1

    return { lambdaMax, CI, RI, CR, isConsistent }
}

/**
 * 执行下一步计算
 */
export function calculateNextStep(m) {
    const n = m.matrix.length

    if (m.currentStep === 0) {
        // Step 1: 列归一化 + 记录 Sj
        const { Sj, normMatrix } = stepNormalize(m.matrix)
        m.steps = {
            n,
            Sj,
            normMatrix
        }
        console.log(`${m.name} - Step 1: 列和 Sj`, Sj)
        console.log(`${m.name} - Step 1: 归一化矩阵`, normMatrix)
    }
    else if (m.currentStep === 1) {
        // Step 2: 行和 W' 和 权重 W
        const { W_prime, weights } = stepWeights(m.steps.normMatrix)
        m.steps.W_prime = W_prime
        m.steps.weights = weights
        console.log(`${m.name} - Step 2: W'`, W_prime)
        console.log(`${m.name} - Step 2: weights`, weights)
    }
    else if (m.currentStep === 2) {
        // Step 3: AW 和 (AW)/W
        const { AW, AW_div_W } = stepAW(m.matrix, m.steps.weights)
        m.steps.AW = AW
        m.steps.AW_div_W = AW_div_W
        console.log(`${m.name} - Step 3: AW`, AW)
        console.log(`${m.name} - Step 3: AW/W`, AW_div_W)
    }
    else if (m.currentStep === 3) {
        // Step 4: 一致性检验
        const { lambdaMax, CI, RI, CR, isConsistent } = stepConsistency(n, m.steps.AW_div_W)
        Object.assign(m.steps, {
            lambdaMax,
            CI,
            RI,
            CR,
            isConsistent
        })
        console.log(`${m.name} - Step 4: consistency`, {
            lambdaMax: lambdaMax.toFixed(5),
            CI: CI.toFixed(5),
            RI: RI,
            CR: CR.toFixed(5),
            isConsistent
        })
    }

    m.currentStep++
}
