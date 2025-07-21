# 构建和部署指南

## 开发环境设置

### 前置要求
- Node.js 18+ 
- Rust 1.70+
- Git

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd photo-metadata-overlay

# 安装前端依赖
npm install

# 安装Tauri CLI
npm install -g @tauri-apps/cli

# 验证Rust环境
rustc --version
cargo --version
```

## 开发模式

### 启动开发服务器
```bash
# 启动前端开发服务器和Tauri开发模式
npm run tauri dev

# 或者分别启动
npm run dev          # 仅前端
npm run tauri build  # 仅构建
```

### 开发工具
- 前端热重载：自动刷新
- Rust热重载：需要重新编译
- 开发者工具：F12打开

## 构建生产版本

### 单平台构建
```bash
# 构建当前平台
npm run tauri build

# 构建特定平台（需要对应环境）
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows
npm run tauri build -- --target x86_64-apple-darwin     # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin    # macOS Apple Silicon
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

### 跨平台构建
```bash
# 使用GitHub Actions进行跨平台构建
# 推送到main分支会自动触发构建

# 手动触发构建
gh workflow run build-release.yml
```

## 构建配置

### Tauri配置 (`src-tauri/tauri.conf.json`)
```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Photo Metadata Overlay",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["**"]
      },
      "dialog": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.phototools.metadata-overlay",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    }
  }
}
```

### 前端构建配置 (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

## 测试

### 单元测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --grep "component"

# 测试覆盖率
npm run test:coverage
```

### 端到端测试
```bash
# 运行E2E测试
npm run test:e2e

# 运行特定E2E测试
npm run test:e2e -- --spec "batch-processing"
```

### 性能测试
```bash
# 运行性能测试
npm run test:performance

# 内存泄漏测试
npm run test:memory
```

## 代码质量

### 代码检查
```bash
# ESLint检查
npm run lint

# 修复可自动修复的问题
npm run lint:fix

# TypeScript类型检查
npm run type-check
```

### 代码格式化
```bash
# Prettier格式化
npm run format

# 检查格式
npm run format:check
```

## 发布流程

### 版本管理
```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 手动更新版本
# 1. 更新 package.json
# 2. 更新 src-tauri/Cargo.toml
# 3. 更新 src-tauri/tauri.conf.json
```

### 创建发布
```bash
# 创建Git标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions会自动构建和发布
```

### 手动发布
```bash
# 构建所有平台
npm run build:all

# 上传到发布平台
# 构建产物位于 src-tauri/target/release/bundle/
```

## 平台特定说明

### Windows
- 需要Visual Studio Build Tools
- 构建产物：`.exe` 和 `.msi`
- 签名：需要代码签名证书

### macOS
- 需要Xcode Command Line Tools
- 构建产物：`.app` 和 `.dmg`
- 签名：需要Apple Developer证书
- 公证：需要Apple公证

### Linux
- 构建产物：`.AppImage` 和 `.deb`
- 依赖：需要系统库

## 优化建议

### 构建优化
```bash
# 启用Rust优化
export CARGO_PROFILE_RELEASE_LTO=true
export CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1

# 前端优化
npm run build -- --mode production
```

### 包大小优化
- 移除未使用的依赖
- 启用tree-shaking
- 压缩资源文件
- 使用动态导入

### 性能优化
- 启用Rust编译优化
- 使用Web Workers
- 实现资源懒加载
- 优化图像处理算法

## 故障排除

### 常见构建问题

#### Rust编译错误
```bash
# 更新Rust工具链
rustup update

# 清理构建缓存
cargo clean
```

#### 前端构建错误
```bash
# 清理node_modules
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
npm run clean
```

#### 跨平台构建问题
- 检查目标平台工具链
- 验证交叉编译环境
- 查看GitHub Actions日志

### 调试技巧
- 使用 `console.log` 调试前端
- 使用 `println!` 调试Rust代码
- 启用详细日志输出
- 使用开发者工具

## CI/CD配置

### GitHub Actions
```yaml
name: Build and Release

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run tauri build
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.platform }}-build
          path: src-tauri/target/release/bundle/
```

## 部署

### 自动部署
- GitHub Releases：自动发布到GitHub
- 应用商店：需要手动提交审核

### 手动部署
1. 构建所有平台版本
2. 测试安装包
3. 上传到发布平台
4. 更新发布说明
5. 通知用户更新

## 监控和分析

### 错误监控
- 集成错误报告服务
- 收集崩溃日志
- 监控性能指标

### 使用分析
- 匿名使用统计
- 功能使用频率
- 性能指标收集

---

更多详细信息请参考官方文档或联系开发团队。