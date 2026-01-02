// EntropyCalculation.js

// 配置项
export const EPSILON = 0.0001; // 非负平移常数
export const DECIMALS = 5;     // 默认保留小数位

/**
 * 辅助函数：格式化数字
 */
export function formatNum(num) {
    if (typeof num !== 'number') return num;
    // 根据项目规范，所有计算结果的数值显示必须保留5位小数，并进行四舍五入处理
    return Number(num.toFixed(DECIMALS));
}

/**
 * 预处理：解析 Excel 数据并匹配指标类型
 * @param {Array} sheet1Data 历史数据 (含表头)
 * @param {Array} sheet2Data 指标说明 (含表头)
 */
export function parseAndMatch(sheet1Data, sheet2Data) {
    // 1. 处理 Sheet2 (指标说明)
    // 假设：第一行表头，列1=名称，列2=类型
    const indicatorMap = {}; // { "指标A": "正向", "指标B": "负向" }
    const sheet2Indicators = []; // 保存原始Sheet2数据

    // 从第1行(索引1)开始读取，跳过表头
    for (let i = 1; i < sheet2Data.length; i++) {
        const row = sheet2Data[i];
        if (row && row.length >= 2) {
            const name = row[0];
            const typeRaw = row[1] ? row[1].trim() : '';
            // 模糊匹配类型
            let type = 'unknown';
            let typeDisplay = typeRaw;
            if (typeRaw.includes('正') || typeRaw.includes('高')) {
                type = 'positive';
                typeDisplay = '正向';
            }
            if (typeRaw.includes('负') || typeRaw.includes('低')) {
                type = 'negative';
                typeDisplay = '负向';
            }

            if (name) {
                indicatorMap[name] = type;
                sheet2Indicators.push({
                    name: name,
                    type: type,
                    typeDisplay: typeDisplay
                });
            }
        }
    }

    // 2. 处理 Sheet1 (数据矩阵)
    // 假设：第一行表头，列1=样本名(n)，列2~m=指标数据
    const headers = sheet1Data[0];
    const sampleNames = [];
    const matrix = [];
    const validIndicators = []; // 记录参与计算的指标信息 { index: 1, name: '指标A', type: 'positive' }

    // 2.1 确定哪些列是有效指标（存在于 Map 中且类型已知）
    for (let j = 1; j < headers.length; j++) {
        const headerName = headers[j];
        const type = indicatorMap[headerName];
        if (type && (type === 'positive' || type === 'negative')) {
            validIndicators.push({
                colIndex: j, // 原始数据的列索引
                name: headerName,
                type: type
            });
        }
    }

    // 2.2 提取数据行
    for (let i = 1; i < sheet1Data.length; i++) {
        const row = sheet1Data[i];
        if (!row || row.length === 0) continue;

        sampleNames.push(row[0]); // 第一列是样本名
        const rowData = [];

        // 只提取有效指标的数值
        validIndicators.forEach(ind => {
            rowData.push(Number(row[ind.colIndex]) || 0);
        });
        matrix.push(rowData);
    }

    // 准备Sheet1数据预览（显示所有行，不再限制数量）
    const sheet1DataPreview = [];
    for (let i = 1; i < sheet1Data.length; i++) { // 显示所有数据行，从第1行开始（跳过表头）
        sheet1DataPreview.push(sheet1Data[i]);
    }

    // 准备有效指标的原始数据预览（显示所有行，不再限制数量）
    const rawMatrixPreview = [];
    for (let i = 0; i < matrix.length; i++) { // 显示所有数据行
        rawMatrixPreview.push([...matrix[i]]); // 深拷贝
    }

    return {
        sampleNames,
        indicators: validIndicators, // 最终的指标列表 (m个)
        rawMatrix: matrix,           // n行 * m列 纯数值矩阵
        n: matrix.length,
        m: validIndicators.length,
        isReady: validIndicators.length > 0 && matrix.length > 0,
        sheet1Headers: headers.slice(1), // Sheet1的指标头（不含样本名列）
        sheet1DataPreview: sheet1DataPreview, // Sheet1的前几行数据
        sheet2Data: sheet2Indicators, // 原始Sheet2数据
        rawMatrixPreview: rawMatrixPreview // 原始数据预览
    };
}

/**
 * Step 1: 数据标准化与平移
 * 极差标准化 + Epsilon
 */
