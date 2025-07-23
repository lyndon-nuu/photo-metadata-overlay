use crate::types::*;
use anyhow::{Context, Result};
use exif::{In, Tag, Value};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

pub struct ExifService;

impl ExifService {
    /// 从图片文件中提取EXIF元数据
    pub fn extract_metadata<P: AsRef<Path>>(file_path: P) -> Result<PhotoMetadata> {
        let file = File::open(&file_path)
            .with_context(|| format!("Failed to open file: {:?}", file_path.as_ref()))?;
        
        let mut buf_reader = BufReader::new(file);
        let exif_reader = exif::Reader::new();
        
        let exif_data = exif_reader
            .read_from_container(&mut buf_reader)
            .with_context(|| "Failed to read EXIF data")?;

        let mut metadata = PhotoMetadata {
            camera: CameraInfo {
                make: None,
                model: None,
            },
            settings: CameraSettings {
                aperture: None,
                shutter_speed: None,
                iso: None,
                focal_length: None,
            },
            timestamp: None,
            location: None,
        };

        // 提取相机信息
        if let Some(field) = exif_data.get_field(Tag::Make, In::PRIMARY) {
            metadata.camera.make = Self::field_to_string(field);
        }

        if let Some(field) = exif_data.get_field(Tag::Model, In::PRIMARY) {
            metadata.camera.model = Self::field_to_string(field);
        }

        // 提取拍摄设置
        if let Some(field) = exif_data.get_field(Tag::FNumber, In::PRIMARY) {
            metadata.settings.aperture = Self::format_aperture(field);
        }

        if let Some(field) = exif_data.get_field(Tag::ExposureTime, In::PRIMARY) {
            metadata.settings.shutter_speed = Self::format_shutter_speed(field);
        }

        if let Some(field) = exif_data.get_field(Tag::PhotographicSensitivity, In::PRIMARY) {
            metadata.settings.iso = Self::field_to_u32(field);
        }

        if let Some(field) = exif_data.get_field(Tag::FocalLength, In::PRIMARY) {
            metadata.settings.focal_length = Self::format_focal_length(field);
        }

        // 提取拍摄时间
        if let Some(field) = exif_data.get_field(Tag::DateTime, In::PRIMARY) {
            metadata.timestamp = Self::field_to_string(field);
        }

        // 提取GPS信息
        metadata.location = Self::extract_gps_info(&exif_data);

        Ok(metadata)
    }

    /// 验证图片文件格式
    pub fn validate_image_file<P: AsRef<Path>>(file_path: P) -> bool {
        let path = file_path.as_ref();
        
        // 检查文件扩展名
        if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            matches!(ext.as_str(), "jpg" | "jpeg" | "png" | "tiff" | "tif")
        } else {
            false
        }
    }

    /// 将EXIF字段转换为字符串
    fn field_to_string(field: &exif::Field) -> Option<String> {
        match &field.value {
            Value::Ascii(vec) => {
                if let Some(bytes) = vec.first() {
                    String::from_utf8(bytes.to_vec()).ok()
                } else {
                    None
                }
            }
            _ => Some(field.display_value().to_string()),
        }
    }

    /// 将EXIF字段转换为u32
    fn field_to_u32(field: &exif::Field) -> Option<u32> {
        match &field.value {
            Value::Short(vec) => vec.first().map(|&v| v as u32),
            Value::Long(vec) => vec.first().copied(),
            _ => None,
        }
    }

    /// 格式化光圈值
    fn format_aperture(field: &exif::Field) -> Option<String> {
        match &field.value {
            Value::Rational(vec) => {
                if let Some(rational) = vec.first() {
                    let f_number = rational.num as f64 / rational.denom as f64;
                    Some(format!("f/{:.1}", f_number))
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    /// 格式化快门速度
    fn format_shutter_speed(field: &exif::Field) -> Option<String> {
        match &field.value {
            Value::Rational(vec) => {
                if let Some(rational) = vec.first() {
                    let exposure_time = rational.num as f64 / rational.denom as f64;
                    if exposure_time >= 1.0 {
                        Some(format!("{}s", exposure_time as u32))
                    } else {
                        Some(format!("1/{}", (1.0_f64 / exposure_time).round() as u32))
                    }
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    /// 格式化焦距
    fn format_focal_length(field: &exif::Field) -> Option<String> {
        match &field.value {
            Value::Rational(vec) => {
                if let Some(rational) = vec.first() {
                    let focal_length = rational.num as f64 / rational.denom as f64;
                    Some(format!("{:.0}mm", focal_length))
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    /// 提取GPS信息
    fn extract_gps_info(exif_data: &exif::Exif) -> Option<LocationInfo> {
        let lat_ref = exif_data.get_field(Tag::GPSLatitudeRef, In::PRIMARY)?;
        let lat = exif_data.get_field(Tag::GPSLatitude, In::PRIMARY)?;
        let lon_ref = exif_data.get_field(Tag::GPSLongitudeRef, In::PRIMARY)?;
        let lon = exif_data.get_field(Tag::GPSLongitude, In::PRIMARY)?;

        let latitude = Self::parse_gps_coordinate(lat, lat_ref)?;
        let longitude = Self::parse_gps_coordinate(lon, lon_ref)?;

        Some(LocationInfo {
            latitude,
            longitude,
            address: None, // 地址解析需要额外的地理编码服务
        })
    }

    /// 解析GPS坐标
    fn parse_gps_coordinate(coord_field: &exif::Field, ref_field: &exif::Field) -> Option<f64> {
        let reference = Self::field_to_string(ref_field)?;
        
        match &coord_field.value {
            Value::Rational(vec) => {
                if vec.len() >= 3 {
                    let degrees = vec[0].num as f64 / vec[0].denom as f64;
                    let minutes = vec[1].num as f64 / vec[1].denom as f64;
                    let seconds = vec[2].num as f64 / vec[2].denom as f64;
                    
                    let mut coordinate = degrees + minutes / 60.0 + seconds / 3600.0;
                    
                    // 根据参考方向调整符号
                    if reference == "S" || reference == "W" {
                        coordinate = -coordinate;
                    }
                    
                    Some(coordinate)
                } else {
                    None
                }
            }
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_validate_image_file() {
        assert!(ExifService::validate_image_file("test.jpg"));
        assert!(ExifService::validate_image_file("test.jpeg"));
        assert!(ExifService::validate_image_file("test.png"));
        assert!(ExifService::validate_image_file("test.tiff"));
        assert!(!ExifService::validate_image_file("test.txt"));
        assert!(!ExifService::validate_image_file("test"));
    }
}