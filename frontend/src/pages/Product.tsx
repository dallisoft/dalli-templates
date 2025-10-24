import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import Footer from '../components/home/Footer';

const Product: React.FC = () => {
  const products = [
    {
      name: 'Dalli Admin Dashboard',
      description: '현대적이고 직관적인 관리자 대시보드 솔루션',
      features: ['반응형 디자인', '다크 모드 지원', '실시간 데이터', '사용자 관리'],
      price: '무료',
    },
    {
      name: 'Dalli Analytics',
      description: '비즈니스 데이터 분석 및 시각화 도구',
      features: ['실시간 분석', '커스텀 차트', '데이터 내보내기', 'API 연동'],
      price: '월 $99',
    },
    {
      name: 'Dalli CRM',
      description: '고객 관계 관리 시스템',
      features: ['고객 데이터베이스', '영업 파이프라인', '자동화 워크플로우', '리포팅'],
      price: '월 $199',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              제품
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              비즈니스 성장을 위한 혁신적인 제품들을 만나보세요
            </p>
          </div>
        </div>

        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {product.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    {product.price}
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    자세히 보기
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Product;
