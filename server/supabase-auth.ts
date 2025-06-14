import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from './supabase';
import type { IStorage } from './storage';

export interface SupabaseUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  supabaseUser?: SupabaseUser;
}

// Middleware para autenticação Supabase
export const authenticateSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente Supabase com o token do usuário
    const supabaseWithAuth = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    
    // Verificar token com Supabase 
    const { data: { user }, error } = await supabaseWithAuth.auth.getUser();
    
    if (error || !user) {
      console.error('Erro na validação do token:', error);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Buscar dados do perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Usar dados do usuário mesmo se o perfil não for encontrado
    const userData = {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || user.email,
      role: profile?.role || user.user_metadata?.role || 'user'
    };

    // Configurar contexto do usuário para RLS
    const userIdInt = await getUserIdMapping(user.id);
    req.app.locals.currentUserId = userIdInt;

    // Anexar dados do usuário à requisição
    (req as AuthenticatedRequest).supabaseUser = userData;

    next();
  } catch (error) {
    console.error('Erro na autenticação Supabase:', error);
    return res.status(500).json({ error: 'Erro interno de autenticação' });
  }
};

// Função para mapear UUID do Supabase para ID integer durante migração
async function getUserIdMapping(supabaseUuid: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_id_mapping')
      .select('legacy_id')
      .eq('supabase_uuid', supabaseUuid)
      .single();
    
    if (error || !data) {
      console.error('Erro ao buscar mapeamento de usuário:', error);
      return 2; // Fallback para admin durante migração
    }
    
    return data.legacy_id;
  } catch (error) {
    console.error('Erro no mapeamento de usuário:', error);
    return 2; // Fallback para admin durante migração
  }
}

// Middleware para verificar acesso à clínica
export const hasClinicAccess = (paramName: string = 'clinicId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicId = parseInt(req.params[paramName]);
      const userId = req.app.locals.currentUserId;

      if (!userId || !clinicId) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }

      // Verificar acesso usando RLS políticas
      const { data, error } = await supabase
        .from('clinic_users')
        .select('*')
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return res.status(403).json({ error: 'Acesso negado à clínica' });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de acesso à clínica:', error);
      return res.status(500).json({ error: 'Erro interno de verificação' });
    }
  };
};

// Rotas de autenticação Supabase
export function setupSupabaseAuthRoutes(app: any, storage: IStorage) {
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Atualizar último login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name,
          role: profile?.role
        },
        session: data.session
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        await supabase.auth.admin.signOut(token);
      }
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Verificar usuário atual
  app.get('/api/auth/user', authenticateSupabase, (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).supabaseUser;
    res.json({ user });
  });

  // Refresh token
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token é obrigatório' });
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        return res.status(401).json({ error: 'Refresh token inválido' });
      }

      res.json({ session: data.session });
    } catch (error) {
      console.error('Erro no refresh:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}

// Função para migrar usuário atual para Supabase Auth
export async function migrateCurrentUser(): Promise<{success: boolean, error?: string}> {
  try {
    // Buscar usuário atual na tabela users
    const { data: currentUser } = await supabase
      .from('users_backup')
      .select('*')
      .eq('email', 'admin@teste.com')
      .single();

    if (!currentUser) {
      return { success: false, error: 'Usuário atual não encontrado' };
    }

    // Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: currentUser.email,
      password: 'NovaSeinha123!', // Nova senha segura
      email_confirm: true,
      user_metadata: {
        name: currentUser.name,
        role: currentUser.role
      }
    });

    if (authError) {
      return { success: false, error: `Erro ao criar usuário: ${authError.message}` };
    }

    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        name: currentUser.name,
        role: currentUser.role,
        is_active: currentUser.is_active
      });

    if (profileError) {
      return { success: false, error: `Erro ao criar perfil: ${profileError.message}` };
    }

    // Atualizar clinic_users com novo UUID (manteremos temporariamente)
    // Isso será atualizado quando migrarmos completamente para UUID

    return { 
      success: true, 
      error: undefined 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Erro na migração: ${error}` 
    };
  }
}