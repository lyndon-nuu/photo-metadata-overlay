use crate::types::*;
use anyhow::{Context, Result};
use image::{DynamicImage, Rgba, RgbaImage, GenericImageView, ImageFormat};
use imageproc::drawing::{draw_filled_rect_mut, draw_text_mut};
use imageproc::rect::Rect;
use rusttype::{Font, Scale};
use std::path::Path;
use std::time::Instant;

pub struct ImageProcessingService;

impl ImageProcessingService {
    /// 处理单张图片
    pub async fn process_image(
        input_path: &str,
        metadata: PhotoMetadata,
        overlay_settings: OverlaySettings,
        frame_settings: FrameSettings,
        output_path: &str,
        quality: u8,
    ) -> Result<ProcessedImageInfo> {
        let start_time = Instant::now();
        
        // 获取原始文件大小
        let original_size = std::fs::metadata(input_path)
            .with_context(|| format!("Failed to get metadata for {}", input_path))?
            .len();

        // 加载图片
        let mut img = image::open(input_path)
            .with_context(|| format!("Failed to open image: {}", input_path))?;

        // 应用元数据叠加（先应用叠加，避免被相框遮挡）
        img = Self::apply_overlay(img, &metadata, &overlay_settings)?;

        // 应用相框效果（后应用相框，确保叠加内容不被遮挡）
        if frame_settings.enabled {
            img = Self::apply_frame(img, &frame_settings)?;
        }

        // 保存处理后的图片
        Self::save_image(&img, output_path, &overlay_settings.display_items, quality)?;

        // 获取处理后文件大小
        let processed_size = std::fs::metadata(output_path)
            .with_context(|| format!("Failed to get metadata for {}", output_path))?
            .len();

        let processing_time = start_time.elapsed().as_millis() as u64;

        Ok(ProcessedImageInfo {
            input_path: input_path.to_string(),
            output_path: output_path.to_string(),
            original_size,
            processed_size,
            processing_time_ms: processing_time,
        })
    }

    /// 批量处理图片
    pub async fn batch_process_images(
        image_paths: Vec<String>,
        settings: ProcessingSettings,
        output_dir: &str,
    ) -> Result<BatchProcessingResult> {
        let start_time = Instant::now();
        let mut successful = Vec::new();
        let mut failed = Vec::new();

        for input_path in image_paths.iter() {
            // 生成输出文件名
            let input_file = Path::new(input_path);
            let file_stem = input_file.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("processed");
            
            let extension = match settings.output_format {
                OutputFormat::Jpeg => "jpg",
                OutputFormat::Png => "png",
            };
            
            let output_path = format!("{}/{}_processed.{}", output_dir, file_stem, extension);

            // 提取EXIF数据
            match crate::exif_service::ExifService::extract_metadata(input_path) {
                Ok(metadata) => {
                    // 处理图片
                    match Self::process_image(
                        input_path,
                        metadata,
                        settings.overlay_settings.clone(),
                        settings.frame_settings.clone(),
                        &output_path,
                        settings.quality,
                    ).await {
                        Ok(result) => successful.push(result),
                        Err(e) => failed.push(ProcessingError {
                            file_path: input_path.clone(),
                            error_message: e.to_string(),
                            error_type: ErrorType::ImageProcessingError,
                        }),
                    }
                }
                Err(e) => failed.push(ProcessingError {
                    file_path: input_path.clone(),
                    error_message: e.to_string(),
                    error_type: ErrorType::ExifReadError,
                }),
            }
        }

        let total_time = start_time.elapsed().as_millis() as u64;

        Ok(BatchProcessingResult {
            total_files: image_paths.len(),
            successful,
            failed,
            total_time_ms: total_time,
        })
    }

    /// 生成预览图片
    pub async fn generate_preview(
        image_path: &str,
        settings: PreviewSettings,
    ) -> Result<Vec<u8>> {
        // 加载图片
        let img = image::open(image_path)
            .with_context(|| format!("Failed to open image: {}", image_path))?;

        // 缩放到预览尺寸
        let preview_img = img.resize(
            settings.max_width,
            settings.max_height,
            image::imageops::FilterType::Lanczos3,
        );

        // 提取EXIF数据
        let metadata = crate::exif_service::ExifService::extract_metadata(image_path)?;

        // 应用叠加效果（先应用叠加，避免被相框遮挡）
        let mut processed_img = Self::apply_overlay(preview_img, &metadata, &settings.overlay_settings)?;

        // 应用相框效果（后应用相框，确保叠加内容不被遮挡）
        if settings.frame_settings.enabled {
            processed_img = Self::apply_frame(processed_img, &settings.frame_settings)?;
        }

        // 转换为字节数组
        let mut buffer = Vec::new();
        processed_img.write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageOutputFormat::Png)
            .with_context(|| "Failed to encode preview image")?;

