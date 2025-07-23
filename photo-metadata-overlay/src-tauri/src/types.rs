use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 照片元数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhotoMetadata {
    pub camera: CameraInfo,
    pub settings: CameraSettings,
    pub timestamp: Option<String>,
    pub location: Option<LocationInfo>,
}

/// 相机信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraInfo {
    pub make: Option<String>,
    pub model: Option<String>,
}

/// 拍摄设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraSettings {
    pub aperture: Option<String>,
    pub shutter_speed: Option<String>,
    pub iso: Option<u32>,
    pub focal_length: Option<String>,
}

/// 位置信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationInfo {
    pub latitude: f64,
    pub longitude: f64,
    pub address: Option<String>,
}

/// 叠加设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlaySettings {
    pub position: OverlayPosition,
    pub font: FontSettings,
    pub background: BackgroundSettings,
    pub display_items: DisplayItems,
}

/// 叠加位置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OverlayPosition {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

/// 字体设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontSettings {
    pub family: String,
    pub size: f32,
    pub color: String, // RGB hex color
    pub weight: FontWeight,
}

/// 字体粗细
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FontWeight {
    Normal,
    Bold,
}

/// 背景设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundSettings {
    pub color: String, // RGBA hex color
    pub opacity: f32,
    pub padding: f32,
    pub border_radius: f32,
}

/// 显示项目设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayItems {
    pub brand: bool,
    pub model: bool,
    pub aperture: bool,
    pub shutter_speed: bool,
    pub iso: bool,
    pub timestamp: bool,
    pub location: bool,
    pub brand_logo: bool,
}

/// 相框设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameSettings {
    pub enabled: bool,
    pub style: FrameStyle,
    pub color: String,
    pub width: f32,
    pub opacity: f32,
    pub custom_properties: Option<HashMap<String, serde_json::Value>>,
}

/// 相框样式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FrameStyle {
    Simple,
    Shadow,
    Film,
    Polaroid,
    Vintage,
}

/// 处理设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingSettings {
    pub overlay_settings: OverlaySettings,
    pub frame_settings: FrameSettings,
    pub output_format: OutputFormat,
    pub quality: u8, // 1-100 for JPEG
}

/// 输出格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OutputFormat {
    Jpeg,
    Png,
}

/// 处理结果信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedImageInfo {
    pub input_path: String,
    pub output_path: String,
    pub original_size: u64,
    pub processed_size: u64,
    pub processing_time_ms: u64,
}

/// 批量处理结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProcessingResult {
    pub total_files: usize,
    pub successful: Vec<ProcessedImageInfo>,
    pub failed: Vec<ProcessingError>,
    pub total_time_ms: u64,
}

/// 处理错误
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingError {
    pub file_path: String,
    pub error_message: String,
    pub error_type: ErrorType,
}

/// 错误类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ErrorType {
    FileNotFound,
    InvalidFormat,
    ExifReadError,
    ImageProcessingError,
    OutputError,
    PermissionDenied,
}

/// 预览设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewSettings {
    pub max_width: u32,
    pub max_height: u32,
    pub overlay_settings: OverlaySettings,
    pub frame_settings: FrameSettings,
}