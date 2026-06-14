import React, { ChangeEvent, FormEvent, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container';
import Button from '../ui/Button';

type ContactMethod = 'phone' | 'email' | 'whatsapp';
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ContactFormState {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  preferredContactMethod: ContactMethod;
  website: string;
}

type ContactFormErrors = Partial<Record<keyof ContactFormState | 'contact', string>>;

const initialFormState: ContactFormState = {
  name: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
  preferredContactMethod: 'phone',
  website: '',
};

const Contact: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<ContactFormState>(initialFormState);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');

  const validateForm = () => {
    const nextErrors: ContactFormErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+\d][\d\s()./-]{5,24}$/;

    if (!formData.name.trim()) {
      nextErrors.name = t('contact.form.validation.name');
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      nextErrors.contact = t('contact.form.validation.contact');
    }
    if (formData.phone.trim() && !phonePattern.test(formData.phone.trim())) {
      nextErrors.phone = t('contact.form.validation.phone');
    }
    if (formData.email.trim() && !emailPattern.test(formData.email.trim())) {
      nextErrors.email = t('contact.form.validation.email');
    }
    if (!formData.message.trim()) {
      nextErrors.message = t('contact.form.validation.message');
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({
      ...current,
      [name]: undefined,
      contact: name === 'phone' || name === 'email' ? undefined : current.contact,
    }));
    if (formStatus !== 'idle') {
      setFormStatus('idle');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      setFormStatus('error');
      return;
    }

    setFormStatus('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          language: i18n.resolvedLanguage === 'en' ? 'en' : 'mk',
        }),
      });

      if (!response.ok) {
        throw new Error(`Contact submission failed with status ${response.status}`);
      }

      setFormData(initialFormState);
      setErrors({});
      setFormStatus('success');
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setFormStatus('error');
    }
  };

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
            
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contact.form.name')} <span aria-hidden="true" className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    className={`w-full px-3 py-2 md:px-4 md:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('contact.form.placeholder.name')}
                  />
                  {errors.name && (
                    <p id="contact-name-error" className="mt-1 text-sm text-red-700">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contact.form.phone')}
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone || errors.contact)}
                    aria-describedby={`contact-phone-help${
                      errors.phone || errors.contact ? ' contact-phone-error' : ''
                    }`}
                    className={`w-full px-3 py-2 md:px-4 md:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200 ${
                      errors.phone || errors.contact ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('contact.form.placeholder.phone')}
                  />
                  <p id="contact-phone-help" className="mt-1 text-xs text-gray-500">
                    {t('contact.form.phoneEncouragement')}
                  </p>
                  {(errors.phone || errors.contact) && (
                    <p id="contact-phone-error" className="mt-1 text-sm text-red-700">
                      {errors.phone || errors.contact}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contact.form.email')}
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email || errors.contact)}
                    aria-describedby={errors.email || errors.contact ? 'contact-email-error' : undefined}
                    className={`w-full px-3 py-2 md:px-4 md:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200 ${
                      errors.email || errors.contact ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('contact.form.placeholder.email')}
                  />
                  {(errors.email || errors.contact) && (
                    <p id="contact-email-error" className="mt-1 text-sm text-red-700">
                      {errors.email || errors.contact}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="contact-method" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contact.form.preferredMethod')}
                  </label>
                  <select
                    id="contact-method"
                    name="preferredContactMethod"
                    value={formData.preferredContactMethod}
                    onChange={handleChange}
                    className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200"
                  >
                    <option value="phone">{t('contact.form.methods.phone')}</option>
                    <option value="whatsapp">{t('contact.form.methods.whatsapp')}</option>
                    <option value="email">{t('contact.form.methods.email')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.form.subject')}
                </label>
                <input
                  type="text"
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200"
                  placeholder={t('contact.form.placeholder.subject')}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contact.form.message')} <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  required
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  className={`w-full px-3 py-2 md:px-4 md:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-siena-500 focus:border-transparent text-sm md:text-base transition-colors duration-200 resize-y ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('contact.form.placeholder.message')}
                />
                {errors.message && (
                  <p id="contact-message-error" className="mt-1 text-sm text-red-700">
                    {errors.message}
                  </p>
                )}
              </div>

              <div
                aria-hidden="true"
                className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
              >
                <label htmlFor="contact-website">Website</label>
                <input
                  type="text"
                  id="contact-website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {formStatus === 'success' && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{t('contact.form.status.success')}</span>
                </div>
              )}

              {formStatus === 'error' && Object.keys(errors).length === 0 && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{t('contact.form.status.error')}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full min-h-11"
                disabled={formStatus === 'submitting'}
              >
                {formStatus === 'submitting'
                  ? t('contact.form.status.sending')
                  : t('contact.form.send')}
                {formStatus === 'submitting' ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="ml-2 h-4 w-4" aria-hidden="true" />
                )}
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
