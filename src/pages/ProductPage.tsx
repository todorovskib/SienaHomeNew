import React from 'react';
import { useParams, Navigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductDetails from '../components/product/ProductDetails';
import RelatedProducts from '../components/product/RelatedProducts';
import { useProducts } from '../contexts/ProductContext';
import Container from '../components/ui/Container';

const ProductPage: React.FC = () => {
  const { productId } = useParams();
  const { t } = useTranslation();
  const { products } = useProducts();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return <Navigate to={`/${currentLang}/products`} replace />;
  }

  const productWithDefaults = {
    ...product,
    specifications: product.specifications || {
      material: 'N/A',
      finish: 'N/A',
      handleType: 'N/A',
      hingeType: 'N/A',
      mountingType: 'N/A'
    }
  };

  return (
    <div className="pt-20">
      <Container>
        <nav className="py-4">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link to={`/${currentLang}`} className="text-gray-500 hover:text-teal-600">
                {t('nav.home')}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li>
              <Link to={`/${currentLang}/products`} className="text-gray-500 hover:text-teal-600">
                {t('nav.products')}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-teal-600">{product.name}</li>
          </ol>
        </nav>
        
        <ProductDetails product={productWithDefaults} />
        <RelatedProducts currentProductId={product.id} />
      </Container>
    </div>
  );
};

export default ProductPage;
