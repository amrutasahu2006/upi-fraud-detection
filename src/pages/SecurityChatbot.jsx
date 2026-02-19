import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTransaction } from "../context/TransactionContext";
import { chatbot } from "../services/chatbotService";
import { Send, AlertCircle, CheckCircle, Clock } from "lucide-react";

function SecurityChatbot() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentTransaction, riskAnalysis } = useTransaction();
  
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [error, setError] = useState(null);

  // Initialize chatbot with transaction context
  useEffect(() => {
    console.log("🤖 Chatbot initialization:", { 
      hasTransaction: !!currentTransaction, 
      hasRiskAnalysis: !!riskAnalysis 
    });
    
    if (currentTransaction && riskAnalysis) {
      console.log("✅ Setting chatbot context with:", {
        amount: currentTransaction.amount,
        riskScore: riskAnalysis.riskScore
      });
      chatbot.setContext(currentTransaction, riskAnalysis);
      const greeting = chatbot.generateInitialGreeting(t);
      chatbot.addMessage(greeting, 'bot');
      setMessages([{ content: greeting, type: 'bot', id: 1, meta: { kind: 'greeting' } }]);
    } else {
      // Fallback if no transaction data
      console.log("⚠️ No transaction/risk data, showing fallback greeting");
      const fallbackGreeting = t('chatbot.greeting');
      chatbot.addMessage(fallbackGreeting, 'bot');
      setMessages([{ content: fallbackGreeting, type: 'bot', id: 1, meta: { kind: 'greeting' } }]);
    }
  }, [currentTransaction, riskAnalysis]);

  // Retranslate existing bot messages when language changes
  useEffect(() => {
    setMessages((prev) => prev.map((msg) => {
      if (msg.type !== 'bot') return msg;

      if (msg.meta?.kind === 'greeting') {
        return { ...msg, content: chatbot.generateInitialGreeting(t) };
      }

      if (msg.meta?.kind === 'response' && msg.meta?.userMessage) {
        const regenerated = chatbot.generateResponse(msg.meta.userMessage, t);
        return { ...msg, content: regenerated.text };
      }

      if (msg.meta?.i18nKey) {
        return { ...msg, content: t(msg.meta.i18nKey, msg.meta.i18nValues || {}) };
      }

      return msg;
    }));
  }, [i18n.language, t]);

  /**
   * Execute action (block, delay, approve)
   */
  const executeAction = async (action) => {
    if (!riskAnalysis?.transactionId) {
      setError(t('chatbot.transactionIdNotFound', 'Transaction ID not found'));
      console.error("❌ Transaction ID missing:", riskAnalysis);
      return;
    }

    setActionInProgress(action);
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log("🔑 Token check:", { token: token ? '✅ Found' : '❌ Not found', tokenLength: token?.length });
      
      if (!token) {
        throw new Error(t('chatbot.tokenMissing', 'No authentication token found. Please log in first.'));
      }

      let endpoint = '';
      let body = {};

      console.log(`📤 Executing action: ${action} for transaction:`, riskAnalysis.transactionId);

      if (action === 'BLOCK') {
        endpoint = '/api/analysis/action/block';
        body = { transactionId: riskAnalysis.transactionId, reason: t('chatbot.blockReasonUserAction', 'User blocked via chatbot') };
      } else if (action === 'DELAY') {
        endpoint = '/api/analysis/action/delay';
        body = { transactionId: riskAnalysis.transactionId, delayMinutes: 5 };
      } else if (action === 'APPROVE') {
        // For approve, we just show success message and let user navigate
        const successMsg = t('chatbot.approveSuccess', '✅ Transaction approved! Proceeding with payment.');
        chatbot.addMessage(successMsg, 'bot');
          setMessages(prev => [...prev, { content: successMsg, type: 'bot', id: Date.now(), meta: { i18nKey: 'chatbot.approveSuccess' } }]);
        setTimeout(() => navigate('/payment'), 1500);
        return;
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      console.log(`📊 Response status: ${response.status} for ${endpoint}`);
      const responseData = await response.json();
      console.log(`📥 Response data:`, responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Action failed (${response.status})`);
      }

      if (action === 'BLOCK') {
        const blockMsg = t('chatbot.blockSuccess', '🚫 Transaction blocked successfully! Your account is protected.');
        chatbot.addMessage(blockMsg, 'bot');
          setMessages(prev => [...prev, { content: blockMsg, type: 'bot', id: Date.now(), meta: { i18nKey: 'chatbot.blockSuccess' } }]);
        setTimeout(() => navigate('/blocked'), 1500);
      } else if (action === 'DELAY') {
        const delayMsg = t('chatbot.delaySuccess', '⏳ Transaction delayed for 5 minutes. This gives you time to verify everything.');
        chatbot.addMessage(delayMsg, 'bot');
          setMessages(prev => [...prev, { content: delayMsg, type: 'bot', id: Date.now(), meta: { i18nKey: 'chatbot.delaySuccess' } }]);
        setTimeout(() => navigate('/security-warning'), 1500);
      }
    } catch (err) {
      console.error('Action error:', err);
      setError(err.message || t('chatbot.actionFailed'));
      chatbot.addMessage(`❌ Error: ${err.message}`, 'bot');
      setMessages(prev => [...prev, { content: `❌ Error: ${err.message}`, type: 'bot', id: Date.now() }]);
    } finally {
      setIsLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Handle user message
   */
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMsg = userInput.trim();
      console.log("📤 User sent message:", userMsg);
    chatbot.addMessage(userMsg, 'user');
      setMessages(prev => [...prev, { content: userMsg, type: 'user', id: Date.now(), meta: { kind: 'user' } }]);
    setUserInput("");
    setIsLoading(true);

    // Simulate typing delay for more natural feel
    await new Promise(resolve => setTimeout(resolve, 600));

    const response = chatbot.generateResponse(userMsg, t);
      console.log("📥 Bot response:", response);
    chatbot.addMessage(response.text, 'bot');
      setMessages(prev => [...prev, { content: response.text, type: 'bot', id: Date.now(), meta: { kind: 'response', userMessage: userMsg } }]);

    // Auto-execute action if high confidence
    if (response.action && response.confidence > 0.8) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await executeAction(response.action);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex justify-center">
      <div className="w-full max-w-2xl bg-white flex flex-col h-screen md:h-auto md:rounded-3xl md:shadow-xl md:mt-4 md:mb-4">

        {/* Page Header */}
        <header className="flex items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/security-warning')} 
              aria-label="Go back" 
              className="text-2xl cursor-pointer hover:opacity-70 transition-opacity"
            >
              ←
            </button>
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-900">{t('chatbot.title')}</h1>
              <p className="text-xs text-slate-500">{t('chatbot.subtitle')}</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">🤖</span>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex items-end gap-3 animate-fade-in ${
                msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {msg.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🤖</span>
                </div>
              )}
              
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 flex gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length > 0 && !actionInProgress && (
          <div className="px-4 md:px-6 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-600 mb-3 font-medium">{t('chatbot.quickActions', 'Quick actions:')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {chatbot.getQuickActions(t).map((quickAction, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    if (quickAction.action === 'QUERY') {
                      // Treat as a "why" question
                      const userMsg = t('chatbot.whyRisky', 'Why is this risky?');
                      chatbot.addMessage(userMsg, 'user');
                      setMessages(prev => [...prev, { content: userMsg, type: 'user', id: Date.now(), meta: { kind: 'user' } }]);
                      setIsLoading(true);
                      await new Promise(resolve => setTimeout(resolve, 400));
                      const response = chatbot.generateResponse(userMsg, t);
                      chatbot.addMessage(response.text, 'bot');
                      setMessages(prev => [...prev, { content: response.text, type: 'bot', id: Date.now(), meta: { kind: 'response', userMessage: userMsg } }]);
                      setIsLoading(false);
                      return;
                    }

                    if (['BLOCK', 'DELAY', 'APPROVE'].includes(quickAction.action)) {
                      await executeAction(quickAction.action);
                    }
                  }}
                  disabled={isLoading}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-900 text-xs md:text-sm font-medium rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {quickAction.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-4 md:mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">{error}</div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 p-4 md:p-6 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t('chatbot.typeMessage')}
              disabled={isLoading || actionInProgress}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !userInput.trim() || actionInProgress}
              className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
              aria-label={t('chatbot.send')}
            >
              {actionInProgress ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityChatbot;

