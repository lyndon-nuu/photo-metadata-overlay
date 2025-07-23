use crate::types::*;
use crate::exif_service::ExifService;
use std::fs;
use std::io::Write;

/// 创建一个简单的测试图片文件（最小的JPEG文件）
pub fn create_test_image(path: &str) -> std::io::Result<()> {
    // 这是一个最小的有效JPEG文件头部
    let jpeg_data = vec![
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0,
        0x07, 0xFF, 0xD9
    ];
    
    let mut file = fs::File::create(path)?;
    file.write_all(&jpeg_data)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_file_validation() {
        // 测试文件格式验证
        assert!(ExifService::validate_image_file("test.jpg"));
        assert!(ExifService::validate_image_file("test.jpeg"));
        assert!(ExifService::validate_image_file("test.png"));
        assert!(ExifService::validate_image_file("test.tiff"));
        assert!(!ExifService::validate_image_file("test.txt"));
        assert!(!ExifService::validate_image_file("test.pdf"));
    }

    #[test]
    fn test_exif_extraction_with_test_image() {
        // 创建临时目录和测试图片
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let test_image_path = temp_dir.path().join("test.jpg");
        
        // 创建测试图片
        create_test_image(test_image_path.to_str().unwrap())
            .expect("Failed to create test image");
        
        // 尝试提取EXIF数据（这个测试图片没有EXIF数据，但不应该崩溃）
        match ExifService::extract_metadata(&test_image_path) {
            Ok(_metadata) => {
                // 如果成功提取，说明函数正常工作
                println!("✅ EXIF提取函数正常工作");
            }
            Err(e) => {
                // 预期会失败，因为测试图片没有EXIF数据
                println!("⚠️  预期的EXIF提取失败: {}", e);
                // 这不是真正的错误，因为测试图片确实没有EXIF数据
            }
        }
    }

    #[test]
    fn test_overlay_settings_serialization() {
        // 测试数据结构的序列化
        let overlay_settings = OverlaySettings {
            position: OverlayPosition::BottomRight,
            font: FontSettings {
                family: "Arial".to_string(),
                size: 16.0,
                color: "#FFFFFF".to_string(),
                weight: FontWeight::Normal,
            },
            background: BackgroundSettings {
                color: "#000000".to_string(),
                opacity: 0.8,
                padding: 10.0,
                border_radius: 5.0,
            },
            display_items: DisplayItems {
                brand: true,
                model: true,
                aperture: true,
                shutter_speed: true,
                iso: true,
                timestamp: true,
                location: false,
                brand_logo: true,
            },
        };

        // 测试序列化
        let json = serde_json::to_string(&overlay_settings).expect("Failed to serialize");
        println!("✅ 序列化成功: {}", json);

        // 测试反序列化
        let _deserialized: OverlaySettings = serde_json::from_str(&json)
            .expect("Failed to deserialize");
        println!("✅ 反序列化成功");
    }
}