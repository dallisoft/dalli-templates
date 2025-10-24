import React, { useState } from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import Footer from '../components/home/Footer';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 폼 제출 로직
    console.log('Form submitted:', formData);
    alert('문의가 성공적으로 전송되었습니다. 빠른 시일 내에 연락드리겠습니다.');
  };

  const contactInfo = [
    {
      title: '주소',
      content: '서울특별시 강남구 테헤란로 123, 456호',
      icon: '📍',
    },
    {
      title: '전화',
      content: '+82-2-1234-5678',
      icon: '📞',
    },
    {
      title: '이메일',
      content: 'contact@dallisoft.com',
      icon: '✉️',
    },
    {
      title: '운영시간',
      content: '월-금: 09:00 - 18:00',
      icon: '🕒',
    },
  ];

  const services = [
    '웹 개발',
    '모바일 앱 개발',
    '클라우드 솔루션',
    'AI/ML 솔루션',
    'DevOps 서비스',
    '데이터 분석',
    '기타',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <div className="bg-gradient-to-r from-pink-600 to-pink-800 dark:from-pink-800 dark:to-pink-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              연락처
            </h1>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto">
              프로젝트 문의나 상담이 필요하시면 언제든지 연락해주세요
            </p>
          </div>
        </div>

        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* 연락처 정보 */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  연락처 정보
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="text-2xl">{info.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {info.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    빠른 응답을 위한 팁
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• 프로젝트의 목적과 목표를 명확히 설명해주세요</li>
                    <li>• 예상 예산과 일정을 미리 알려주시면 더 정확한 제안을 드릴 수 있습니다</li>
                    <li>• 기존 시스템이나 특별한 요구사항이 있다면 함께 공유해주세요</li>
                    <li>• 긴급한 문의는 전화로 연락해주시면 더 빠른 응답이 가능합니다</li>
                  </ul>
                </div>
              </div>

              {/* 문의 폼 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  문의하기
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        이름 *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      회사명
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      관심 서비스
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">서비스를 선택해주세요</option>
                      {services.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      메시지 *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="프로젝트에 대한 자세한 내용을 알려주세요..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-pink-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-pink-700 transition-colors"
                  >
                    문의 보내기
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
