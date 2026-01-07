import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SecurityChatbot() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleBlock = () => {
    // Handle block action
    navigate('/blocked');
  };

  const handleSafe = () => {
    // Handle safe action
    navigate('/payment');
  };

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      console.log("Message sent:", message);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button onClick={() => navigate('/')} aria-label="Go back" className="text-2xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">SurakshaPay AI</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col">

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 mb-6">
            <button
              onClick={handleBlock}
              className="flex-1 bg-blue-600 text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm md:text-base shadow-md hover:shadow-lg cursor-pointer"
            >
              Yes, block it
            </button>
            <button
              onClick={handleSafe}
              className="flex-1 bg-white text-gray-700 font-medium py-3 md:py-4 px-4 md:px-6 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm md:text-base shadow-sm hover:shadow-md cursor-pointer"
            >
              No, it's safe
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col gap-4 mb-6">
            {/* AI Message */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 md:px-5 py-3 md:py-4 max-w-[85%] md:max-w-[75%] lg:max-w-[65%]">
                <p className="text-gray-800 text-sm md:text-base leading-relaxed">
                  Hey User, this transaction looks unusual. Want me to block it?
                </p>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 md:gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 md:px-5 py-2.5 md:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base transition-all"
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 text-white p-2.5 md:p-3 rounded-full hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center shadow-md hover:shadow-lg flex-shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SecurityChatbot;

