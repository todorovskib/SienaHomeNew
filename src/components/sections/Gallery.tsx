import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container';

interface GalleryImage {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}

const Gallery: React.FC = () => {
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null);

  const galleryImages: GalleryImage[] = [
    {
      id: '1',
      title: t('gallery.items.modern_master.title'),
      category: t('gallery.categories.vanities'),
      imageUrl: 'https://raw.githubusercontent.com/darkotodorovski/Strana/main/Mini/2.png',
    },
    {
      id: '2',
      title: t('gallery.items.minimalist_storage.title'),
      category: t('gallery.categories.storage'),
      imageUrl: 'https://raw.githubusercontent.com/darkotodorovski/Strana/main/%D0%9A%D0%BB%D0%B0%D1%81%D0%B8%D0%BA/2.png',
    },
    {
      id: '3',
      title: t('gallery.items.luxury_spa.title'),
      category: t('gallery.categories.complete'),
      imageUrl: 'https://raw.githubusercontent.com/darkotodorovski/Strana/main/%D0%9A%D0%BB%D0%B0%D1%81%D0%B8%D0%BA%20%D0%B2%D0%B8%D1%81%D0%B5%D1%87%D0%BA%D0%BE/19.png',
    },
    {
      id: '4',
      title: t('gallery.items.contemporary_vanity.title'),
      category: t('gallery.categories.vanities'),
      imageUrl: 'https://raw.githubusercontent.com/darkotodorovski/Strana/main/%D0%A2%D1%80%D0%B8%D0%BE/5%20%D0%B0%D0%BD.png',
    },
    {
      id: '5',
      title: t('gallery.items.elegant_mirror.title'),
      category: t('gallery.categories.mirrors'),
      imageUrl: 'https://raw.githubusercontent.com/darkotodorovski/Strana/main/%D0%A8%D0%BA%D0%B0%D1%84%20%D0%B7%D0%B0%20%D0%B1%D0%B0%D1%9A%D0%B0/16.png',
    },
    {
      id: '6',
      title: t('gallery.items.compact_solution.title'),
      category: t('gallery.categories.vanities'),
      imageUrl: 'https://raw.githubusercontent.com/darkotodorovski/Strana/main/%D0%A8%D0%BA%D0%B0%D1%84%20%D0%B7%D0%B0%20%D0%B1%D0%B0%D1%9A%D0%B0%20%D0%B4%D1%83%D0%BF%D0%BB%D0%B8/26.png',
    },
  ];

  const openLightbox = (image: GalleryImage) => {
    setCurrentImage(image);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setCurrentImage(null);
    document.body.style.overflow = '';
  };

  return (
    <>
      <section id="gallery" className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-siena-50">
        <Container>
          <div className="mb-6 md:mb-8 lg:mb-12 px-2 md:px-4 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-3 lg:mb-4">
              {t('gallery.title')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('gallery.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-lg group cursor-pointer relative shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => openLightbox(image)}
              >
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-60 md:h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6">
                  <span className="text-white text-xs md:text-sm font-medium bg-siena-500 px-2 py-1 rounded inline-block mb-2 w-fit">
                    {image.category}
                  </span>
                  <h3 className="text-white text-base md:text-lg font-semibold">
                    {image.title}
                  </h3>
                </div>
                
                {/* Hover overlay with gradient border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-siena-400 rounded-lg transition-colors duration-300"></div>
              </div>
            ))}
          </div>
        </Container>
      </section>
      
      {/* Enhanced Lightbox */}
      {lightboxOpen && currentImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-siena-400 transition-colors duration-300 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70"
          >
            <X className="h-6 w-6 md:h-8 md:w-8" />
          </button>
          
          <div className="max-w-5xl w-full">
            <img
              src={currentImage.imageUrl}
              alt={currentImage.title}
              className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="text-center mt-4 bg-black/50 rounded-lg p-4 backdrop-blur-sm">
              <h3 className="text-white text-lg md:text-xl font-semibold">
                {currentImage.title}
              </h3>
              <p className="text-gray-300 text-sm md:text-base">
                {currentImage.category}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
