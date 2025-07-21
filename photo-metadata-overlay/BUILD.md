# 跨平台构建指南

本文档介绍如何为不同平台构建 Photo Metadata Overlay 应用程序。

## 系统要求

### 通用要求
- Node.js 18+ 
- npm 或 yarn
- Rust 工具链 (rustc, cargo)
- Tauri CLI

### 平台特定要求

#### Windows
- Visual Studio Build Tools 2019/2022
- Windows 10 SDK

#### macOS
- Xcode Command Line Tools
- macOS 10.13+ (构建目标)

#### Linux
- 构建工具包：`build-essential`
- GTK 开发库：`libgtk-3-dev`
- WebKit 开发库：`libwebkit2gtk-4.0-dev`
- 应用指示器库：`libayatana-appindicator3-dev`
- SVG 库：`librsvg2-dev`

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Tauri CLI (如果尚未安装)
cargo install tauri-cli
```

### 2. 构建当前平台

```bash
# 使用自定义构建脚本
npm run build:current

# 或使用 Tauri CLI
npm run tauri:build
```

## 跨平台构建

### 构建所有支持的平台

```bash
npm run build:all
```

### 构建特定平台

```bash
# Windows (x64)
npm run build:windows

# macOS (Intel)
npm run build:macos

# macOS (Apple Silicon)
npm run build:macos-arm

# Linux (x64)
npm run build:linux
```

## 构建产物

构建完成后，产物将位于 `src-tauri/target/release/bundle/` 目录下：

### Windows
- `msi/` - Windows Installer (.msi)
- `nsis/` - NSIS Installer (.exe)

### macOS
- `dmg/` - macOS Disk Image (.dmg)
- `macos/` - macOS Application Bundle (.app)

### Linux
- `deb/` - Debian Package (.deb)
- `appimage/` - AppImage (.AppImage)
- `rpm/` - RPM Package (.rpm)

## 平台兼容性测试

在构建之前，建议运行兼容性测试：

```bash
node scripts/test-platform-compatibility.js
```

测试将检查：
- 文件系统兼容性
- UI 组件兼容性
- 依赖兼容性
- 构建配置兼容性
- 性能配置
- 安全配置

## 开发模式

```bash
# 启动开发服务器
npm run dev

# 启动 Tauri 开发模式
npm run tauri:dev
```

## 故障排除

### 常见问题

#### 1. Rust 工具链问题
```bash
# 更新 Rust
rustup update

# 添加目标平台
rustup target add x86_64-pc-windows-msvc
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
rustup target add x86_64-unknown-linux-gnu
```

#### 2. Linux 依赖问题
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev

# CentOS/RHEL/Fedora
sudo yum install gtk3-devel webkit2gtk3-devel libappindicator-gtk3-devel librsvg2-devel
```

#### 3. macOS 代码签名
如需发布到 App Store 或进行公证，需要配置代码签名：

```json
// src-tauri/tauri.conf.json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name",
      "entitlements": "path/to/entitlements.plist"
    }
  }
}
```

#### 4. Windows 代码签名
```json
// src-tauri/tauri.conf.json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERTIFICATE_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

### 构建脚本选项

自定义构建脚本支持以下选项：

```bash
# 显示帮助信息
node scripts/build-all-platforms.js --help

# 跳过依赖检查
node scripts/build-all-platforms.js --skip-deps

# 详细输出
node scripts/build-all-platforms.js --verbose

# 清理构建缓存
node scripts/build-all-platforms.js --clean
```

## CI/CD 集成

项目包含 GitHub Actions 工作流，支持：
- 自动跨平台构建
- 兼容性测试
- 自动发布到 GitHub Releases

工作流文件位于：`.github/workflows/build-release.yml`

### 触发构建
- 推送标签 (如 `v1.0.0`) 将触发发布构建
- Pull Request 将触发测试构建
- 手动触发工作流

## 性能优化

### 构建优化
- 启用 LTO (Link Time Optimization)
- 优化二进制大小
- 压缩资源文件

### 运行时优化
- 延迟加载非关键组件
- 图片资源优化
- 内存使用优化

## 发布检查清单

在发布新版本之前，请确保：

- [ ] 所有平台构建成功
- [ ] 兼容性测试通过
- [ ] 功能测试完成
- [ ] 性能测试通过
- [ ] 安全扫描完成
- [ ] 文档更新
- [ ] 版本号更新
- [ ] 更新日志编写

## 支持的平台

| 平台 | 架构 | 状态 | 备注 |
|------|------|------|------|
| Windows | x64 | ✅ 支持 | Windows 10+ |
| macOS | Intel | ✅ 支持 | macOS 10.13+ |
| macOS | Apple Silicon | ✅ 支持 | macOS 11+ |
| Linux | x64 | ✅ 支持 | Ubuntu 18.04+, CentOS 7+ |

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎贡献代码！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献指南。

## 支持

如果遇到构建问题，请：
1. 查看本文档的故障排除部分
2. 搜索现有的 Issues
3. 创建新的 Issue 并提供详细信息