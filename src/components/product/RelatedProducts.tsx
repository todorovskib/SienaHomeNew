import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { ChevronRight } from 'lucide-react';
import Button from '../ui/Button';

interface RelatedProductsProps {
  currentProductId: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ currentProductId }) => {
  const { t } = useTranslation();
  const { products } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1];
  
  const relatedProducts = products
    .filter(product => product.id !== currentProductId)
    .slice(0, 3);

  const handleProductClick = (productId: string) => {
    // Scroll to top when navigating to a new product
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <section className="py-12 bg-gradient-to-br from-siena-50 to-accent-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-siena-800">
          {t('products.related')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-siena-100 hover:border-siena-200"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-siena-800">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {getTranslatedText(product.description)}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-siena-600">{product.price}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-siena-600 border-siena-600 hover:bg-siena-50"
                  >
                    {t('products.details')}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