        Ok(buffer)
    }

    /// 应用相框效果
    fn apply_frame(img: DynamicImage, frame_settings: &FrameSettings) -> Result<DynamicImage> {
        let (width, height) = img.dimensions();
        let frame_width = frame_settings.width as u32;
        
        // 创建新的画布，尺寸包含相框
        let new_width = width + 2 * frame_width;
        let new_height = height + 2 * frame_width;
        
        let mut canvas = RgbaImage::new(new_width, new_height);
        
        // 解析相框颜色
        let frame_color = Self::parse_color(&frame_settings.color, frame_settings.opacity)?;
        
        // 根据相框样式绘制
        match frame_settings.style {
            FrameStyle::Simple => {
                // 填充整个画布为相框颜色
                for pixel in canvas.pixels_mut() {
                    *pixel = frame_color;
                }
            }
            FrameStyle::Shadow => {
                // 简单的阴影效果
                Self::draw_shadow_frame(&mut canvas, frame_width, &frame_color)?;
            }
            FrameStyle::Film => {
                // 胶片风格相框
                Self::draw_film_frame(&mut canvas, frame_width, &frame_color)?;
            }
            FrameStyle::Polaroid => {
                // 宝丽来风格相框
                Self::draw_polaroid_frame(&mut canvas, frame_width, &frame_color)?;
            }
            FrameStyle::Vintage => {
                // 复古风格相框
                Self::draw_vintage_frame(&mut canvas, frame_width, &frame_color)?;
            }
        }
        
        // 将原图片粘贴到画布中心
        image::imageops::overlay(&mut canvas, &img.to_rgba8(), frame_width as i64, frame_width as i64);
        
        Ok(DynamicImage::ImageRgba8(canvas))
    }

    /// 应用元数据叠加
    fn apply_overlay(
        img: DynamicImage,
        metadata: &PhotoMetadata,
        overlay_settings: &OverlaySettings,
    ) -> Result<DynamicImage> {
        let mut img_rgba = img.to_rgba8();
        
        // 生成要显示的文本
        let overlay_text = Self::generate_overlay_text(metadata, &overlay_settings.display_items);
        
        if overlay_text.is_empty() {
            return Ok(DynamicImage::ImageRgba8(img_rgba));
        }
        
        // 尝试加载字体
        match Self::load_font() {
            Ok(font) => {
                // 字体加载成功，进行文本渲染
                let scale = Scale::uniform(overlay_settings.font.size);
                let font_color = Self::parse_color(&overlay_settings.font.color, 1.0)?;
                
                // 计算文本尺寸
                let text_width = Self::calculate_text_width(&font, scale, &overlay_text);
                let text_height = overlay_settings.font.size as u32;
                
                // 计算叠加位置
                let (x, y) = Self::calculate_overlay_position(
                    &overlay_settings.position,
                    img_rgba.width(),
                    img_rgba.height(),
                    text_width,
                    text_height,
                    overlay_settings.background.padding as u32,
                );
                
                // 绘制背景
                if overlay_settings.background.opacity > 0.0 {
                    let bg_color = Self::parse_color(
                        &overlay_settings.background.color,
                        overlay_settings.background.opacity,
                    )?;
                    
                    let bg_rect = Rect::at(x as i32, y as i32).of_size(
                        text_width + 2 * overlay_settings.background.padding as u32,
                        text_height + 2 * overlay_settings.background.padding as u32,
                    );
                    
                    draw_filled_rect_mut(&mut img_rgba, bg_rect, bg_color);
                }
                
                // 绘制文本
                draw_text_mut(
                    &mut img_rgba,
                    font_color,
                    (x + overlay_settings.background.padding as u32) as i32,
                    (y + overlay_settings.background.padding as u32) as i32,
                    scale,
                    &font,
                    &overlay_text,
                );
                
                println!("✅ Successfully rendered text: {}", overlay_text);
            }
            Err(e) => {
                // 字体加载失败，记录错误但不中断处理
                println!("⚠️ Font loading failed: {}, continuing without text overlay", e);
                println!("📝 Text would be: {}", overlay_text);
            }
        }
        
        Ok(DynamicImage::ImageRgba8(img_rgba))
    }
    
    /// 加载字体文件
    fn load_font() -> Result<Font<'static>> {
        // 尝试多种字体加载方式
        
        // 方法1: 尝试加载内嵌字体
        let font_data = include_bytes!("../assets/fonts/DejaVuSans.ttf");
        if let Some(font) = Font::try_from_bytes(font_data as &[u8]) {
            return Ok(font);
        }
        
        // 方法2: 尝试使用一个更小的内嵌字体数据
        // 如果DejaVu字体有问题，我们可以尝试创建一个最小的字体
        println!("DejaVu font failed, trying alternative approach...");
        
        // 方法3: 使用系统字体路径（Linux）
        let system_font_paths = vec![
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/TTF/DejaVuSans.ttf",
            "/System/Library/Fonts/Arial.ttf", // macOS
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ];
        
        for font_path in system_font_paths {
            if let Ok(font_data) = std::fs::read(font_path) {
                if let Some(font) = Font::try_from_vec(font_data) {
                    println!("Successfully loaded system font: {}", font_path);
                    return Ok(font);
                }
            }
        }
        
        Err(anyhow::anyhow!("Failed to load any font"))
    }

    /// 生成叠加文本
    fn generate_overlay_text(metadata: &PhotoMetadata, display_items: &DisplayItems) -> String {
        let mut lines = Vec::new();
        
        // 按照与前端相同的优先级顺序排列：brand, model, aperture, shutterSpeed, iso, timestamp, location
        
        // 1. 相机品牌
        if display_items.brand {
            if let Some(make) = &metadata.camera.make {
                lines.push(make.clone());
            }
        }
        
        // 2. 相机型号
        if display_items.model {
            if let Some(model) = &metadata.camera.model {
                lines.push(model.clone());
            }
        }
        
        // 3. 光圈
        if display_items.aperture {
            if let Some(aperture) = &metadata.settings.aperture {
                lines.push(aperture.clone());
            }
        }
        
        // 4. 快门速度
        if display_items.shutter_speed {
            if let Some(shutter) = &metadata.settings.shutter_speed {
                lines.push(shutter.clone());
            }
        }
        
        // 5. ISO
        if display_items.iso {
            if let Some(iso) = metadata.settings.iso {
                lines.push(format!("ISO {}", iso));
            }
        }
        
        // 6. 时间戳
        if display_items.timestamp {
            if let Some(timestamp) = &metadata.timestamp {
                lines.push(timestamp.clone());
            }
        }
        
        // 7. 位置信息（如果有的话）
        // TODO: 添加位置信息支持
        
        // 注意：焦距信息暂时不在前端的优先级列表中，所以这里也不包含
        
        lines.join("\n")
    }

    /// 计算叠加位置
    fn calculate_overlay_position(
        position: &OverlayPosition,
        img_width: u32,
        img_height: u32,
        text_width: u32,
        text_height: u32,
        padding: u32,
    ) -> (u32, u32) {
        match position {
            OverlayPosition::TopLeft => (padding, padding),
            OverlayPosition::TopRight => (img_width - text_width - padding, padding),
            OverlayPosition::BottomLeft => (padding, img_height - text_height - padding),
            OverlayPosition::BottomRight => (
                img_width - text_width - padding,
                img_height - text_height - padding,
            ),
        }
    }

    /// 计算文本宽度
    fn calculate_text_width(font: &Font, scale: Scale, text: &str) -> u32 {
        let v_metrics = font.v_metrics(scale);
        let glyphs: Vec<_> = font.layout(text, scale, rusttype::point(0.0, v_metrics.ascent)).collect();
        
        if let (Some(first), Some(last)) = (glyphs.first(), glyphs.last()) {
            let width = last.position().x + last.unpositioned().h_metrics().advance_width - first.position().x;
            width.ceil() as u32
        } else {
            0
        }
    }

    /// 解析颜色字符串
    fn parse_color(color_str: &str, opacity: f32) -> Result<Rgba<u8>> {
        // 处理 RGBA 格式: rgba(r, g, b, a)
        if color_str.starts_with("rgba(") && color_str.ends_with(")") {
            let inner = &color_str[5..color_str.len()-1]; // 移除 "rgba(" 和 ")"
            let parts: Vec<&str> = inner.split(',').map(|s| s.trim()).collect();
            
            if parts.len() == 4 {
                let r = parts[0].parse::<u8>()
                    .with_context(|| "Invalid red component in RGBA")?;
                let g = parts[1].parse::<u8>()
                    .with_context(|| "Invalid green component in RGBA")?;
                let b = parts[2].parse::<u8>()
                    .with_context(|| "Invalid blue component in RGBA")?;
                let a = (parts[3].parse::<f32>()
                    .with_context(|| "Invalid alpha component in RGBA")? * 255.0) as u8;
                
                return Ok(Rgba([r, g, b, a]));
            }
        }
        
        // 处理 RGB 格式: rgb(r, g, b)
        if color_str.starts_with("rgb(") && color_str.ends_with(")") {
            let inner = &color_str[4..color_str.len()-1]; // 移除 "rgb(" 和 ")"
            let parts: Vec<&str> = inner.split(',').map(|s| s.trim()).collect();
            
            if parts.len() == 3 {
                let r = parts[0].parse::<u8>()
                    .with_context(|| "Invalid red component in RGB")?;
                let g = parts[1].parse::<u8>()
                    .with_context(|| "Invalid green component in RGB")?;
                let b = parts[2].parse::<u8>()
                    .with_context(|| "Invalid blue component in RGB")?;
                let a = (opacity * 255.0) as u8;
                
                return Ok(Rgba([r, g, b, a]));
            }
        }
        
        // 处理十六进制格式: #RRGGBB
        let hex_str = color_str.trim_start_matches('#');
        if hex_str.len() == 6 {
            let r = u8::from_str_radix(&hex_str[0..2], 16)
                .with_context(|| "Invalid red component in hex")?;
            let g = u8::from_str_radix(&hex_str[2..4], 16)
                .with_context(|| "Invalid green component in hex")?;
            let b = u8::from_str_radix(&hex_str[4..6], 16)
                .with_context(|| "Invalid blue component in hex")?;
            let a = (opacity * 255.0) as u8;
            
            return Ok(Rgba([r, g, b, a]));
        }
        
        Err(anyhow::anyhow!("Invalid color format: {}. Supported formats: rgba(r,g,b,a), rgb(r,g,b), #RRGGBB", color_str))
    }

    /// 保存图片
    fn save_image(
        img: &DynamicImage,
        output_path: &str,
        _display_items: &DisplayItems,
        quality: u8,
    ) -> Result<()> {
        let output_path = Path::new(output_path);
        
        // 根据文件扩展名确定格式
        let format = match output_path.extension().and_then(|s| s.to_str()) {
            Some("jpg") | Some("jpeg") => ImageFormat::Jpeg,
            Some("png") => ImageFormat::Png,
            _ => ImageFormat::Jpeg,
        };
        
        // 对于JPEG格式，需要特殊处理质量设置
        if format == ImageFormat::Jpeg {
            let mut buffer = Vec::new();
            img.write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageOutputFormat::Jpeg(quality))
                .with_context(|| "Failed to encode JPEG image")?;
            std::fs::write(output_path, buffer)
                .with_context(|| format!("Failed to write image to {}", output_path.display()))?;
        } else {
            img.save_with_format(output_path, format)
                .with_context(|| format!("Failed to save image to {}", output_path.display()))?;
        }
        
        Ok(())
    }

    // 相框绘制辅助方法
    fn draw_shadow_frame(canvas: &mut RgbaImage, _frame_width: u32, color: &Rgba<u8>) -> Result<()> {
        // 简单的阴影效果实现
        for pixel in canvas.pixels_mut() {
            *pixel = *color;
        }
        Ok(())
    }

    fn draw_film_frame(canvas: &mut RgbaImage, _frame_width: u32, color: &Rgba<u8>) -> Result<()> {
        // 胶片风格相框实现
        for pixel in canvas.pixels_mut() {
            *pixel = *color;
        }
        Ok(())
    }

    fn draw_polaroid_frame(canvas: &mut RgbaImage, _frame_width: u32, color: &Rgba<u8>) -> Result<()> {
        // 宝丽来风格相框实现
        for pixel in canvas.pixels_mut() {
            *pixel = *color;
        }
        Ok(())
    }

    fn draw_vintage_frame(canvas: &mut RgbaImage, _frame_width: u32, color: &Rgba<u8>) -> Result<()> {
        // 复古风格相框实现
        for pixel in canvas.pixels_mut() {
            *pixel = *color;
        }
        Ok(())
    }


}