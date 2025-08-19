# 基础镜像（含Node.js 18和系统依赖）
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

# 创建非root用户并设置目录权限（关键修改）
RUN useradd -m -u 501 appuser \
    && mkdir -p /home/appuser/app \
    && chown -R appuser:appuser /home/appuser/app

USER appuser
WORKDIR /home/appuser/app

# ----------------------------
# 开发环境阶段（新增）
FROM base AS development

# 复制package文件（先复制依赖清单，利用Docker缓存）
COPY package*.json ./

# 安装所有依赖（包括开发依赖，如ts-node-dev）
RUN npm install

# 复制源代码（开发环境需要完整代码，而非编译结果）
COPY tsconfig.json ./
COPY src ./src
COPY tests ./tests

# 暴露端口
EXPOSE 3000

# 开发环境启动命令（与docker-compose中的command一致）
CMD ["npm", "run", "dev"]

# ----------------------------
# 构建阶段（用于生产环境编译）
FROM base AS builder

# 复制package文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装所有依赖（包括开发依赖，用于编译）
RUN npm ci

# 复制源代码
COPY src ./src
COPY tests ./tests

# 编译TypeScript
RUN npm run build

# ----------------------------
# 生产环境阶段
FROM base AS production

# 复制package文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 复制编译结果
COPY --from=builder /home/appuser/app/dist ./dist

# 安装Playwright浏览器（默认安装Chromium）
RUN npx playwright install chromium --with-deps

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]