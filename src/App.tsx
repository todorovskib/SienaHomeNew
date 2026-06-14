import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/SupabaseAuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ContentProvider } from './contexts/ContentContext';
import { ProductProvider } from './contexts/ProductContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
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
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

const DEFAULT_LANGUAGE = 'mk';
const SUPPORTED_LANGUAGES = ['mk', 'en'] as const;

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return null;
};

const setMetaContent = (selector: string, content: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute('content', content);
  }
};

const SeoMetadata: React.FC = () => {
  const location = useLocation();
  const lang = location.pathname.split('/')[1] === 'en' ? 'en' : 'mk';

  useEffect(() => {
    const isEnglish = lang === 'en';
    const title = isEnglish
      ? 'Siena Home - Waterproof PVC Bathroom Furniture'
      : 'Siena Home - Водоотпорен PVC мебел за бања';
    const description = isEnglish
      ? 'Custom waterproof PVC bathroom furniture, modern designs, delivery, and practical made-to-measure solutions.'
      : '100% водоотпорен PVC мебел за бања по мерка, модерни дизајни и практични решенија за вашиот дом.';
    const url = `https://sienahome.vercel.app${location.pathname}`;

    document.documentElement.lang = lang;
    document.title = title;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:url"]', url);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', url);
    }
  }, [lang, location.pathname]);

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
      <AnalyticsProvider>
        <ContentProvider>
          <ProductProvider>
            <FavoritesProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </FavoritesProvider>
          </ProductProvider>
        </ContentProvider>
      </AnalyticsProvider>
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
        <SeoMetadata />
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
                      <Route path={`/${lang}/checkout`} element={<CheckoutPage />} />
                      <Route path={`/${lang}/checkout/success`} element={<CheckoutSuccessPage />} />
                      
                      {/* Admin routes */}
                      <Route path={`/${lang}/admin`} element={<Navigate to={`/${lang}/admin/login`} replace />} />
                      <Route path={`/${lang}/admin/login`} element={<AdminLoginPage />} />
                      <Route
                        path={`/${lang}/admin/dashboard`}
                        element={(
                          <ProtectedAdminRoute>
                            <AdminDashboardPage />
                          </ProtectedAdminRoute>
                        )}
                      />
                    </React.Fragment>
                  ))}

                  {/* Non-localized admin shortcuts */}
                  <Route path="/admin" element={<Navigate to={`/${DEFAULT_LANGUAGE}/admin/login`} replace />} />
                  <Route path="/admin/login" element={<Navigate to={`/${DEFAULT_LANGUAGE}/admin/login`} replace />} />
                  <Route path="/admin/dashboard" element={<Navigate to={`/${DEFAULT_LANGUAGE}/admin/dashboard`} replace />} />
                  <Route path="/checkout" element={<Navigate to={`/${DEFAULT_LANGUAGE}/checkout`} replace />} />
                  <Route path="/checkout/success" element={<Navigate to={`/${DEFAULT_LANGUAGE}/checkout/success`} replace />} />

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
