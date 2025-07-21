#!/usr/bin/env node

/**
 * 跨平台构建脚本
 * 用于构建Windows、macOS和Linux平台的应用程序包
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 检查系统要求
function checkSystemRequirements() {
  logStep('SYSTEM CHECK', '检查系统要求...');
  
  const platform = os.platform();
  log(`当前平台: ${platform}`, 'blue');
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  log(`Node.js版本: ${nodeVersion}`, 'blue');
  
  // 检查npm版本
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`npm版本: ${npmVersion}`, 'blue');
  } catch (error) {
    logError('npm未安装或不可用');
    process.exit(1);
  }
  
  // 检查Rust和Cargo
  try {
    const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
    log(`Rust版本: ${rustVersion}`, 'blue');
    
    const cargoVersion = execSync('cargo --version', { encoding: 'utf8' }).trim();
    log(`Cargo版本: ${cargoVersion}`, 'blue');
  } catch (error) {
    logError('Rust/Cargo未安装，请先安装Rust工具链');
    logError('访问 https://rustup.rs/ 安装Rust');
    process.exit(1);
  }
  
  // 检查Tauri CLI
  try {
    const tauriVersion = execSync('cargo tauri --version', { encoding: 'utf8' }).trim();
    log(`Tauri CLI版本: ${tauriVersion}`, 'blue');
  } catch (error) {
    logWarning('Tauri CLI未安装，正在安装...');
    try {
      execSync('cargo install tauri-cli', { stdio: 'inherit' });
      logSuccess('Tauri CLI安装成功');
    } catch (installError) {
      logError('Tauri CLI安装失败');
      process.exit(1);
    }
  }
  
  logSuccess('系统要求检查完成');
}

// 安装依赖
function installDependencies() {
  logStep('DEPENDENCIES', '安装项目依赖...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('前端依赖安装完成');
  } catch (error) {
    logError('前端依赖安装失败');
    process.exit(1);
  }
  
  try {
    execSync('cargo fetch', { cwd: 'src-tauri', stdio: 'inherit' });
    logSuccess('Rust依赖获取完成');
  } catch (error) {
    logWarning('Rust依赖获取失败，构建时将自动下载');
  }
}

// 构建前端
function buildFrontend() {
  logStep('FRONTEND', '构建前端应用...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('前端构建完成');
  } catch (error) {
    logError('前端构建失败');
    process.exit(1);
  }
}

// 构建特定平台
function buildPlatform(target, description) {
  logStep('BUILD', `构建${description}...`);
  
  try {
    const command = target ? `cargo tauri build --target ${target}` : 'cargo tauri build';
    execSync(command, { stdio: 'inherit' });
    logSuccess(`${description}构建完成`);
  } catch (error) {
    logError(`${description}构建失败`);
    return false;
  }
  
  return true;
}

// 获取构建产物信息
function getBuildArtifacts() {
  const bundleDir = path.join('src-tauri', 'target', 'release', 'bundle');
  const artifacts = [];
  
  if (fs.existsSync(bundleDir)) {
    const platforms = fs.readdirSync(bundleDir);
    
    platforms.forEach(platform => {
      const platformDir = path.join(bundleDir, platform);
      if (fs.statSync(platformDir).isDirectory()) {
        const files = fs.readdirSync(platformDir, { recursive: true });
        files.forEach(file => {
          const fullPath = path.join(platformDir, file);
          if (fs.statSync(fullPath).isFile()) {
            const stats = fs.statSync(fullPath);
            artifacts.push({
              platform,
              file,
              path: fullPath,
              size: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
            });
          }
        });
      }
    });
  }
  
  return artifacts;
}

// 显示构建结果
function showBuildResults(artifacts) {
  logStep('RESULTS', '构建结果:');
  
  if (artifacts.length === 0) {
    logWarning('未找到构建产物');
    return;
  }
  
  artifacts.forEach(artifact => {
    log(`📦 ${artifact.platform}: ${artifact.file} (${artifact.size})`, 'green');
    log(`   路径: ${artifact.path}`, 'blue');
  });
  
  log(`\n总共生成了 ${artifacts.length} 个构建产物`, 'bright');
}

// 主构建流程
function main() {
  const args = process.argv.slice(2);
  const targetPlatform = args[0];
  
  log('🚀 Photo Metadata Overlay 跨平台构建工具', 'bright');
  log('=' .repeat(50), 'cyan');
  
  // 检查系统要求
  checkSystemRequirements();
  
  // 安装依赖
  installDependencies();
  
  // 构建前端
  buildFrontend();
  
  // 根据参数决定构建目标
  let buildSuccess = true;
  
  if (targetPlatform) {
    switch (targetPlatform.toLowerCase()) {
      case 'windows':
      case 'win':
        buildSuccess = buildPlatform('x86_64-pc-windows-msvc', 'Windows (x64)');
        break;
      case 'macos':
      case 'mac':
        buildSuccess = buildPlatform('x86_64-apple-darwin', 'macOS (Intel)');
        break;
      case 'macos-arm':
      case 'mac-arm':
        buildSuccess = buildPlatform('aarch64-apple-darwin', 'macOS (Apple Silicon)');
        break;
      case 'linux':
        buildSuccess = buildPlatform('x86_64-unknown-linux-gnu', 'Linux (x64)');
        break;
      case 'all':
        // 构建所有平台（需要相应的工具链）
        logStep('BUILD ALL', '构建所有平台...');
        const currentPlatform = os.platform();
        
        if (currentPlatform === 'win32') {
          buildSuccess &= buildPlatform('x86_64-pc-windows-msvc', 'Windows (x64)');
        } else if (currentPlatform === 'darwin') {
          buildSuccess &= buildPlatform('x86_64-apple-darwin', 'macOS (Intel)');
          buildSuccess &= buildPlatform('aarch64-apple-darwin', 'macOS (Apple Silicon)');
        } else if (currentPlatform === 'linux') {
          buildSuccess &= buildPlatform('x86_64-unknown-linux-gnu', 'Linux (x64)');
        }
        break;
      default:
        logError(`不支持的平台: ${targetPlatform}`);
        logError('支持的平台: windows, macos, macos-arm, linux, all');
        process.exit(1);
    }
  } else {
    // 默认构建当前平台
    buildSuccess = buildPlatform(null, '当前平台');
  }
  
  if (buildSuccess) {
    // 显示构建结果
    const artifacts = getBuildArtifacts();
    showBuildResults(artifacts);
    
    logSuccess('构建完成！');
  } else {
    logError('构建失败！');
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  logError(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`未处理的Promise拒绝: ${reason}`);
  process.exit(1);
});

// 运行主程序
if (require.main === module) {
  main();
}

module.exports = {
  checkSystemRequirements,
  installDependencies,
  buildFrontend,
  buildPlatform,
  getBuildArtifacts,
  showBuildResults
};