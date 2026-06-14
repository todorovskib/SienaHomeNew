import React from 'react';
import {
  ChevronRight,
  Droplets,
  MessageCircle,
  Ruler,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import Container from '../ui/Container';

// TODO: Replace with a local Siena Home room/product photo once one is available.
const HERO_IMAGE_URL =
  'https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg';

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';

  const trustPoints = [
    { key: 'waterproof', icon: Droplets },
    { key: 'custom', icon: Ruler },
    { key: 'delivery', icon: Truck },
    { key: 'warranty', icon: ShieldCheck },
  ];

  return (
    <section
      id="home"
      className="relative isolate min-h-[560px] overflow-hidden bg-siena-900 sm:min-h-[600px] lg:min-h-[680px]"
    >
      <img
        src={HERO_IMAGE_URL}
        alt={t('hero.imageAlt')}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-siena-900/75 to-black/95 sm:bg-gradient-to-r sm:from-black/95 sm:via-siena-900/80 sm:to-black/30" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-black/80 to-transparent" />

      <Container className="flex min-h-[560px] items-center sm:min-h-[600px] lg:min-h-[680px]">
        <div className="w-full pb-8 pt-24 sm:pb-12 sm:pt-28 lg:pb-16 lg:pt-32">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-siena-200 sm:text-sm">
              {t('hero.eyebrow')}
            </p>

            <h1 className="max-w-2xl text-3xl font-bold leading-[1.08] text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base md:mt-5 md:text-lg">
              {t('hero.subtitle')}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap md:mt-8">
              <Link
                to={`/${currentLang}/products`}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-siena-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-colors hover:bg-siena-600 focus:outline-none focus:ring-2 focus:ring-siena-300 focus:ring-offset-2 focus:ring-offset-siena-900 sm:w-auto sm:text-base"
              >
                {t('hero.buttons.products')}
                <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>

              <Link
                to={`/${currentLang}/contact`}
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/70 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-siena-900 sm:w-auto sm:text-base"
              >
                <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                {t('hero.buttons.contact')}
              </Link>
            </div>

            <div
              className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/20 pt-4 sm:mt-8 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3 md:pt-5"
              aria-label={t('hero.trustLabel')}
            >
              {trustPoints.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="flex min-w-0 items-center gap-2 text-xs font-medium text-white/90 sm:text-sm"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-siena-200">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>{t(`hero.trust.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
