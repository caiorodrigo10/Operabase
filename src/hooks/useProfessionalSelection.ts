import { useState, useEffect, useMemo } from 'react';

interface ProfessionalUser {
  id: number;
  user_id: number;
  clinic_id: number;
  name: string;
  email: string;
  is_professional: boolean;
  is_active: boolean;
  role: string;
}

/**
 * Obtém o email do usuário atual do localStorage
 */
const getCurrentUserEmail = (): string | null => {
  try {
    const authData = JSON.parse(localStorage.getItem('sb-lkwrevhxugaxfpwiktdy-auth-token') || '{}');
    return authData?.user?.email || null;
  } catch {
    return null;
  }
};

/**
 * Obtém IDs de usuários válidos para uma clínica (incluindo consultas órfãs)
 */
const getValidUserIds = (clinicId: number, clinicUsers: ProfessionalUser[], appointments: any[] = []): number[] => {
  // Get user IDs from clinic_users table
  const clinicUserIds = clinicUsers
    .filter(user => user.clinic_id === clinicId && user.is_active)
    .map(user => user.user_id);
  
  // Get user IDs from appointments (to include "orphaned" appointments)
  const appointmentUserIds = appointments
    .filter(appointment => appointment.clinic_id === clinicId && appointment.user_id)
    .map(appointment => appointment.user_id);
  
  // Combine both sets and remove duplicates
  const allValidUserIds = [...new Set([...clinicUserIds, ...appointmentUserIds])];
  
  console.log('🔧 Multi-tenant: Valid user IDs calculation:', {
    clinicId,
    clinicUserIds,
    appointmentUserIds,
    allValidUserIds
  });
  
  return allValidUserIds;
};

/**
 * Determina a seleção padrão de profissional baseada no contexto
 * IMPORTANTE: Retorna USER_ID, não clinic_user_id
 */
const getDefaultProfessionalSelection = (
  clinicUsers: ProfessionalUser[], 
  currentUserEmail: string,
  clinicId: number
): number | null => {
  if (!clinicUsers.length) return null;
  
  // 1. Prioridade: Usuário atual se for profissional (apenas se temos email)
  if (currentUserEmail) {
    const currentUser = clinicUsers.find(u => 
      u.email === currentUserEmail && u.is_professional
    );
    if (currentUser) {
      console.log('🎯 Multi-tenant: Selecting current user as professional:', currentUser.user_id);
      return currentUser.user_id; // ← CORRIGIDO: retornar user_id
    }
  }
  
  // 2. Fallback: Primeiro profissional ativo da clínica
  const firstProfessional = clinicUsers.find(u => 
    u.clinic_id === clinicId && u.is_professional && u.is_active
  );
  if (firstProfessional) {
    console.log('🎯 Multi-tenant: Selecting first professional:', firstProfessional.user_id);
    return firstProfessional.user_id; // ← CORRIGIDO: retornar user_id
  }
  
  // 3. Fallback final: null (será tratado no useEffect)
  console.log('🎯 Multi-tenant: No professionals found in getDefaultProfessionalSelection');
  return null;
};

/**
 * Salva a seleção do profissional no cache local por clínica
 */
const saveProfessionalSelection = (professionalId: number, clinicId: number): void => {
  try {
    localStorage.setItem(
      `selected_professional_${clinicId}`, 
      professionalId.toString()
    );
    console.log('💾 Multi-tenant: Professional selection cached:', { professionalId, clinicId });
  } catch (error) {
    console.warn('Failed to save professional selection to cache:', error);
  }
};

/**
 * Recupera a seleção do profissional do cache local por clínica
 */
const getCachedProfessionalSelection = (clinicId: number): number | null => {
  try {
    const cached = localStorage.getItem(`selected_professional_${clinicId}`);
    const result = cached ? parseInt(cached, 10) : null;
    console.log('📖 Multi-tenant: Retrieved cached professional selection:', { clinicId, result });
    return result;
  } catch {
    return null;
  }
};

