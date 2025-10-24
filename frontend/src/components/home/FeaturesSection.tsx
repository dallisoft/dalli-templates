import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: '혁신적인 기술',
      description: '최신 기술 스택을 활용한 안정적이고 확장 가능한 솔루션을 제공합니다.',
      icon: '🚀',
    },
    {
      title: '전문적인 지원',
      description: '경험 많은 전문가들이 고객의 성공을 위해 최선을 다해 지원합니다.',
      icon: '👥',
    },
    {
      title: '맞춤형 솔루션',
      description: '고객의 요구사항에 맞는 맞춤형 솔루션을 설계하고 구현합니다.',
      icon: '⚙️',
    },
    {
      title: '24/7 지원',
      description: '언제든지 필요한 도움을 받을 수 있도록 24시간 지원 서비스를 제공합니다.',
      icon: '🕒',
    },
  ];

  return (
    <div className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            왜 Dallisoft를 선택해야 할까요?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            우리는 고객의 성공을 위해 최선의 서비스를 제공합니다.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
