import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Container from '../components/ui/Container';
import SectionHeading from '../components/ui/SectionHeading';

const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pt-24 pb-16"
    >
      <Container>
        <motion.div {...fadeInUp}>
          <SectionHeading
            title={t('terms.title')}
            subtitle={t('terms.subtitle')}
            centered
          />
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto prose prose-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            
            {/* Last Updated */}
            <div className="text-sm text-gray-500 border-b pb-4">
              {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
            </div>

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.introduction.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.sections.introduction.content')}
              </p>
            </section>

            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.acceptance.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('terms.sections.acceptance.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('terms.sections.acceptance.items.access')}</li>
                <li>{t('terms.sections.acceptance.items.purchase')}</li>
                <li>{t('terms.sections.acceptance.items.account')}</li>
                <li>{t('terms.sections.acceptance.items.communication')}</li>
              </ul>
            </section>

            {/* Products and Services */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.products.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('terms.sections.products.content')}
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {t('terms.sections.products.custom.title')}
                  </h3>
                  <p className="text-gray-600">
                    {t('terms.sections.products.custom.content')}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {t('terms.sections.products.bulk.title')}
                  </h3>
                  <p className="text-gray-600">
                    {t('terms.sections.products.bulk.content')}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {t('terms.sections.products.installation.title')}
                  </h3>
                  <p className="text-gray-600">
                    {t('terms.sections.products.installation.content')}
                  </p>
                </div>
              </div>
            </section>

            {/* Orders and Payment */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.orders.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('terms.sections.orders.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('terms.sections.orders.items.confirmation')}</li>
                <li>{t('terms.sections.orders.items.payment')}</li>
                <li>{t('terms.sections.orders.items.pricing')}</li>
                <li>{t('terms.sections.orders.items.cancellation')}</li>
              </ul>
            </section>

            {/* Shipping and Delivery */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.shipping.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('terms.sections.shipping.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('terms.sections.shipping.items.timeframes')}</li>
                <li>{t('terms.sections.shipping.items.costs')}</li>
                <li>{t('terms.sections.shipping.items.risk')}</li>
                <li>{t('terms.sections.shipping.items.inspection')}</li>
              </ul>
            </section>

            {/* Returns and Refunds */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.returns.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('terms.sections.returns.content')}
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">
                    {t('terms.sections.returns.conditions.title')}
                  </h4>
                  <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                    <li>{t('terms.sections.returns.conditions.timeframe')}</li>
                    <li>{t('terms.sections.returns.conditions.condition')}</li>
                    <li>{t('terms.sections.returns.conditions.custom')}</li>
                    <li>{t('terms.sections.returns.conditions.approval')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.intellectual.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.sections.intellectual.content')}
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.liability.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.sections.liability.content')}
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.governing.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.sections.governing.content')}
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.changes.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.sections.changes.content')}
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-teal-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.sections.contact.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('terms.sections.contact.content')}
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Siena Home</strong></p>
                <p>{t('contact.info.email')}: siena.home@yahoo.com</p>
                <p>{t('contact.info.phone')}: 076 669 454</p>
                <p>{t('footer.factoryAddress')}: {t('contact.locations.factory.address')}</p>
              </div>
            </section>
          </div>
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default TermsOfServicePage;
