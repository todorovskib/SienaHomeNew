import React, { useState, useEffect } from 'react';
import { Menu, X, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Container from '../ui/Container';
import Button from '../ui/Button';
import Logo from '../ui/Logo';
import FavoritesDrawer from '../favorites/FavoritesDrawer';
import { useFavorites } from '../../contexts/FavoritesContext';
import { NavLink } from '../../types';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  const { state: favoritesState } = useFavorites();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const getLocalizedPath = (path: string, targetLang: string) => {
    const pathParts = location.pathname.split('/');
    pathParts[1] = targetLang;
    return pathParts.join('/');
  };

  const navigation: NavLink[] = [
    { name: t('nav.home'), href: `/${currentLang}` },
    { name: t('nav.products'), href: `/${currentLang}/products` },
    { name: t('nav.services'), href: `/${currentLang}/services` },
    { name: t('nav.about'), href: `/${currentLang}/about` },
    { name: t('nav.gallery'), href: `/${currentLang}/gallery` },
    { name: t('nav.contact'), href: `/${currentLang}/contact` },
  ];

  const toggleLanguage = () => {
    const newLang = currentLang === 'mk' ? 'en' : 'mk';
    const newPath = getLocalizedPath(location.pathname, newLang);
    i18n.changeLanguage(newLang);
    navigate(newPath);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if we're on the home page
  const isHomePage = location.pathname === `/${currentLang}` || location.pathname === '/';

  // Determine if header should have dark background (always visible)
  const shouldHaveDarkBg = !isHomePage || scrolled;

  return (
    <>
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        shouldHaveDarkBg ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}>
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to={`/${currentLang}`}>
                <Logo size={shouldHaveDarkBg ? 'sm' : 'md'} />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-base font-medium transition-colors duration-300 ${
                    shouldHaveDarkBg ? 'text-primary-800 hover:text-primary-600' : 'text-white hover:text-teal-200'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Desktop Language Switcher */}
              <div className="relative">
                <button
                  onClick={toggleLanguage}
                  className={`flex items-center px-3 py-1.5 rounded-full border-2 transition-all duration-300 ${
                    shouldHaveDarkBg 
                      ? 'border-teal-200 bg-white hover:border-teal-400 text-gray-700' 
                      : 'border-white/30 bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  aria-label={currentLang === 'mk' ? 'Switch to English' : 'Промени на македонски'}
                >
                  <div className="flex items-center space-x-1">
                    <span className={`text-sm font-medium transition-all duration-300 ${
                      currentLang === 'mk' ? 'opacity-100' : 'opacity-50'
                    }`}>
                      MK
                    </span>
                    <div className={`w-8 h-4 rounded-full border transition-all duration-300 relative ${
                      shouldHaveDarkBg ? 'border-gray-300 bg-gray-100' : 'border-white/50 bg-white/20'
                    }`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${
                        currentLang === 'en' 
                          ? 'translate-x-4 bg-teal-500' 
                          : shouldHaveDarkBg ? 'translate-x-0.5 bg-gray-600' : 'translate-x-0.5 bg-white'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium transition-all duration-300 ${
                      currentLang === 'en' ? 'opacity-100' : 'opacity-50'
                    }`}>
                      EN
                    </span>
                  </div>
                </button>
              </div>

              {/* Desktop Action Buttons */}
              <button
                onClick={() => setIsFavoritesOpen(true)}
                className={`relative transition-colors duration-300 p-2 rounded-full ${
                  shouldHaveDarkBg ? 'text-primary-800 hover:text-primary-600' : 'text-white hover:text-teal-200'
                }`}
                aria-label="Favorites"
              >
                <Heart className="h-5 w-5" />
                {favoritesState.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favoritesState.itemCount}
                  </span>
                )}
              </button>
              
              <Link to={`/${currentLang}/contact`}>
                <Button variant="primary" size="sm">
                  {t('nav.getQuote')}
                </Button>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center space-x-2">
              {/* Mobile Action Buttons */}
              <button
                onClick={() => setIsFavoritesOpen(true)}
                className={`relative p-2 transition-colors duration-300 ${
                  shouldHaveDarkBg ? 'text-primary-800 hover:text-primary-600' : 'text-white hover:text-teal-200'
                } focus:outline-none`}
              >
                <Heart className="h-5 w-5" />
                {favoritesState.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {favoritesState.itemCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 transition-colors duration-300 ${
                  shouldHaveDarkBg ? 'text-primary-800 hover:text-primary-600' : 'text-white hover:text-teal-200'
                } focus:outline-none`}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
        )}

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Logo size="sm" />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Language Switcher */}
              <div className="p-4 border-b">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {currentLang === 'mk' ? 'Македонски' : 'English'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${currentLang === 'mk' ? 'font-bold text-teal-600' : 'text-gray-500'}`}>
                      MK
                    </span>
                    <div className="w-8 h-4 bg-gray-200 rounded-full relative">
                      <div className={`absolute top-0.5 w-3 h-3 bg-teal-500 rounded-full transition-transform duration-300 ${
                        currentLang === 'en' ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                    <span className={`text-xs ${currentLang === 'en' ? 'font-bold text-teal-600' : 'text-gray-500'}`}>
                      EN
                    </span>
                  </div>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-4">
                <div className="space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>

            {/* Mobile Menu Footer */}
            <div className="p-4 border-t bg-gray-50">
              <Link 
                to={`/${currentLang}/contact`} 
                onClick={() => setIsOpen(false)}
                className="block w-full"
              >
                <Button variant="primary" className="w-full">
                  {t('nav.getQuote')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <FavoritesDrawer isOpen={isFavoritesOpen} onClose={() => setIsFavoritesOpen(false)} />
    </>
  );
};

export default Header;
