import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './SupabaseAuthContext';
import { initialProducts } from '../data/products';
import { Color, Dimensions, Product } from '../types';

type ProductMutationInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & {
  slug?: string;
};

interface ProductContextType {
  products: Product[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  createProduct: (product: ProductMutationInput) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<ProductMutationInput>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

interface DbProductRow {
  id: string;
  name: string | null;
  slug: string | null;
  category: string | null;
  price: number | null;
  description: string | null;
  features: unknown;
  colors: unknown;
  dimensions: unknown;
  specifications: unknown;
  main_image_url: string | null;
  additional_images: unknown;
  in_stock: boolean | null;
  is_published: boolean | null;
  sort_order: number | null;
  created_at?: string;
  updated_at?: string;
}

interface DbProductPayload {
  name: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  features: string[];
  colors: Color[];
  dimensions: Dimensions;
  specifications: Product['specifications'];
  main_image_url: string;
  additional_images: string[];
  in_stock: boolean;
  is_published: boolean;
  sort_order: number;
}

interface LooseProduct extends Partial<Product> {
  main_image_url?: string;
  additional_images?: string[];
  in_stock?: boolean;
  is_published?: boolean;
  sort_order?: number;
}

const DEFAULT_DIMENSIONS: Dimensions = {
  width: 0,
  height: 0,
  depth: 0,
  weight: 0,
};

const DEFAULT_SPECIFICATIONS: Product['specifications'] = {
  material: 'PVC',
  finish: 'Matte',
  handleType: 'Standard',
  hingeType: 'Standard',
  mountingType: 'Wall-mounted',
};

const DEFAULT_CATEGORY = 'Vanities';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toSafeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const normalizeString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const normalizeColors = (value: unknown): Color[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const name = normalizeString(item.name).trim();
      const colorValue = normalizeString(item.value).trim();
      if (!name || !colorValue) {
        return null;
      }

      return { name, value: colorValue };
    })
    .filter((item): item is Color => item !== null);
};

const normalizeDimensions = (value: unknown): Dimensions => {
  if (!isRecord(value)) {
    return DEFAULT_DIMENSIONS;
  }

  return {
    width: toSafeNumber(value.width, 0),
    height: toSafeNumber(value.height, 0),
    depth: toSafeNumber(value.depth, 0),
    weight: toSafeNumber(value.weight, 0),
  };
};

const normalizeSpecifications = (value: unknown): Product['specifications'] => {
  const base: Product['specifications'] = { ...DEFAULT_SPECIFICATIONS };

  if (!isRecord(value)) {
    return base;
  }

  const merged: Product['specifications'] = {
    ...base,
    material: normalizeString(value.material, base.material),
    finish: normalizeString(value.finish, base.finish),
    handleType: normalizeString(value.handleType, base.handleType),
    hingeType: normalizeString(value.hingeType, base.hingeType),
    mountingType: normalizeString(value.mountingType, base.mountingType),
  };

  Object.entries(value).forEach(([key, val]) => {
    if (typeof val === 'string' || typeof val === 'number') {
      merged[key] = val;
    }
  });

  return merged;
};

const slugify = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `product-${Date.now()}`;
};

const sortProducts = (items: Product[]): Product[] =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

const ensureUniqueSlug = (candidate: string, currentId: string | null, products: Product[]): string => {
  const base = slugify(candidate);
  const existing = new Set(
    products
      .filter((product) => product.id !== currentId)
      .map((product) => product.slug),
  );

  if (!existing.has(base)) {
    return base;
  }

  let index = 1;
  let next = `${base}-${index}`;
  while (existing.has(next)) {
    index += 1;
    next = `${base}-${index}`;
  }

  return next;
};