/**
 * Inicialização inteligente do profissional selecionado
 */
const getInitialProfessionalSelection = (clinicId: number = 1): number | null => {
  // 1. Verificar cache primeiro
  const cachedSelection = getCachedProfessionalSelection(clinicId);
  if (cachedSelection) {
    console.log('🔄 Multi-tenant: Using cached professional selection:', cachedSelection);
    return cachedSelection;
  }
  
  // 2. Será resolvido quando clinicUsers carregar
  console.log('🔄 Multi-tenant: No cache found, will auto-select when data loads');
  return null;
};

export function useProfessionalSelection(
  clinicUsers: ProfessionalUser[],
  appointments: any[] = [],
  clinicId: number = 1
) {
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(() => {
    return getInitialProfessionalSelection(clinicId);
  });

  // Memoized current user email for performance
  const currentUserEmail = useMemo(() => getCurrentUserEmail(), []);

  // Memoized clinic user lookup by email
  const clinicUserByEmail = useMemo(() => {
    const map = new Map<string, ProfessionalUser>();
    clinicUsers.forEach((user: ProfessionalUser) => {
      if (user.email) {
        map.set(user.email, user);
      }
    });
    return map;
  }, [clinicUsers]);

  // Memoized professional ID lookup for performance
  const professionalNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    clinicUsers.forEach((user: ProfessionalUser) => {
      if (user.name) {
        map.set(user.name, user.id);
      }
    });
    return map;
  }, [clinicUsers]);

  // Memoized valid user IDs
  const validUserIds = useMemo(() => {
    return getValidUserIds(clinicId, clinicUsers, appointments);
  }, [clinicId, clinicUsers, appointments]);

  // Auto-select professional when data loads
  useEffect(() => {
    if (clinicUsers.length > 0 && selectedProfessional === null) {
      // Tentar seleção inteligente primeiro
      let defaultSelection = getDefaultProfessionalSelection(
        clinicUsers, 
        currentUserEmail || '', 
        clinicId
      );
      
      // Se não encontrou por email, selecionar primeiro profissional disponível
      if (!defaultSelection) {
        const firstProfessional = clinicUsers.find((user: ProfessionalUser) => 
          user.is_professional && user.is_active
        );
        if (firstProfessional) {
          defaultSelection = firstProfessional.user_id;
          console.log('🎯 Multi-tenant: Auto-selecting first available professional:', defaultSelection);
        }
      }
      
      if (defaultSelection) {
        console.log('🎯 Multi-tenant: Auto-selecting professional:', defaultSelection);
        setSelectedProfessional(defaultSelection);
        saveProfessionalSelection(defaultSelection, clinicId);
      }
    }
  }, [clinicUsers.length, selectedProfessional, currentUserEmail, clinicId]);

  const selectProfessional = (professionalId: number) => {
    setSelectedProfessional(professionalId);
    saveProfessionalSelection(professionalId, clinicId);
    console.log('👤 Professional selected:', professionalId);
  };

  // Get filtered professionals (only active professionals)
  const availableProfessionals = useMemo(() => {
    return clinicUsers.filter(user => 
      user.is_professional === true && 
      user.is_active === true &&
      user.clinic_id === clinicId
    );
  }, [clinicUsers, clinicId]);

  // Get current professional name
  const selectedProfessionalName = useMemo(() => {
    if (!selectedProfessional) return null;
    const professional = clinicUsers.find(user => user.user_id === selectedProfessional);
    return professional?.name || null;
  }, [selectedProfessional, clinicUsers]);

  return {
    selectedProfessional,
    setSelectedProfessional,
    selectProfessional,
    availableProfessionals,
    selectedProfessionalName,
    currentUserEmail,
    clinicUserByEmail,
    professionalNameToIdMap,
    validUserIds,
    
    // Utility functions
    getValidUserIds: (appointments: any[]) => getValidUserIds(clinicId, clinicUsers, appointments),
    saveProfessionalSelection: (professionalId: number) => saveProfessionalSelection(professionalId, clinicId),
  };
} 