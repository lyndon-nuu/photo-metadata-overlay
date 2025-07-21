import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { ToastContainer } from '../components/UI/Toast';
import { ProgressBar, CircularProgress } from '../components/UI/ProgressBar';
import { useToast } from '../hooks/useToast';

/**
 * 动画演示组件
 * 展示任务13实现的所有动画和用户体验优化功能
 */
export const AnimationDemo: React.FC = () => {
  const [showCard, setShowCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toasts, removeToast, success, error, warning, info } = useToast();

  const handleShowToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: '成功！', message: '操作已成功完成' },
      error: { title: '错误！', message: '操作失败，请重试' },
      warning: { title: '警告！', message: '请注意这个操作' },
      info: { title: '信息', message: '这是一条信息提示' },
    };

    const { title, message } = messages[type];
    
    switch (type) {
      case 'success':
        success(title, message);
        break;
      case 'error':
        error(title, message);
        break;
      case 'warning':
        warning(title, message);
        break;
      case 'info':
        info(title, message);
        break;
    }
  };

  const handleStartProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          success('完成！', '进度已达到100%');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleToggleLoading = () => {
    setLoading(!loading);
    if (!loading) {
      setTimeout(() => {
        setLoading(false);
        success('加载完成！', '数据已成功加载');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            动画和用户体验演示
          </h1>
          <p className="text-lg text-gray-600">
            展示任务13实现的所有动画效果和用户体验优化功能
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 按钮动画演示 */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-xl font-semibold mb-4">按钮动画</h3>
            <div className="space-y-4">
              <Button variant="primary">主要按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="outline">轮廓按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="danger">危险按钮</Button>
              <Button loading={loading} onClick={handleToggleLoading}>
                {loading ? '加载中...' : '开始加载'}
              </Button>
            </div>
          </motion.div>

          {/* 加载动画演示 */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-xl font-semibold mb-4">加载动画</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Spinner</p>
                <LoadingSpinner variant="spinner" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Dots</p>
                <LoadingSpinner variant="dots" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Pulse</p>
                <LoadingSpinner variant="pulse" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Bars</p>
                <LoadingSpinner variant="bars" />
              </div>
            </div>
          </motion.div>

          {/* 进度条演示 */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-xl font-semibold mb-4">进度条</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">线性进度条</p>
                <ProgressBar progress={progress} showPercentage />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">圆形进度条</p>
                <div className="flex justify-center">
                  <CircularProgress progress={progress} />
                </div>
              </div>
              <Button onClick={handleStartProgress} className="w-full">
                开始进度演示
              </Button>
            </div>
          </motion.div>

          {/* Toast通知演示 */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-xl font-semibold mb-4">Toast通知</h3>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                onClick={() => handleShowToast('success')}
                className="w-full"
              >
                成功通知
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleShowToast('error')}
                className="w-full"
              >
                错误通知
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleShowToast('warning')}
                className="w-full"
              >
                警告通知
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleShowToast('info')}
                className="w-full"
              >
                信息通知
              </Button>
            </div>
          </motion.div>

          {/* 卡片动画演示 */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-xl font-semibold mb-4">卡片动画</h3>
            <div className="space-y-4">
              <Button 
                onClick={() => setShowCard(!showCard)}
                className="w-full"
              >
                {showCard ? '隐藏卡片' : '显示卡片'}
              </Button>
              
              <AnimatePresence>
                {showCard && (
                  <motion.div
                    className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg p-4 text-white"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <h4 className="font-semibold mb-2">动画卡片</h4>
                    <p className="text-sm">
                      这是一个带有进入和退出动画的卡片组件
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 交互反馈演示 */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-xl font-semibold mb-4">交互反馈</h3>
            <div className="space-y-4">
              <motion.div
                className="bg-blue-100 rounded-lg p-4 cursor-pointer"
                whileHover={{ scale: 1.05, backgroundColor: '#dbeafe' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <p className="text-blue-800 font-medium">悬停和点击我</p>
                <p className="text-blue-600 text-sm">感受交互动画效果</p>
              </motion.div>
              
              <motion.div
                className="bg-green-100 rounded-lg p-4 cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  rotate: 2,
                  backgroundColor: '#dcfce7' 
                }}
                whileTap={{ scale: 0.95, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <p className="text-green-800 font-medium">旋转动画</p>
                <p className="text-green-600 text-sm">悬停时会轻微旋转</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* 移动设备优化提示 */}
        <motion.div
          className="mt-12 bg-white rounded-lg shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h3 className="text-xl font-semibold mb-4">移动设备优化</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">触摸优化</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 触摸目标最小44px</li>
                <li>• 增加表单元素间距</li>
                <li>• 优化滑块控件高度</li>
                <li>• 增加列表项间距</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">响应式布局</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 垂直布局适配</li>
                <li>• 模态框尺寸优化</li>
                <li>• 工具栏自适应换行</li>
                <li>• 标签页灵活布局</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast容器 */}
      <ToastContainer 
        toasts={toasts} 
        onClose={removeToast} 
        position="top-right" 
      />
    </div>
  );
};