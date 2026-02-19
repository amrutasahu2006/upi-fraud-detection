import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import TwoFactorPrompt from '../../components/TwoFactorPrompt';

const LoginPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  
  const { login, verify2FALogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      if (result.requires2FA) {
        // Show 2FA prompt
        setTempUserId(result.userId);
        setShow2FA(true);
      } else {
        // Login complete
        navigate('/');
      }
    } else {
      setError(result.message || t('auth.loginFailed'));
    }
    
    setLoading(false);
  };

  const handle2FAVerify = async (code, useBackupCode) => {
    const result = await verify2FALogin(tempUserId, code, useBackupCode);
    
    if (result.success) {
      setShow2FA(false);
      navigate('/');
    } else {
      throw new Error(result.message || 'Verification failed');
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempUserId(null);
    setError(t('auth.loginCancelled'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{t('auth.welcomeBack')}</h1>
            <p className="text-gray-600 mt-2">{t('auth.enterCredentials')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder={t('auth.enterEmail')}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder={t('auth.enterPassword')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
              {loading ? `${t('common.loading')}` : t('auth.signIn')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>

      {/* 2FA Prompt Modal */}
      {show2FA && (
        <TwoFactorPrompt
          onVerify={handle2FAVerify}
          onCancel={handle2FACancel}
        />
      )}
    </div>
  );
};

export default LoginPage;