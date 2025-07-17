import { ConfigProvider } from 'antd';
import { useAppStore } from './stores';
import './App.css';

function App() {
  const { isLoading, error } = useAppStore();

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
                  Photo Metadata Overlay
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="btn-secondary">Settings</button>
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
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error?.message || 'An error occurred'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Photo Viewer Area */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Photo Viewer
                </h2>
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                  <p className="text-gray-500">Select a photo to get started</p>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="space-y-6">
              {/* Photo Selection */}
              <div className="card">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Photo Selection
                </h3>
                <button className="btn-primary w-full">Select Photo</button>
              </div>

              {/* Overlay Configuration */}
              <div className="card">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Overlay Configuration
                </h3>
                <div className="space-y-3">
                  <button className="btn-secondary w-full">
                    Create New Overlay
                  </button>
                  <button className="btn-secondary w-full">
                    Load Template
                  </button>
                </div>
              </div>

              {/* Export Options */}
              <div className="card">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Export
                </h3>
                <div className="space-y-2">
                  <button className="btn-primary w-full" disabled>
                    Export with Overlay
                  </button>
                  <p className="text-xs text-gray-500">
                    Select a photo and configure overlay first
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}

export default App;
