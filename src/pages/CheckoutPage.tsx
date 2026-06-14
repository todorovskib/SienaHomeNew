import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, ShieldCheck, Truck, Wallet } from 'lucide-react';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/price';

type PaymentMethod = 'online' | 'cash';

type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

const EMPTY_FORM: CheckoutFormState = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  notes: '',
};

const getVisitorId = () => {
  const match = document.cookie.match(/(?:^|; )siena_visitor_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const CheckoutPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { state } = useCart();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  const [form, setForm] = useState<CheckoutFormState>(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getColorLabel = (name: string) => {
    const key = name.toLowerCase();
    if (['black', 'white', 'gray', 'red'].includes(key)) {
      return t(`products.colors.${key}`);
    }
    return name;
  };

  const checkoutItems = useMemo(
    () => state.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
    })),
    [state.items],
  );

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      return t('checkout.errors.required');
    }

    if (paymentMethod === 'online' && !form.email.trim()) {
      return t('checkout.errors.emailRequired');
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (state.items.length === 0) {
      setError(t('checkout.errors.emptyCart'));
      return;
    }

    setIsSubmitting(true);
    trackEvent('checkout_details_submit', {
      entityType: 'checkout',
      eventValue: state.total,
      metadata: {
        payment_method: paymentMethod,
        item_count: state.itemCount,
      },
    });

    try {
      const functionName = paymentMethod === 'online' ? 'create-checkout-session' : 'create-cash-order';
      const { data, error: functionError } = await supabase.functions.invoke(functionName, {
        body: {
          language: currentLang,
          visitorId: getVisitorId(),
          customer: form,
          items: checkoutItems,
        },
      });

      if (functionError) {
        throw functionError;
      }

      if (paymentMethod === 'online') {
        if (!data?.url) {
          throw new Error(t('cart.checkoutNotConfigured'));
        }
        window.location.href = data.url;
        return;
      }

      if (!data?.orderId) {
        throw new Error(t('checkout.errors.orderFailed'));
      }

      trackEvent('pay_on_door_selected', {
        entityType: 'checkout',
        entityId: data.orderId,
        eventValue: state.total,
      });
      navigate(`/${currentLang}/checkout/success?payment=cod&order_id=${encodeURIComponent(data.orderId)}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('checkout.errors.orderFailed');
      setError(message);
      trackEvent('checkout_failed', {
        entityType: 'checkout',
        eventValue: state.total,
        metadata: {
          payment_method: paymentMethod,
          message,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 pt-28 pb-16">
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-siena-100 text-siena-700">
              <Truck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-950">{t('checkout.empty.title')}</h1>
            <p className="mt-2 text-gray-600">{t('checkout.empty.description')}</p>
            <Link to={`/${currentLang}/products`} className="mt-6 inline-flex">
              <Button variant="primary">{t('checkout.empty.cta')}</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-siena-50 pt-28 pb-16">
      <Container>
        <Link to={`/${currentLang}/products`} className="mb-6 inline-flex items-center text-sm font-medium text-siena-700 hover:text-siena-900">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('checkout.backToProducts')}
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-siena-600">{t('checkout.kicker')}</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950 md:text-4xl">{t('checkout.title')}</h1>
          <p className="mt-3 max-w-2xl text-gray-600">{t('checkout.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-950">{t('checkout.contact.title')}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('checkout.contact.fullName')} *</span>
                  <input
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-siena-500 focus:outline-none focus:ring-2 focus:ring-siena-200"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('checkout.contact.email')}</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-siena-500 focus:outline-none focus:ring-2 focus:ring-siena-200"
                    autoComplete="email"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">{t('checkout.contact.phone')} *</span>
                  <input
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-siena-500 focus:outline-none focus:ring-2 focus:ring-siena-200"
                    autoComplete="tel"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-950">{t('checkout.delivery.title')}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">{t('checkout.delivery.address')} *</span>
                  <input
                    value={form.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-siena-500 focus:outline-none focus:ring-2 focus:ring-siena-200"
                    autoComplete="street-address"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('checkout.delivery.city')} *</span>
                  <input
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-siena-500 focus:outline-none focus:ring-2 focus:ring-siena-200"
                    autoComplete="address-level2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('checkout.delivery.postalCode')}</span>
                  <input
                    value={form.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-siena-500 focus:outline-none focus:ring-2 focus:ring-siena-200"
                    autoComplete="postal-code"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">{t('checkout.delivery.notes')}</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-siena-500 focus:outline-none focus:ring-2 focus:ring-siena-200"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-950">{t('checkout.payment.title')}</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`rounded-xl border p-4 text-left transition ${
                    paymentMethod === 'online'
                      ? 'border-siena-500 bg-siena-50 ring-2 ring-siena-100'
                      : 'border-gray-200 bg-white hover:border-siena-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-siena-700" />
                    <span className="font-semibold text-gray-950">{t('checkout.payment.onlineTitle')}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{t('checkout.payment.onlineDescription')}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Wallet className="h-4 w-4" />
                    {t('checkout.payment.wallets')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`rounded-xl border p-4 text-left transition ${
                    paymentMethod === 'cash'
                      ? 'border-siena-500 bg-siena-50 ring-2 ring-siena-100'
                      : 'border-gray-200 bg-white hover:border-siena-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-siena-700" />
                    <span className="font-semibold text-gray-950">{t('checkout.payment.cashTitle')}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{t('checkout.payment.cashDescription')}</p>
                </button>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-950">{t('checkout.summary.title')}</h2>
              <div className="mt-4 space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-950">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{t('products.quantity')}: {item.quantity}</p>
                      {item.selectedOptions?.color && (
                        <p className="text-sm text-gray-500">
                          {t('products.color')}: {getColorLabel(item.selectedOptions.color.name)}
                        </p>
                      )}
                      {item.selectedOptions?.dimensionOption && (
                        <p className="text-sm text-gray-500">
                          {t('products.dimensions.title')}: {item.selectedOptions.dimensionOption.width} x {item.selectedOptions.dimensionOption.height} cm
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-950">{formatPrice(item.product.price * item.quantity, i18n.resolvedLanguage)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{t('checkout.summary.subtotal')}</span>
                  <span>{formatPrice(state.total, i18n.resolvedLanguage)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                  <span>{t('checkout.summary.delivery')}</span>
                  <span>{t('checkout.summary.deliveryNote')}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-lg font-bold text-gray-950">
                  <span>{t('cart.total')}</span>
                  <span>{formatPrice(state.total, i18n.resolvedLanguage)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" className="mt-5 w-full" disabled={isSubmitting}>
                {isSubmitting ? t('checkout.actions.processing') : paymentMethod === 'online' ? t('checkout.actions.payOnline') : t('checkout.actions.placeCashOrder')}
              </Button>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p>{paymentMethod === 'online' ? t('checkout.security.online') : t('checkout.security.cash')}</p>
              </div>
            </div>
          </aside>
        </form>
      </Container>
    </div>
  );
};

export default CheckoutPage;
