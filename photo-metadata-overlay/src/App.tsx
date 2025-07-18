import { ConfigProvider } from 'antd';
import { useAppStore } from './stores';
import { FileSelector } from './components/FileSelector/FileSelector';
import { FileManager } from './components/FileManager/FileManager';
import { useFileManager } from './hooks/useFileManager';
import { FileSelectedEvent } from './types';
import './App.css';

function App() {
  const { isLoading, error } = useAppStore();
  
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
    handleFilesSelected(event);
  };

  return (
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
                <button className="btn-secondary">设置</button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">错误</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error?.message || '发生了一个错误'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Selection Area */}
            <div className="space-y-6">
              <div className="card">
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
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="card">
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    处理进度
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>正在处理: {progress.fileName}</span>
                      <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* File Statistics */}
              {stats.totalFiles > 0 && (
                <div className="card">
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    文件统计
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">总文件数:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {stats.totalFiles}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">总大小:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {(stats.totalSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">错误数:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {stats.errorCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">文件类型:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {Object.keys(stats.fileTypes).join(', ') || '无'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* File Management Area */}
            <div className="space-y-6">
              <div className="card">
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
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}

export default App;
