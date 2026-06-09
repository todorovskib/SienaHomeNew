import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { useAnalytics } from '../contexts/AnalyticsContext';

const CheckoutSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';
  const params = new URLSearchParams(location.search);
  const payment = params.get('payment');
  const orderId = params.get('order_id') || params.get('session_id');
  const { clearCart } = useCart();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    clearCart();
    trackEvent(payment === 'cod' ? 'pay_on_door_order_success' : 'checkout_success_page_view', {
      entityType: 'checkout',
      entityId: orderId ?? undefined,
      metadata: {
        payment_method: payment === 'cod' ? 'cash_on_delivery' : 'online_card_wallet',
      },
    });
  }, [clearCart, orderId, payment, trackEvent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-siena-50 via-white to-stone-50 pt-28 pb-16">
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-siena-600">{t('checkout.success.kicker')}</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">{t('checkout.success.title')}</h1>
          <p className="mt-3 text-gray-600">
            {payment === 'cod' ? t('checkout.success.cashDescription') : t('checkout.success.onlineDescription')}
          </p>

          {orderId && (
            <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <ClipboardList className="h-4 w-4 text-siena-600" />
              <span>{t('checkout.success.reference')}: {orderId}</span>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/${currentLang}/products`}>
              <Button variant="primary">{t('checkout.success.continueShopping')}</Button>
            </Link>
            <Link to={`/${currentLang}/contact`}>
              <Button variant="outline">{t('checkout.success.contact')}</Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CheckoutSuccessPage;
