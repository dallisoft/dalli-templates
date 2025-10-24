import React, { useState, useEffect } from 'react';
import { User, UserCreate, UserUpdate } from '../../types/user';
import { userService } from '../../services/userService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, user, mode }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    is_active: true,
    is_admin: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          password: '',
          password_confirm: '',
          is_active: user.is_active,
          is_admin: user.is_admin
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          password: '',
          password_confirm: '',
          is_active: true,
          is_admin: false
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, user]);

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 6) {
      errors.push('비밀번호는 6자 이상이어야 합니다');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('대문자를 포함해야 합니다');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('소문자를 포함해야 합니다');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('숫자를 포함해야 합니다');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('특수문자를 포함해야 합니다');
    }
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {[key: string]: string} = {};
    
    // Validate required fields
    if (!formData.first_name) newErrors.first_name = '이름을 입력해주세요';
    if (!formData.last_name) newErrors.last_name = '성을 입력해주세요';
    if (!formData.email) newErrors.email = '이메일을 입력해주세요';
    
    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }
    
    // Password validation for create mode or when password is provided
    if (mode === 'create' || formData.password) {
      if (!formData.password) {
        newErrors.password = '비밀번호를 입력해주세요';
      } else {
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
          newErrors.password = passwordErrors[0];
        }
      }
      
      if (!formData.password_confirm) {
        newErrors.password_confirm = '비밀번호 확인을 입력해주세요';
      } else if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = '비밀번호가 일치하지 않습니다';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const userData: UserCreate = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          password_confirm: formData.password_confirm,
          is_active: formData.is_active,
          is_admin: formData.is_admin
        };
        await userService.createUser(userData);
      } else if (user) {
        const userData: UserUpdate = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          is_active: formData.is_active,
          is_admin: formData.is_admin
        };
        
        // Only include password if provided
        if (formData.password) {
          userData.password = formData.password;
          userData.password_confirm = formData.password_confirm;
        }
        
        await userService.updateUser(user.id, userData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('User operation error:', error);
      alert(error instanceof Error ? error.message : '작업에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? '새 사용자 추가' : '사용자 수정'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="이름을 입력하세요"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                성 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="성을 입력하세요"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="이메일을 입력하세요"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              비밀번호 {mode === 'create' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={mode === 'create' ? '비밀번호를 입력하세요' : '새 비밀번호 (선택사항)'}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            {mode === 'create' && (
              <p className="mt-1 text-xs text-gray-500">
                비밀번호는 6자 이상, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              비밀번호 확인 {mode === 'create' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="비밀번호를 다시 입력하세요"
            />
            {errors.password_confirm && (
              <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">활성 상태</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_admin"
                checked={formData.is_admin}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">관리자 권한</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : (mode === 'create' ? '추가' : '수정')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
