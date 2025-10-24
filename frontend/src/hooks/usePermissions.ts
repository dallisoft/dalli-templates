import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const canEditUser = useCallback((targetUserId: number) => {
    if (!user) return false;
    // Admin can edit any user, regular users can only edit themselves
    return user.is_admin || user.id === targetUserId;
  }, [user]);

  const canDeleteUser = useCallback(() => {
    if (!user) return false;
    // Only admin can delete users
    return user.is_admin;
  }, [user]);

  const canCreateUser = useCallback(() => {
    if (!user) return false;
    // Only admin can create users
    return user.is_admin;
  }, [user]);

  const canEditPost = useCallback((postUserId: number) => {
    if (!user) return false;
    // Admin can edit any post, regular users can only edit their own posts
    return user.is_admin || user.id === postUserId;
  }, [user]);

  const canDeletePost = useCallback((postUserId: number) => {
    if (!user) return false;
    // Admin can delete any post, regular users can only delete their own posts
    return user.is_admin || user.id === postUserId;
  }, [user]);

  const canCreatePost = useCallback(() => {
    if (!user) return false;
    // All authenticated users can create posts
    return true;
  }, [user]);

  const canViewUserProfile = useCallback((targetUserId: number) => {
    if (!user) return false;
    // Admin can view any profile, regular users can only view their own profile
    return user.is_admin || user.id === targetUserId;
  }, [user]);

  const canViewUserList = useCallback(() => {
    if (!user) return false;
    // All authenticated users can view user list
    return true;
  }, [user]);

  const canViewPostList = useCallback(() => {
    if (!user) return false;
    // All authenticated users can view post list
    return true;
  }, [user]);

  return {
    user,
    isAdmin: user?.is_admin || false,
    isAuthenticated: !!user,
    canEditUser,
    canDeleteUser,
    canCreateUser,
    canEditPost,
    canDeletePost,
    canCreatePost,
    canViewUserProfile,
    canViewUserList,
    canViewPostList,
  };
};
