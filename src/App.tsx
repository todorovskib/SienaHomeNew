import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/SupabaseAuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ContentProvider } from './contexts/ContentContext';
import { ProductProvider } from './contexts/ProductContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AdminToolbar from './components/admin/AdminToolbar';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import ServicesPage from './pages/ServicesPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import WarrantyPage from './pages/WarrantyPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const DEFAULT_LANGUAGE = 'mk';
const SUPPORTED_LANGUAGES = ['mk', 'en'] as const;

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return null;
};

// Component to handle language initialization
const LanguageInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    const routeLang = location.pathname.split('/')[1];
    const targetLanguage = SUPPORTED_LANGUAGES.includes(routeLang as (typeof SUPPORTED_LANGUAGES)[number])
      ? routeLang
      : DEFAULT_LANGUAGE;

    const syncLanguage = async () => {
      setIsLanguageReady(false);
      if (i18n.resolvedLanguage !== targetLanguage) {
        await i18n.changeLanguage(targetLanguage);
      }
      if (mounted) {
        setIsLanguageReady(true);
      }
    };

    syncLanguage();

    return () => {
      mounted = false;
    };
  }, [location.pathname, i18n]);

  if (!isLanguageReady) {
    return null;
  }
  
  return <>{children}</>;
};

// Component to wrap providers that need auth context
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  return (
    <AdminProvider>
      <ContentProvider>
        <ProductProvider>
          <FavoritesProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </FavoritesProvider>
        </ProductProvider>
      </ContentProvider>
    </AdminProvider>
  );
};

function App() {
  // Redirect root to default language
  const RootRedirect = () => {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  };

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <LanguageInitializer>
          <AppProviders>
            <div className="min-h-screen bg-white">
              <Header />
              <main>
                <Routes>
                  {/* Root redirect */}
                  <Route path="/" element={<RootRedirect />} />

                  {/* Language-specific routes */}
                  {['mk', 'en'].map((lang) => (
                    <React.Fragment key={lang}>
                      <Route path={`/${lang}`} element={<HomePage />} />
                      <Route path={`/${lang}/products`} element={<ProductsPage />} />
                      <Route path={`/${lang}/products/:productId`} element={<ProductPage />} />
                      <Route path={`/${lang}/about`} element={<AboutPage />} />
                      <Route path={`/${lang}/gallery`} element={<GalleryPage />} />
                      <Route path={`/${lang}/contact`} element={<ContactPage />} />
                      <Route path={`/${lang}/services`} element={<ServicesPage />} />
                      <Route path={`/${lang}/privacy-policy`} element={<PrivacyPolicyPage />} />
                      <Route path={`/${lang}/terms-of-service`} element={<TermsOfServicePage />} />
                      <Route path={`/${lang}/warranty`} element={<WarrantyPage />} />
                      
                      {/* Admin routes */}
                      <Route path={`/${lang}/admin/login`} element={<AdminLoginPage />} />
                      <Route path={`/${lang}/admin/dashboard`} element={<AdminDashboardPage />} />
                    </React.Fragment>
                  ))}

                  {/* Catch all redirect */}
                  <Route path="*" element={<Navigate to={`/${DEFAULT_LANGUAGE}`} replace />} />
                </Routes>
              </main>
              <Footer />
              <AdminToolbar />
            </div>
          </AppProviders>
        </LanguageInitializer>
      </Router>
    </AuthProvider>
  );
}

export default App;
