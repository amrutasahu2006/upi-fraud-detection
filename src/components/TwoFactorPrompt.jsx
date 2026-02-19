import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertCircle, X } from 'lucide-react';

const TwoFactorPrompt = ({ onVerify, onCancel, onUseBackupCode }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!useBackup && code.length !== 6) {
        setError(t('twoFactor.invalidCode'));
      return;
    }

    if (useBackup && code.length < 8) {
        setError(t('twoFactor.invalidCode'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(code, useBackup);
    } catch (err) {
        setError(err.message || t('twoFactor.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    let value = e.target.value;
    if (!useBackup) {
      value = value.replace(/\D/g, '').slice(0, 6);
    } else {
      value = value.toUpperCase().slice(0, 8);
    }
    setCode(value);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/20 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('twoFactor.title')}</h2>
          <p className="text-gray-600 text-sm">
            {useBackup 
                ? t('twoFactor.backupCodeMessage')
                : t('twoFactor.loginMessage')
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder={useBackup ? 'XXXXXXXX' : '000000'}
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!useBackup && code.length !== 6) || (useBackup && code.length < 8)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
              {loading ? t('twoFactor.verifying') : t('twoFactor.verifyCode')}
          </button>
        </form>

        {/* Backup code toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setUseBackup(!useBackup);
              setCode('');
              setError('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {useBackup ? t('twoFactor.useAuthenticatorInstead') : t('twoFactor.useBackupCode')}
          </button>
        </div>

        {/* Help text */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {useBackup
                ? t('twoFactor.backupCodesWarning')
              : t('twoFactor.openAuthenticator')
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorPrompt;
