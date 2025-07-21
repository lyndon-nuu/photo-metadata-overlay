import React, { useState, useMemo } from 'react';
import { 
  Image, 
  X, 
  Download, 
  Grid, 
  List, 
  Search,
  Camera,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { PhotoMetadata, FileError } from '../../types';
import { formatFileSize } from '../../utils/file.utils';

interface FileManagerProps {
  files: PhotoMetadata[];
  errors: FileError[];
  isProcessing: boolean;
  onFileRemove?: (filePath: string) => void;
  onClearAll?: () => void;
  onClearErrors?: () => void;
  onExportList?: () => void;
  onFileSelect?: (photo: PhotoMetadata, file: File) => void;
  selectedFile?: PhotoMetadata | null;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'size' | 'date' | 'camera';
type FilterBy = 'all' | 'camera' | 'size' | 'errors';

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  errors,
  isProcessing,
  onFileRemove,
  onClearAll,
  onClearErrors,
  onExportList,
  onFileSelect,
  selectedFile,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [_filterBy] = useState<FilterBy>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 计算统计信息
  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
    const cameras = new Set(files.map(f => f.exif?.make).filter(Boolean));
    const avgSize = files.length > 0 ? totalSize / files.length : 0;

    return {
      totalFiles: files.length,
      totalSize,
      avgSize,
      uniqueCameras: cameras.size,
      errorCount: errors.length,
    };
  }, [files, errors]);

  // 过滤和排序文件
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = [...files];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.fileName.toLowerCase().includes(query) ||
        file.exif?.make?.toLowerCase().includes(query) ||
        file.exif?.model?.toLowerCase().includes(query)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'camera':
          const cameraA = `${a.exif?.make || ''} ${a.exif?.model || ''}`.trim();
          const cameraB = `${b.exif?.make || ''} ${b.exif?.model || ''}`.trim();
          comparison = cameraA.localeCompare(cameraB);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [files, searchQuery, sortBy, sortOrder]);

  // 切换排序顺序
  const toggleSortOrder = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // 格式化相机信息
  const formatCameraInfo = (file: PhotoMetadata): string => {
    if (!file.exif?.make && !file.exif?.model) return '未知相机';
    return `${file.exif?.make || ''} ${file.exif?.model || ''}`.trim();
  };

  // 格式化拍摄参数
  const formatShootingParams = (file: PhotoMetadata): string => {
    const params = [];
    if (file.exif?.aperture) params.push(file.exif.aperture);
    if (file.exif?.shutterSpeed) params.push(file.exif.shutterSpeed);
    if (file.exif?.iso) params.push(file.exif.iso);
    return params.join(' • ') || '无拍摄参数';
  };

  if (files.length === 0 && errors.length === 0) {
    return (
      <div className={`file-manager ${className}`}>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>还没有选择任何文件</p>
          <p className="text-sm mt-1">请使用上方的文件选择器添加图片</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-manager ${className}`}>
      {/* 统计信息栏 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalFiles}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">文件总数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatFileSize(stats.totalSize)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">总大小</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.uniqueCameras}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">相机品牌</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              stats.errorCount > 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {stats.errorCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">错误</div>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文件名或相机品牌..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600
              rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
          />
        </div>

        {/* 视图切换 */}
        <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setViewMode('list')}
            className={`
              px-3 py-2 text-sm font-medium rounded-l-md transition-colors
              ${viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`
              px-3 py-2 text-sm font-medium rounded-r-md border-l border-gray-300 dark:border-gray-600 transition-colors
              ${viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {onExportList && (
            <button
              onClick={onExportList}
              disabled={files.length === 0}
              className="
                inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600
                rounded-md text-sm font-medium text-gray-700 dark:text-gray-200
                bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Download className="w-4 h-4 mr-2" />
              导出列表
            </button>
          )}
          
          {onClearAll && (
            <button
              onClick={onClearAll}
              disabled={files.length === 0 || isProcessing}
              className="
                inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600
                rounded-md text-sm font-medium text-red-700 dark:text-red-200
                bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <X className="w-4 h-4 mr-2" />
              清空全部
            </button>
          )}
        </div>
      </div>

      {/* 错误信息 */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  处理错误 ({errors.length})
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  {errors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-300 mb-1">
                      {error.fileName ? `${error.fileName}: ` : ''}{error.message}
                    </p>
                  ))}
                  {errors.length > 5 && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      还有 {errors.length - 5} 个错误...
                    </p>
                  )}
                </div>
              </div>
            </div>
            {onClearErrors && (
              <button
                onClick={onClearErrors}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                清除错误
              </button>
            )}
          </div>
        </div>
      )}

      {/* 排序按钮 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => toggleSortOrder('name')}
          className={`
            px-3 py-1 text-sm rounded-md transition-colors
            ${sortBy === 'name' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          文件名 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => toggleSortOrder('size')}
          className={`
            px-3 py-1 text-sm rounded-md transition-colors
            ${sortBy === 'size' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          大小 {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => toggleSortOrder('camera')}
          className={`
            px-3 py-1 text-sm rounded-md transition-colors
            ${sortBy === 'camera' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          相机 {sortBy === 'camera' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => toggleSortOrder('date')}
          className={`
            px-3 py-1 text-sm rounded-md transition-colors
            ${sortBy === 'date' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          日期 {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* 文件列表 */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredAndSortedFiles.map((file, index) => (
            <div
              key={`${file.filePath}-${index}`}
              onClick={() => onFileSelect && onFileSelect(file, new File([], file.fileName, { type: file.mimeType }))}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                selectedFile?.filePath === file.filePath
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <Image className="w-8 h-8 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.fileName}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <HardDrive className="w-3 h-3 mr-1" />
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span>{file.dimensions.width}×{file.dimensions.height}</span>
                    <span className="flex items-center">
                      <Camera className="w-3 h-3 mr-1" />
                      {formatCameraInfo(file)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatShootingParams(file)}
                  </div>
                </div>
              </div>
              {onFileRemove && (
                <button
                  onClick={() => onFileRemove(file.filePath)}
                  disabled={isProcessing}
                  className="
                    p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400
                    transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  aria-label={`移除 ${file.fileName}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSortedFiles.map((file, index) => (
            <div
              key={`${file.filePath}-${index}`}
              className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Image className="w-12 h-12 text-gray-400" />
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                  {file.fileName}
                </h4>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>{formatFileSize(file.fileSize)}</div>
                  <div>{file.dimensions.width}×{file.dimensions.height}</div>
                  <div className="truncate">{formatCameraInfo(file)}</div>
                </div>
              </div>
              {onFileRemove && (
                <button
                  onClick={() => onFileRemove(file.filePath)}
                  disabled={isProcessing}
                  className="
                    absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full
                    text-gray-400 hover:text-red-500 dark:hover:text-red-400
                    opacity-0 group-hover:opacity-100 transition-all duration-200
                    shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  aria-label={`移除 ${file.fileName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {filteredAndSortedFiles.length === 0 && files.length > 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>没有找到匹配的文件</p>
          <p className="text-sm mt-1">尝试调整搜索条件</p>
        </div>
      )}
    </div>
  );
};

export default FileManager;