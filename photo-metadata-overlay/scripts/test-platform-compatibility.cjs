#!/usr/bin/env node

/**
 * 跨平台兼容性测试脚本
 * 测试应用在不同平台上的功能一致性和界面适配
 */

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

// 测试结果统计
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addTestResult(name, status, message = '') {
  testResults.tests.push({ name, status, message });
  if (status === 'pass') {
    testResults.passed++;
    logSuccess(`${name}: ${message}`);
  } else if (status === 'fail') {
    testResults.failed++;
    logError(`${name}: ${message}`);
  } else if (status === 'warning') {
    testResults.warnings++;
    logWarning(`${name}: ${message}`);
  }
}

// 检查文件系统兼容性
function testFileSystemCompatibility() {
  logStep('FILE SYSTEM', '测试文件系统兼容性...');
  
  // 测试路径分隔符处理
  const testPath = path.join('src', 'components', 'UI');
  if (fs.existsSync(testPath)) {
    addTestResult('路径分隔符处理', 'pass', '路径正确解析');
  } else {
    addTestResult('路径分隔符处理', 'fail', '路径解析失败');
  }
  
  // 测试文件名大小写敏感性
  const packageJsonPath = 'package.json';
  const packageJsonPathUpper = 'PACKAGE.JSON';
  
  if (fs.existsSync(packageJsonPath)) {
    if (os.platform() === 'win32' && fs.existsSync(packageJsonPathUpper)) {
      addTestResult('文件名大小写', 'warning', 'Windows系统不区分大小写');
    } else {
      addTestResult('文件名大小写', 'pass', '文件名处理正确');
    }
  }
  
  // 测试长文件名支持
  const longFileName = 'a'.repeat(200) + '.txt';
  const longFilePath = path.join(os.tmpdir(), longFileName);
  
  try {
    fs.writeFileSync(longFilePath, 'test');
    fs.unlinkSync(longFilePath);
    addTestResult('长文件名支持', 'pass', '支持长文件名');
  } catch (error) {
    addTestResult('长文件名支持', 'warning', '长文件名可能有限制');
  }
}

// 检查UI组件兼容性
function testUICompatibility() {
  logStep('UI COMPATIBILITY', '测试UI组件兼容性...');
  
  // 检查CSS文件
  const cssFiles = [
    'src/App.css',
    'tailwind.config.js'
  ];
  
  cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查是否使用了平台特定的CSS
      if (content.includes('-webkit-') || content.includes('-moz-') || content.includes('-ms-')) {
        addTestResult(`CSS前缀 (${file})`, 'warning', '包含浏览器特定前缀');
      } else {
        addTestResult(`CSS前缀 (${file})`, 'pass', '无浏览器特定前缀');
      }
      
      // 检查字体兼容性
      if (content.includes('font-family')) {
        if (content.includes('system-ui') || content.includes('sans-serif')) {
          addTestResult(`字体兼容性 (${file})`, 'pass', '使用系统字体');
        } else {
          addTestResult(`字体兼容性 (${file})`, 'warning', '可能使用特定字体');
        }
      }
    }
  });
  
  // 检查图标资源
  const iconDir = 'src-tauri/icons';
  if (fs.existsSync(iconDir)) {
    const icons = fs.readdirSync(iconDir);
    const requiredIcons = ['icon.ico', 'icon.icns', '32x32.png', '128x128.png'];
    
    requiredIcons.forEach(icon => {
      if (icons.includes(icon)) {
        addTestResult(`图标资源 (${icon})`, 'pass', '图标存在');
      } else {
        addTestResult(`图标资源 (${icon})`, 'fail', '缺少必需图标');
      }
    });
  } else {
    addTestResult('图标目录', 'fail', '图标目录不存在');
  }
}

