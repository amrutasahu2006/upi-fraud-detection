import { useNavigate } from "react-router-dom";

function TransactionBlocked() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Page Header */}
        <header className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button onClick={() => navigate('/')} aria-label="Go back" className="text-2xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Transaction Blocked</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8 flex flex-col items-center text-center">

          {/* status (centered) */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gray-100 flex items-center justify-center">
              {/* check icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-14 md:w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" strokeWidth={2} stroke="currentColor" className="text-green-600" />
              </svg>
            </div>

            <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Transaction blocked successfully!</h3>

            <p className="text-sm md:text-base text-gray-500 text-center md:max-w-md">We've successfully blocked the suspicious transaction and recorded your report. Your funds are secure.</p>
          </div>

          {/* summary and action (stacked, centered) */}
          <div className="w-full max-w-xl mx-auto">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="px-4 py-3 border-b">
                <h4 className="font-semibold text-gray-800">Transaction Summary</h4>
              </div>

              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-500">Receiver VPA</div>
                  <div className="text-sm font-medium text-gray-700">receiver@bankname</div>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="text-sm font-semibold text-gray-700">₹ 25,000.00</div>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-600">Reported Risk Score</div>
                  <div className="text-sm font-semibold text-red-600">92%</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/payment')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg shadow-md text-sm md:text-base tracking-wide cursor-pointer"
            >
              Return to Home Page
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TransactionBlocked;

