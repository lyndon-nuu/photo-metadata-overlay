import { ConfigProvider } from 'antd';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useSettingsStore } from './stores';
import { FileSelector } from './components/FileSelector/FileSelector';
import { FileManager } from './components/FileManager/FileManager';
import { ImagePreview } from './components/ImagePreview/ImagePreview';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { SettingsManager } from './components/SettingsManager/SettingsManager';
import { BatchProcessor } from './components/BatchProcessor/BatchProcessor';

import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { ToastContainer } from './components/UI/Toast';
import { StatusBar, StatusBarContainer } from './components/StatusBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFileManager } from './hooks/useFileManager';
import { useAutoSave } from './hooks/useAutoSave';
import { useToast } from './hooks/useToast';
import { useAppStatus } from './hooks/useAppStatus';
import { FileSelectedEvent, PhotoMetadata, OverlaySettings, FrameSettings } from './types';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from './constants/design-tokens';
import { storageService } from './services/storage.service';
import './App.css';

// 添加演示模式检查
const isDemoMode = window.location.search.includes('demo=true');

function App() {
  // 如果是演示模式，显示演示组件
  if (isDemoMode) {
    const { AnimationDemo } = require('./demo/AnimationDemo');
    return <AnimationDemo />;
  }
  const { isLoading, error } = useAppStore();
  const { loadSettings } = useSettingsStore();
  
  // State for preview functionality
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
  const [frameSettings, setFrameSettings] = useState<FrameSettings>(DEFAULT_FRAME_SETTINGS);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [showSettingsManager, setShowSettingsManager] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  
  // Map to store original File objects by filename
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());

  // 自动保存Hook
  const { isAutoSaveEnabled } = useAutoSave(overlaySettings, frameSettings);
  
  // Toast通知Hook
  const { toasts, removeToast, success } = useToast();
  
  // 应用状态管理Hook
  const { 
    currentStatus, 
    setLoading, 
    setSuccess, 
    setError, 
    setIdle
  } = useAppStatus();

  // 初始化时加载设置
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // 加载用户设置
        await loadSettings();
        
        // 加载叠加和相框设置
        const [savedOverlaySettings, savedFrameSettings] = await Promise.all([
          storageService.loadOverlaySettings(),
          storageService.loadFrameSettings(),
        ]);
        
        setOverlaySettings(savedOverlaySettings);
        setFrameSettings(savedFrameSettings);
        
        console.log('应用设置已加载');
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    };

    initializeSettings();
  }, [loadSettings]);
  
  const {
    selectedFiles,
    isProcessing,
    progress,
    errors,
    handleFilesSelected,
    removeFile,
    clearFiles,
    clearErrors,
    getFileStats,
    exportFileList,
  } = useFileManager({
    maxFiles: 100,
    allowDuplicates: false,
  });

  const stats = getFileStats();

  const handleFileSelection = (event: FileSelectedEvent) => {
    try {
      setLoading('正在加载文件...');
      
      // Store original File objects in the map
      const newFileMap = new Map(fileMap);
      event.files.forEach(file => {
        newFileMap.set(file.name, file);
      });
      setFileMap(newFileMap);
      
      handleFilesSelected(event);
      
      // 显示成功通知和状态
      if (event.files.length > 0) {
        setSuccess(`已成功加载 ${event.files.length} 个文件`);
        success(
          '文件加载成功',
          `已成功加载 ${event.files.length} 个文件`
        );
      }
      
      // Auto-select first file for preview
      if (event.files.length > 0 && !selectedFile) {
        const firstFile = event.files[0];
        setSelectedFile(firstFile);
        
        // Find corresponding PhotoMetadata (may not be available immediately due to async processing)
        setTimeout(() => {
          const photoMetadata = selectedFiles.find(f => f.fileName === firstFile.name);
          if (photoMetadata) {
            setSelectedPhoto(photoMetadata);
          }
        }, 100);
      }
    } catch (error) {
      setError('文件加载失败，请重试');
      console.error('文件选择错误:', error);
    }
  };

  const handlePhotoSelect = (photo: PhotoMetadata, file: File) => {
    setSelectedPhoto(photo);
    // Use the original file from our map instead of the passed file
    const originalFile = fileMap.get(photo.fileName);
    if (originalFile) {
      setSelectedFile(originalFile);
    } else {
      // Fallback to the passed file if not found in map
      setSelectedFile(file);
    }
  };

  const handleOverlaySettingsChange = (newSettings: OverlaySettings) => {
    setOverlaySettings(newSettings);
  };

  const handleFrameSettingsChange = (newSettings: FrameSettings) => {
    setFrameSettings(newSettings);
  };

  const handleProcessingComplete = (blob: Blob) => {
    setProcessedBlob(blob);
    success('图像处理完成', '图像已成功处理，可以下载了');
  };

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
            fontSize: 14,
          },
        }}
      >
        <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  照片元数据叠加工具
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  className="btn-primary"
                  onClick={() => setShowBatchProcessor(true)}
                  disabled={selectedFiles.length === 0}
                >
                  批量处理 ({selectedFiles.length})
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowSettingsManager(true)}
                >
                  设置
                </button>
                {isAutoSaveEnabled && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>自动保存</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                className="flex justify-center items-center h-64"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingSpinner size="lg" text="加载中..." />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-red-50 border border-red-200 rounded-md p-4 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">错误</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error?.message || '发生了一个错误'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            {/* Left Panel - File Selection and Management */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  文件选择
                </h2>
                <FileSelector
                  onFilesSelected={handleFileSelection}
                  selectedFiles={selectedFiles}
                  onFileRemove={removeFile}
                  multiple={true}
                  allowFolder={true}
                  showPreview={true}
                  disabled={isProcessing}
                />
              </motion.div>

              {/* File Management */}
              <motion.div 
                className="card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  文件管理
                </h2>
                <FileManager
                  files={selectedFiles}
                  errors={errors}
                  isProcessing={isProcessing}
                  onFileRemove={removeFile}
                  onClearAll={clearFiles}
                  onClearErrors={clearErrors}
                  onExportList={exportFileList}
                  onFileSelect={handlePhotoSelect}
                  selectedFile={selectedPhoto}
                />
              </motion.div>

              {/* Processing Progress */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div 
                    className="card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-md font-medium text-gray-900 mb-3">
                      处理进度
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>正在处理: {progress.fileName}</span>
                        <span>{progress.current} / {progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className="bg-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` 
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File Statistics */}
              <AnimatePresence>
                {stats.totalFiles > 0 && (
                  <motion.div 
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="text-md font-medium text-gray-900 mb-3">
                      文件统计
                    </h3>
                    <motion.div 
                      className="grid grid-cols-2 gap-4 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, staggerChildren: 0.1 }}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <span className="text-gray-600">总文件数:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {stats.totalFiles}
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <span className="text-gray-600">总大小:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {(stats.totalSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="text-gray-600">错误数:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {stats.errorCount}
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="text-gray-600">文件类型:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {Object.keys(stats.fileTypes).join(', ') || '无'}
                        </span>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Center Panel - Real-time Preview */}
            <motion.div 
              className="xl:col-span-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                className="card h-full"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <ImagePreview
                  photo={selectedPhoto}
                  file={selectedFile}
                  overlaySettings={overlaySettings}
                  frameSettings={frameSettings}
                  onProcessingComplete={handleProcessingComplete}
                  className="h-full min-h-[600px]"
                />
              </motion.div>
            </motion.div>

            {/* Right Panel - Settings */}
            <motion.div 
              className="xl:col-start-1 xl:row-start-2 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div 
                className="card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <SettingsPanel
                  overlaySettings={overlaySettings}
                  frameSettings={frameSettings}
                  onOverlayChange={handleOverlaySettingsChange}
                  onFrameChange={handleFrameSettingsChange}
                  disabled={!selectedPhoto}
                />
              </motion.div>

              {/* Export Controls */}
              <AnimatePresence>
                {processedBlob && (
                  <motion.div 
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="text-md font-medium text-gray-900 mb-3">
                      导出控制
                    </h3>
                    <div className="space-y-3">
                      <motion.button
                        className="w-full btn-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (processedBlob && selectedPhoto) {
                            const url = URL.createObjectURL(processedBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${selectedPhoto.fileName.replace(/\.[^/.]+$/, '')}_processed.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }
                        }}
                      >
                        下载处理后的图片
                      </motion.button>
                      <motion.div 
                        className="text-xs text-gray-500 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        图片大小: {processedBlob ? (processedBlob.size / 1024).toFixed(1) : 0} KB
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </main>

        {/* Settings Manager Modal */}
        <AnimatePresence>
          {showSettingsManager && (
            <motion.div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowSettingsManager(false)}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <SettingsManager onClose={() => setShowSettingsManager(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Batch Processor Modal */}
        <AnimatePresence>
          {showBatchProcessor && (
            <motion.div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowBatchProcessor(false)}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <motion.h2 
                      className="text-2xl font-bold text-gray-900 dark:text-gray-100"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      批量处理
                    </motion.h2>
                    <motion.button
                      onClick={() => setShowBatchProcessor(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <BatchProcessor
                      files={selectedFiles}
                      fileMap={fileMap}
                      overlaySettings={overlaySettings}
                      frameSettings={frameSettings}
                      onComplete={(results) => {
                        console.log('批量处理完成:', results);
                        // 可以在这里添加完成后的处理逻辑
                      }}
                      onProgress={(progress) => {
                        console.log('批量处理进度:', progress);
                        // 可以在这里添加进度更新的处理逻辑
                      }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toast Notifications */}
        <ToastContainer 
          toasts={toasts} 
          onClose={removeToast} 
          position="top-right" 
        />
        
        {/* Status Bar */}
        <AnimatePresence>
          {currentStatus.type !== 'idle' && (
            <StatusBarContainer>
              <StatusBar
                status={currentStatus.type}
                message={currentStatus.message}
                progress={currentStatus.progress}
                showProgress={currentStatus.type === 'loading' && typeof currentStatus.progress === 'number'}
                onClose={() => setIdle()}
              />
            </StatusBarContainer>
          )}
        </AnimatePresence>
      </div>
    </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
