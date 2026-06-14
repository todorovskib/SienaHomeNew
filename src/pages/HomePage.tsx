import React from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import ProductShowcase from '../components/sections/ProductShowcase';
import Newsletter from '../components/sections/Newsletter';

const HomePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <ProductShowcase />
      <Features />
      <Newsletter />
    </motion.div>
  );
};

export default HomePage;
