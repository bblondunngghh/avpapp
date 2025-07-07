import { useQuery } from '@tanstack/react-query';

interface AdminUser {
  email: string;
  name: string;
}

export function useAdminAuth() {
  const { data: user, isLoading, error } = useQuery<AdminUser>({
    queryKey: ['/api/admin/verify'],
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}