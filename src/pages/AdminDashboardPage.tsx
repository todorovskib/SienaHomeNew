import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit, Eye, EyeOff, LogOut, Package, Plus, Save, Trash2, X } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useProducts } from '../contexts/ProductContext';
import { Color, Product } from '../types';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';

type ProductFormState = {
  id: string | null;
  name: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  inStock: boolean;
  isPublished: boolean;
  sortOrder: number;
  featuresText: string;
  additionalImagesText: string;
  colorsText: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  material: string;
  finish: string;
  handleType: string;
  hingeType: string;
  mountingType: string;
};

const EMPTY_FORM: ProductFormState = {
  id: null,
  name: '',
  slug: '',
  category: 'Vanities',
  price: 0,
  description: '',
  imageUrl: '',
  inStock: true,
  isPublished: true,
  sortOrder: 0,
  featuresText: '',
  additionalImagesText: '',
  colorsText: 'White|#ffffff',
  width: 0,
  height: 0,
  depth: 0,
  weight: 0,
  material: 'PVC',
  finish: 'Matte',
  handleType: 'Standard',
  hingeType: 'Standard',
  mountingType: 'Wall-mounted',
};

const toLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const parseColors = (value: string): Color[] => {
  const parsed = toLines(value)
    .map((line) => {
      const [name, colorValue] = line.split('|').map((part) => part.trim());
      if (!name || !colorValue) {
        return null;
      }
      return { name, value: colorValue };
    })
    .filter((color): color is Color => color !== null);

  return parsed.length > 0 ? parsed : [{ name: 'White', value: '#ffffff' }];
};

const colorsToText = (colors: Color[]): string =>
  colors
    .map((color) => `${color.name}|${color.value}`)
    .join('\n');

