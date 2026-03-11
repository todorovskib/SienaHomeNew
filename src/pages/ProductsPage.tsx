import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Search, Filter } from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';

interface FilterState {
  category: string;
  dimensions: string[];
  materials: string[];
  inStock: boolean | null;
}

const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { products } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1];
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    dimensions: [],
    materials: [],
    inStock: null
  });

  // Get unique values for filters
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const allMaterials = [...new Set(products.map(p => p.specifications.material))];
  const allDimensions = [...new Set(products.map(p => `${p.dimensions.width} CM`))];

  // Helper function to get translated text
  const getTranslatedText = (text: string) => {
    if (text.startsWith('products.')) {
      return t(text);
    }
    return text;
  };

  const filteredProducts = products
    .filter(product => {
      // Category filter
      if (filters.category !== 'All' && product.category !== filters.category) {
        return false;
      }

      // Dimensions filter
      if (filters.dimensions.length > 0) {
        const productDimension = `${product.dimensions.width} CM`;
        if (!filters.dimensions.includes(productDimension)) {
          return false;
        }
      }
      
      // Materials filter
      if (filters.materials.length > 0) {
        if (!filters.materials.includes(product.specifications.material)) {
          return false;
        }
      }
      
      // Stock filter
      if (filters.inStock !== null && product.inStock !== filters.inStock) {
        return false;
      }
      
      // Search filter
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !getTranslatedText(product.description).toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });

  const handleProductClick = (productId: string) => {
    navigate(`/${currentLang}/products/${productId}`);
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'dimensions' | 'materials', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'All',
      dimensions: [],
      materials: [],
      inStock: null
    });
    setSearchQuery('');
  };

  const FilterSidebar = () => (
    <div className="w-full lg:w-80 bg-white p-6 rounded-lg shadow-sm h-fit border border-siena-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-siena-800">{t('products.filters.title')}</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-siena-600 hover:text-siena-700 transition-colors duration-200"
        >
          {t('products.filters.clear')}
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-siena-700">{t('products.filters.categories')}</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center group cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={filters.category === category}
                onChange={() => updateFilter('category', category)}
                className="mr-2 text-siena-600 focus:ring-siena-500"
              />
              <span className="text-sm group-hover:text-siena-600 transition-colors duration-200">{t(`products.categories.${category.toLowerCase()}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-siena-700">{t('products.filters.dimensions')}</h4>
        <div className="space-y-2">
          {allDimensions.map((dimension) => (
            <label key={dimension} className="flex items-center group cursor-pointer">
              <input
                type="checkbox"
                checked={filters.dimensions.includes(dimension)}
                onChange={() => toggleArrayFilter('dimensions', dimension)}
                className="mr-2 text-siena-600 focus:ring-siena-500"
              />
              <span className="text-sm group-hover:text-siena-600 transition-colors duration-200">{dimension}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Materials */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-siena-700">{t('products.filters.materials')}</h4>
        <div className="space-y-2">
          {allMaterials.map((material) => (
            <label key={material} className="flex items-center group cursor-pointer">
              <input
                type="checkbox"
                checked={filters.materials.includes(material)}
                onChange={() => toggleArrayFilter('materials', material)}
                className="mr-2 text-siena-600 focus:ring-siena-500"
              />
              <span className="text-sm group-hover:text-siena-600 transition-colors duration-200">{material}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stock Status */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-siena-700">{t('products.filters.availability')}</h4>
        <div className="space-y-2">
          <label className="flex items-center group cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={filters.inStock === null}
              onChange={() => updateFilter('inStock', null)}
              className="mr-2 text-siena-600 focus:ring-siena-500"
            />
            <span className="text-sm group-hover:text-siena-600 transition-colors duration-200">{t('products.filters.all')}</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={filters.inStock === true}
              onChange={() => updateFilter('inStock', true)}
              className="mr-2 text-siena-600 focus:ring-siena-500"
            />
            <span className="text-sm group-hover:text-siena-600 transition-colors duration-200">{t('products.filters.inStock')}</span>
          </label>
          <label className="flex items-center group cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={filters.inStock === false}
              onChange={() => updateFilter('inStock', false)}
              className="mr-2 text-siena-600 focus:ring-siena-500"
            />
            <span className="text-sm group-hover:text-siena-600 transition-colors duration-200">{t('products.filters.outOfStock')}</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-24">
      <Container>
        <div className="mb-6 md:mb-8 lg:mb-12 px-2 md:px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-3 lg:mb-4">
            {t('products.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('products.subtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-siena-300 rounded-md hover:bg-siena-50 transition-colors duration-200"
            >
              <Filter className="h-4 w-4 text-siena-600" />
              <span className="text-siena-700">{t('products.filters.title')}</span>
            </button>
          </div>

          {/* Sidebar Filters */}
          <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
            <FilterSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-siena-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t('products.search')}
                  className="w-full pl-10 pr-4 py-3 border border-siena-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent transition-colors duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-siena-600">
                {t('products.results', { count: filteredProducts.length })}
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-siena-100 hover:border-siena-200"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="relative h-64 overflow-hidden group">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4">
                        <span className="inline-block px-3 py-1 bg-siena-500 text-white text-xs font-medium rounded-full mb-2">
                          {t(`products.categories.${product.category.toLowerCase()}`)}
                        </span>
                      </div>
                    </div>
                    {!product.inStock && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {t('products.outOfStock')}
                      </div>
                    )}
                    {product.inStock && (
                      <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {t('products.filters.inStock')}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm md:text-base">
                      {getTranslatedText(product.description)}
                    </p>

                    <div className="flex items-center justify-end">
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

            {/* No Results */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-siena-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-siena-400" />
                </div>
                <p className="text-gray-500 text-lg">
                  {t('products.noResults')}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-siena-600 hover:text-siena-700 transition-colors duration-200"
                >
                  {t('products.filters.clear')}
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProductsPage;
