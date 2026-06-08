import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Minus, Plus, MessageSquare, Heart, ShoppingCart } from 'lucide-react';
import { ProductDetails as ProductDetailsType } from '../../types';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { formatPrice } from '../../utils/price';
import Button from '../ui/Button';

interface ProductDetailsProps {
  product: ProductDetailsType;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { trackEvent } = useAnalytics();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const isProductFavorite = isFavorite(product.id);

  useEffect(() => {
    trackEvent('product_view', {
      entityType: 'product',
      entityId: product.id,
      metadata: {
        product_name: product.name,
        product_slug: product.slug,
        price: product.price,
      },
    });
  }, [product.id, product.name, product.price, product.slug, trackEvent]);

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleGetQuote = () => {
    trackEvent('quote_click', {
      entityType: 'product',
      entityId: product.id,
      metadata: { product_name: product.name },
    });
    navigate(`/${currentLang}/contact`);
  };

  const handleToggleFavorite = () => {
    if (isProductFavorite) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }

    trackEvent(isProductFavorite ? 'favorite_remove' : 'favorite_add', {
      entityType: 'product',
      entityId: product.id,
      metadata: { product_name: product.name },
    });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    trackEvent('add_to_cart', {
      entityType: 'product',
      entityId: product.id,
      eventValue: product.price * quantity,
      metadata: {
        product_name: product.name,
        quantity,
        price: product.price,
      },
    });
  };

  const allImages = [product.imageUrl, ...(product.additionalImages || [])];

  // Helper function to get translated text
  const getTranslatedText = (text: string) => {
    if (text.startsWith('products.')) {
      return t(text);
    }
    return text;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="mb-4 border border-siena-200 rounded-lg overflow-hidden shadow-sm">
            <TransformWrapper>
              <TransformComponent>
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-auto cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {allImages.map((image, index) => (
              <button
                key={index}
                className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                  selectedImage === image ? 'ring-2 ring-siena-500 border-siena-300' : 'border-siena-200 hover:border-siena-300'
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Information */}
        <div>
          <h1 className="text-3xl font-bold mb-6 text-siena-800">
            {product.name}
          </h1>

          <div className="mb-6 flex items-center justify-between rounded-lg border border-siena-200 bg-siena-50 p-4">
            <span className="text-sm font-medium uppercase tracking-wide text-siena-700">
              {t('admin.dashboard.table.price')}
            </span>
            <span className="text-3xl font-bold text-siena-800">
              {formatPrice(product.price, i18n.resolvedLanguage)}
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-siena-700">
              {t('products.description')}
            </h2>
            <p className="text-gray-600">
              {getTranslatedText(product.description)}
            </p>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-siena-700">
              {t('products.features')}
            </h2>
            <ul className="list-disc list-inside space-y-1">
              {product.features.map((feature, index) => (
                <li key={index} className="text-gray-600 flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-gray-600 flex-1">{getTranslatedText(feature)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-siena-700">
              {t('products.specifications')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.specifications)
                .filter(([key]) => key !== 'mirrorWidth' && key !== 'mirrorHeight')
                .map(([key, value]) => (
                  <div key={key} className="bg-siena-50 p-3 rounded-lg">
                    <span className="font-medium text-siena-700">
                      {t(`products.specs.${key}`)}
                      :
                    </span>
                    <span className="text-gray-600">
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-siena-700">
              {t('products.dimensions.title')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-siena-50 p-3 rounded-lg">
                <span className="font-medium text-siena-700">
                  {t('products.dimensions.width')}
                  :
                </span>
                <span className="text-gray-600">{product.dimensions.width} cm</span>
              </div>
              <div className="bg-siena-50 p-3 rounded-lg">
                <span className="font-medium text-siena-700">
                  {t('products.dimensions.height')}
                  :
                </span>
                <span className="text-gray-600">{product.dimensions.height} cm</span>
              </div>
              <div className="bg-siena-50 p-3 rounded-lg">
                <span className="font-medium text-siena-700">
                  {t('products.dimensions.depth')}
                  :
                </span>
                <span className="text-gray-600">{product.dimensions.depth} cm</span>
              </div>
              <div className="bg-siena-50 p-3 rounded-lg">
                <span className="font-medium text-siena-700">
                  {t('products.dimensions.weight')}
                  :
                </span>
                <span className="text-gray-600">{product.dimensions.weight} kg</span>
              </div>
            </div>
          </div>

          {/* Mirror Dimensions - Only show if product has mirror dimensions */}
          {product.specifications.mirrorWidth && product.specifications.mirrorHeight && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-siena-700">
                {t('products.dimensions.mirrorTitle')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-siena-50 p-3 rounded-lg">
                  <span className="font-medium text-siena-700">
                    {t('products.dimensions.width')}
                    :
                  </span>
                  <span className="text-gray-600">{product.specifications.mirrorWidth} cm</span>
                </div>
                <div className="bg-siena-50 p-3 rounded-lg">
                  <span className="font-medium text-siena-700">
                    {t('products.dimensions.height')}
                    :
                  </span>
                  <span className="text-gray-600">{product.specifications.mirrorHeight} cm</span>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-siena-700">
              {t('products.quantity')}
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="p-2 border border-siena-300 rounded-md hover:bg-siena-100 transition-colors duration-200 disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4 text-siena-600" />
              </button>
              <span className="text-xl font-medium text-siena-700 bg-siena-50 px-4 py-2 rounded-md">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-2 border border-siena-300 rounded-md hover:bg-siena-100 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 text-siena-600" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {t('products.addToCart')}
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGetQuote}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              {t('products.getQuote')}
            </Button>

            <Button
              variant={isProductFavorite ? "primary" : "outline"}
              onClick={handleToggleFavorite}
              className={`px-4 ${isProductFavorite ? 'bg-red-500 hover:bg-red-600 border-red-500' : 'border-red-500 text-red-500 hover:bg-red-50'}`}
            >
              <Heart className={`h-5 w-5 ${isProductFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Custom Order Note */}
          <div className="bg-siena-50 p-4 rounded-lg border border-siena-200">
            <p className="text-sm text-siena-700">
              {t('products.customOrderNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setIsLightboxOpen(false)}
        >
          <TransformWrapper>
            <TransformComponent>
              <img
                src={selectedImage}
                alt={product.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
