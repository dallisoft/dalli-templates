import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import Footer from '../components/home/Footer';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
