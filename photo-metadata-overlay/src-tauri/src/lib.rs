mod types;
mod exif_service;
mod image_processing;
mod unified_engine;
#[cfg(test)]
mod test_utils;

use types::*;
use exif_service::ExifService;
use image_processing::ImageProcessingService;
use unified_engine::{UNIFIED_ENGINE, ProcessingRequestType};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 提取图片EXIF元数据
#[tauri::command]
async fn extract_metadata(file_path: String) -> Result<PhotoMetadata, String> {
    ExifService::extract_metadata(&file_path)
        .map_err(|e| e.to_string())
}

/// 验证图片文件格式
#[tauri::command]
fn validate_image_file(file_path: String) -> bool {
    ExifService::validate_image_file(&file_path)
}

/// 处理单张图片
#[tauri::command]
async fn process_image(
    input_path: String,
    metadata: PhotoMetadata,
    overlay_settings: OverlaySettings,
    frame_settings: FrameSettings,
    output_path: String,
    quality: u8,
) -> Result<ProcessedImageInfo, String> {
    ImageProcessingService::process_image(
        &input_path,
        metadata,
        overlay_settings,
        frame_settings,
        &output_path,
        quality,
    )
    .await
    .map_err(|e| e.to_string())
}

/// 批量处理图片
#[tauri::command]
async fn batch_process_images(
    image_paths: Vec<String>,
    settings: ProcessingSettings,
    output_dir: String,
) -> Result<BatchProcessingResult, String> {
    ImageProcessingService::batch_process_images(image_paths, settings, &output_dir)
        .await
        .map_err(|e| e.to_string())
}

/// 统一的图像处理API - 预览模式
#[tauri::command]
async fn generate_preview(
    image_path: String,
    settings: PreviewSettings,
) -> Result<Vec<u8>, String> {
    // 提取元数据
    let metadata = ExifService::extract_metadata(&image_path)
        .map_err(|e| e.to_string())?;
    
    // 使用统一引擎处理预览
    match UNIFIED_ENGINE.process_image_unified(
        &image_path,
        metadata,
        settings.overlay_settings,
        settings.frame_settings,
        ProcessingRequestType::Preview,
    ).await {
        Ok(unified_engine::ProcessingResult::Preview(data)) => Ok(data),
        Ok(_) => Err("Unexpected result type".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

/// 保存处理后的图片（带文件保存对话框）
#[tauri::command]
async fn save_processed_image(
    app_handle: tauri::AppHandle,
    input_path: String,
    metadata: PhotoMetadata,
    overlay_settings: OverlaySettings,
    frame_settings: FrameSettings,
    quality: u8,
) -> Result<String, String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
    use std::sync::{Arc, Mutex};
    use tokio::sync::oneshot;
    
    // 获取原始文件名
    let input_file = std::path::Path::new(&input_path);
    let file_stem = input_file.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("processed");
    
    // 根据质量设置确定默认扩展名
    let default_extension = if quality < 100 { "jpg" } else { "png" };
    let default_filename = format!("{}_processed.{}", file_stem, default_extension);
    
    // 创建一个channel来等待对话框结果
    let (tx, rx) = oneshot::channel();
    let tx = Arc::new(Mutex::new(Some(tx)));
    
    // 显示文件保存对话框
    app_handle.dialog()
        .file()
        .set_title("保存处理后的图片")
        .set_file_name(&default_filename)
        .add_filter("JPEG图片", &["jpg", "jpeg"])
        .add_filter("PNG图片", &["png"])
        .add_filter("所有图片", &["jpg", "jpeg", "png"])
        .save_file(move |file_path| {
            if let Ok(mut sender) = tx.lock() {
                if let Some(sender) = sender.take() {
                    let _ = sender.send(file_path);
                }
            }
        });
    
    // 等待对话框结果
    let file_path = rx.await.map_err(|_| "对话框操作失败".to_string())?;
    
    match file_path {
        Some(path) => {
            let output_path = path.to_string();
            
            // 处理图片
            match ImageProcessingService::process_image(
                &input_path,
                metadata,
                overlay_settings,
                frame_settings,
                &output_path,
                quality,
            ).await {
                Ok(_result) => {
                    // 显示成功消息
                    let (success_tx, success_rx) = oneshot::channel();
                    let success_tx = Arc::new(Mutex::new(Some(success_tx)));
                    
                    app_handle.dialog()
                        .message(format!("图片已成功保存到:\n{}", output_path))
                        .title("保存成功")
                        .kind(MessageDialogKind::Info)
                        .show(move |_| {
                            if let Ok(mut sender) = success_tx.lock() {
                                if let Some(sender) = sender.take() {
                                    let _ = sender.send(());
                                }
                            }
                        });
                    
                    let _ = success_rx.await;
                    Ok(output_path)
                }
                Err(e) => {
                    // 显示错误消息
                    let (error_tx, error_rx) = oneshot::channel();
                    let error_tx = Arc::new(Mutex::new(Some(error_tx)));
                    
                    app_handle.dialog()
                        .message(format!("保存失败:\n{}", e))
                        .title("保存错误")
                        .kind(MessageDialogKind::Error)
                        .show(move |_| {
                            if let Ok(mut sender) = error_tx.lock() {
                                if let Some(sender) = sender.take() {
                                    let _ = sender.send(());
                                }
                            }
                        });
                    
                    let _ = error_rx.await;
                    Err(e.to_string())
                }
            }
        }
        None => {
            // 用户取消了保存
            Err("用户取消了保存操作".to_string())
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            extract_metadata,
            validate_image_file,
            process_image,
            batch_process_images,
            generate_preview,
            save_processed_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
