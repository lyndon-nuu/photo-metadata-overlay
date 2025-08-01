# 自定义拖拽布局调试指南 - 更新版

## 问题状态

### ✅ 已修复的问题：
1. **编译错误** - 修复了所有 TypeScript 编译错误
2. **元素创建逻辑** - 改进了默认元素创建，不再依赖真实 EXIF 数据
3. **元素定位** - 修复了 DraggableMetadataItem 的定位问题
4. **预览更新** - 优化了 useImagePreview hook 的依赖关系

### 🔧 当前正在修复的问题：
1. **编辑模式下元素消失** - 元素创建了但可能不可见
2. **完成编辑后预览空白** - 图像处理可能没有正确处理自定义布局

## 最新修复内容

### 1. CustomLayoutEditor 改进
- ✅ 添加了详细的调试信息显示
- ✅ 修复了 createDefaultElements 函数，不再依赖真实 EXIF 数据
- ✅ 为每个启用的显示项创建演示元素

### 2. DraggableMetadataItem 定位修复
- ✅ 移除了 Framer Motion 的 x/y 动画属性冲突
- ✅ 改用 CSS left/top 百分比定位
- ✅ 保持了拖拽和选择功能

### 3. useImagePreview Hook 优化
- ✅ 修复了设置变化检测逻辑
- ✅ 使用 settingsHash 确保所有变化都被检测到
- ✅ 优化了缓存机制

## 测试步骤

### 步骤 1: 启动应用
```bash\ncd photo-metadata-overlay\nnpm run tauri dev\n```\n\n### 步骤 2: 基础功能测试\n1. 选择一张照片\n2. 在设置面板中确保勾选了一些显示项（品牌、型号、光圈等）\n3. 点击\"自定义拖拽\"按钮\n4. **预期结果**：应该能看到元数据信息叠加在图片上\n\n### 步骤 3: 编辑模式测试\n1. 在自定义布局模式下，点击\"编辑布局\"按钮\n2. **观察调试信息**：左上角应该显示\"元素数量: X\"和\"显示项: ...\"\n3. **预期结果**：应该能看到可拖拽的元素，每个元素都有半透明背景\n4. **Console 输出**：应该看到类似这样的日志：\n   ```\n   Creating default elements with displayItems: {...}\n   Created elements: [...]\n   Rendering element in CustomLayoutEditor: {...}\n   ```\n\n### 步骤 4: 拖拽功能测试\n1. 尝试拖拽任意一个元素\n2. **预期结果**：元素应该跟随鼠标移动\n3. 释放鼠标后，元素应该停留在新位置\n4. 点击元素应该选中它（显示蓝色边框和控制点）\n\n### 步骤 5: 完成编辑测试\n1. 拖拽几个元素到不同位置\n2. 点击\"完成编辑\"按钮\n3. **预期结果**：应该回到预览模式，显示带有新位置的元数据叠加\n4. **Console 输出**：应该看到图像处理的日志\n\n## 调试信息说明\n\n### 界面调试信息\n- **左上角黑色框**：显示元素数量和启用的显示项\n- **元素选中状态**：蓝色边框、控制点和类型标签\n- **编辑模式提示**：蓝色提示框显示当前在编辑模式\n\n### Console 日志关键信息\n```\n✅ 正常流程应该看到：\n1. Creating default elements with displayItems: {...}\n2. Created elements: [array of elements]\n3. Rendering element in CustomLayoutEditor: {...}\n4. DraggableMetadataItem [elementId] text: [text content]\n5. ⚡ 设置变化，触发预览更新\n6. 🎨 开始纯前端高质量图像处理...\n7. ✅ 纯前端处理完成\n```\n\n## 常见问题诊断\n\n### 问题 1: 编辑模式下看不到元素\n**可能原因**：\n- 元素数量为 0（检查调试信息）\n- 元素位置超出可视区域\n- 元素文本为空\n\n**解决方案**：\n1. 检查 Console 中的 \"Created elements\" 日志\n2. 确保在设置面板中勾选了显示项\n3. 尝试重新切换布局模式\n\n### 问题 2: 元素创建了但不可见\n**可能原因**：\n- CSS 定位问题\n- z-index 层级问题\n- 容器尺寸问题\n\n**解决方案**：\n1. 检查元素的 position 值是否在 0-100 范围内\n2. 在浏览器开发者工具中检查元素的实际位置\n3. 尝试手动调整元素位置\n\n### 问题 3: 完成编辑后预览空白\n**可能原因**：\n- 图像处理服务没有正确处理自定义布局\n- 缓存问题\n- 设置更新没有触发重新处理\n\n**解决方案**：\n1. 检查 Console 中是否有图像处理的错误信息\n2. 尝试刷新页面重新开始\n3. 检查 renderCustomLayout 方法是否被调用\n\n## 下一步调试计划\n\n如果问题仍然存在，请提供以下信息：\n1. **Console 完整日志**：从选择照片到完成编辑的所有日志\n2. **调试信息截图**：显示元素数量和显示项的黑色调试框\n3. **具体问题描述**：在哪一步出现问题，看到了什么现象\n4. **浏览器开发者工具**：Elements 标签页中 CustomLayoutEditor 的 DOM 结构\n\n这将帮助我进一步定位和解决问题。\n\n## 临时解决方案\n\n如果编辑模式仍有问题，可以尝试：\n1. 使用\"预设布局\"模式作为替代\n2. 刷新页面重新开始\n3. 尝试不同的照片文件\n4. 检查浏览器控制台是否有 JavaScript 错误\n\n---\n\n**更新时间**: $(date)\n**修复版本**: v2.0\n**状态**: 等待用户测试反馈"}