use crate::types::*;
use crate::image_processing::ImageProcessingService;
use anyhow::{Context, Result};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// 统一图像处理引擎
/// 提供高性能、一致性的图像处理服务
pub struct UnifiedProcessingEngine {
    // 智能缓存系统
    cache: Arc<Mutex<HashMap<String, CachedResult>>>,
    // 处理统计
    stats: Arc<Mutex<ProcessingStats>>,
}

#[derive(Clone)]
struct CachedResult {
    preview_data: Vec<u8>,
    full_data: Option<Vec<u8>>,
    timestamp: u64,
    settings_hash: String,
}

#[derive(Default, Clone)]
struct ProcessingStats {
    cache_hits: u64,
    cache_misses: u64,
    total_processing_time: u64,
}

impl UnifiedProcessingEngine {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            stats: Arc::new(Mutex::new(ProcessingStats::default())),
        }
    }

    /// 统一的图像处理入口点
    /// 根据请求类型返回不同分辨率的结果
    pub async fn process_image_unified(
        &self,
        input_path: &str,
        metadata: PhotoMetadata,
        overlay_settings: OverlaySettings,
        frame_settings: FrameSettings,
        request_type: ProcessingRequestType,
    ) -> Result<ProcessingResult> {
        let start_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        // 生成缓存键
        let cache_key = self.generate_cache_key(
            input_path,
            &overlay_settings,
            &frame_settings,
            &request_type,
        );

        // 检查缓存
        if let Some(cached) = self.get_from_cache(&cache_key) {
            self.update_stats(true, 0);
            return Ok(self.extract_result_from_cache(cached, request_type));
        }

        // 缓存未命中，进行处理
        let result = match request_type {
            ProcessingRequestType::Preview => {
                self.process_preview(input_path, metadata, overlay_settings, frame_settings).await?
            }
            ProcessingRequestType::FullQuality => {
                self.process_full_quality(input_path, metadata, overlay_settings, frame_settings).await?
            }
            ProcessingRequestType::Both => {
                self.process_both(input_path, metadata, overlay_settings, frame_settings).await?
            }
        };

        // 更新缓存
        self.update_cache(cache_key, &result);

        let processing_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64 - start_time;

        self.update_stats(false, processing_time);

        Ok(result)
    }

    /// 处理预览请求（优化分辨率）
    async fn process_preview(
        &self,
        input_path: &str,
        _metadata: PhotoMetadata,
        overlay_settings: OverlaySettings,
        frame_settings: FrameSettings,
    ) -> Result<ProcessingResult> {
        // 使用优化的预览设置
        let preview_settings = PreviewSettings {
            max_width: 800,
            max_height: 600,
            overlay_settings,
            frame_settings,
        };

        let preview_data = ImageProcessingService::generate_preview(input_path, preview_settings).await?;

        Ok(ProcessingResult::Preview(preview_data))
    }

    /// 处理完整质量请求
    async fn process_full_quality(
        &self,
        input_path: &str,
        metadata: PhotoMetadata,
        overlay_settings: OverlaySettings,
        frame_settings: FrameSettings,
    ) -> Result<ProcessingResult> {
        let output_path = format!("/tmp/processed_{}.jpg", 
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis());

        let _result = ImageProcessingService::process_image(
            input_path,
            metadata,
            overlay_settings,
            frame_settings,
            &output_path,
            95, // 高质量
        ).await?;

        // 读取处理后的文件
        let full_data = std::fs::read(&output_path)?;
        
        // 清理临时文件
        let _ = std::fs::remove_file(&output_path);

        Ok(ProcessingResult::FullQuality(full_data))
    }

    /// 同时处理预览和完整质量
    async fn process_both(
        &self,
        input_path: &str,
        metadata: PhotoMetadata,
        overlay_settings: OverlaySettings,
        frame_settings: FrameSettings,
    ) -> Result<ProcessingResult> {
        // 并行处理预览和完整质量
        let preview_future = self.process_preview(
            input_path, 
            metadata.clone(), 
            overlay_settings.clone(), 
            frame_settings.clone()
        );
        
        let full_future = self.process_full_quality(
            input_path, 
            metadata, 
            overlay_settings, 
            frame_settings
        );

        let (preview_result, full_result) = tokio::try_join!(preview_future, full_future)?;

        let preview_data = match preview_result {
            ProcessingResult::Preview(data) => data,
            _ => return Err(anyhow::anyhow!("Unexpected preview result type")),
        };

        let full_data = match full_result {
            ProcessingResult::FullQuality(data) => data,
            _ => return Err(anyhow::anyhow!("Unexpected full quality result type")),
        };

        Ok(ProcessingResult::Both { preview_data, full_data })
    }

    /// 生成缓存键
    fn generate_cache_key(
        &self,
        input_path: &str,
        overlay_settings: &OverlaySettings,
        frame_settings: &FrameSettings,
        request_type: &ProcessingRequestType,
    ) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        input_path.hash(&mut hasher);
        format!("{:?}", overlay_settings).hash(&mut hasher);
        format!("{:?}", frame_settings).hash(&mut hasher);
        format!("{:?}", request_type).hash(&mut hasher);

        format!("unified_cache_{:x}", hasher.finish())
    }

    /// 从缓存获取结果
    fn get_from_cache(&self, key: &str) -> Option<CachedResult> {
        let cache = self.cache.lock().unwrap();
        cache.get(key).cloned()
    }

    /// 更新缓存
    fn update_cache(&self, key: String, result: &ProcessingResult) {
        let mut cache = self.cache.lock().unwrap();
        
        let cached_result = match result {
            ProcessingResult::Preview(data) => CachedResult {
                preview_data: data.clone(),
                full_data: None,
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                settings_hash: key.clone(),
            },
            ProcessingResult::FullQuality(data) => CachedResult {
                preview_data: Vec::new(),
                full_data: Some(data.clone()),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                settings_hash: key.clone(),
            },
            ProcessingResult::Both { preview_data, full_data } => CachedResult {
                preview_data: preview_data.clone(),
                full_data: Some(full_data.clone()),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                settings_hash: key.clone(),
            },
        };

        cache.insert(key, cached_result);

        // 清理过期缓存（保留最近100个）
        if cache.len() > 100 {
            let entries: Vec<_> = cache.iter().map(|(k, v)| (k.clone(), v.timestamp)).collect();
            let mut sorted_entries = entries;
            sorted_entries.sort_by_key(|(_, timestamp)| *timestamp);
            
            // 删除最旧的20个条目
            for (key, _) in sorted_entries.iter().take(20) {
                cache.remove(key);
            }
        }
    }

    /// 从缓存提取结果
    fn extract_result_from_cache(
        &self,
        cached: CachedResult,
        request_type: ProcessingRequestType,
    ) -> ProcessingResult {
        match request_type {
            ProcessingRequestType::Preview => ProcessingResult::Preview(cached.preview_data),
            ProcessingRequestType::FullQuality => {
                ProcessingResult::FullQuality(cached.full_data.unwrap_or_default())
            }
            ProcessingRequestType::Both => ProcessingResult::Both {
                preview_data: cached.preview_data,
                full_data: cached.full_data.unwrap_or_default(),
            },
        }
    }

    /// 更新统计信息
    fn update_stats(&self, cache_hit: bool, processing_time: u64) {
        let mut stats = self.stats.lock().unwrap();
        if cache_hit {
            stats.cache_hits += 1;
        } else {
            stats.cache_misses += 1;
            stats.total_processing_time += processing_time;
        }
    }

    /// 获取性能统计
    pub fn get_stats(&self) -> ProcessingStats {
        let stats = self.stats.lock().unwrap();
        stats.clone()
    }
}

#[derive(Debug, Clone)]
pub enum ProcessingRequestType {
    Preview,
    FullQuality,
    Both,
}

#[derive(Debug)]
pub enum ProcessingResult {
    Preview(Vec<u8>),
    FullQuality(Vec<u8>),
    Both {
        preview_data: Vec<u8>,
        full_data: Vec<u8>,
    },
}

// 全局引擎实例
lazy_static::lazy_static! {
    pub static ref UNIFIED_ENGINE: UnifiedProcessingEngine = UnifiedProcessingEngine::new();
}