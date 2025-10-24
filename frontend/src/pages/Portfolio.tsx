import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import Footer from '../components/home/Footer';

const Portfolio: React.FC = () => {
  const projects = [
    {
      title: 'E-commerce 플랫폼',
      description: '대규모 온라인 쇼핑몰 구축 및 운영',
      image: '/images/portfolio/ecommerce.jpg',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      category: '웹 개발',
      year: '2023',
    },
    {
      title: '핀테크 모바일 앱',
      description: '안전하고 직관적인 금융 서비스 앱',
      image: '/images/portfolio/fintech.jpg',
      technologies: ['React Native', 'Firebase', 'Stripe API'],
      category: '모바일 앱',
      year: '2023',
    },
    {
      title: 'IoT 대시보드',
      description: '스마트 시티를 위한 실시간 모니터링 시스템',
      image: '/images/portfolio/iot.jpg',
      technologies: ['Vue.js', 'WebSocket', 'MongoDB', 'Docker'],
      category: 'IoT',
      year: '2022',
    },
    {
      title: 'AI 추천 시스템',
      description: '머신러닝 기반 개인화 추천 엔진',
      image: '/images/portfolio/ai.jpg',
      technologies: ['Python', 'TensorFlow', 'Redis', 'Kubernetes'],
      category: 'AI/ML',
      year: '2022',
    },
    {
      title: '클라우드 마이그레이션',
      description: '레거시 시스템의 클라우드 전환 프로젝트',
      image: '/images/portfolio/cloud.jpg',
      technologies: ['AWS', 'Docker', 'Terraform', 'Jenkins'],
      category: 'DevOps',
      year: '2021',
    },
    {
      title: '데이터 분석 플랫폼',
      description: '빅데이터 분석 및 시각화 솔루션',
      image: '/images/portfolio/data.jpg',
      technologies: ['Python', 'Apache Spark', 'Tableau', 'Airflow'],
      category: '데이터 분석',
      year: '2021',
    },
  ];

  const categories = ['전체', '웹 개발', '모바일 앱', 'IoT', 'AI/ML', 'DevOps', '데이터 분석'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-800 dark:to-purple-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              포트폴리오
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              다양한 프로젝트를 통해 검증된 우리의 실력과 경험을 확인하세요
            </p>
          </div>
        </div>

        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 프로젝트 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <span className="text-4xl">📁</span>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                        {project.category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {project.year}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                      자세히 보기
                    </button>
                  </div>
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

export default Portfolio;
