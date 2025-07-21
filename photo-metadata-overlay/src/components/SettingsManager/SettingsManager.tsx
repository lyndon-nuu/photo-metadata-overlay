import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { Button } from '../UI/Button';
import { cn } from '../../utils/cn';

interface SettingsManagerProps {
  className?: string;
  onClose?: () => void;
}

/**
 * 设置管理组件
 * 提供设置的保存、加载、导入、导出和重置功能
 */
export const SettingsManager: React.FC<SettingsManagerProps> = ({
  className,
  onClose,
}) => {
  const {
    settings,
    isLoading,
    error,

    resetSettings,
    loadSettings,
    saveSettings,
    exportSettings,
    importSettings,
    resetAllSettings,
  } = useSettingsStore();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmResetAll, setShowConfirmResetAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 显示成功消息
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // 处理导出设置
  const handleExportSettings = async () => {
    try {
      const exportData = await exportSettings();
      
      // 创建下载链接
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `photo-metadata-overlay-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      showSuccess('设置已导出到文件');
    } catch (err) {
      console.error('导出设置失败:', err);
    }
  };

  // 处理导入设置
  const handleImportSettings = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      await importSettings(content);
      showSuccess('设置已成功导入');
    } catch (err) {
      console.error('导入设置失败:', err);
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理重置设置
  const handleResetSettings = async () => {
    try {
      await resetSettings();
      setShowConfirmReset(false);
      showSuccess('设置已重置为默认值');
    } catch (err) {
      console.error('重置设置失败:', err);
    }
  };

  // 处理重置所有设置
  const handleResetAllSettings = async () => {
    try {
      await resetAllSettings();
      setShowConfirmResetAll(false);
      showSuccess('所有设置已重置');
    } catch (err) {
      console.error('重置所有设置失败:', err);
    }
  };

  // 处理保存设置
  const handleSaveSettings = async () => {
    try {
      await saveSettings();
      showSuccess('设置已保存');
    } catch (err) {
      console.error('保存设置失败:', err);
    }
  };

  // 处理加载设置
  const handleLoadSettings = async () => {
    try {
      await loadSettings();
      showSuccess('设置已重新加载');
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            设置管理
          </h2>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* 成功信息 */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
        </div>
      )}

      {/* 当前设置信息 */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          当前设置
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">主题:</span> {settings.theme}
          </div>
          <div>
            <span className="font-medium">语言:</span> {settings.language}
          </div>
          <div>
            <span className="font-medium">导出格式:</span> {settings.defaultExportFormat.toUpperCase()}
          </div>
          <div>
            <span className="font-medium">导出质量:</span> {Math.round(settings.defaultExportQuality * 100)}%
          </div>
          <div>
            <span className="font-medium">自动保存:</span> {settings.autoSave ? '开启' : '关闭'}
          </div>
          <div>
            <span className="font-medium">模板数量:</span> {settings.recentTemplates.length}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-4">
        {/* 基本操作 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            基本操作
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>保存设置</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleLoadSettings}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              <span>重新加载</span>
            </Button>
          </div>
        </div>

        {/* 导入导出 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            导入导出
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleExportSettings}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>导出设置</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleImportSettings}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>导入设置</span>
            </Button>
          </div>
        </div>

        {/* 重置操作 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            重置操作
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmReset(true)}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重置设置</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowConfirmResetAll(true)}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>重置全部</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 重置确认对话框 */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  确认重置设置
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  这将重置所有用户设置为默认值，但不会影响模板和其他数据。此操作无法撤销。
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmReset(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleResetSettings}
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    确认重置
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 重置全部确认对话框 */}
      {showConfirmResetAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  确认重置所有设置
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  这将删除所有设置、模板和配置数据，恢复到应用的初始状态。此操作无法撤销！
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmResetAll(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleResetAllSettings}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    确认重置全部
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex items-start space-x-2">
          <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">使用说明：</p>
            <ul className="space-y-1 text-xs">
              <li>• 导出的设置文件包含所有配置和模板数据</li>
              <li>• 导入设置会覆盖当前所有配置</li>
              <li>• 重置设置只影响用户偏好，保留模板</li>
              <li>• 重置全部会清除所有数据，请谨慎操作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;