// 检查依赖兼容性
function testDependencyCompatibility() {
  logStep('DEPENDENCIES', '测试依赖兼容性...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // 检查关键依赖
  const criticalDeps = [
    '@tauri-apps/api',
    '@tauri-apps/cli',
    'react',
    'react-dom',
    'typescript',
    'vite'
  ];
  
  criticalDeps.forEach(dep => {
    if (dependencies[dep]) {
      addTestResult(`关键依赖 (${dep})`, 'pass', `版本: ${dependencies[dep]}`);
    } else {
      addTestResult(`关键依赖 (${dep})`, 'fail', '缺少关键依赖');
    }
  });
  
  // 检查可能有平台兼容性问题的依赖
  const platformSpecificDeps = ['node-gyp', 'native-modules', 'electron'];
  
  platformSpecificDeps.forEach(dep => {
    if (dependencies[dep]) {
      addTestResult(`平台特定依赖 (${dep})`, 'warning', '可能有平台兼容性问题');
    }
  });
}

// 检查构建配置兼容性
function testBuildConfigCompatibility() {
  logStep('BUILD CONFIG', '测试构建配置兼容性...');
  
  // 检查Tauri配置
  const tauriConfigPath = 'src-tauri/tauri.conf.json';
  if (fs.existsSync(tauriConfigPath)) {
    const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
    
    // 检查bundle配置
    if (tauriConfig.bundle) {
      if (tauriConfig.bundle.targets === 'all') {
        addTestResult('构建目标', 'pass', '配置为构建所有平台');
      } else {
        addTestResult('构建目标', 'warning', '未配置构建所有平台');
      }
      
      // 检查平台特定配置
      const platforms = ['windows', 'macOS', 'linux'];
      platforms.forEach(platform => {
        if (tauriConfig.bundle[platform]) {
          addTestResult(`${platform}配置`, 'pass', '存在平台特定配置');
        } else {
          addTestResult(`${platform}配置`, 'warning', '缺少平台特定配置');
        }
      });
    }
    
    // 检查窗口配置
    if (tauriConfig.app && tauriConfig.app.windows) {
      const windowConfig = tauriConfig.app.windows[0];
      if (windowConfig.minWidth && windowConfig.minHeight) {
        addTestResult('窗口最小尺寸', 'pass', '设置了最小窗口尺寸');
      } else {
        addTestResult('窗口最小尺寸', 'warning', '未设置最小窗口尺寸');
      }
    }
  } else {
    addTestResult('Tauri配置', 'fail', 'Tauri配置文件不存在');
  }
  
  // 检查Vite配置
  const viteConfigPath = 'vite.config.ts';
  if (fs.existsSync(viteConfigPath)) {
    addTestResult('Vite配置', 'pass', 'Vite配置文件存在');
  } else {
    addTestResult('Vite配置', 'warning', 'Vite配置文件不存在');
  }
}

// 检查性能相关配置
function testPerformanceCompatibility() {
  logStep('PERFORMANCE', '测试性能相关配置...');
  
  // 检查是否有性能优化配置
  const viteConfigPath = 'vite.config.ts';
  if (fs.existsSync(viteConfigPath)) {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    if (viteConfig.includes('rollupOptions')) {
      addTestResult('构建优化', 'pass', '配置了Rollup优化选项');
    } else {
      addTestResult('构建优化', 'warning', '未配置构建优化');
    }
    
    if (viteConfig.includes('chunkSizeWarningLimit')) {
      addTestResult('包大小限制', 'pass', '配置了包大小警告');
    } else {
      addTestResult('包大小限制', 'warning', '未配置包大小限制');
    }
  }
  
  // 检查图片资源优化
  const publicDir = 'public';
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir, { recursive: true });
    const imageFiles = files.filter(file => 
      typeof file === 'string' && /\.(png|jpg|jpeg|gif|svg)$/i.test(file)
    );
    
    if (imageFiles.length > 0) {
      addTestResult('图片资源', 'pass', `发现 ${imageFiles.length} 个图片文件`);
    } else {
      addTestResult('图片资源', 'warning', '未发现图片资源');
    }
  }
}

// 检查安全配置
function testSecurityCompatibility() {
  logStep('SECURITY', '测试安全配置...');
  
  const tauriConfigPath = 'src-tauri/tauri.conf.json';
  if (fs.existsSync(tauriConfigPath)) {
    const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
    
    // 检查CSP配置
    if (tauriConfig.app && tauriConfig.app.security) {
      if (tauriConfig.app.security.csp) {
        addTestResult('CSP配置', 'pass', '配置了内容安全策略');
      } else {
        addTestResult('CSP配置', 'warning', '未配置内容安全策略');
      }
    }
    
    // 检查权限配置
    if (tauriConfig.app && tauriConfig.app.allowlist) {
      addTestResult('权限配置', 'pass', '配置了API权限');
    } else {
      addTestResult('权限配置', 'warning', '未明确配置API权限');
    }
  }
}

// 生成测试报告
function generateTestReport() {
  logStep('REPORT', '生成测试报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    platform: {
      os: os.platform(),
      arch: os.arch(),
      version: os.release(),
      node: process.version
    },
    summary: {
      total: testResults.tests.length,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings
    },
    tests: testResults.tests
  };
  
  const reportPath = 'platform-compatibility-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('\n' + '='.repeat(60), 'cyan');
  log('跨平台兼容性测试报告', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`测试平台: ${report.platform.os} ${report.platform.arch}`, 'blue');
  log(`Node.js版本: ${report.platform.node}`, 'blue');
  log(`测试时间: ${new Date(report.timestamp).toLocaleString()}`, 'blue');
  
  log('\n测试结果统计:', 'bright');
  log(`总测试数: ${report.summary.total}`, 'blue');
  log(`通过: ${report.summary.passed}`, 'green');
  log(`失败: ${report.summary.failed}`, 'red');
  log(`警告: ${report.summary.warnings}`, 'yellow');
  
  const successRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);
  log(`成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  log(`\n详细报告已保存到: ${reportPath}`, 'cyan');
  
  // 返回测试是否通过
  return report.summary.failed === 0;
}

// 主测试流程
function main() {
  log('🧪 Photo Metadata Overlay 跨平台兼容性测试', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    testFileSystemCompatibility();
    testUICompatibility();
    testDependencyCompatibility();
    testBuildConfigCompatibility();
    testPerformanceCompatibility();
    testSecurityCompatibility();
    
    const success = generateTestReport();
    
    if (success) {
      logSuccess('所有关键测试通过！');
      process.exit(0);
    } else {
      logError('存在关键问题需要修复！');
      process.exit(1);
    }
  } catch (error) {
    logError(`测试过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = {
  testFileSystemCompatibility,
  testUICompatibility,
  testDependencyCompatibility,
  testBuildConfigCompatibility,
  testPerformanceCompatibility,
  testSecurityCompatibility,
  generateTestReport
};