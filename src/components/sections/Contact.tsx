import React from 'react';
import { Send, MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container';
import Button from '../ui/Button';

const Contact: React.FC = () => {
  const { t } = useTranslation();

  const locations = [
    {
      key: 'factory',
      title: t('contact.locations.factory.title'),
      address: t('contact.locations.factory.address'),
      coordinates: t('contact.locations.factory.coordinates'),
      description: t('contact.locations.factory.description'),
      mapUrl: 'https://www.google.com/maps?q=41.4899722,22.0900000'
    },
    {
      key: 'showroom_kavadarci',
      title: t('contact.locations.showroom_kavadarci.title'),
      address: t('contact.locations.showroom_kavadarci.address'),
      coordinates: t('contact.locations.showroom_kavadarci.coordinates'),
      description: t('contact.locations.showroom_kavadarci.description'),
      mapUrl: 'https://www.google.com/maps?q=41.4441389,22.0086667'
    },
    {
      key: 'showroom_skopje',
      title: t('contact.locations.showroom_skopje.title'),
      address: t('contact.locations.showroom_skopje.address'),
      coordinates: t('contact.locations.showroom_skopje.coordinates'),
      description: t('contact.locations.showroom_skopje.description'),
      mapUrl: 'https://www.google.com/maps?q=Прохор+Пчински+91,+Skopje+1000,+North+Macedonia'
    }
  ];

  return (
    <section id="contact" className="py-16 md:py-24 bg-white">
      <Container>
        <div className="mb-6 md:mb-8 lg:mb-12 px-2 md:px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-3 lg:mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('contact.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-12">
          <div className="bg-gradient-to-br from-gray-50 to-siena-50 p-6 md:p-8 rounded-lg shadow-sm">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 text-siena-800">
              {t('contact.form.send')}
            </h3>
            
            <form className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contact.form.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200"
                    placeholder={t('contact.form.placeholder.name')}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contact.form.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200"
                    placeholder={t('contact.form.placeholder.email')}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.form.subject')}
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200"
                  placeholder={t('contact.form.placeholder.subject')}
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.form.message')}
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200"
                  placeholder={t('contact.form.placeholder.message')}
                />
              </div>
              
              <Button variant="primary" className="w-full">
                {t('contact.form.send')}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
          
          <div>
            <div className="bg-gradient-to-br from-siena-700 to-siena-800 text-white p-6 md:p-8 rounded-lg mb-6 md:mb-8 shadow-lg">
              <h3 className="text-xl md:text-2xl font-semibold mb-6">
                {t('contact.info.title')}
              </h3>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start group">
                  <Phone className="h-5 w-5 md:h-6 md:w-6 text-siena-300 mr-3 md:mr-4 flex-shrink-0 mt-1 transition-colors duration-300 group-hover:text-siena-200" />
                  <div>
                    <h4 className="font-medium mb-1">
                      {t('contact.info.phone')}
                    </h4>
                    <p className="text-siena-100 text-sm md:text-base">
                      076 669 454
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <Mail className="h-5 w-5 md:h-6 md:w-6 text-siena-300 mr-3 md:mr-4 flex-shrink-0 mt-1 transition-colors duration-300 group-hover:text-siena-200" />
                  <div>
                    <h4 className="font-medium mb-1">
                      {t('contact.info.email')}
                    </h4>
                    <p className="text-siena-100 text-sm md:text-base">
                      siena.home@yahoo.com
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-siena-300 mr-3 md:mr-4 flex-shrink-0 mt-1 transition-colors duration-300 group-hover:text-siena-200" />
                  <div>
                    <h4 className="font-medium mb-1">
                      {t('contact.info.hours')}
                    </h4>
                    <p className="text-siena-100 text-sm md:text-base">
                      {t('contact.info.weekdays')}
                    </p>
                    <p className="text-siena-100 text-sm md:text-base">
                      {t('contact.info.saturday')}
                    </p>
                    <p className="text-siena-100 text-sm md:text-base">
                      {t('contact.info.sunday')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locations Section */}
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-semibold text-center mb-8 md:mb-12 text-siena-800">
            {t('contact.info.location')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {locations.map((location) => (
              <div key={location.key} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-siena-700 transition-colors duration-300">
                    {location.title}
                  </h4>
                  <a
                    href={location.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-siena-600 hover:text-siena-700 transition-colors duration-200"
                    aria-label={`Open ${location.title} in Google Maps`}
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-siena-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {location.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {location.coordinates}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {location.description}
                  </p>
                  
                  <a
                    href={location.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-siena-600 hover:text-siena-700 font-medium transition-colors duration-200"
                  >
                    View on Map
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="rounded-lg overflow-hidden h-64 md:h-96 bg-gray-200 shadow-lg">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.8234567890123!2d22.0900000!3d41.4899722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDI5JzIzLjkiTiAyMsKwMDUnMjQuMCJF!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Siena Home Factory Location"
          />
        </div>
      </Container>
    </section>
  );
};

export default Contact;
