import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { CardSkeleton } from "../components/ui/loading";
import { userProfileService } from '../services/userProfileService';
import { UserWithProfile } from '../types/userProfile';

export default function UserProfiles() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user_id');
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserProfile(parseInt(userId));
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadUserProfile = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userProfileService.getUserWithProfile(userId);
      setUser(userData);
    } catch (err) {
      setError('사용자 프로필을 불러오는데 실패했습니다.');
      console.error('Error loading user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser: UserWithProfile) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="사용자 프로필 | Dalli Template"
          description="사용자 프로필 페이지"
        />
        <PageBreadcrumb pageTitle="사용자 프로필" />
        <div className="space-y-6">
          <CardSkeleton lines={4} showAvatar={true} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="사용자 프로필 | Dalli Template"
          description="사용자 프로필 페이지"
        />
        <PageBreadcrumb pageTitle="사용자 프로필" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="text-red-800 dark:text-red-200">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!userId) {
    return (
      <>
        <PageMeta
          title="사용자 프로필 | Dalli Template"
          description="사용자 프로필 페이지"
        />
        <PageBreadcrumb pageTitle="사용자 프로필" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="text-yellow-800 dark:text-yellow-200">사용자 ID가 필요합니다.</div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageMeta
          title="사용자 프로필 | Dalli Template"
          description="사용자 프로필 페이지"
        />
        <PageBreadcrumb pageTitle="사용자 프로필" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 dark:bg-gray-900/20 dark:border-gray-800">
            <div className="text-gray-800 dark:text-gray-200">사용자를 찾을 수 없습니다.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${user.first_name} ${user.last_name} 프로필 | Dalli Template`}
        description={`${user.first_name} ${user.last_name}의 프로필 페이지`}
      />
      <PageBreadcrumb pageTitle={`${user.first_name} ${user.last_name} 프로필`} />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          {user.first_name} {user.last_name} 프로필
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={user} onUserUpdate={handleUserUpdate} />
          <UserInfoCard user={user} onUserUpdate={handleUserUpdate} />
          <UserAddressCard user={user} onUserUpdate={handleUserUpdate} />
        </div>
      </div>
    </>
  );
}
