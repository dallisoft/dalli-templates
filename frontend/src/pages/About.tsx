import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import Footer from '../components/home/Footer';

const About: React.FC = () => {
  const team = [
    {
      name: '김대표',
      position: 'CEO',
      description: '10년 이상의 IT 업계 경험을 바탕으로 회사를 이끌고 있습니다.',
      image: '/images/team/ceo.jpg',
    },
    {
      name: '이개발',
      position: 'CTO',
      description: '최신 기술 트렌드를 선도하는 기술 리더입니다.',
      image: '/images/team/cto.jpg',
    },
    {
      name: '박디자인',
      position: '디자인 디렉터',
      description: '사용자 중심의 직관적인 디자인을 추구합니다.',
      image: '/images/team/designer.jpg',
    },
    {
      name: '최마케팅',
      position: '마케팅 매니저',
      description: '브랜드 가치를 전달하는 창의적인 마케팅을 담당합니다.',
      image: '/images/team/marketing.jpg',
    },
  ];

  const values = [
    {
      title: '혁신',
      description: '지속적인 연구개발을 통해 최신 기술을 도입하고 혁신적인 솔루션을 제공합니다.',
      icon: '💡',
    },
    {
      title: '신뢰',
      description: '고객과의 약속을 지키고 투명한 소통을 통해 신뢰 관계를 구축합니다.',
      icon: '🤝',
    },
    {
      title: '품질',
      description: '최고 수준의 품질을 유지하기 위해 꼼꼼한 테스트와 검증 과정을 거칩니다.',
      icon: '⭐',
    },
    {
      title: '성장',
      description: '고객의 성공이 곧 우리의 성공이라는 마음가짐으로 함께 성장합니다.',
      icon: '📈',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-800 dark:to-indigo-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              회사소개
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              혁신적인 기술로 고객의 성공을 지원하는 신뢰할 수 있는 파트너
            </p>
          </div>
        </div>

        {/* 회사 개요 */}
        <div className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Dallisoft에 대해
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Dallisoft는 2020년에 설립된 혁신적인 기술 회사입니다. 
                  최신 기술과 창의적인 아이디어를 바탕으로 고객의 비즈니스 성장을 지원하는 
                  다양한 솔루션을 제공하고 있습니다.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  우리는 웹 개발, 모바일 앱 개발, 클라우드 솔루션, AI/ML 등 
                  다양한 기술 영역에서 전문성을 보유하고 있으며, 
                  고객의 요구사항에 맞는 맞춤형 솔루션을 제공합니다.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">50+</div>
                    <div className="text-gray-600 dark:text-gray-300">완료 프로젝트</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">30+</div>
                    <div className="text-gray-600 dark:text-gray-300">만족한 고객</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">4년</div>
                    <div className="text-gray-600 dark:text-gray-300">업계 경험</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">24/7</div>
                    <div className="text-gray-600 dark:text-gray-300">고객 지원</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">미션</h3>
                <p className="text-lg mb-6">
                  "기술의 힘으로 고객의 비즈니스 성장을 지원하고, 
                  더 나은 미래를 만들어가는 것이 우리의 미션입니다."
                </p>
                <h3 className="text-2xl font-bold mb-4">비전</h3>
                <p className="text-lg">
                  "혁신적인 기술 솔루션을 통해 고객의 성공을 이끄는 
                  글로벌 리딩 기업이 되는 것입니다."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 핵심 가치 */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                핵심 가치
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                우리가 추구하는 핵심 가치와 원칙들입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 팀 소개 */}
        <div className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                팀 소개
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                전문성과 열정을 바탕으로 고객의 성공을 위해 노력하는 우리 팀입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="text-center bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl text-white font-bold">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-3">
                    {member.position}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {member.description}
                  </p>
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

export default About;
