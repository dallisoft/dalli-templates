import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import Footer from '../components/home/Footer';

const Solution: React.FC = () => {
  const solutions = [
    {
      title: '웹 개발 솔루션',
      description: '현대적이고 확장 가능한 웹 애플리케이션 개발',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      icon: '🌐',
    },
    {
      title: '모바일 앱 개발',
      description: 'iOS 및 Android 플랫폼을 위한 네이티브 앱 개발',
      technologies: ['React Native', 'Swift', 'Kotlin', 'Firebase'],
      icon: '📱',
    },
    {
      title: '클라우드 마이그레이션',
      description: '기존 시스템을 클라우드 환경으로 안전하게 이전',
      technologies: ['AWS', 'Azure', 'Google Cloud', 'Kubernetes'],
      icon: '☁️',
    },
    {
      title: '데이터 분석',
      description: '비즈니스 인사이트를 위한 데이터 분석 및 시각화',
      technologies: ['Python', 'R', 'Tableau', 'Power BI'],
      icon: '📊',
    },
    {
      title: 'AI/ML 솔루션',
      description: '인공지능과 머신러닝을 활용한 스마트 솔루션',
      technologies: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenAI'],
      icon: '🤖',
    },
    {
      title: 'DevOps & CI/CD',
      description: '개발부터 배포까지 자동화된 개발 환경 구축',
      technologies: ['Jenkins', 'GitLab CI', 'Docker', 'Kubernetes'],
      icon: '⚙️',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <div className="bg-gradient-to-r from-green-600 to-green-800 dark:from-green-800 dark:to-green-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              솔루션
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              비즈니스 요구사항에 맞는 맞춤형 기술 솔루션을 제공합니다
            </p>
          </div>
        </div>

        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                전문 솔루션 영역
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                다양한 기술 영역에서 검증된 전문성을 바탕으로 최적의 솔루션을 제공합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
                >
                  <div className="text-4xl mb-4">{solution.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {solution.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {solution.description}
                  </p>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      사용 기술
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {solution.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    문의하기
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

export default Solution;
