import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';

const AdminLoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin, loading, signIn, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  const requestedPath = (location.state as { from?: string } | null)?.from;
  const dashboardPath = requestedPath?.startsWith(`/${currentLang}/admin/dashboard`)
    ? requestedPath
    : `/${currentLang}/admin/dashboard`;

  useEffect(() => {
    if (!loading && isAdmin) {
      navigate(dashboardPath, { replace: true });
    }
  }, [dashboardPath, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(credentials.email, credentials.password);
      if (result.error) {
        setError(t('admin.login.error'));
        return;
      }

      if (result.profile?.role !== 'admin') {
        await signOut();
        setError(t('admin.login.error'));
        return;
      }

      navigate(dashboardPath, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t('admin.login.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-siena-900 to-gray-800 flex items-center justify-center py-12 px-4">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-siena-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-siena-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('admin.login.title')}</h1>
              <p className="text-gray-600">{t('admin.login.subtitle')}</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.login.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent transition-colors duration-200"
                  placeholder={t('admin.login.emailPlaceholder')}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent transition-colors duration-200"
                    placeholder={t('admin.login.passwordPlaceholder')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('admin.login.loading') : t('account.login')}
              </Button>
            </form>

          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default AdminLoginPage;
