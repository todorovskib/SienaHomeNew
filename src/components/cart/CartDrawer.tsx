import React, { useState } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/price';
import Button from '../ui/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { state, removeFromCart, updateQuantity, clearCart } = useCart();
  const { trackEvent } = useAnalytics();
  const location = useLocation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const currentLang = location.pathname.split('/')[1] || 'mk';

  const getVisitorId = () => {
    const match = document.cookie.match(/(?:^|; )siena_visitor_id=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const handleCheckout = async () => {
    setCheckoutError('');
    setIsCheckingOut(true);

    trackEvent('checkout_start', {
      entityType: 'cart',
      eventValue: state.total,
      metadata: {
        item_count: state.itemCount,
        total: state.total,
      },
    });

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          language: currentLang,
          visitorId: getVisitorId(),
          items: state.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error(t('cart.checkoutNotConfigured'));
      }

      window.location.href = data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('cart.checkoutFailed');
      setCheckoutError(message);
      trackEvent('checkout_failed', {
        entityType: 'cart',
        eventValue: state.total,
        metadata: { message },
      });
    } finally {
      setIsCheckingOut(false);
    }
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
            <h2 className="text-lg font-semibold text-siena-800">{t('cart.title')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-siena-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-siena-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-siena-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-siena-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                  </svg>
                </div>
                <p className="text-gray-500">{t('cart.empty')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-siena-50 p-3 md:p-4 rounded-lg border border-siena-100 hover:border-siena-200 transition-colors duration-200">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded ring-2 ring-siena-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate text-siena-800">{item.product.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-siena-700">
                        {formatPrice(item.product.price, i18n.resolvedLanguage)}
                      </p>

                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => {
                            const nextQuantity = item.quantity - 1;
                            updateQuantity(item.product.id, nextQuantity);
                            trackEvent('cart_quantity_change', {
                              entityType: 'product',
                              entityId: item.product.id,
                              eventValue: item.product.price * nextQuantity,
                              metadata: {
                                product_name: item.product.name,
                                previous_quantity: item.quantity,
                                next_quantity: nextQuantity,
                              },
                            });
                          }}
                          className="p-1 hover:bg-siena-200 rounded transition-colors duration-200 text-siena-600"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                        <span className="text-sm font-medium text-siena-700 bg-white px-2 py-1 rounded">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const nextQuantity = item.quantity + 1;
                            updateQuantity(item.product.id, nextQuantity);
                            trackEvent('cart_quantity_change', {
                              entityType: 'product',
                              entityId: item.product.id,
                              eventValue: item.product.price * nextQuantity,
                              metadata: {
                                product_name: item.product.name,
                                previous_quantity: item.quantity,
                                next_quantity: nextQuantity,
                              },
                            });
                          }}
                          className="p-1 hover:bg-siena-200 rounded transition-colors duration-200 text-siena-600"
                        >
                          <Plus className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                        <button
                          onClick={() => {
                            removeFromCart(item.product.id);
                            trackEvent('cart_remove', {
                              entityType: 'product',
                              entityId: item.product.id,
                              eventValue: item.product.price * item.quantity,
                              metadata: {
                                product_name: item.product.name,
                                quantity: item.quantity,
                              },
                            });
                          }}
                          className="p-1 hover:bg-red-100 text-red-600 rounded ml-2 transition-colors duration-200"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t p-4 space-y-4 bg-gradient-to-r from-siena-50 to-accent-50">
              {checkoutError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {checkoutError}
                </div>
              )}
              <div className="flex items-center justify-between text-base font-semibold text-siena-900">
                <span>{t('cart.total')}</span>
                <span>{formatPrice(state.total, i18n.resolvedLanguage)}</span>
              </div>
              <div className="space-y-2">
                <Button variant="primary" className="w-full" onClick={handleCheckout} disabled={isCheckingOut}>
                  {isCheckingOut ? t('cart.checkoutLoading') : t('cart.checkout')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-siena-300 text-siena-600 hover:bg-siena-50"
                  onClick={() => {
                    trackEvent('cart_clear', {
                      entityType: 'cart',
                      eventValue: state.total,
                      metadata: {
                        item_count: state.itemCount,
                      },
                    });
                    clearCart();
                  }}
                >
                  {t('cart.clear')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
