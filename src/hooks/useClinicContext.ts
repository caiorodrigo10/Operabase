import { useMemo } from 'react';

export interface ClinicUser {
  id: number;
  clinic_id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  is_professional: boolean;
  is_active: boolean;
}

export interface ClinicContext {
  clinicId: number;
  userId: number;
  userEmail: string;
  isAdmin: boolean;
  isProfessional: boolean;
}

/**
 * Hook para gerenciar contexto multi-tenant da clínica
 * Temporariamente usando fallback até integração com auth
 */
export const useClinicContext = (): ClinicContext | null => {
  return useMemo(() => {
    // TODO: Integrar com sistema de auth quando disponível
    return {
      clinicId: 1, // Fallback para clínica 1
      userId: 4, // Fallback para usuário padrão
      userEmail: getCurrentUserEmail() || '',
      isAdmin: false,
      isProfessional: true
    };
  }, []);
};

/**
 * Obtém o email do usuário atual do localStorage
 */
export const getCurrentUserEmail = (): string | null => {
  try {
    const authData = JSON.parse(localStorage.getItem('sb-lkwrevhxugaxfpwiktdy-auth-token') || '{}');
    return authData?.user?.email || null;
  } catch {
    return null;
  }
};

/**
 * Determina a seleção padrão de profissional baseada no contexto
 */
export const getDefaultProfessionalSelection = (
  clinicUsers: ClinicUser[], 
  currentUserEmail: string,
  clinicId: number
): number | null => {
  if (!clinicUsers.length || !currentUserEmail) return null;
  
  // 1. Prioridade: Usuário atual se for profissional
  const currentUser = clinicUsers.find(u => 
    u.email === currentUserEmail && u.is_professional
  );
  if (currentUser) {
    return currentUser.id;
  }
  
  // 2. Fallback: Primeiro profissional ativo da clínica
  const firstProfessional = clinicUsers.find(u => 
    u.clinic_id === clinicId && u.is_professional && u.is_active
  );
  if (firstProfessional) {
    return firstProfessional.id;
  }
  
  // 3. Fallback final: null (mostrar todos)
  return null;
};

/**
 * Salva a seleção do profissional no cache local
 */
export const saveProfessionalSelection = (professionalId: number, clinicId: number): void => {
  try {
    localStorage.setItem(
      `selected_professional_${clinicId}`, 
      professionalId.toString()
    );
  } catch (error) {
    console.warn('Failed to save professional selection to cache:', error);
  }
};

/**
 * Recupera a seleção do profissional do cache local
 */
export const getCachedProfessionalSelection = (clinicId: number): number | null => {
  try {
    const cached = localStorage.getItem(`selected_professional_${clinicId}`);
    return cached ? parseInt(cached, 10) : null;
  } catch {
    return null;
  }
};

/**
 * Obtém IDs de usuários válidos para uma clínica
 */
export const getValidUserIds = (clinicId: number, clinicUsers: ClinicUser[]): number[] => {
  return clinicUsers
    .filter(user => user.clinic_id === clinicId && user.is_active)
    .map(user => user.user_id);
};

/**
 * Inicialização inteligente do profissional selecionado
 */
export const getInitialProfessionalSelection = (clinicId?: number): number | null => {
  if (!clinicId) return null;
  
  // 1. Verificar cache primeiro
  const cachedSelection = getCachedProfessionalSelection(clinicId);
  if (cachedSelection) {
    return cachedSelection;
  }
  
  // 2. Será resolvido quando clinicUsers carregar
  return null;
}; 