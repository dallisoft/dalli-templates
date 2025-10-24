import React, { useState } from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import Footer from '../components/home/Footer';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Dallisoft는 어떤 서비스를 제공하나요?',
      answer: 'Dallisoft는 웹 개발, 모바일 앱 개발, 클라우드 솔루션, AI/ML, DevOps 등 다양한 기술 영역에서 전문적인 서비스를 제공합니다. 고객의 요구사항에 맞는 맞춤형 솔루션을 설계하고 구현합니다.',
    },
    {
      question: '프로젝트 진행 과정은 어떻게 되나요?',
      answer: '프로젝트는 1) 요구사항 분석 2) 설계 및 계획 수립 3) 개발 및 구현 4) 테스트 및 검증 5) 배포 및 운영 지원의 단계로 진행됩니다. 각 단계마다 고객과의 소통을 통해 진행 상황을 공유합니다.',
    },
    {
      question: '개발 기간은 얼마나 걸리나요?',
      answer: '프로젝트의 복잡도와 범위에 따라 달라집니다. 간단한 웹사이트는 2-4주, 복잡한 웹 애플리케이션은 2-6개월, 대규모 시스템은 6개월 이상 소요될 수 있습니다. 정확한 일정은 상담을 통해 결정됩니다.',
    },
    {
      question: '유지보수 서비스는 제공하나요?',
      answer: '네, 모든 프로젝트에 대해 유지보수 서비스를 제공합니다. 버그 수정, 기능 업데이트, 보안 패치, 성능 최적화 등을 포함하며, 24/7 기술 지원도 가능합니다.',
    },
    {
      question: '비용은 어떻게 책정되나요?',
      answer: '프로젝트의 복잡도, 개발 기간, 사용 기술, 팀 규모 등을 고려하여 책정됩니다. 투명한 비용 구조를 제공하며, 상세한 견적서를 미리 제공해드립니다.',
    },
    {
      question: '기존 시스템과의 연동이 가능한가요?',
      answer: '네, 기존 시스템과의 연동이 가능합니다. API 연동, 데이터베이스 연동, 레거시 시스템 통합 등 다양한 연동 방식을 지원합니다.',
    },
    {
      question: '보안은 어떻게 관리하나요?',
      answer: '보안은 최우선으로 고려합니다. 데이터 암호화, 접근 제어, 보안 감사, 정기적인 보안 점검 등을 통해 고객의 데이터와 시스템을 안전하게 보호합니다.',
    },
    {
      question: '긴급한 문제 발생 시 어떻게 대응하나요?',
      answer: '긴급한 문제 발생 시 24시간 내 응답하며, 심각한 문제의 경우 4시간 내 현장 지원이 가능합니다. 원격 지원과 현장 지원을 모두 제공합니다.',
    },
    {
      question: '교육이나 훈련 서비스도 제공하나요?',
      answer: '네, 고객사 직원들을 위한 기술 교육과 훈련 서비스를 제공합니다. 시스템 사용법, 유지보수 방법, 트러블슈팅 등 다양한 교육 프로그램을 운영합니다.',
    },
    {
      question: '계약 조건은 어떻게 되나요?',
      answer: '계약은 프로젝트별로 개별적으로 체결됩니다. 일반적으로 계약금, 중간금, 잔금으로 나누어 지불하며, 유지보수 계약은 별도로 체결할 수 있습니다.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-800 dark:to-teal-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              FAQ
            </h1>
            <p className="text-xl text-teal-100 max-w-3xl mx-auto">
              자주 묻는 질문들을 정리했습니다. 궁금한 점이 있으시면 언제든 문의해주세요.
            </p>
          </div>
        </div>

        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 추가 문의 섹션 */}
            <div className="mt-16 text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                더 궁금한 점이 있으신가요?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                위에서 답을 찾지 못하셨다면 언제든지 문의해주세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:contact@dallisoft.com"
                  className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  이메일 문의
                </a>
                <a
                  href="tel:+82-2-1234-5678"
                  className="border-2 border-teal-600 text-teal-600 dark:text-teal-400 px-6 py-3 rounded-lg font-semibold hover:bg-teal-600 hover:text-white transition-colors"
                >
                  전화 문의
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
