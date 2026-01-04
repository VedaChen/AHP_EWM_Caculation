# AHP_EWM_Caculation

使用mimo-v2-flash生成的AHP-熵值法的组合权重计算器

## 快速开始

您可以通过以下三种方式使用本系统：

### 方式一：直接在线访问（推荐）
直接访问在线版本，无需安装任何环境：
```
https://vedachen.github.io/AHP_EWM_Caculation/
```

**使用步骤：**
1. 访问上述网址
2. 下载模板文件（在页面中找到模板下载链接）
3. 根据您的实际数据填写模板文件
4. 上传模板文件进行计算

**模板文件位置：**
- `docs/AHP模板文件.xlsx` - AHP判断矩阵模板
- `docs/EWM模板文件.xlsx` - 熵值法数据模板

### 方式二：克隆仓库本地使用
如果您需要在本地运行或修改代码，请使用此方式：

#### 1. 克隆仓库
```bash
git clone https://github.com/VedaChen/AHP_EWM_Caculation.git
cd AHP_EWM_Caculation
```

#### 2. 安装依赖
```bash
npm install
# 或者
yarn install
```

#### 3. 填写模板文件
在 `docs/` 目录下有两个模板文件：
- `AHP模板文件.xlsx` - AHP判断矩阵模板
- `EWM模板文件.xlsx` - 熵值法数据模板

请根据您的实际数据填写这些模板文件。

#### 4. 启动开发服务器
```bash
npm run dev
# 或者
yarn dev
```

#### 5. 使用界面
1. 在浏览器中打开显示的URL（通常是 http://localhost:5173）
2. 选择计算方法：
   - **AHP层次分析法** - 用于主观权重计算
   - **熵值法** - 用于客观权重计算  
   - **AHP-熵值法融合** - 结合主客观权重
3. 上传对应的Excel模板文件
4. 点击"直接计算"按钮进行计算
5. 或点击"查看详细过程"按钮查看完整计算步骤

### 方式三：下载使用系统
如果您希望在本地使用但不需要修改代码：

1. 在GitHub仓库页面点击 "Code" → "Download ZIP"
2. 解压下载的ZIP文件
3. 进入解压后的目录
4. 按照方式二的步骤3-5继续操作

## 功能特点

- ✅ 三种计算方法：AHP、熵值法、融合计算
- ✅ 线性风格UI设计，操作直观
- ✅ 支持详细计算过程展示
- ✅ 实时结果展示，无弹窗干扰
- ✅ 响应式设计，支持暗色模式
- ✅ Excel文件导入导出

## 项目结构

```
src/
├── components/
│   ├── index.vue          # 主选择界面
│   ├── caculation/
│   │   ├── AHP.vue        # AHP计算组件
│   │   ├── EWM.vue        # 熵值法计算组件  
│   │   ├── AHP-EWM.vue    # 融合计算组件
│   │   ├── AHP.js         # AHP计算逻辑
│   │   └── EWM.js         # 熵值法计算逻辑
├── main.js
└── style.css

docs/
├── AHP模板文件.xlsx        # AHP判断矩阵模板
└── EWM模板文件.xlsx        # 熵值法数据模板
```

## 使用说明

### AHP层次分析法
1. 准则层：第一个Sheet页，填写判断矩阵
2. 指标层：后续Sheet页，每个准则对应一个判断矩阵
3. 系统会自动计算权重并进行一致性检验

### 熵值法
1. Sheet1：历史数据，第一列为样本名，后续列为指标值
2. Sheet2：指标说明，第一列为指标名，第二列为"正向"或"负向"
3. 系统会自动计算信息熵和权重

### 融合计算
1. 先完成AHP和熵值法计算
2. 调节α系数（0-1之间）控制主观权重占比
3. 点击计算融合权重查看结果

## 技术栈

- Vue 3
- Vite
- xlsx (Excel处理)
- 现代CSS (Grid, Flexbox, CSS Variables)

## 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 许可证

MIT License
