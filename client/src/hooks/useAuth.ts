import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}

export function useUserClinics() {
  const { data: clinics, isLoading } = useQuery({
    queryKey: ["/api/user/clinics"],
    retry: false,
  });

  return {
    clinics: clinics || [],
    isLoading
  };
}