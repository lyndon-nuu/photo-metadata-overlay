
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import { Button } from './Button';

interface SessionData {
  files: File[];
  overlaySettings: any;
  frameSettings: any;
  timestamp: number;
}

interface SessionRecoveryDialogProps {
  sessionData?: SessionData;
  workProgress?: any;
  onRecover?: (data: SessionData) => void;
  onRestore?: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export function SessionRecoveryDialog({
  sessionData,
  workProgress,
  onRecover,
  onRestore,
  onDiscard,
  onClose
}: SessionRecoveryDialogProps) {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const data = sessionData || workProgress;
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">恢复上次会话</h3>
              <p className="text-sm text-gray-600">检测到未完成的工作会话</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">会话信息</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>时间: {data.timestamp ? formatTimestamp(data.timestamp) : '未知'}</div>
              <div>文件数量: {data.files?.length || 0} 个</div>
              <div>包含设置: 叠加样式、相框效果</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => {
                if (onRecover && sessionData) {
                  onRecover(sessionData);
                } else if (onRestore) {
                  onRestore();
                }
              }}
              className="flex-1"
            >
              恢复会话
            </Button>
            <Button
              variant="secondary"
              onClick={onDiscard}
              className="flex-1"
            >
              丢弃会话
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-3"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}