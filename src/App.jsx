function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-4 text-center">
          UPI Fraud Detection – Frontend Starter
        </h1>
        
        {/* Verification checklist */}
        <div className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Setup Verification
          </h2>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded border border-green-200">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-gray-700">React is working</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded border border-green-200">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-gray-700">Tailwind CSS is working</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded border border-green-200">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-gray-700">Vite dev server is running</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default App;
