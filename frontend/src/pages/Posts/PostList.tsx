import { useState, useEffect } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import { TableSkeleton } from "../../components/ui/loading";
import { PostWithCategoryAndUser } from "../../types/post";
import postService from "../../services/postService";
import { usePermissions } from "../../hooks/usePermissions";

// Icons
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function PostList() {
  const [posts, setPosts] = useState<PostWithCategoryAndUser[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { canCreatePost, canEditPost, canDeletePost } = usePermissions();

  useEffect(() => {
    loadPosts();
  }, [page, perPage, searchTerm]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getPosts(
        page, 
        perPage, 
        undefined, 
        searchTerm || undefined
      );
      setPosts(response.posts as PostWithCategoryAndUser[]);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError('포스트를 불러오는데 실패했습니다.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("정말로 이 포스트를 삭제하시겠습니까?")) {
      try {
        const success = await postService.deletePost(id);
        if (success) {
          await loadPosts(); // Reload posts after deletion
        } else {
          alert('포스트 삭제에 실패했습니다.');
        }
      } catch (err) {
        alert('포스트 삭제 중 오류가 발생했습니다.');
        console.error('Error deleting post:', err);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <>
      <PageMeta
        title="Post List | Dalli Template - Next.js Admin Dashboard Template"
        description="This is Post List page for Dalli Template - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Post List" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post List</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              총 {total}개의 포스트
            </p>
          </div>
          {canCreatePost() && (
            <Link to="/posts/new">
              <Button size="sm" variant="primary">
                새 포스트 작성
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="포스트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button 
                  type="submit" 
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                >
                  검색
                </button>
              </div>
            </form>

            {/* Per Page Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">페이지당:</label>
              <Select
                options={[
                  { value: "5", label: "5개" },
                  { value: "10", label: "10개" },
                  { value: "20", label: "20개" },
                  { value: "50", label: "50개" }
                ]}
                defaultValue={perPage.toString()}
                onChange={(value) => handlePerPageChange(parseInt(value))}
                className="w-20"
              />
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <TableSkeleton rows={5} columns={5} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="text-red-800 dark:text-red-200">{error}</div>
            <button 
              onClick={loadPosts}
              className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      제목
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      카테고리
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      작성자
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      태그
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      작성일
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      수정일
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      작업
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {posts.length === 0 ? (
                    <TableRow>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        포스트가 없습니다.
                      </td>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {post.id}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="max-w-xs">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                              {post.title}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400 truncate">
                              {post.content.replace(/[#*`]/g, '').substring(0, 50)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Badge
                            size="sm"
                            color="primary"
                          >
                            {post.category?.name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-gray-600 text-theme-sm dark:text-gray-400">
                            {post.user?.first_name} {post.user?.last_name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex flex-wrap gap-1">
                            {post.tags?.slice(0, 2).map((tag, index) => (
                              <Badge
                                key={index}
                                size="sm"
                                color="info"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {post.tags && post.tags.length > 2 && (
                              <Badge
                                size="sm"
                                color="info"
                              >
                                +{post.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(post.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(post.updated_at || post.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            {canEditPost(post.user_id) && (
                              <Link to={`/posts/edit/${post.id}`}>
                                <button
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                                  title="편집"
                                >
                                  <EditIcon />
                                </button>
                              </Link>
                            )}
                            {canDeletePost(post.user_id) && (
                              <button
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                onClick={() => handleDelete(post.id)}
                                title="삭제"
                              >
                                <DeleteIcon />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {total > 0 ? (
                      <>
                        {((page - 1) * perPage) + 1} - {Math.min(page * perPage, total)} / {total}개
                      </>
                    ) : (
                      "0개"
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                    >
                      이전
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={pageNum === page ? "primary" : "outline"}
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    {/* Next Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