const productToForm = (product: Product): ProductFormState => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  category: product.category,
  price: product.price,
  description: product.description,
  imageUrl: product.imageUrl,
  inStock: product.inStock,
  isPublished: product.isPublished,
  sortOrder: product.sortOrder,
  featuresText: product.features.join('\n'),
  additionalImagesText: product.additionalImages.join('\n'),
  colorsText: colorsToText(product.colors),
  width: product.dimensions.width,
  height: product.dimensions.height,
  depth: product.dimensions.depth,
  weight: product.dimensions.weight,
  material: product.specifications.material,
  finish: product.specifications.finish,
  handleType: product.specifications.handleType,
  hingeType: product.specifications.hingeType,
  mountingType: product.specifications.mountingType,
});

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { state: adminState, logout } = useAdmin();
  const { products, loading, saving, error, createProduct, updateProduct, deleteProduct } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';

  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const isEdit = Boolean(formState.id);

  useEffect(() => {
    if (!adminState.loading && !adminState.isAuthenticated) {
      navigate(`/${currentLang}/admin/login`);
    }
  }, [adminState.loading, adminState.isAuthenticated, navigate, currentLang]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) {
      return products;
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query),
    );
  }, [products, searchTerm]);

  const handleLogout = async () => {
    await logout();
    navigate(`/${currentLang}`);
  };

  const openCreateForm = () => {
    setFormError('');
    setFormState(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setFormError('');
    setFormState(productToForm(product));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormState(EMPTY_FORM);
    setFormError('');
  };

  const handleSave = async () => {
    if (!formState.name.trim()) {
      setFormError(t('admin.dashboard.validation.nameRequired'));
      return;
    }
    if (!formState.imageUrl.trim()) {
      setFormError('Main image URL is required.');
      return;
    }

    const payload = {
      name: formState.name.trim(),
      slug: formState.slug.trim() || undefined,
      category: formState.category,
      price: Number.isFinite(formState.price) ? formState.price : 0,
      description: formState.description.trim(),
      imageUrl: formState.imageUrl.trim(),
      inStock: formState.inStock,
      isPublished: formState.isPublished,
      sortOrder: Number.isFinite(formState.sortOrder) ? formState.sortOrder : 0,
      features: toLines(formState.featuresText),
      additionalImages: toLines(formState.additionalImagesText),
      colors: parseColors(formState.colorsText),
      dimensions: {
        width: Number.isFinite(formState.width) ? formState.width : 0,
        height: Number.isFinite(formState.height) ? formState.height : 0,
        depth: Number.isFinite(formState.depth) ? formState.depth : 0,
        weight: Number.isFinite(formState.weight) ? formState.weight : 0,
      },
      specifications: {
        material: formState.material.trim(),
        finish: formState.finish.trim(),
        handleType: formState.handleType.trim(),
        hingeType: formState.hingeType.trim(),
        mountingType: formState.mountingType.trim(),
      },
    };

    setFormError('');
    try {
      if (formState.id) {
        await updateProduct(formState.id, payload);
      } else {
        await createProduct(payload);
      }
      closeForm();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to save product.');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) {
      return;
    }
    try {
      await deleteProduct(product.id);
      if (formState.id === product.id) {
        closeForm();
      }
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Failed to delete product.');
    }
  };

  if (adminState.loading) {
    return null;
  }

  if (!adminState.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
            <p className="text-gray-600">{t('admin.dashboard.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            {t('account.logout')}
          </Button>
        </div>

        {(error || formError) && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError || error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
            <Package className="h-6 w-6 text-siena-600" />
            <div>
              <p className="text-sm text-gray-600">{t('admin.dashboard.stats.totalProducts')}</p>
              <p className="text-xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
            <Eye className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">{t('admin.dashboard.stats.inStock')}</p>
              <p className="text-xl font-bold text-gray-900">{products.filter((product) => product.inStock).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
            <EyeOff className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">{t('admin.dashboard.stats.outOfStock')}</p>
              <p className="text-xl font-bold text-gray-900">{products.filter((product) => !product.inStock).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder={t('admin.dashboard.searchPlaceholder')}
            className="w-full sm:max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-siena-500"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Button variant="primary" onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.dashboard.addProduct')}
          </Button>
        </div>

        {formOpen && (
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-siena-200">
            <h2 className="text-lg font-semibold text-siena-800 mb-4">
              {isEdit ? t('admin.dashboard.editProduct') : t('admin.dashboard.addProduct')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="px-3 py-2 border rounded-md" placeholder="Name *" value={formState.name} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} />
              <input className="px-3 py-2 border rounded-md" placeholder="Slug (optional)" value={formState.slug} onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))} />
              <input className="px-3 py-2 border rounded-md" placeholder="Category" value={formState.category} onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))} />
              <input type="number" className="px-3 py-2 border rounded-md" placeholder="Price" value={formState.price} onChange={(event) => setFormState((prev) => ({ ...prev, price: Number(event.target.value) }))} />
              <input className="px-3 py-2 border rounded-md md:col-span-2" placeholder="Main image URL *" value={formState.imageUrl} onChange={(event) => setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))} />
              <textarea className="px-3 py-2 border rounded-md md:col-span-2" rows={3} placeholder="Description" value={formState.description} onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))} />
              <textarea className="px-3 py-2 border rounded-md" rows={4} placeholder="Features (one per line)" value={formState.featuresText} onChange={(event) => setFormState((prev) => ({ ...prev, featuresText: event.target.value }))} />
              <textarea className="px-3 py-2 border rounded-md" rows={4} placeholder="Additional image URLs (one per line)" value={formState.additionalImagesText} onChange={(event) => setFormState((prev) => ({ ...prev, additionalImagesText: event.target.value }))} />
              <textarea className="px-3 py-2 border rounded-md md:col-span-2" rows={2} placeholder="Colors (one per line: Name|#hex)" value={formState.colorsText} onChange={(event) => setFormState((prev) => ({ ...prev, colorsText: event.target.value }))} />
              <input type="number" className="px-3 py-2 border rounded-md" placeholder="Width" value={formState.width} onChange={(event) => setFormState((prev) => ({ ...prev, width: Number(event.target.value) }))} />
              <input type="number" className="px-3 py-2 border rounded-md" placeholder="Height" value={formState.height} onChange={(event) => setFormState((prev) => ({ ...prev, height: Number(event.target.value) }))} />
              <input type="number" className="px-3 py-2 border rounded-md" placeholder="Depth" value={formState.depth} onChange={(event) => setFormState((prev) => ({ ...prev, depth: Number(event.target.value) }))} />
              <input type="number" className="px-3 py-2 border rounded-md" placeholder="Weight" value={formState.weight} onChange={(event) => setFormState((prev) => ({ ...prev, weight: Number(event.target.value) }))} />
              <input className="px-3 py-2 border rounded-md" placeholder="Material" value={formState.material} onChange={(event) => setFormState((prev) => ({ ...prev, material: event.target.value }))} />
              <input className="px-3 py-2 border rounded-md" placeholder="Finish" value={formState.finish} onChange={(event) => setFormState((prev) => ({ ...prev, finish: event.target.value }))} />
              <input className="px-3 py-2 border rounded-md" placeholder="Handle Type" value={formState.handleType} onChange={(event) => setFormState((prev) => ({ ...prev, handleType: event.target.value }))} />
              <input className="px-3 py-2 border rounded-md" placeholder="Hinge Type" value={formState.hingeType} onChange={(event) => setFormState((prev) => ({ ...prev, hingeType: event.target.value }))} />
              <input className="px-3 py-2 border rounded-md" placeholder="Mounting Type" value={formState.mountingType} onChange={(event) => setFormState((prev) => ({ ...prev, mountingType: event.target.value }))} />
              <input type="number" className="px-3 py-2 border rounded-md" placeholder="Sort Order" value={formState.sortOrder} onChange={(event) => setFormState((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formState.inStock} onChange={(event) => setFormState((prev) => ({ ...prev, inStock: event.target.checked }))} />In stock</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formState.isPublished} onChange={(event) => setFormState((prev) => ({ ...prev, isPublished: event.target.checked }))} />Published</label>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : t('admin.dashboard.form.save')}
              </Button>
              <Button variant="outline" onClick={closeForm} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                {t('admin.dashboard.form.cancel')}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('admin.dashboard.productsTable')} ({filteredProducts.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.dashboard.table.product')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.dashboard.table.category')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.dashboard.table.price')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.dashboard.table.stock')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.dashboard.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded object-cover" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{product.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.inStock ? t('admin.dashboard.inStock') : t('admin.dashboard.outOfStock')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${product.isPublished ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {product.isPublished ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEditForm(product)} className="p-1 text-siena-700 hover:bg-siena-100 rounded" title={t('admin.dashboard.editProduct')}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-1 text-red-700 hover:bg-red-100 rounded" title={t('admin.dashboard.deleteProduct')}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      {loading ? 'Loading products...' : 'No products found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AdminDashboardPage;
