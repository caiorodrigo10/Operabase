import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { LiviaConfiguration, InsertLiviaConfiguration, UpdateLiviaConfiguration } from '../../../shared/schema';

// Get Livia configuration for current clinic
export function useLiviaConfiguration() {
  return useQuery({
    queryKey: ['/api/livia/config'],
    queryFn: () => apiRequest('/api/livia/config'),
  });
}

// Create new Livia configuration
export function useCreateLiviaConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<InsertLiviaConfiguration, 'clinic_id'>) => 
      apiRequest('/api/livia/config', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/livia/config'] });
    },
  });
}

// Update Livia configuration
export function useUpdateLiviaConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateLiviaConfiguration) => 
      apiRequest('/api/livia/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/livia/config'] });
    },
  });
}

// Delete Livia configuration
export function useDeleteLiviaConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => 
      apiRequest('/api/livia/config', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/livia/config'] });
    },
  });
}

// Get Livia configuration for N8N integration (enhanced data)
export function useLiviaConfigurationForN8N() {
  return useQuery({
    queryKey: ['/api/livia/config/n8n'],
    queryFn: () => apiRequest('/api/livia/config/n8n'),
  });
}

// Get WhatsApp numbers for current clinic
export function useWhatsAppNumbers() {
  return useQuery({
    queryKey: ['/api/whatsapp/numbers'],
    queryFn: () => apiRequest('/api/whatsapp/numbers'),
  });
}

// Get professionals for current clinic 
export function useProfessionals() {
  return useQuery({
    queryKey: ['/api/clinics/users'],
    queryFn: () => apiRequest('/api/clinics/users'),
  });
}

// Get knowledge bases for current clinic
export function useKnowledgeBases() {
  return useQuery({
    queryKey: ['/api/rag/knowledge-bases'],
    queryFn: () => apiRequest('/api/rag/knowledge-bases'),
  });
}