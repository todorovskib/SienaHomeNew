import React from 'react';
import { X, ShoppingCart, Trash2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { formatPrice } from '../../utils/price';
import { Product } from '../../types';
import Button from '../ui/Button';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  const { state, removeFromFavorites, clearFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { trackEvent } = useAnalytics();

  const handleProductClick = (productId: string) => {
    const item = state.items.find((favorite) => favorite.product.id === productId);
    trackEvent('product_card_click', {
      entityType: 'product',
      entityId: productId,
      metadata: {
        source: 'favorites_drawer',
        product_name: item?.product.name,
        product_slug: item?.product.slug,
      },
    });
    navigate(`/${currentLang}/products/${productId}`);
    onClose();
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    trackEvent('add_to_cart', {
      entityType: 'product',
      entityId: product.id,
      eventValue: product.price,
      metadata: {
        source: 'favorites_drawer',
        product_name: product.name,
        quantity: 1,
        price: product.price,
      },
    });
  };

  if (!isOpen) return null;

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
              <Heart className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-siena-800">{t('favorites.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-siena-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-siena-600" />
            </button>
          </div>

          {/* Favorites Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-gray-500">{t('favorites.empty')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.product.id} className="bg-gradient-to-r from-gray-50 to-siena-50 p-3 md:p-4 rounded-lg border border-siena-100 hover:border-siena-200 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded cursor-pointer ring-2 ring-siena-200 hover:ring-siena-300 transition-colors duration-200"
                        onClick={() => handleProductClick(item.product.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-sm cursor-pointer hover:text-siena-600 truncate transition-colors duration-200"
                          onClick={() => handleProductClick(item.product.id)}
                        >
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('favorites.addedOn')} {item.dateAdded.toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-siena-700">
                          {formatPrice(item.product.price, i18n.resolvedLanguage)}
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-3">
                          <button
                            onClick={() => handleAddToCart(item.product)}
                            className="flex items-center space-x-1 px-3 py-1 bg-siena-500 text-white text-xs rounded hover:bg-siena-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!item.product.inStock}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span>{item.product.inStock ? t('products.addToCart') : t('products.outOfStock')}</span>
                          </button>
                          <button
                            onClick={() => removeFromFavorites(item.product.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors duration-200"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t p-4 space-y-3 bg-gradient-to-r from-siena-50 to-accent-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-siena-800">{t('favorites.total')}</span>
                <span className="text-sm font-bold text-siena-600">{state.itemCount} {t('favorites.items')}</span>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full text-sm border-siena-300 text-siena-600 hover:bg-siena-50"
                onClick={clearFavorites}
              >
                {t('favorites.clear')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FavoritesDrawer;
