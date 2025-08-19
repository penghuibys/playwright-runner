# 基础镜像（含Node.js 18和TypeScript）
FROM node:18-slim AS base

# 安装系统依赖（Playwright需要的库）
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户（避免权限风险）
RUN useradd -m appuser
USER appuser
WORKDIR /home/appuser/app

# 构建阶段
FROM base AS builder

# 复制package文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY src ./src
COPY tests ./tests

# 编译TypeScript
RUN npm run build

# 生产阶段
FROM base AS production

# 复制package文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 复制编译结果
COPY --from=builder /home/appuser/app/dist ./dist

# 安装Playwright浏览器（默认安装Chromium）
RUN npx playwright install chromium --with-deps

# 暴露健康检查端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
