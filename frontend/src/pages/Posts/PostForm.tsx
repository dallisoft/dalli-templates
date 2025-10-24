import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { FormSkeleton } from "../../components/ui/loading";
import { PostFormData } from "../../types/post";
import postService from "../../services/postService";
import { userService } from "../../services/userService";
import { usePermissions } from "../../hooks/usePermissions";

export default function PostForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { user, canEditPost, canCreatePost } = usePermissions();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<PostFormData>({
    category_id: 0,
    user_id: user?.id || 0,
    title: "",
    content: "",
    tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);

  // Reset form data when switching between edit and create modes
  useEffect(() => {
    // Reset form data when switching modes
    setFormData({
      category_id: 0,
      user_id: user?.id || 0,
      title: "",
      content: "",
      tags: []
    });
    setTagInput("");
    setErrors({});
  }, [isEdit, user?.id]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await postService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Set empty array on error to prevent form issues
        setCategories([]);
      }
    };

    const loadUsers = async () => {
      try {
        const usersData = await userService.getUsers();
        setUsers(usersData.users);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Set empty array on error to prevent form issues
        setUsers([]);
      }
    };

    const initializeForm = async () => {
      // Check permissions
      if (isEdit && id) {
        // For edit mode, we need to check if user can edit this post
        await loadPost(parseInt(id));
      } else if (!isEdit) {
        // For create mode, check if user can create posts
        if (!canCreatePost()) {
          navigate('/posts');
          return;
        }
      }
      
      // Load categories and users in parallel
      await Promise.all([
        loadCategories(),
        loadUsers()
      ]);
    };

    initializeForm();
  }, [id, isEdit]);

  const loadPost = async (postId: number) => {
    try {
      setLoading(true);
      const post = await postService.getPostById(postId);
      if (post) {
        // Check if user can edit this post
        if (!canEditPost((post as any).user_id)) {
          navigate('/posts');
          return;
        }
        
        setFormData({
          category_id: (post as any).category_id,
          user_id: (post as any).user_id || 0,
          title: post.title,
          content: post.content,
          tags: post.tags || []
        });
      } else {
        // Post not found
        navigate('/posts');
        return;
      }
    } catch (error) {
      console.error('Failed to load post:', error);
      // On error, redirect to posts list
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PostFormData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const categoryOptions = categories.map(category => ({
    value: category.id.toString(),
    label: category.name
  }));

  const userOptions = users.map(user => ({
    value: user.id.toString(),
    label: `${user.first_name} ${user.last_name} (${user.email})`
  }));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    
    if (!formData.category_id) {
      newErrors.category_id = "카테고리를 선택해주세요.";
    }
    
    if (!formData.user_id) {
      newErrors.user_id = "작성자를 선택해주세요.";
    }
    
    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "내용을 입력해주세요.";
    }
    
    // 태그는 선택 사항이므로 유효성 검사에서 제거
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEdit && id) {
        // Update existing post
        const updatedPost = await postService.updatePost(parseInt(id), formData);
        if (updatedPost) {
          navigate("/posts");
        }
      } else {
        // Create new post
        const newPost = await postService.createPost(formData);
        if (newPost) {
          navigate("/posts");
        }
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('포스트 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/posts");
  };


  if (loading) {
    return (
      <>
        <PageMeta
          title={isEdit ? "Edit Post | Dalli Template" : "New Post | Dalli Template"}
          description={isEdit ? "Edit Post page" : "New Post page"}
        />
        <PageBreadcrumb 
          pageTitle={isEdit ? "Edit Post" : "New Post"}
        />
        
        <div className="space-y-6">
          <ComponentCard title={isEdit ? "Edit Post" : "New Post"}>
            <FormSkeleton fields={6} />
          </ComponentCard>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={isEdit ? "Edit Post | Dalli Template" : "New Post | Dalli Template"}
        description={isEdit ? "Edit Post page" : "New Post page"}
      />
      <PageBreadcrumb 
        pageTitle={isEdit ? "Edit Post" : "New Post"}
      />
      
      <div className="space-y-6">
        <ComponentCard title={isEdit ? "Edit Post" : "New Post"}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                options={categoryOptions}
                placeholder="카테고리를 선택하세요"
                defaultValue={formData.category_id.toString()}
                onChange={(value) => handleInputChange('category_id', parseInt(value))}
                className="dark:bg-dark-900"
              />
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.category_id}
                </p>
              )}
            </div>

            {/* User Selection */}
            <div>
              <Label htmlFor="user">작성자 *</Label>
              <Select
                options={userOptions}
                placeholder="작성자를 선택하세요"
                defaultValue={formData.user_id.toString()}
                onChange={(value) => handleInputChange('user_id', parseInt(value))}
                className="dark:bg-dark-900"
              />
              {errors.user_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.user_id}
                </p>
              )}
            </div>

            {/* Title Input */}
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                type="text"
                placeholder="포스트 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Content TextArea */}
            <div>
              <Label htmlFor="content">내용 *</Label>
              <TextArea
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                rows={12}
                placeholder="마크다운 형식으로 내용을 입력하세요..."
                className={errors.content ? "border-red-500" : ""}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.content}
                </p>
              )}
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>마크다운 문법을 사용할 수 있습니다:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code># 제목</code> - 헤딩</li>
                  <li><code>**굵은 글씨**</code> - 굵은 글씨</li>
                  <li><code>*기울임*</code> - 기울임</li>
                  <li><code>- 목록</code> - 목록</li>
                  <li><code>`코드`</code> - 인라인 코드</li>
                </ul>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <Label htmlFor="tags">태그</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="태그를 입력하고 Enter를 누르세요"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={errors.tags ? "border-red-500" : ""}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAddTag}
                  >
                    추가
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {errors.tags && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.tags}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                취소
              </Button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "처리 중..." : (isEdit ? "수정" : "작성")}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
