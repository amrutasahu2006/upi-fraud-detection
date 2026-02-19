import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setEditData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phoneNumber: user.profile?.phoneNumber || '',
      });
    }
  }, [user]);

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const result = await updateProfile(editData);
    
    if (result.success) {
      setMessage(`${t('profile.updateSuccess')}!`);
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(result.message || t('profile.updateFailed'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError(t('profile.newPasswordsMismatch'));
      return;
    }

    const result = await changePassword(passwordData);
    
    if (result.success) {
      setMessage(t('profile.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(result.message || t('profile.passwordChangeFailed'));
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <h1 className="text-2xl font-bold">{t('profile.myProfile')}</h1>
            <p className="opacity-80">{t('profile.manageSettings')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Profile Info Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{t('profile.personalInfo')}</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t('profile.edit')}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.firstName')}
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={editData.firstName}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.lastName')}
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={editData.lastName}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.phoneNumber')}
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editData.phoneNumber}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-6">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        {t('profile.saveChanges')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({
                            firstName: user.profile?.firstName || '',
                            lastName: user.profile?.lastName || '',
                            phoneNumber: user.profile?.phoneNumber || '',
                          });
                        }}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">{t('profile.fullName')}</p>
                      <p className="font-medium">
                        {user.profile?.firstName || ''} {user.profile?.lastName || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('auth.username')}</p>
                      <p className="font-medium">{user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('auth.email')}</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('profile.phoneNumber')}</p>
                      <p className="font-medium">{user.profile?.phoneNumber || t('profile.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('profile.role')}</p>
                      <p className="font-medium capitalize">{user.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('profile.memberSince')}</p>
                      <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('profile.changePassword')}</h2>
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.currentPassword')}
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.newPassword')}
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.confirmNewPassword')}
                    </label>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {t('profile.changePassword')}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Actions */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('profile.accountActions')}</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-red-600 hover:text-red-800 font-medium py-2"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('profile.accountStatus')}</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profile.status')}:</span>
                    <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? t('common.active') : t('common.inactive')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profile.role')}:</span>
                    <span className="font-medium capitalize">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message/Notification */}
      {(message || error) && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          message ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message || error}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;