import React, { useState } from 'react';
import { X, User, Settings, Heart, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFavorites: () => void;
}

const AccountDrawer: React.FC<AccountDrawerProps> = ({ isOpen, onClose, onOpenFavorites }) => {
  const { t } = useTranslation();
  const { user, profile, isAdmin, signIn, signOut, signUp } = useAuth();
  const { state: adminState, logout: adminLogout, toggleEditMode } = useAdmin();
  const { state: favoritesState } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  const [showLogin, setShowLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let success = false;

    if (showLogin) {
      const { error } = await signIn(formData.email, formData.password);
      success = !error;
    } else {
      const { error } = await signUp(formData.email, formData.password, { full_name: formData.name });
      success = !error;
    }

    if (success) {
      setFormData({ name: '', email: '', password: '' });
    }
  };

  const handleLogout = async () => {
    if (adminState.isAuthenticated) {
      await adminLogout();
    } else if (user) {
      await signOut();
    }
    onClose();
  };

  if (!isOpen) return null;

  // Check if anyone is logged in (admin or regular user)
  const isLoggedIn = adminState.isAuthenticated || !!user;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm md:max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-siena-50 to-accent-50">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-siena-600" />
              <h2 className="text-lg font-semibold text-siena-800">{t('account.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-siena-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-siena-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoggedIn ? (
              /* Logged In View */
              <div className="space-y-6">
                {adminState.isAuthenticated ? (
                  /* Admin User View */
                  <div className="space-y-6">
                    {/* Admin Profile */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-siena-50 to-accent-50 rounded-lg border border-siena-200">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">ADMIN</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-siena-800">Administrator</h3>
                        <p className="text-sm text-siena-600">{user?.email || 'Admin account'}</p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Admin</span>
                      </div>
                    </div>

                    {/* Admin Controls */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-semibold text-blue-800 mb-2 text-sm">Admin Controls</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            navigate(`/${currentLang}/admin/dashboard`);
                            onClose();
                          }}
                          className="w-full flex items-center justify-center space-x-2 p-2 rounded text-sm font-medium transition-colors duration-200 bg-blue-500 text-white hover:bg-blue-600"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </button>
                        <button
                          onClick={toggleEditMode}
                          className={`w-full flex items-center justify-center space-x-2 p-2 rounded text-sm font-medium transition-colors duration-200 ${
                            adminState.editMode
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          <Settings className="h-4 w-4" />
                          <span>{adminState.editMode ? 'Exit Edit Mode' : 'Enable Edit Mode'}</span>
                        </button>
                        {adminState.editMode && (
                          <div className="text-xs text-blue-600 text-center">
                            Edit mode active - hover over content to edit
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular User View */
                  <div className="space-y-6">
                    {/* User Profile */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-siena-50 to-accent-50 rounded-lg border border-siena-200">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || 'User'}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-siena-300"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-siena-800">
                          {profile?.full_name || 'User'}
                        </h3>
                        <p className="text-sm text-siena-600">
                          {user?.email}
                        </p>
                        {isAdmin && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Admin</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenFavorites();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white border border-siena-200 rounded-lg hover:bg-siena-50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className="text-siena-700">{t('favorites.title')}</span>
                      </div>
                      <span className="text-sm text-siena-500">
                        {favoritesState.itemCount} {t('favorites.items')}
                      </span>
                    </button>
                  </div>
                )}

                {/* Logout Button */}
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('account.logout')}</span>
                </Button>
              </div>
            ) : (
              /* Login/Register Form */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-siena-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-siena-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-siena-800">
                    {showLogin ? t('account.login') : t('account.register')}
                  </h3>
                  <p className="text-sm text-siena-600">
                    {showLogin ? t('account.loginSubtitle') : t('account.registerSubtitle')}
                  </p>
                  
                  {/* Admin Login Helper */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                    <p className="text-xs text-blue-700 font-medium mb-1">Admin Access:</p>
                    <p className="text-xs text-blue-600">Sign in with a Supabase account that has role set to admin.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!showLogin && (
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-siena-700 mb-1">
                        {t('contact.form.name')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-siena-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent transition-colors duration-200"
                        required={!showLogin}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-siena-700 mb-1">
                      {t('contact.form.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-siena-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent transition-colors duration-200"
                      placeholder={showLogin ? "Your email address" : "Your email"}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-siena-700 mb-1">
                      {t('account.password')}
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-siena-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent transition-colors duration-200"
                      placeholder={showLogin ? "Your password" : "Your password"}
                      required
                    />
                  </div>
                  
                  <Button type="submit" variant="primary" className="w-full">
                    {showLogin ? (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        {t('account.login')}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('account.register')}
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => setShowLogin(!showLogin)}
                    className="text-sm text-siena-600 hover:text-siena-700 transition-colors duration-200"
                  >
                    {showLogin ? t('account.needAccount') : t('account.haveAccount')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountDrawer;
