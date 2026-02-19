import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Shield, Check, Copy, Download, AlertTriangle, Key, Smartphone } from 'lucide-react';

const Setup2FA = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Backup Codes, 4: Complete
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initiate2FASetup();
  }, []);

  const initiate2FASetup = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setQrCode(data.data.qrCode);
        setSecret(data.data.manualEntry);
        setBackupCodes(data.data.backupCodes);
      } else {
        setError(data.message || t('twoFactor.setupError'));
      }
    } catch (err) {
      setError(t('twoFactor.setupError'));
      console.error('2FA setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError(t('twoFactor.invalidCode'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5000/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: verificationCode })
      });

      const data = await response.json();
      if (data.success) {
        setStep(3); // Show backup codes
      } else {
        setError(data.message || t('twoFactor.invalidCode'));
      }
    } catch (err) {
      setError(t('twoFactor.invalidCode'));
      console.error('2FA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `UPI Fraud Detection - 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\n⚠️ Keep these codes safe! Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    navigate('/recommendations');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('twoFactor.setupTitle')}</h1>
          <p className="text-gray-600">{t('security.twoFactorCard.description')}</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Check size={20} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Scan QR Code */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{t('twoFactor.setupStep1')}</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-700">{t('twoFactor.installAppIntro')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Google Authenticator (iOS/Android)</li>
                <li>Microsoft Authenticator (iOS/Android)</li>
                <li>Authy (iOS/Android/Desktop)</li>
              </ul>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : qrCode ? (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600 mb-4 text-center">{t('twoFactor.scanQR')}</p>
                  <div className="flex justify-center">
                    <img src={qrCode} alt="2FA QR Code" className="w-64 h-64 border-4 border-white rounded-lg shadow-md" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">{t('twoFactor.manualEntry')}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-200 text-sm font-mono break-all">
                      {secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(secret)}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {t('twoFactor.continueVerification')}
                </button>
              </div>
            ) : error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{t('twoFactor.setupStep2')}</h2>
            </div>

            <p className="text-gray-700 mb-6">{t('twoFactor.enterCode')}</p>

            <div className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="000000"
                maxLength="6"
                className="w-full text-center text-3xl font-mono tracking-widest px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6 || loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? t('twoFactor.verifying') : t('twoFactor.verifyEnable')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">{t('twoFactor.setupStep3')}</h2>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-900 font-semibold mb-2">{t('twoFactor.backupCodesImportant')}</p>
              <p className="text-yellow-800 text-sm">
                {t('twoFactor.backupCodesWarning')}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-3">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white px-4 py-2 rounded border border-gray-300 font-mono text-sm text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={downloadBackupCodes}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                <Download size={20} />
                {t('twoFactor.downloadCodes')}
              </button>

              <button
                onClick={handleComplete}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {t('twoFactor.setupComplete')}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              {t('twoFactor.backupCodesStore')}
            </p>
          </div>
        )}

        {/* Cancel button */}
        {step < 3 && (
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/recommendations')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Setup2FA;
