import React, { useState, useEffect } from 'react';
import { User } from '../../types/user';
import { userService } from '../../services/userService';
import { PencilIcon, TrashBinIcon } from '../../icons';
import { Link } from 'react-router';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';
import Select from '../../components/form/Select';
import UserModal from '../../components/users/UserModal';
import { TableSkeleton } from '../../components/ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { usePermissions } from '../../hooks/usePermissions';

interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const { canCreateUser, canEditUser, canDeleteUser } = usePermissions();

  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.per_page, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(
        pagination.page, 
        pagination.per_page, 
        searchTerm || undefined
      );
      setUsers(response.users);
      setPagination({
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        total_pages: response.total_pages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        await userService.deleteUser(id);
        await loadUsers(); // Reload users after deletion
      } catch (err) {
        setError(err instanceof Error ? err.message : '사용자 삭제에 실패했습니다.');
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPagination(prev => ({ ...prev, per_page: newPerPage, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleModalSuccess = () => {
    loadUsers();
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
        title="User List | Dalli Template - Next.js Admin Dashboard Template"
        description="This is User List page for Dalli Template - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="User List" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User List</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              총 {pagination.total}명의 사용자
            </p>
          </div>
          {canCreateUser() && (
            <Button size="sm" variant="primary" onClick={handleCreateUser}>
              새 사용자 추가
            </Button>
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
                  placeholder="사용자 검색..."
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
                  { value: "5", label: "5명" },
                  { value: "10", label: "10명" },
                  { value: "20", label: "20명" },
                  { value: "50", label: "50명" }
                ]}
                defaultValue={pagination.per_page.toString()}
                onChange={(value) => handlePerPageChange(parseInt(value))}
                className="w-20"
              />
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <TableSkeleton rows={5} columns={4} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="text-red-800 dark:text-red-200">{error}</div>
            <button 
              onClick={loadUsers}
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
                      이름
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      이메일
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      관리자
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      상태
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      가입일
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
                  {users.length === 0 ? (
                    <TableRow>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        사용자가 없습니다.
                      </td>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.id}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.first_name} {user.last_name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-gray-600 text-theme-sm dark:text-gray-400">
                            {user.email}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_admin 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.is_admin ? '관리자' : '일반'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {user.is_active ? '활성' : '비활성'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Link
                              to={`/profile?user_id=${user.id}`}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                              title="프로필 보기"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </Link>
                            {canEditUser(user.id) && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                                title="편집"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteUser() && (
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                title="삭제"
                              >
                                <TrashBinIcon className="h-4 w-4" />
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
            {pagination.total_pages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {pagination.total > 0 ? (
                      <>
                        {((pagination.page - 1) * pagination.per_page) + 1} - {Math.min(pagination.page * pagination.per_page, pagination.total)} / {pagination.total}명
                      </>
                    ) : (
                      "0명"
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      이전
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={pageNum === pagination.page ? "primary" : "outline"}
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
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.total_pages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* User Modal */}
        <UserModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          user={editingUser}
          mode={modalMode}
        />
      </div>
    </>
  );
};

export default UserList;