export function stepStandardize(dataObj) {
    const { rawMatrix, indicators, n, m } = dataObj;

    // 1. 获取每列的 Min 和 Max
    const colStats = indicators.map((_, colIndex) => {
        const colValues = rawMatrix.map(row => row[colIndex]);
        return {
            min: Math.min(...colValues),
            max: Math.max(...colValues)
        };
    });

    // 2. 计算极差标准化矩阵
    const normalizedMatrix = rawMatrix.map((row, i) => {
        return row.map((val, j) => {
            const { min, max } = colStats[j];
            const type = indicators[j].type;
            const range = max - min;

            let x_prime = 0;

            // 防止分母为0 (极值相等情况)
            if (range === 0) {
                x_prime = 1; // 或者 0，视业务逻辑而定，这里取1保证后续计算有效
            } else {
                if (type === 'positive') {
                    x_prime = (val - min) / range;
                } else {
                    x_prime = (max - val) / range;
                }
            }

            return x_prime;
        });
    });

    // 3. 计算非负平移矩阵（在标准化基础上加EPSILON）
    const stdMatrix = normalizedMatrix.map(row => {
        return row.map(val => val + EPSILON);
    });

    return { colStats, normalizedMatrix, stdMatrix };
}

/**
 * Step 2: 计算特征比重 (概率矩阵 P)
 * p_ij = x''_ij / sum(x''_j)
 */
export function stepProbability(stdMatrix) {
    const n = stdMatrix.length;
    const m = stdMatrix[0].length;

    // 1. 计算每列之和
    const colSums = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
        for (let i = 0; i < n; i++) {
            colSums[j] += stdMatrix[i][j];
        }
    }

    // 2. 计算 P 矩阵
    const pMatrix = stdMatrix.map(row => {
        return row.map((val, j) => {
            // 避免除以0的情况
            return colSums[j] !== 0 ? val / colSums[j] : 0;
        });
    });

    return { colSums, pMatrix };
}

/**
 * Step 3: 计算信息熵 E
 * E_j = -k * sum(p * ln(p))
 */
export function stepEntropy(pMatrix, n) {
    const m = pMatrix[0].length;
    // k = 1 / ln(n)
    // 注意：若 n=1，ln(1)=0，这里需要处理。一般熵值法 n>1。
    // 公式常数为负： -1/ln(n)
    let k = 0;
    if (n > 1) {
        k = 1 / Math.log(n);
    }

    const E_list = new Array(m).fill(0);

    for (let j = 0; j < m; j++) {
        let sumPLnP = 0;
        for (let i = 0; i < n; i++) {
            const p = pMatrix[i][j];
            // 当概率值为0时，p*ln(p)定义为0，因此跳过此项
            if (p > 0) {
                sumPLnP += p * Math.log(p);
            }
        }
        // E_j = -k * sum
        // 理论上 E_j 应该在 [0, 1] 之间
        E_list[j] = n > 1 ? (-k * sumPLnP) : 0;
    }

    return { k, E_list };
}

/**
 * Step 4: 计算差异系数与权重
 * d_j = 1 - E_j
 * w_j = d_j / sum(d)
 */
export function stepWeights(E_list) {
    const m = E_list.length;

    // 1. 差异系数 d_j
    const d_list = E_list.map(e => 1 - e);

    // 2. 差异系数之和
    const sumD = d_list.reduce((a, b) => a + b, 0);

    // 3. 权重 w_j
    const weights = d_list.map(d => sumD === 0 ? 0 : d / sumD);

    return { d_list, sumD, weights };
}

/**
 * 状态机：执行下一步
 */
export function calculateNextStep(dataObj) {
    const current = dataObj.currentStep;

    if (current === 0) {
        // Step 1: 标准化
        const res = stepStandardize(dataObj);
        dataObj.steps.normalizedMatrix = res.normalizedMatrix; // 极差标准化结果
        dataObj.steps.stdMatrix = res.stdMatrix;               // 非负平移结果
        dataObj.steps.colStats = res.colStats; // 记录 max/min 供展示
    }
    else if (current === 1) {
        // Step 2: 概率 P
        const res = stepProbability(dataObj.steps.stdMatrix);
        dataObj.steps.pMatrix = res.pMatrix;      // 特征比重表格
        dataObj.steps.colSums = res.colSums;
    }
    else if (current === 2) {
        // Step 3: 信息熵 E
        const res = stepEntropy(dataObj.steps.pMatrix, dataObj.n);
        dataObj.steps.k = res.k;
        dataObj.steps.E_list = res.E_list;        // 信息熵表格
    }
    else if (current === 3) {
        // Step 4: 权重 W
        const res = stepWeights(dataObj.steps.E_list);
        dataObj.steps.d_list = res.d_list;        // 差异系数表格
        dataObj.steps.sumD = res.sumD;
        dataObj.steps.weights = res.weights;      // 最终权重表格
        
        // 添加排序功能：按权重降序排列
        const weightedIndicators = dataObj.indicators.map((ind, index) => ({
            ...ind,
            weight: res.weights[index],
            originalIndex: index
        }));
        
        // 按权重降序排序
        dataObj.steps.sortedWeights = weightedIndicators
            .sort((a, b) => b.weight - a.weight)
            .map((item, rank) => ({
                ...item,
                rank: rank + 1,  // 排名从1开始
                percentage: (item.weight * 100).toFixed(2) + '%'
            }));
    }

    dataObj.currentStep++;
}
