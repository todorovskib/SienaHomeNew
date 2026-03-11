import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { useProducts } from '../../contexts/ProductContext';

const ProductShowcase: React.FC = () => {
  const { t } = useTranslation();
  const { products } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );

  const filteredProducts = selectedCategory === 'All'
    ? products.slice(0, 6)
    : products.filter(product => product.category === selectedCategory).slice(0, 6);

  const handleProductClick = (productId: string) => {
    navigate(`/${currentLang}/products/${productId}`);
  };

  // Helper function to get translated text
  const getTranslatedText = (text: string) => {
    if (text.startsWith('products.')) {
      return t(text);
    }
    return text;
  };

  return (
    <section id="products" className="py-12 md:py-16 lg:py-24 bg-gray-50">
      <Container>
        <div className="mb-6 md:mb-8 lg:mb-12 px-2 md:px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-3 lg:mb-4">
            {t('products.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('products.subtitle')}
          </p>
        </div>
        
        {/* Category Filter - Mobile Optimized */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12 px-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 ${
                selectedCategory === category
                  ? 'bg-siena-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {t(`products.categories.${category.toLowerCase()}`)}
            </button>
          ))}
        </div>
        
        {/* Products Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-2">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden group">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-3 md:p-4">
                    <span className="inline-block px-2 py-1 md:px-3 md:py-1 bg-siena-500 text-white text-xs font-medium rounded-full mb-2">
                      {t(`products.categories.${product.category.toLowerCase()}`)}
                    </span>
                  </div>
                </div>
                {!product.inStock && (
                  <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full">
                    {t('products.outOfStock')}
                  </div>
                )}
              </div>
              
              <div className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm md:text-base">{getTranslatedText(product.description || '')}</p>
                
                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* View All Button - Mobile Optimized */}
        <div className="mt-8 md:mt-12 text-center px-4">
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => navigate(`/${currentLang}/products`)}
            className="w-full sm:w-auto"
          >
            {t('products.viewAll')}
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default ProductShowcase;
