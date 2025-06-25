import { IStorage } from '../storage';
import { SupabaseStorageService } from './supabase-storage.service';
import { EvolutionAPIService } from './evolution-api.service';

interface UploadParams {
  file: Buffer;
  filename: string;
  mimeType: string;
  conversationId: string;
  clinicId: number;
  userId: number;
  caption?: string;
  sendToWhatsApp?: boolean;
}

interface UploadResult {
  success: boolean;
  message: any;
  attachment: any;
  signedUrl: string;
  expiresAt: string;
  whatsapp: {
    sent: boolean;
    messageId?: string;
    error?: string;
  };
}

// Mapeamento MIME -> Evolution mediaType
const evolutionTypeMapping: Record<string, 'image' | 'video' | 'document' | 'audio'> = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/mov': 'video',
  'video/avi': 'video',
  'video/webm': 'video',
  'audio/mp3': 'audio',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/m4a': 'audio',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'text/plain': 'document'
};

export class ConversationUploadService {
  constructor(
    private storage: IStorage,
    private supabaseStorage: SupabaseStorageService,
    private evolutionAPI: EvolutionAPIService
  ) {}

  // Mapear MIME type para message_type
  private getMimeToMessageType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf' || 
        mimeType.includes('document') || 
        mimeType.includes('text/') ||
        mimeType.includes('application/')) return 'document';
    return 'document'; // fallback
  }

  async uploadFile(params: UploadParams): Promise<UploadResult> {
    const {
      file,
      filename,
      mimeType,
      conversationId,
      clinicId,
      userId,
      caption,
      sendToWhatsApp = true
    } = params;

    console.log(`📤 Starting upload: ${filename} (${mimeType}) for conversation ${conversationId}`);

    try {
      // 1. Validar arquivo
      this.validateFile(file, mimeType, filename);

      // 2. Sanitizar filename ANTES do upload
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // 3. Upload para Supabase Storage com nome sanitizado
      console.log('📁 Uploading to Supabase Storage...');
      console.log('🔧 Using sanitized filename for storage:', sanitizedFilename);
      const storageResult = await this.uploadToSupabase({
        file,
        filename: sanitizedFilename, // Usar nome sanitizado
        mimeType,
        conversationId,
        clinicId
      });
      
      // 4. Validar que conversation existe usando Supabase direto (compatível com IDs científicos)
      console.log('🔍 Validating conversation exists...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let conversation;
      const isScientificNotation = typeof conversationId === 'string' && conversationId.includes('e+');
      
      if (isScientificNotation) {
        // Para IDs científicos, usar busca robusta como no endpoint GET
        console.log('🔬 Scientific notation ID detected, using robust lookup');
        const { data: allConversations } = await supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('clinic_id', clinicId);
        
        const paramIdNum = parseFloat(conversationId);
        conversation = allConversations?.find(conv => {
          const convIdNum = parseFloat(conv.id.toString());
          return Math.abs(convIdNum - paramIdNum) < 1;
        });
      } else {
        // Para IDs normais, busca direta
        const { data } = await supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('id', conversationId)
          .eq('clinic_id', clinicId)
          .single();
        conversation = data;
      }

      if (!conversation) {
        console.error(`❌ Conversation not found: ${conversationId} for clinic ${clinicId}`);
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      console.log('✅ Conversation found:', { id: conversation.id, contact_id: conversation.contact_id });
      
      // 5. Criar mensagem no banco (usar ID numérico da conversa) - deixar PostgreSQL criar timestamp automaticamente
      console.log('💾 Creating message in database...');
      const messageContent = caption || `📎 ${filename}`; // Usar nome original na mensagem
      
      // Mapear MIME type para message_type automaticamente
      const messageType = this.getMimeToMessageType(mimeType);
      
      const message = await this.storage.createMessage({
        conversation_id: conversation.id.toString(), // Usar ID da conversa encontrada
        sender_type: 'professional',
        content: messageContent,
        message_type: messageType, // Tipo mapeado automaticamente
        ai_action: 'file_upload' // Indicar que foi upload de arquivo
      });

      // 6. Criar attachment (preservar nome original para o usuário)
      console.log('📎 Creating attachment record...');
      const attachment = await this.storage.createAttachment({
        message_id: message.id,
        clinic_id: clinicId,
        file_name: filename, // Nome original para exibição
        file_type: mimeType,
        file_size: file.length,
        file_url: storageResult.signed_url
      });

      let whatsappResult = { sent: false, messageId: undefined, error: undefined };

      // 5. Enviar via Evolution API (se solicitado)
      if (sendToWhatsApp) {
        console.log('📱 INICIANDO envio via Evolution API...');
        console.log('📱 sendToWhatsApp =', sendToWhatsApp);
        console.log('📱 Parâmetros para sendToEvolution:', {
          conversationId,
          clinicId,
          mediaType: this.getEvolutionMediaType(mimeType),
          mediaUrl: storageResult.signed_url,
          fileName: this.shouldIncludeFileName(mimeType) ? filename : undefined
        });
        try {
          console.log('📱 Chamando this.sendToEvolution...');
          whatsappResult = await this.sendToEvolution({
            conversationId,
            clinicId,
            mediaType: this.getEvolutionMediaType(mimeType),
            mediaUrl: storageResult.signed_url,
            fileName: this.shouldIncludeFileName(mimeType) ? filename : undefined,
            caption: mimeType.startsWith('audio/') ? undefined : caption
          });

          // Atualizar status da mensagem usando evolution_status
          if (whatsappResult.sent) {
            await this.storage.updateMessage(message.id, {
              status: 'sent'
            });
            console.log('✅ WhatsApp sent successfully');
          } else {
            await this.storage.updateMessage(message.id, {
              status: 'failed'
            });
            console.log('⚠️ WhatsApp failed, but file saved');
          }
        } catch (whatsappError) {
          console.error('❌ WhatsApp sending failed:', whatsappError);
          whatsappResult = {
            sent: false,
            error: whatsappError instanceof Error ? whatsappError.message : 'Unknown error'
          };
          
          // Manter como 'pending' para retry posterior
          await this.storage.updateMessage(message.id, {
            status: 'failed'
          });
        }
      }

      console.log('🎉 Upload complete!');
      return {
        success: true,
        message,
        attachment,
        signedUrl: storageResult.signed_url,
        expiresAt: storageResult.expires_at.toISOString(),
        whatsapp: whatsappResult
      };

    } catch (error) {
      console.error('💥 Upload failed:', error);
      throw error;
    }
  }

  private validateFile(file: Buffer, mimeType: string, filename: string): void {
    // Validar tamanho (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.length > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.formatFileSize(maxSize)}`);
    }

    // Validar tipo MIME
    if (!evolutionTypeMapping[mimeType]) {
      throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
    }

    // Validar nome do arquivo
    if (!filename || filename.length > 255) {
      throw new Error('Nome do arquivo inválido');
    }
  }

  private sanitizeFilename(filename: string): string {
    if (!filename) return 'unnamed-file';
    
    console.log('🔧 Sanitizing filename:', filename);
    console.log('🔧 Original bytes:', Buffer.from(filename).toString('hex'));
    
    // Mapeamento completo de caracteres especiais para Supabase Storage
    const characterMap: { [key: string]: string } = {
      // Acentos maiúsculos
      'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
      'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
      'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
      'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
      'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C', 'Ñ': 'N', 'Ý': 'Y',
      
      // Acentos minúsculos
      'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
      'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
      'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
      'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
      'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y',
      
      // Caracteres especiais comuns
      ' ': '_', '\t': '_', '\n': '_', '\r': '_',
      '!': '', '?': '', '@': '', '#': '', '$': '', '%': '', '&': '', '*': '',
      '(': '', ')': '', '[': '', ']': '', '{': '', '}': '', '|': '', '\\': '',
      '/': '_', ':': '', ';': '', '<': '', '>': '', '=': '', '+': '', '~': '',
      '`': '', "'": '', '"': '', ',': '', '^': ''
    };
    
    // Primeiro: aplicar mapeamento de caracteres
    let sanitized = filename
      .split('')
      .map(char => {
        // Se está no mapa, usar mapeamento
        if (characterMap.hasOwnProperty(char)) {
          return characterMap[char];
        }
        // Se é ASCII básico permitido (a-z, A-Z, 0-9, ., -, _), manter
        const code = char.charCodeAt(0);
        if ((code >= 48 && code <= 57) ||  // 0-9
            (code >= 65 && code <= 90) ||  // A-Z
            (code >= 97 && code <= 122) || // a-z
            code === 46 ||                 // .
            code === 45 ||                 // -
            code === 95) {                 // _
          return char;
        }
        // Qualquer outro caractere é removido
        return '';
      })
      .join('')
      // Limpar múltiplos underscores e pontos
      .replace(/_{2,}/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^[._-]+|[._-]+$/g, '')
      .toLowerCase();
    
    // Garantir que há pelo menos algum conteúdo
    if (!sanitized || sanitized.length === 0 || sanitized === '.' || sanitized === '_') {
      const timestamp = Date.now();
      const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
      sanitized = `arquivo_${timestamp}.${extension}`;
    }
    
    // Validação final: apenas caracteres permitidos pelo Supabase
    const validPattern = /^[a-zA-Z0-9._-]+$/;
    if (!validPattern.test(sanitized)) {
      console.warn('🚨 Filename ainda contém caracteres inválidos, usando fallback');
      const timestamp = Date.now();
      const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
      sanitized = `arquivo_${timestamp}.${extension}`;
    }
    
    console.log('✅ Sanitized filename:', sanitized);
    console.log('🔍 Validation check:', validPattern.test(sanitized));
    
    return sanitized;
  }

  private async uploadToSupabase(params: {
    file: Buffer;
    filename: string;
    mimeType: string;
    conversationId: string;
    clinicId: number;
  }) {
    console.log('📤 Iniciando upload para Supabase Storage...');
    console.log('📋 Parâmetros:', {
      filename: params.filename,
      mimeType: params.mimeType,
      fileSize: params.file.length,
      conversationId: params.conversationId,
      clinicId: params.clinicId
    });

    const timestamp = Date.now();
    const category = this.getCategoryFromMime(params.mimeType);
    const storagePath = `clinic-${params.clinicId}/conversation-${params.conversationId}/${category}/${timestamp}-${params.filename}`;

    console.log('🗂️ Caminho de armazenamento:', storagePath);

    // Upload direto usando Supabase sem service intermediário
    const supabase = this.supabaseStorage['supabase'];
    const bucketName = 'conversation-attachments';
    
    console.log('📤 Fazendo upload para bucket:', bucketName);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, params.file, {
        contentType: params.mimeType,
        upsert: true
      });

    if (error) {
      console.error('❌ Erro no upload direto:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    console.log('✅ Upload direto realizado com sucesso:', data.path);

    // Gerar URL assinada usando método direto também
    console.log('🔗 Gerando URL assinada...');
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 86400); // 24 horas

    if (signedError) {
      console.error('❌ Erro ao gerar URL assinada:', signedError);
      throw new Error(`Erro ao gerar URL assinada: ${signedError.message}`);
    }

    console.log('✅ URL assinada gerada com sucesso');
    
    return {
      storage_path: storagePath,
      signed_url: signedData.signedUrl,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  private async sendToEvolution(params: {
    conversationId: string;
    clinicId: number;
    mediaType: 'image' | 'video' | 'document' | 'audio';
    mediaUrl: string;
    fileName?: string;
    caption?: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    try {
      console.log('🔍 Starting Evolution API media send process...');
      
      // Usar EXATAMENTE a mesma lógica do envio de texto (conversations-simple-routes.ts linha 592-598)
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      console.log('🔍 UPLOAD: Querying WhatsApp instances for clinic:', params.clinicId);
      
      const { data: instanceArray, error: instanceError } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('clinic_id', params.clinicId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('🔍 UPLOAD: Raw query result:', instanceArray);
      console.log('🔍 UPLOAD: Query error:', instanceError);
      
      const activeInstance = instanceArray?.[0];
      
      console.log('🔍 UPLOAD: Selected instance:', activeInstance?.instance_name);

      if (instanceError) {
        console.error('❌ Error fetching WhatsApp instance:', instanceError);
        throw new Error('Erro ao buscar instância WhatsApp ativa');
      }

      if (!activeInstance) {
        console.error('❌ No active WhatsApp instance found for clinic:', params.clinicId);
        throw new Error('Nenhuma instância WhatsApp ativa encontrada para esta clínica');
      }

      console.log('✅ Active WhatsApp instance found (using text message logic):', {
        instance_name: activeInstance.instance_name,
        phone_number: activeInstance.phone_number,
        status: activeInstance.status
      });

      // Buscar informações de contato usando método existente
      const conversation = await this.storage.getConversationById(params.conversationId);

      console.log('🔍 Conversation lookup result:', {
        conversationId: params.conversationId,
        found: !!conversation,
        phone: conversation?.contact?.phone
      });

      if (!conversation?.contact?.phone) {
        console.error('❌ No contact phone found for conversation:', params.conversationId);
        throw new Error('Conversa não possui contato com telefone');
      }

      console.log('📤 Sending to Evolution API with clinic instance...', {
        phone: conversation.contact.phone,
        instance: activeInstance.instance_name,
        mediaType: params.mediaType,
        fileName: params.fileName
      });

      // Helper para MIME types
      const getMimeType = (mediaType: string): string => {
        const mimeTypes = {
          'image': 'image/png',
          'video': 'video/mp4', 
          'audio': 'audio/mpeg',
          'document': 'application/pdf'
        };
        return mimeTypes[mediaType as keyof typeof mimeTypes] || 'application/octet-stream';
      };

      const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY;
      
      console.log('🔧 Evolution API Configuration Check:');
      console.log('📍 URL:', evolutionUrl);
      console.log('🔑 API Key exists:', !!evolutionApiKey);
      console.log('🔑 API Key length:', evolutionApiKey?.length || 0);
      
      if (!evolutionApiKey) {
        console.error('❌ EVOLUTION_API_KEY not found in environment variables');
        throw new Error('Evolution API Key não configurada');
      }

      // Helper para MIME types - V2 API
      const getMimeTypeV2 = (mediaType: string): string => {
        const mimeTypes = {
          'image': 'image/png',
          'video': 'video/mp4', 
          'audio': 'audio/mpeg',
          'document': 'application/pdf'
        };
        return mimeTypes[mediaType as keyof typeof mimeTypes] || 'application/octet-stream';
      };

      // Payload V2 Evolution API - estrutura CORRETA com campos diretos
      const payload = {
        number: conversation.contact.phone,
        mediatype: params.mediaType,  // Campo direto no root
        mimetype: getMimeTypeV2(params.mediaType),
        media: params.mediaUrl,
        fileName: params.fileName || 'attachment',
        delay: 1000,
        ...(params.caption && params.mediaType !== 'audio' && { caption: params.caption })
      };
      
      console.log('📤 Evolution API V2 Payload (campos diretos):');
      console.log('📤 URL:', `${evolutionUrl}/message/sendMedia/${activeInstance.instance_name}`);
      console.log('📤 mediatype:', payload.mediatype);
      console.log('📤 mimetype:', payload.mimetype);
      console.log('📤 fileName:', payload.fileName);
      console.log('📤 number:', payload.number);

      // Usar formato exato do texto para mídia
      const response = await fetch(`${evolutionUrl}/message/sendMedia/${activeInstance.instance_name}`, {
        method: 'POST',
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Evolution API media success:', result);
        console.log('ℹ️ Mantendo status "pending" - assumindo sucesso');
        
        return {
          sent: true,
          messageId: result.key?.id
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Evolution API confirmou falha de mídia:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        return {
          sent: false,
          error: `Evolution API error: ${response.status} - ${errorText}`
        };
      }

    } catch (error) {
      console.error('❌ Evolution API media send failed:', error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getCategoryFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('doc') || mimeType.includes('text')) return 'documents';
    return 'others';
  }

  private getEvolutionMediaType(mimeType: string): 'image' | 'video' | 'document' | 'audio' {
    return evolutionTypeMapping[mimeType] || 'document';
  }

  private getMessageTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private shouldIncludeFileName(mimeType: string): boolean {
    // Evolution API só precisa do fileName para documentos
    return this.getEvolutionMediaType(mimeType) === 'document';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}