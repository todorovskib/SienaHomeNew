import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Container from '../components/ui/Container';
import SectionHeading from '../components/ui/SectionHeading';

const PrivacyPolicyPage: React.FC = () => {
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
            title={t('privacy.title')}
            subtitle={t('privacy.subtitle')}
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
              {t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}
            </div>

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.introduction.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.sections.introduction.content')}
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.collection.title')}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {t('privacy.sections.collection.personal.title')}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {t('privacy.sections.collection.personal.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>{t('privacy.sections.collection.personal.items.name')}</li>
                    <li>{t('privacy.sections.collection.personal.items.email')}</li>
                    <li>{t('privacy.sections.collection.personal.items.phone')}</li>
                    <li>{t('privacy.sections.collection.personal.items.address')}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {t('privacy.sections.collection.usage.title')}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {t('privacy.sections.collection.usage.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>{t('privacy.sections.collection.usage.items.ip')}</li>
                    <li>{t('privacy.sections.collection.usage.items.browser')}</li>
                    <li>{t('privacy.sections.collection.usage.items.pages')}</li>
                    <li>{t('privacy.sections.collection.usage.items.time')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.usage.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('privacy.sections.usage.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('privacy.sections.usage.items.orders')}</li>
                <li>{t('privacy.sections.usage.items.communication')}</li>
                <li>{t('privacy.sections.usage.items.improvement')}</li>
                <li>{t('privacy.sections.usage.items.marketing')}</li>
                <li>{t('privacy.sections.usage.items.legal')}</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.sharing.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('privacy.sections.sharing.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('privacy.sections.sharing.items.consent')}</li>
                <li>{t('privacy.sections.sharing.items.service')}</li>
                <li>{t('privacy.sections.sharing.items.legal')}</li>
                <li>{t('privacy.sections.sharing.items.business')}</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.security.title')}
              </h2>
              <p className="text-gray-600">
                {t('privacy.sections.security.content')}
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.cookies.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('privacy.sections.cookies.content')}
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">
                    {t('privacy.sections.cookies.types.essential.title')}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {t('privacy.sections.cookies.types.essential.content')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">
                    {t('privacy.sections.cookies.types.analytics.title')}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {t('privacy.sections.cookies.types.analytics.content')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">
                    {t('privacy.sections.cookies.types.marketing.title')}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {t('privacy.sections.cookies.types.marketing.content')}
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.rights.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('privacy.sections.rights.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('privacy.sections.rights.items.access')}</li>
                <li>{t('privacy.sections.rights.items.correct')}</li>
                <li>{t('privacy.sections.rights.items.delete')}</li>
                <li>{t('privacy.sections.rights.items.restrict')}</li>
                <li>{t('privacy.sections.rights.items.portability')}</li>
                <li>{t('privacy.sections.rights.items.object')}</li>
              </ul>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.thirdParty.title')}
              </h2>
              <p className="text-gray-600">
                {t('privacy.sections.thirdParty.content')}
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.children.title')}
              </h2>
              <p className="text-gray-600">
                {t('privacy.sections.children.content')}
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.changes.title')}
              </h2>
              <p className="text-gray-600">
                {t('privacy.sections.changes.content')}
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-teal-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.sections.contact.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('privacy.sections.contact.content')}
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

export default PrivacyPolicyPage;
