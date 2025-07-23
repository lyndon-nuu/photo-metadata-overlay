// 简单的前端测试脚本，用于测试后端API
// 这个脚本可以在浏览器控制台中运行

async function testBackendAPI() {
  console.log('🧪 开始测试后端图像处理API...');
  
  try {
    // 测试1: 验证图片文件格式
    console.log('📝 测试1: 验证图片文件格式');
    const isValidJpg = await window.__TAURI__.core.invoke('validate_image_file', {
      filePath: 'test.jpg'
    });
    const isValidTxt = await window.__TAURI__.core.invoke('validate_image_file', {
      filePath: 'test.txt'
    });
    console.log(`✅ JPG文件验证: ${isValidJpg} (应该为true)`);
    console.log(`✅ TXT文件验证: ${isValidTxt} (应该为false)`);
    
    // 测试2: 测试greet命令（基础连接测试）
    console.log('\n📝 测试2: 基础连接测试');
    const greeting = await window.__TAURI__.core.invoke('greet', {
      name: '图像处理测试'
    });
    console.log(`✅ 后端连接测试: ${greeting}`);
    
    console.log('\n🎉 后端API测试完成！');
    console.log('💡 提示: 要测试完整的图像处理功能，需要提供真实的图片文件路径');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果在Tauri环境中，自动运行测试
if (typeof window !== 'undefined' && window.__TAURI__) {
  testBackendAPI();
} else {
  console.log('⚠️  请在Tauri应用程序中运行此测试脚本');
}