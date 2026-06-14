import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, Edit, Eye, EyeOff, LogOut, Package, Plus, Save, Trash2, X } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useProducts } from '../contexts/ProductContext';
import { supabase } from '../lib/supabase';
import { Color, DimensionOption, Product } from '../types';
import { formatPrice } from '../utils/price';
import {
  buildDefaultDimensionOptions,
  DEFAULT_PRODUCT_COLORS,
  normalizeDimensionOptionId,
} from '../utils/productOptions';
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
  dimensionOptionOneLabel: string;
  dimensionOptionOneWidth: number;
  dimensionOptionOneHeight: number;
  dimensionOptionTwoLabel: string;
  dimensionOptionTwoWidth: number;
  dimensionOptionTwoHeight: number;
  depth: number;
  weight: number;
  material: string;
  finish: string;
  handleType: string;
  hingeType: string;
  mountingType: string;
};

type AnalyticsEventRow = {
  id: string;
  event_name: string;
  event_value: number | null;
  entity_type: string | null;
  entity_id: string | null;
  visitor_id: string;
  session_id: string | null;
  page_path: string | null;
  page_title: string | null;
  device_type: string | null;
  browser_name: string | null;
  os_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const RANGE_OPTIONS = [7, 30, 90] as const;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const percent = (numerator: number, denominator: number): string =>
  denominator > 0 ? `${Math.round((numerator / denominator) * 100)}%` : '0%';

const average = (values: number[]): number =>
  values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

const countBy = <T,>(items: T[], getKey: (item: T) => string): Array<{ name: string; count: number }> => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

const toCsv = (events: AnalyticsEventRow[]): string => {
  const headers = [
    'created_at',
    'event_name',
    'event_value',
    'visitor_id',
    'session_id',
    'entity_type',
    'entity_id',
    'page_path',
    'device_type',
    'browser_name',
    'os_name',
    'utm_source',
    'utm_medium',
    'utm_campaign',
  ];

  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = events.map((event) => headers.map((header) => escape(event[header as keyof AnalyticsEventRow])).join(','));
  return [headers.join(','), ...rows].join('\n');
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
  colorsText: DEFAULT_PRODUCT_COLORS.map((color) => `${color.name}|${color.value}`).join('\n'),
  width: 0,
  height: 0,
  dimensionOptionOneLabel: 'Standard',
  dimensionOptionOneWidth: 55,
  dimensionOptionOneHeight: 55,
  dimensionOptionTwoLabel: 'Large',
  dimensionOptionTwoWidth: 65,
  dimensionOptionTwoHeight: 55,
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

  if (parsed.length === 0) {
    return DEFAULT_PRODUCT_COLORS;
  }

  if (parsed.length >= DEFAULT_PRODUCT_COLORS.length) {
    return parsed;
  }

  const existing = new Set(parsed.map((color) => color.name.toLowerCase()));
  return [
    ...parsed,
    ...DEFAULT_PRODUCT_COLORS.filter((color) => !existing.has(color.name.toLowerCase())),
  ].slice(0, DEFAULT_PRODUCT_COLORS.length);
};

const colorsToText = (colors: Color[]): string =>
  (colors.length > 0 ? parseColors(colors.map((color) => `${color.name}|${color.value}`).join('\n')) : DEFAULT_PRODUCT_COLORS)
    .map((color) => `${color.name}|${color.value}`)
    .join('\n');

const getDimensionOptionsForProduct = (product: Product): DimensionOption[] => {
  const defaults = buildDefaultDimensionOptions(product.dimensions);
  const options = product.dimensionOptions.length > 0 ? product.dimensionOptions : defaults;

  if (options.length === 1) {
    return [options[0], defaults[1]];
  }

  return options.slice(0, 2);
};

const getDimensionOptionsForForm = (form: ProductFormState): DimensionOption[] => [
  {
    id: normalizeDimensionOptionId(form.dimensionOptionOneLabel, 0),
    label: form.dimensionOptionOneLabel.trim() || 'Standard',
    width: Number.isFinite(form.dimensionOptionOneWidth) ? form.dimensionOptionOneWidth : 0,
    height: Number.isFinite(form.dimensionOptionOneHeight) ? form.dimensionOptionOneHeight : 0,
  },
  {
    id: normalizeDimensionOptionId(form.dimensionOptionTwoLabel, 1),
    label: form.dimensionOptionTwoLabel.trim() || 'Large',
    width: Number.isFinite(form.dimensionOptionTwoWidth) ? form.dimensionOptionTwoWidth : 0,
    height: Number.isFinite(form.dimensionOptionTwoHeight) ? form.dimensionOptionTwoHeight : 0,
  },
];

const productToForm = (product: Product): ProductFormState => {
  const dimensionOptions = getDimensionOptionsForProduct(product);
  const [firstOption, secondOption] = dimensionOptions;

  return {
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
    width: firstOption.width,
    height: firstOption.height,
    dimensionOptionOneLabel: firstOption.label,
    dimensionOptionOneWidth: firstOption.width,
    dimensionOptionOneHeight: firstOption.height,
    dimensionOptionTwoLabel: secondOption.label,
    dimensionOptionTwoWidth: secondOption.width,
    dimensionOptionTwoHeight: secondOption.height,
    depth: product.dimensions.depth,
    weight: product.dimensions.weight,
    material: product.specifications.material,
    finish: product.specifications.finish,
    handleType: product.specifications.handleType,
    hingeType: product.specifications.hingeType,
    mountingType: product.specifications.mountingType,
  };
};

const AdminDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { state: adminState, logout } = useAdmin();
  const { products, loading, saving, error, createProduct, updateProduct, deleteProduct } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';

  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEventRow[]>([]);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsRangeDays, setAnalyticsRangeDays] = useState<(typeof RANGE_OPTIONS)[number]>(30);
  const isEdit = Boolean(formState.id);

  useEffect(() => {
    if (!adminState.loading && !adminState.isAuthenticated) {
      navigate(`/${currentLang}/admin/login`);
    }
  }, [adminState.loading, adminState.isAuthenticated, navigate, currentLang]);

  useEffect(() => {
    if (!adminState.isAuthenticated) {
      return;
    }

    const loadAnalytics = async () => {
      const since = new Date();
      since.setDate(since.getDate() - analyticsRangeDays);

      const { data, error: fetchError } = await supabase
        .from('analytics_events')
        .select('id,event_name,event_value,entity_type,entity_id,visitor_id,session_id,page_path,page_title,device_type,browser_name,os_name,utm_source,utm_medium,utm_campaign,metadata,created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(2000);

      if (fetchError) {
        setAnalyticsError(fetchError.message);
        return;
      }

      setAnalyticsEvents((data ?? []) as AnalyticsEventRow[]);
      setAnalyticsError('');
    };

    void loadAnalytics();
  }, [adminState.isAuthenticated, analyticsRangeDays]);

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

  const analyticsSummary = useMemo(() => {
    const pageViews = analyticsEvents.filter((event) => event.event_name === 'page_view');
    const productViews = analyticsEvents.filter((event) => event.event_name === 'product_view');
    const productClicks = analyticsEvents.filter((event) => event.event_name === 'product_card_click');
    const checkoutStarts = analyticsEvents.filter((event) => event.event_name === 'checkout_start');
    const checkoutSuccesses = analyticsEvents.filter((event) => event.event_name === 'checkout_success');
    const checkoutCancels = analyticsEvents.filter((event) => event.event_name === 'checkout_cancelled');
    const checkoutFailures = analyticsEvents.filter((event) => event.event_name === 'checkout_failed');
    const purchaseEvents = analyticsEvents.filter((event) => event.event_name === 'purchase_completed');
    const addToCartEvents = analyticsEvents.filter((event) => event.event_name === 'add_to_cart');
    const quoteClicks = analyticsEvents.filter((event) => event.event_name === 'quote_click');
    const searchEvents = analyticsEvents.filter((event) => event.event_name === 'product_search');
    const timeEvents = analyticsEvents.filter((event) => event.event_name === 'time_on_page');
    const uniqueVisitors = new Set(analyticsEvents.map((event) => event.visitor_id)).size;
    const uniqueSessions = new Set(analyticsEvents.map((event) => event.session_id).filter(Boolean)).size;
    const avgSecondsOnPage = average(timeEvents.map((event) => asNumber(event.event_value)));
    const productFunnelEvents = analyticsEvents.filter((event) => event.entity_type === 'product');
    const topProducts = countBy(productFunnelEvents, (event) =>
      asString(event.metadata?.product_name, event.entity_id ?? 'Unknown product'),
    ).slice(0, 8);
    const topPages = countBy(pageViews, (event) => event.page_path ?? 'Unknown page').slice(0, 8);
    const topSearches = countBy(searchEvents, (event) =>
      asString(event.metadata?.query, 'Unknown search'),
    ).slice(0, 8);
    const sourceBreakdown = countBy(analyticsEvents, (event) =>
      event.utm_source || asString(event.metadata?.referrer_domain, 'Direct'),
    ).slice(0, 8);
    const deviceBreakdown = countBy(analyticsEvents, (event) => event.device_type ?? 'Unknown').slice(0, 5);
    const browserBreakdown = countBy(analyticsEvents, (event) => event.browser_name ?? 'Unknown').slice(0, 5);
    const dailyActivityMap = new Map<string, number>();
    pageViews.forEach((event) => {
      const dateKey = new Date(event.created_at).toISOString().slice(0, 10);
      dailyActivityMap.set(dateKey, (dailyActivityMap.get(dateKey) ?? 0) + 1);
    });
    const dailyActivity = Array.from(dailyActivityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-14);

    return {
      totalEvents: analyticsEvents.length,
      pageViews: pageViews.length,
      uniqueVisitors,
      uniqueSessions,
      avgSecondsOnPage,
      productViews: productViews.length,
      productClicks: productClicks.length,
      checkoutStarts: checkoutStarts.length,
      checkoutSuccesses: checkoutSuccesses.length,
      checkoutCancels: checkoutCancels.length,
      checkoutFailures: checkoutFailures.length,
      purchases: purchaseEvents.length,
      revenue: purchaseEvents.reduce((sum, event) => sum + asNumber(event.event_value), 0),
      addToCart: addToCartEvents.length,
      quoteClicks: quoteClicks.length,
      searches: searchEvents.length,
      cartRate: percent(addToCartEvents.length, Math.max(productViews.length, productClicks.length)),
      checkoutRate: percent(checkoutStarts.length, addToCartEvents.length),
      visitorConversionRate: percent(checkoutStarts.length, uniqueVisitors),
      topProducts,
      topPages,
      topSearches,
      sourceBreakdown,
      deviceBreakdown,
      browserBreakdown,
      dailyActivity,
      recentEvents: analyticsEvents.slice(0, 12),
    };
  }, [analyticsEvents]);

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
    const dimensionOptions = getDimensionOptionsForForm(formState);
    if (dimensionOptions.some((option) => option.width <= 0 || option.height <= 0)) {
      setFormError(t('admin.dashboard.validation.dimensionsRequired'));
      return;
    }

    const [defaultDimensionOption] = dimensionOptions;

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
        width: defaultDimensionOption.width,
        height: defaultDimensionOption.height,
        depth: Number.isFinite(formState.depth) ? formState.depth : 0,
        weight: Number.isFinite(formState.weight) ? formState.weight : 0,
      },
      dimensionOptions,
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

  const handleExportAnalytics = () => {
    const csv = toCsv(analyticsEvents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `siena-analytics-${analyticsRangeDays}d.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const analyticsCards = [
    { label: t('admin.dashboard.analytics.uniqueVisitors'), value: analyticsSummary.uniqueVisitors },
    { label: t('admin.dashboard.analytics.sessions'), value: analyticsSummary.uniqueSessions },
    { label: t('admin.dashboard.analytics.pageViews'), value: analyticsSummary.pageViews },
    { label: t('admin.dashboard.analytics.productViews'), value: analyticsSummary.productViews },
    { label: t('admin.dashboard.analytics.addToCart'), value: analyticsSummary.addToCart },
    { label: t('admin.dashboard.analytics.checkoutStarts'), value: analyticsSummary.checkoutStarts },
    { label: t('admin.dashboard.analytics.purchases'), value: analyticsSummary.purchases },
    { label: t('admin.dashboard.analytics.revenue'), value: formatPrice(analyticsSummary.revenue, i18n.resolvedLanguage) },
    { label: t('admin.dashboard.analytics.avgTimeOnPage'), value: `${analyticsSummary.avgSecondsOnPage}s` },
    { label: t('admin.dashboard.analytics.visitorConversionRate'), value: analyticsSummary.visitorConversionRate },
  ];

  const funnelSteps = [
    { label: t('admin.dashboard.analytics.productViews'), value: analyticsSummary.productViews },
    { label: t('admin.dashboard.analytics.addToCart'), value: analyticsSummary.addToCart },
    { label: t('admin.dashboard.analytics.checkoutStarts'), value: analyticsSummary.checkoutStarts },
  ];

  const maxFunnelValue = Math.max(1, ...funnelSteps.map((step) => step.value));
  const maxDailyActivity = Math.max(1, ...analyticsSummary.dailyActivity.map((item) => item.count));

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

        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <div className="flex flex-col gap-4 mb-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-siena-100 text-siena-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.analytics.title')}</h2>
                <p className="text-sm text-gray-600">{t('admin.dashboard.analytics.subtitle')}</p>
                {analyticsError && <p className="mt-2 text-xs text-red-600">{analyticsError}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                {RANGE_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setAnalyticsRangeDays(days)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      analyticsRangeDays === days
                        ? 'bg-white text-siena-700 shadow-sm'
                        : 'text-gray-600 hover:text-siena-700'
                    }`}
                  >
                    {t(`admin.dashboard.analytics.range${days}`)}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={handleExportAnalytics} disabled={analyticsEvents.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                {t('admin.dashboard.analytics.exportCsv')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">
            {analyticsCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-siena-100 bg-gradient-to-br from-siena-50 to-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-siena-700">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-950">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-xl border border-gray-100 p-4 xl:col-span-2">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.funnelTitle')}</h3>
                  <p className="text-xs text-gray-500">{t('admin.dashboard.analytics.funnelSubtitle')}</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>{t('admin.dashboard.analytics.cartRate')}: {analyticsSummary.cartRate}</span>
                  <span>{t('admin.dashboard.analytics.checkoutRate')}: {analyticsSummary.checkoutRate}</span>
                </div>
              </div>
              <div className="space-y-3">
                {funnelSteps.map((step) => (
                  <div key={step.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{step.label}</span>
                      <span className="text-gray-500">{step.value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-siena-500"
                        style={{ width: `${Math.max(4, Math.round((step.value / maxFunnelValue) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.dailyActivity')}</h3>
              <div className="flex h-44 items-end gap-2">
                {analyticsSummary.dailyActivity.length > 0 ? analyticsSummary.dailyActivity.map((item) => (
                  <div key={item.name} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-siena-400"
                      style={{ height: `${Math.max(8, Math.round((item.count / maxDailyActivity) * 150))}px` }}
                      title={`${item.name}: ${item.count}`}
                    />
                    <span className="w-full truncate text-center text-[10px] text-gray-500">
                      {new Date(item.name).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                )) : (
                  <p className="self-center text-sm text-gray-500">{t('admin.dashboard.analytics.noData')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.topProducts')}</h3>
              <div className="space-y-2">
                {analyticsSummary.topProducts.length > 0 ? analyticsSummary.topProducts.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-sm">
                    <span className="truncate font-medium text-gray-800">{item.name}</span>
                    <span className="text-siena-700">{item.count}</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">{t('admin.dashboard.analytics.noData')}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.topPages')}</h3>
              <div className="space-y-2">
                {analyticsSummary.topPages.length > 0 ? analyticsSummary.topPages.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-sm">
                    <span className="truncate font-medium text-gray-800">{item.name}</span>
                    <span className="text-siena-700">{item.count}</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">{t('admin.dashboard.analytics.noData')}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.topSearches')}</h3>
              <div className="space-y-2">
                {analyticsSummary.topSearches.length > 0 ? analyticsSummary.topSearches.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-sm">
                    <span className="truncate font-medium text-gray-800">{item.name}</span>
                    <span className="text-siena-700">{item.count}</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">{t('admin.dashboard.analytics.noData')}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.sourceBreakdown')}</h3>
              <div className="space-y-2">
                {analyticsSummary.sourceBreakdown.length > 0 ? analyticsSummary.sourceBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-sm">
                    <span className="truncate font-medium text-gray-800">{item.name}</span>
                    <span className="text-siena-700">{item.count}</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">{t('admin.dashboard.analytics.noData')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.deviceBreakdown')}</h3>
              <div className="space-y-2">
                {analyticsSummary.deviceBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium capitalize text-gray-800">{item.name}</span>
                    <span className="text-gray-500">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.browserBreakdown')}</h3>
              <div className="space-y-2">
                {analyticsSummary.browserBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="text-gray-500">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.extraSignals')}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('admin.dashboard.analytics.quoteClicks')}</p>
                  <p className="text-lg font-semibold text-gray-900">{analyticsSummary.quoteClicks}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('admin.dashboard.analytics.searches')}</p>
                  <p className="text-lg font-semibold text-gray-900">{analyticsSummary.searches}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('admin.dashboard.analytics.checkoutFailures')}</p>
                  <p className="text-lg font-semibold text-gray-900">{analyticsSummary.checkoutFailures}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('admin.dashboard.analytics.checkoutSuccesses')}</p>
                  <p className="text-lg font-semibold text-gray-900">{analyticsSummary.checkoutSuccesses}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('admin.dashboard.analytics.checkoutCancels')}</p>
                  <p className="text-lg font-semibold text-gray-900">{analyticsSummary.checkoutCancels}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('admin.dashboard.analytics.totalEvents')}</p>
                  <p className="text-lg font-semibold text-gray-900">{analyticsSummary.totalEvents}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-100 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('admin.dashboard.analytics.recentEvents')}</h3>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {analyticsSummary.recentEvents.length > 0 ? analyticsSummary.recentEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-gray-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-800">{event.event_name}</span>
                    <span className="shrink-0 text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {asString(event.metadata?.product_name, event.page_title ?? event.page_path ?? '')}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {event.device_type ?? 'Unknown'} · {event.browser_name ?? 'Unknown'} · {event.utm_source ?? asString(event.metadata?.referrer_domain, 'Direct')}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-gray-500">{t('admin.dashboard.analytics.noData')}</p>
              )}
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
              <textarea className="px-3 py-2 border rounded-md md:col-span-2" rows={4} placeholder={t('admin.dashboard.form.colorsHelp')} value={formState.colorsText} onChange={(event) => setFormState((prev) => ({ ...prev, colorsText: event.target.value }))} />
              <div className="rounded-lg border border-siena-100 bg-siena-50 p-3 md:col-span-2">
                <p className="mb-3 text-sm font-semibold text-siena-800">{t('admin.dashboard.form.dimensionOptionOne')}</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input className="px-3 py-2 border rounded-md" placeholder={t('admin.dashboard.form.optionLabel')} value={formState.dimensionOptionOneLabel} onChange={(event) => setFormState((prev) => ({ ...prev, dimensionOptionOneLabel: event.target.value }))} />
                  <input type="number" className="px-3 py-2 border rounded-md" placeholder={t('products.dimensions.width')} value={formState.dimensionOptionOneWidth} onChange={(event) => setFormState((prev) => ({ ...prev, dimensionOptionOneWidth: Number(event.target.value), width: Number(event.target.value) }))} />
                  <input type="number" className="px-3 py-2 border rounded-md" placeholder={t('products.dimensions.height')} value={formState.dimensionOptionOneHeight} onChange={(event) => setFormState((prev) => ({ ...prev, dimensionOptionOneHeight: Number(event.target.value), height: Number(event.target.value) }))} />
                </div>
              </div>
              <div className="rounded-lg border border-siena-100 bg-siena-50 p-3 md:col-span-2">
                <p className="mb-3 text-sm font-semibold text-siena-800">{t('admin.dashboard.form.dimensionOptionTwo')}</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input className="px-3 py-2 border rounded-md" placeholder={t('admin.dashboard.form.optionLabel')} value={formState.dimensionOptionTwoLabel} onChange={(event) => setFormState((prev) => ({ ...prev, dimensionOptionTwoLabel: event.target.value }))} />
                  <input type="number" className="px-3 py-2 border rounded-md" placeholder={t('products.dimensions.width')} value={formState.dimensionOptionTwoWidth} onChange={(event) => setFormState((prev) => ({ ...prev, dimensionOptionTwoWidth: Number(event.target.value) }))} />
                  <input type="number" className="px-3 py-2 border rounded-md" placeholder={t('products.dimensions.height')} value={formState.dimensionOptionTwoHeight} onChange={(event) => setFormState((prev) => ({ ...prev, dimensionOptionTwoHeight: Number(event.target.value) }))} />
                </div>
              </div>
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
                    <td className="px-6 py-4 text-sm text-gray-800">{formatPrice(product.price, i18n.resolvedLanguage)}</td>
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
