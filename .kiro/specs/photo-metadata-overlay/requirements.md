# Requirements Document

## Introduction

本功能旨在开发一个跨平台桌面应用程序，能够自动读取照片的EXIF数据并在图片上叠加拍摄信息。该工具将支持批量处理，提供可自定义的叠加样式，并确保在Windows、macOS和Linux系统上都能正常运行。

## Requirements

### Requirement 1

**User Story:** 作为一名摄影爱好者，我希望能够自动在我的照片上添加拍摄参数信息，这样我就可以轻松地分享带有技术细节的作品。

#### Acceptance Criteria

1. WHEN 用户选择一张或多张照片 THEN 系统 SHALL 自动读取照片的EXIF数据
2. WHEN 系统读取到EXIF数据 THEN 系统 SHALL 提取相机品牌、型号、光圈、快门速度、ISO、拍摄时间和GPS位置信息
3. WHEN 提取完成后 THEN 系统 SHALL 在照片上叠加这些信息并生成新的图片文件
4. IF 照片缺少某些EXIF信息 THEN 系统 SHALL 跳过缺失的信息项而不是报错

### Requirement 2

**User Story:** 作为用户，我希望能够自定义叠加信息的样式和位置，这样我就可以根据不同的照片调整最佳的显示效果。

#### Acceptance Criteria

1. WHEN 用户访问设置界面 THEN 系统 SHALL 提供字体、颜色、大小和透明度的自定义选项
2. WHEN 用户选择叠加位置 THEN 系统 SHALL 支持左上、右上、左下、右下四个角落的位置选择
3. WHEN 用户预览效果 THEN 系统 SHALL 实时显示叠加效果的预览
4. WHEN 用户保存设置 THEN 系统 SHALL 将设置应用到后续的所有处理操作

### Requirement 9

**User Story:** 作为用户，我希望能够通过拖拽的方式自定义每个元数据项的位置，这样我就可以根据照片内容灵活调整信息的摆放位置。

#### Acceptance Criteria

1. WHEN 用户进入自定义布局模式 THEN 系统 SHALL 将每个元数据项（ISO、光圈、快门等）显示为可拖拽的独立元素
2. WHEN 用户拖拽某个元数据项 THEN 系统 SHALL 实时显示该项在图片上的新位置
3. WHEN 用户释放拖拽 THEN 系统 SHALL 保存该元数据项的新位置坐标
4. WHEN 用户启用网格对齐功能 THEN 系统 SHALL 提供网格线辅助对齐，元素自动吸附到网格点
5. WHEN 用户重置布局 THEN 系统 SHALL 提供一键恢复到默认布局的功能
6. WHEN 用户保存自定义布局 THEN 系统 SHALL 支持将布局保存为预设模板供后续使用

### Requirement 3

**User Story:** 作为需要处理大量照片的用户，我希望能够批量处理多张照片，这样我就可以节省大量的手动操作时间。

#### Acceptance Criteria

1. WHEN 用户选择多张照片或整个文件夹 THEN 系统 SHALL 支持批量选择和处理
2. WHEN 开始批量处理 THEN 系统 SHALL 显示处理进度条和当前处理的文件名
3. WHEN 处理过程中遇到错误 THEN 系统 SHALL 记录错误信息但继续处理其他文件
4. WHEN 批量处理完成 THEN 系统 SHALL 显示处理结果摘要，包括成功和失败的文件数量

### Requirement 4

**User Story:** 作为跨平台用户，我希望这个工具能在我的Windows、macOS或Linux系统上都能正常运行，这样我就不需要为不同系统寻找不同的工具。

#### Acceptance Criteria

1. WHEN 用户在Windows系统上安装应用 THEN 系统 SHALL 提供.exe安装包并正常运行
2. WHEN 用户在macOS系统上安装应用 THEN 系统 SHALL 提供.dmg安装包并正常运行
3. WHEN 用户在Linux系统上安装应用 THEN 系统 SHALL 提供AppImage或.deb包并正常运行
4. WHEN 应用在任何支持的平台上运行 THEN 系统 SHALL 保持一致的用户界面和功能

### Requirement 5

**User Story:** 作为用户，我希望能够选择要显示的信息项目和相机品牌logo，这样我就可以根据需要定制显示内容。

#### Acceptance Criteria

1. WHEN 用户访问信息设置 THEN 系统 SHALL 提供可勾选的信息项列表（相机品牌、型号、光圈、快门、ISO、时间、地点）
2. WHEN 用户选择显示相机品牌logo THEN 系统 SHALL 从内置的品牌logo库中匹配并显示对应logo
3. WHEN 系统无法识别相机品牌 THEN 系统 SHALL 显示文字品牌名称而不是logo
4. WHEN 用户保存信息设置 THEN 系统 SHALL 只在照片上显示用户选中的信息项

### Requirement 6

**User Story:** 作为用户，我希望能够为照片添加装饰性的相框效果，这样我就可以让照片看起来更加专业和美观。

#### Acceptance Criteria

1. WHEN 用户访问相框设置 THEN 系统 SHALL 提供多种相框样式选择（简约边框、阴影效果、胶片风格、宝丽来风格等）
2. WHEN 用户选择相框样式 THEN 系统 SHALL 允许自定义相框的颜色、宽度和透明度
3. WHEN 用户启用相框功能 THEN 系统 SHALL 在照片周围添加选定的相框效果
4. WHEN 用户预览相框效果 THEN 系统 SHALL 实时显示相框和元数据叠加的组合效果

### Requirement 7

**User Story:** 作为用户，我希望处理后的照片质量不会明显下降，这样我就可以保持照片的专业品质。

#### Acceptance Criteria

1. WHEN 系统处理照片 THEN 系统 SHALL 保持原始照片的分辨率和色彩空间
2. WHEN 叠加信息到照片上 THEN 系统 SHALL 使用高质量的文字渲染避免锯齿
3. WHEN 保存处理后的照片 THEN 系统 SHALL 提供JPEG质量设置选项（80-100%）
4. WHEN 用户选择保存格式 THEN 系统 SHALL 支持JPEG和PNG格式输出

### Requirement 8

**User Story:** 作为用户，我希望图像处理能够在后端进行，这样我就可以获得更好的性能和图片质量。

#### Acceptance Criteria

1. WHEN 用户选择图片进行处理 THEN 系统 SHALL 将图片文件传输到Rust后端进行处理
2. WHEN 后端处理图片 THEN 系统 SHALL 使用高性能的图像处理库（如image-rs）保证质量
3. WHEN 处理完成后 THEN 系统 SHALL 将处理后的图片返回给前端显示
4. WHEN 批量处理时 THEN 系统 SHALL 在后端并行处理多张图片以提升效率
5. WHEN 处理大文件时 THEN 系统 SHALL 在后端管理内存使用避免前端崩溃