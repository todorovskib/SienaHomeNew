import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Award, Leaf, Factory } from 'lucide-react';
import Container from '../components/ui/Container';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const milestones = [
    {
      year: '1998',
      title: t('about.milestones.founding'),
      description: t('about.milestones.foundingDesc')
    },
    {
      year: '2015',
      title: t('about.milestones.expansion'),
      description: t('about.milestones.expansionDesc')
    },
    {
      year: '2024',
      title: t('about.milestones.modernization'),
      description: t('about.milestones.modernizationDesc')
    }
  ];

  const values = [
    {
      icon: Award,
      title: t('about.values.quality.title'),
      description: t('about.values.quality.description')
    },
    {
      icon: Leaf,
      title: t('about.values.sustainability.title'),
      description: t('about.values.sustainability.description')
    },
    {
      icon: Factory,
      title: t('about.values.innovation.title'),
      description: t('about.values.innovation.description')
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pt-24"
    >
      <Container>
        <motion.div 
          className="text-center mb-16"
          {...fadeInUp}
        >
          <div className="mb-6 md:mb-8 lg:mb-12 px-2 md:px-4 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-3 lg:mb-4">
              {t('about.title')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('about.subtitle')}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div {...fadeInUp}>
            <h2 className="text-2xl font-semibold mb-6 text-siena-800">
              {t('about.history.title')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('about.history.content1')}
            </p>
            <p className="text-gray-600">
              {t('about.history.content2')}
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-4">
              <motion.div 
                className="overflow-hidden rounded-lg h-48 md:h-64 shadow-md"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src="https://raw.githubusercontent.com/darkotodorovski/Strana/main/%D0%A2%D1%80%D0%B8%D0%BE/4%20%D0%B0%D0%BD.png" 
                  alt="Factory production"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                className="overflow-hidden rounded-lg h-64 md:h-80 shadow-md"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src="https://raw.githubusercontent.com/darkotodorovski/Strana/main/Mini/2.png" 
                  alt="Quality control"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
            <div className="space-y-4 mt-8">
              <motion.div 
                className="overflow-hidden rounded-lg h-64 md:h-80 shadow-md"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src="https://raw.githubusercontent.com/darkotodorovski/Strana/main/Mini/4.png" 
                  alt="Factory production"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                className="overflow-hidden rounded-lg h-48 md:h-64 shadow-md"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src="https://raw.githubusercontent.com/darkotodorovski/Strana/main/%D0%A2%D1%80%D0%B8%D0%BE/5%20%D0%B0%D0%BD.png" 
                  alt="Quality control"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-8 text-center text-siena-800">
            {t('about.timeline')}
          </h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div 
                key={milestone.year} 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="flex-shrink-0 w-24">
                  <span className="text-2xl font-bold text-siena-600">
                    {milestone.year}
                  </span>
                </div>
                <div className="flex-grow pl-8 border-l-2 border-siena-200">
                  <h3 className="text-xl font-semibold mb-2 text-siena-700">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600">
                    {milestone.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-8 text-center text-siena-800">
            {t('about.values.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div 
                key={index} 
                className="text-center p-6 bg-gradient-to-br from-siena-50 to-accent-50 rounded-lg border border-siena-200 hover:border-siena-300 hover:shadow-md transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <value.icon className="w-12 h-12 text-siena-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-siena-800">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-siena-100">
            <div className="text-4xl font-bold text-siena-600 mb-2">
              20+
            </div>
            <div className="text-gray-600">
              {t('about.stats.years')}
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-siena-100">
            <div className="text-4xl font-bold text-siena-600 mb-2">
              1000+
            </div>
            <div className="text-gray-600">
              {t('about.stats.projects')}
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-siena-100">
            <div className="text-4xl font-bold text-siena-600 mb-2">
              50+
            </div>
            <div className="text-gray-600">
              {t('about.stats.employees')}
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-siena-100">
            <div className="text-4xl font-bold text-siena-600 mb-2">
              100%
            </div>
            <div className="text-gray-600">
              {t('about.stats.satisfaction')}
            </div>
          </div>
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default AboutPage;