const mapDbToProduct = (row: DbProductRow): Product => ({
  id: row.id,
  name: normalizeString(row.name, 'Untitled Product'),
  slug: normalizeString(row.slug, slugify(normalizeString(row.name, 'product'))),
  category: normalizeString(row.category, DEFAULT_CATEGORY),
  price: toSafeNumber(row.price, 0),
  description: normalizeString(row.description),
  features: normalizeStringArray(row.features),
  colors: normalizeColors(row.colors),
  dimensions: normalizeDimensions(row.dimensions),
  specifications: normalizeSpecifications(row.specifications),
  imageUrl: normalizeString(row.main_image_url),
  additionalImages: normalizeStringArray(row.additional_images),
  inStock: row.in_stock ?? true,
  isPublished: row.is_published ?? true,
  sortOrder: toSafeNumber(row.sort_order, 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapLooseToProduct = (product: LooseProduct, index: number): Product => {
  const name = normalizeString(product.name, `Product ${index + 1}`);
  const fallbackSlug = slugify(name);
  const slug = normalizeString(product.slug, fallbackSlug);

  return {
    id: normalizeString(product.id, `local-${index + 1}`),
    name,
    slug,
    category: normalizeString(product.category, DEFAULT_CATEGORY),
    price: toSafeNumber(product.price, 0),
    description: normalizeString(product.description),
    features: normalizeStringArray(product.features),
    colors: normalizeColors(product.colors),
    dimensions: normalizeDimensions(product.dimensions),
    specifications: normalizeSpecifications(product.specifications),
    imageUrl: normalizeString(product.imageUrl ?? product.main_image_url),
    additionalImages: normalizeStringArray(product.additionalImages ?? product.additional_images),
    inStock: product.inStock ?? product.in_stock ?? true,
    isPublished: product.isPublished ?? product.is_published ?? true,
    sortOrder: toSafeNumber(product.sortOrder ?? product.sort_order, index + 1),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const buildDbPayload = (product: Product): DbProductPayload => ({
  name: product.name.trim(),
  slug: product.slug,
  category: product.category,
  price: toSafeNumber(product.price, 0),
  description: product.description ?? '',
  features: normalizeStringArray(product.features),
  colors: normalizeColors(product.colors),
  dimensions: normalizeDimensions(product.dimensions),
  specifications: normalizeSpecifications(product.specifications),
  main_image_url: product.imageUrl,
  additional_images: normalizeStringArray(product.additionalImages),
  in_stock: product.inStock,
  is_published: product.isPublished,
  sort_order: product.sortOrder,
});

const getFallbackProducts = (): Product[] =>
  sortProducts((initialProducts as LooseProduct[]).map((product, index) => mapLooseToProduct(product, index)));

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>(getFallbackProducts());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!isAdmin) {
        query = query.eq('is_published', true);
      }

      const { data, error: fetchError } = await withTimeout(
        query,
        15000,
        'Fetching products timed out.',
      );
      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        const mapped = sortProducts((data as DbProductRow[]).map(mapDbToProduct));
        setProducts(mapped);
      } else if (!data || data.length === 0) {
        setProducts(getFallbackProducts());
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Failed to fetch products from database';
      console.error('Error fetching products:', fetchError);
      setError(message);
      setProducts(getFallbackProducts());
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const createProduct = async (input: ProductMutationInput): Promise<Product> => {
    if (!isAdmin) {
      throw new Error('Only admins can create products.');
    }

    setSaving(true);
    setError(null);

    try {
      const nextSortOrder = products.length > 0 ? Math.max(...products.map((product) => product.sortOrder)) + 1 : 1;
      const slug = ensureUniqueSlug(input.slug ?? input.name, null, products);

      const candidate: Product = {
        id: '',
        name: input.name.trim(),
        slug,
        category: input.category,
        price: toSafeNumber(input.price, 0),
        description: input.description ?? '',
        features: normalizeStringArray(input.features),
        colors: normalizeColors(input.colors),
        dimensions: normalizeDimensions(input.dimensions),
        imageUrl: input.imageUrl ?? '',
        additionalImages: normalizeStringArray(input.additionalImages),
        inStock: input.inStock ?? true,
        isPublished: input.isPublished ?? true,
        sortOrder: input.sortOrder ?? nextSortOrder,
        specifications: normalizeSpecifications(input.specifications),
      };

      const payload = buildDbPayload(candidate);
      const { data, error: insertError } = await withTimeout(
        supabase.from('products').insert(payload).select('*').single(),
        15000,
        'Creating product timed out.',
      );
      if (insertError) {
        throw insertError;
      }

      const created = mapDbToProduct(data as DbProductRow);
      setProducts((prev) => sortProducts([...prev, created]));
      return created;
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create product.';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (id: string, updates: Partial<ProductMutationInput>): Promise<Product> => {
    if (!isAdmin) {
      throw new Error('Only admins can update products.');
    }

    setSaving(true);
    setError(null);

    try {
      const current = products.find((product) => product.id === id);
      if (!current) {
        throw new Error('Product not found.');
      }

      const merged: Product = {
        ...current,
        ...updates,
        dimensions: updates.dimensions ? normalizeDimensions(updates.dimensions) : current.dimensions,
        specifications: updates.specifications
          ? normalizeSpecifications({ ...current.specifications, ...updates.specifications })
          : current.specifications,
        colors: updates.colors ? normalizeColors(updates.colors) : current.colors,
        features: updates.features ? normalizeStringArray(updates.features) : current.features,
        additionalImages: updates.additionalImages
          ? normalizeStringArray(updates.additionalImages)
          : current.additionalImages,
        imageUrl: updates.imageUrl ?? current.imageUrl,
        name: normalizeString(updates.name, current.name),
        category: normalizeString(updates.category, current.category),
        description: normalizeString(updates.description, current.description),
        inStock: updates.inStock ?? current.inStock,
        isPublished: updates.isPublished ?? current.isPublished,
        price: toSafeNumber(updates.price, current.price),
        sortOrder: toSafeNumber(updates.sortOrder, current.sortOrder),
      };

      merged.slug = ensureUniqueSlug(updates.slug ?? merged.slug ?? merged.name, id, products);

      const payload = buildDbPayload(merged);
      const { data, error: updateError } = await withTimeout(
        supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select('*')
          .single(),
        15000,
        'Updating product timed out.',
      );

      if (updateError) {
        throw updateError;
      }

      const updated = mapDbToProduct(data as DbProductRow);
      setProducts((prev) => sortProducts(prev.map((product) => (product.id === id ? updated : product))));
      return updated;
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update product.';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    if (!isAdmin) {
      throw new Error('Only admins can delete products.');
    }

    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await withTimeout(
        supabase.from('products').delete().eq('id', id),
        15000,
        'Deleting product timed out.',
      );
      if (deleteError) {
        throw deleteError;
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete product.';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };

  const value: ProductContextType = {
    products,
    loading,
    saving,
    error,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};
