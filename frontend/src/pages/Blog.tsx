import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import Footer from '../components/home/Footer';

const Blog: React.FC = () => {
  const blogPosts = [
    {
      title: 'React 18의 새로운 기능과 개선사항',
      excerpt: 'React 18에서 도입된 Concurrent Features와 자동 배치 처리에 대해 알아보세요.',
      author: '김개발',
      date: '2024-01-15',
      category: '기술',
      readTime: '5분',
      image: '/images/blog/react18.jpg',
    },
    {
      title: '클라우드 마이그레이션 전략과 모범 사례',
      excerpt: '기존 시스템을 클라우드로 안전하게 이전하는 방법과 주의사항을 정리했습니다.',
      author: '이클라우드',
      date: '2024-01-10',
      category: 'DevOps',
      readTime: '8분',
      image: '/images/blog/cloud.jpg',
    },
    {
      title: 'AI와 머신러닝의 비즈니스 활용 사례',
      excerpt: '실제 비즈니스에서 AI 기술을 성공적으로 도입한 사례들을 소개합니다.',
      author: '박AI',
      date: '2024-01-05',
      category: 'AI/ML',
      readTime: '6분',
      image: '/images/blog/ai-business.jpg',
    },
    {
      title: '웹 성능 최적화를 위한 10가지 팁',
      excerpt: '사용자 경험을 향상시키는 웹 성능 최적화 기법들을 정리했습니다.',
      author: '최성능',
      date: '2023-12-28',
      category: '웹 개발',
      readTime: '7분',
      image: '/images/blog/performance.jpg',
    },
    {
      title: '마이크로서비스 아키텍처 설계 가이드',
      excerpt: '확장 가능하고 유지보수가 쉬운 마이크로서비스 시스템을 구축하는 방법을 알아보세요.',
      author: '정아키텍트',
      date: '2023-12-20',
      category: '아키텍처',
      readTime: '10분',
      image: '/images/blog/microservices.jpg',
    },
    {
      title: '데이터베이스 설계와 최적화 기법',
      excerpt: '효율적인 데이터베이스 설계와 쿼리 최적화를 위한 실무 노하우를 공유합니다.',
      author: '한데이터',
      date: '2023-12-15',
      category: '데이터베이스',
      readTime: '9분',
      image: '/images/blog/database.jpg',
    },
  ];

  const categories = ['전체', '기술', 'DevOps', 'AI/ML', '웹 개발', '아키텍처', '데이터베이스'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />
      <main>
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 dark:from-orange-800 dark:to-orange-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              블로그
            </h1>
            <p className="text-xl text-orange-100 max-w-3xl mx-auto">
              최신 기술 트렌드와 실무 경험을 공유하는 기술 블로그입니다
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
                  className="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 블로그 포스트 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <article
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm rounded-full">
                        {post.category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{post.author}</span>
                      <span>{post.date}</span>
                    </div>
                    <button className="w-full mt-4 bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                      읽기
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="flex justify-center mt-12">
              <nav className="flex space-x-2">
                <button className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  이전
                </button>
                <button className="px-3 py-2 rounded-md bg-orange-600 text-white">
                  1
                </button>
                <button className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  2
                </button>
                <button className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  3
                </button>
                <button className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  다음
                </button>
              </nav>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
