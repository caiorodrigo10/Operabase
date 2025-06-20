import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware para validar se o usuário é um profissional
 * Restringe acesso a integrações de calendário apenas para usuários com is_professional = true
 */
export const requireProfessional = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    // Buscar dados do usuário na clínica
    // Assumindo clinic_id = 1 por enquanto (pode ser parametrizado)
    const clinicId = 1;
    
    console.log('🔍 Verificando se usuário é profissional:', { userId, userEmail, clinicId });

    const clinicUsers = await storage.getClinicUsers(clinicId);
    const clinicUser = clinicUsers.find(cu => 
      cu.user?.email === userEmail || cu.user_id === userId
    );

    console.log('👤 Dados do usuário na clínica:', clinicUser);

    if (!clinicUser) {
      return res.status(403).json({ 
        error: 'Usuário não encontrado na clínica',
        code: 'USER_NOT_IN_CLINIC'
      });
    }

    if (!clinicUser.is_professional) {
      console.log('❌ Usuário não é profissional - acesso negado');
      return res.status(403).json({ 
        error: 'Apenas profissionais podem integrar calendários externos',
        code: 'PROFESSIONAL_REQUIRED',
        message: 'Esta funcionalidade está disponível apenas para usuários marcados como profissionais.'
      });
    }

    console.log('✅ Usuário é profissional - acesso autorizado');
    next();

  } catch (error) {
    console.error('❌ Erro na validação de profissional:', error);
    res.status(500).json({ 
      error: 'Erro interno na validação de permissões',
      code: 'VALIDATION_ERROR'
    });
  }
};