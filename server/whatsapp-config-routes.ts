import { Request, Response } from 'express';
import { isAuthenticated } from './auth';

export function setupWhatsAppConfigRoutes(app: any) {
  
  // Get current WhatsApp configuration
  app.get('/api/whatsapp/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const clinicId = 1; // TODO: Get from user session

      const { data: config, error } = await supabase
        .from('evolution_api_settings')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching WhatsApp config:', error);
        return res.status(500).json({ error: 'Erro ao buscar configuração' });
      }

      res.json({ config: config || null });
    } catch (error) {
      console.error('Error in WhatsApp config route:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Save WhatsApp configuration
  app.post('/api/whatsapp/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { api_url, api_key, instance_name } = req.body;

      if (!api_url || !api_key) {
        return res.status(400).json({ error: 'URL da API e API Key são obrigatórios' });
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const clinicId = 1; // TODO: Get from user session

      // First, disable any existing active configs
      await supabase
        .from('evolution_api_settings')
        .update({ is_active: false })
        .eq('clinic_id', clinicId);

      // Insert new configuration
      const { data, error } = await supabase
        .from('evolution_api_settings')
        .insert({
          clinic_id: clinicId,
          api_url: api_url.trim(),
          api_key: api_key.trim(),
          instance_name: instance_name?.trim() || 'default',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving WhatsApp config:', error);
        return res.status(500).json({ error: 'Erro ao salvar configuração' });
      }

      console.log('✅ WhatsApp configuration saved successfully for clinic:', clinicId);
      res.json({ success: true, config: data });
    } catch (error) {
      console.error('Error in WhatsApp config save route:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Test WhatsApp API connection
  app.post('/api/whatsapp/test', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { api_url, api_key, instance_name } = req.body;

      if (!api_url || !api_key) {
        return res.status(400).json({ 
          success: false, 
          message: 'URL da API e API Key são obrigatórios' 
        });
      }

      // Test connection by trying to get instance info
      const testUrl = `${api_url.replace(/\/$/, '')}/instance/connect/${instance_name || 'default'}`;
      
      console.log('🧪 Testing WhatsApp API connection:', testUrl);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': api_key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ WhatsApp API test successful:', data);
        res.json({ 
          success: true, 
          message: 'Conexão estabelecida com sucesso!' 
        });
      } else {
        const errorText = await response.text();
        console.error('❌ WhatsApp API test failed:', response.status, errorText);
        res.json({ 
          success: false, 
          message: `Erro ${response.status}: ${errorText}` 
        });
      }
    } catch (error) {
      console.error('❌ WhatsApp API test error:', error);
      res.json({ 
        success: false, 
        message: 'Erro de conexão: ' + error.message 
      });
    }
  });

  // Get current configuration for message sending
  app.get('/api/whatsapp/config/current', async (req: Request, res: Response) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const clinicId = 1; // TODO: Get from context

      const { data: config, error } = await supabase
        .from('evolution_api_settings')
        .select('api_url, api_key, instance_name')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (error || !config) {
        return res.status(404).json({ error: 'WhatsApp não configurado' });
      }

      res.json(config);
    } catch (error) {
      console.error('Error getting current WhatsApp config:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}