import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import Container from '../components/ui/Container';
import SectionHeading from '../components/ui/SectionHeading';

const WarrantyPage: React.FC = () => {
  const { t } = useTranslation();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const warrantyFeatures = [
    {
      icon: Shield,
      title: t('warranty.features.protection.title'),
      description: t('warranty.features.protection.description')
    },
    {
      icon: Clock,
      title: t('warranty.features.duration.title'),
      description: t('warranty.features.duration.description')
    },
    {
      icon: CheckCircle,
      title: t('warranty.features.coverage.title'),
      description: t('warranty.features.coverage.description')
    },
    {
      icon: AlertTriangle,
      title: t('warranty.features.support.title'),
      description: t('warranty.features.support.description')
    }
  ];

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
            title={t('warranty.title')}
            subtitle={t('warranty.subtitle')}
            centered
          />
        </motion.div>

        {/* Warranty Features */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {warrantyFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              className="text-center p-6 bg-white rounded-lg shadow-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <feature.icon className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto prose prose-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            
            {/* Last Updated */}
            <div className="text-sm text-gray-500 border-b pb-4">
              {t('warranty.lastUpdated')}: {new Date().toLocaleDateString()}
            </div>

            {/* Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('warranty.sections.overview.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('warranty.sections.overview.content')}
              </p>
            </section>

            {/* Coverage */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('warranty.sections.coverage.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('warranty.sections.coverage.content')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-800 mb-3">
                    {t('warranty.sections.coverage.included.title')}
                  </h3>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li>{t('warranty.sections.coverage.included.items.defects')}</li>
                    <li>{t('warranty.sections.coverage.included.items.materials')}</li>
                    <li>{t('warranty.sections.coverage.included.items.workmanship')}</li>
                    <li>{t('warranty.sections.coverage.included.items.hardware')}</li>
                    <li>{t('warranty.sections.coverage.included.items.finish')}</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-red-800 mb-3">
                    {t('warranty.sections.coverage.excluded.title')}
                  </h3>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>{t('warranty.sections.coverage.excluded.items.misuse')}</li>
                    <li>{t('warranty.sections.coverage.excluded.items.damage')}</li>
                    <li>{t('warranty.sections.coverage.excluded.items.wear')}</li>
                    <li>{t('warranty.sections.coverage.excluded.items.modification')}</li>
                    <li>{t('warranty.sections.coverage.excluded.items.installation')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Duration */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('warranty.sections.duration.title')}
              </h2>
              <div className="space-y-4">
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-teal-800 mb-2">
                    {t('warranty.sections.duration.standard.title')}
                  </h3>
                  <p className="text-teal-700 text-sm">
                    {t('warranty.sections.duration.standard.content')}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    {t('warranty.sections.duration.extended.title')}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {t('warranty.sections.duration.extended.content')}
                  </p>
                </div>
              </div>
            </section>

            {/* Claims Process */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('warranty.sections.claims.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('warranty.sections.claims.content')}
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{t('warranty.sections.claims.steps.contact.title')}</h4>
                    <p className="text-gray-600 text-sm">{t('warranty.sections.claims.steps.contact.content')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">2</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{t('warranty.sections.claims.steps.documentation.title')}</h4>
                    <p className="text-gray-600 text-sm">{t('warranty.sections.claims.steps.documentation.content')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">3</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{t('warranty.sections.claims.steps.evaluation.title')}</h4>
                    <p className="text-gray-600 text-sm">{t('warranty.sections.claims.steps.evaluation.content')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">4</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{t('warranty.sections.claims.steps.resolution.title')}</h4>
                    <p className="text-gray-600 text-sm">{t('warranty.sections.claims.steps.resolution.content')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Care Instructions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('warranty.sections.care.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('warranty.sections.care.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('warranty.sections.care.items.cleaning')}</li>
                <li>{t('warranty.sections.care.items.chemicals')}</li>
                <li>{t('warranty.sections.care.items.temperature')}</li>
                <li>{t('warranty.sections.care.items.installation')}</li>
                <li>{t('warranty.sections.care.items.maintenance')}</li>
              </ul>
            </section>

            {/* Limitations */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('warranty.sections.limitations.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('warranty.sections.limitations.content')}
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-teal-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('warranty.sections.contact.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('warranty.sections.contact.content')}
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>{t('warranty.sections.contact.departmentName')}</strong></p>
                <p>{t('contact.info.email')}: siena.home@yahoo.com</p>
                <p>{t('contact.info.phone')}: 076 669 454</p>
                <p>{t('footer.factoryAddress')}: {t('contact.locations.factory.address')}</p>
                <p className="text-sm text-gray-600 mt-4">
                  {t('warranty.sections.contact.hours')}
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default WarrantyPage;
