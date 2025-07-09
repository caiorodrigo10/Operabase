// Carregar variáveis de ambiente
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

interface UploadParams {
  file: Buffer;
  filename: string;
  mimeType: string;
  conversationId: string;
  clinicId: number;
  userId: number;
  caption?: string;
  sendToWhatsApp?: boolean;
  messageType?: string;
}

interface N8NUploadParams {
  file: Buffer;
  filename: string;
  mimeType: string;
  conversationId: string;
  clinicId: number;
  caption?: string;
  whatsappMessageId?: string;
  whatsappMediaId?: string;
  whatsappMediaUrl?: string;
  timestamp?: string;
  senderType?: string; // Para identificar origem (patient/ai)
}

interface UploadResult {
  success: boolean;
  message: any;
  attachment: any;
  signedUrl: string;
  expiresAt: string;
  whatsapp: {
    sent: boolean;
    messageId: string | undefined;
    error: string | undefined;
  };
}

interface EvolutionResponse {
  key?: {
    id: string;
  };
  status?: string;
  message?: any;
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
  'audio/mp4': 'audio',
  'audio/webm': 'audio',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'text/plain': 'document',
  'application/json': 'document',
  'application/octet-stream': 'document'
};

export class ConversationUploadService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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
      sendToWhatsApp = true,
      messageType
    } = params;

    console.log(`📤 Starting upload: ${filename} (${mimeType}) for conversation ${conversationId}`);

    try {
      // 1. Validar arquivo
      this.validateFile(file, mimeType, filename);

      // 2. Sanitizar filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // 3. Upload para Supabase Storage
      console.log('📁 Uploading to Supabase Storage...');
      const storageResult = await this.uploadToSupabase({
        file,
        filename: sanitizedFilename,
        mimeType,
        conversationId,
        clinicId
      });
      
      // 4. Validar que conversation existe
      console.log('🔍 Validating conversation exists...');
      const { data: conversation } = await this.supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('id', conversationId)
          .eq('clinic_id', clinicId)
          .single();

      if (!conversation) {
        console.error(`❌ Conversation not found: ${conversationId} for clinic ${clinicId}`);
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      console.log('✅ Conversation found:', { id: conversation.id, contact_id: conversation.contact_id });
      
      // 5. Criar mensagem no banco
      console.log('💾 Creating message in database...');
      const finalMessageType = messageType || this.getMimeToMessageType(mimeType);
      
      // Função para obter timestamp no horário de Brasília (seguindo padrão das mensagens de texto)
      const getBrasiliaTimestamp = () => {
        const now = new Date();
        // Aplicar offset do fuso horário de São Paulo (GMT-3)
        const saoPauloOffset = -3 * 60; // GMT-3 em minutos
        const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60000);
        return saoPauloTime.toISOString();
      };
      
      const { data: message, error: messageError } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: caption || filename,
          message_type: finalMessageType,
        sender_type: 'professional',
          evolution_status: 'pending',
          timestamp: getBrasiliaTimestamp()
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ Error creating message:', messageError);
        throw new Error(`Error creating message: ${messageError.message}`);
      }

      console.log('✅ Message created:', message.id);

      // 6. Criar attachment
      console.log('📎 Creating attachment...');
      const { data: attachment, error: attachmentError } = await this.supabase
        .from('message_attachments')
        .insert({
        message_id: message.id,
        clinic_id: clinicId,
          file_name: filename,
        file_type: mimeType,
        file_size: file.length,
          file_url: storageResult.signed_url,
          created_at: getBrasiliaTimestamp()
        })
        .select()
        .single();

      if (attachmentError) {
        console.error('❌ Error creating attachment:', attachmentError);
        // Continuar mesmo com erro no attachment
      }

      console.log('✅ Attachment created:', attachment?.id || 'failed');

      let whatsappResult = { 
        sent: false, 
        messageId: undefined as string | undefined, 
        error: undefined as string | undefined 
      };

      // 7. Enviar via Evolution API (se solicitado)
      if (sendToWhatsApp) {
        console.log('📱 Sending via Evolution API...');
        try {
          whatsappResult = await this.sendToEvolution({
            conversationId,
            clinicId,
            mediaType: this.getEvolutionMediaType(mimeType),
            mediaUrl: storageResult.signed_url,
            fileName: this.shouldIncludeFileName(mimeType) ? filename : undefined,
            caption: mimeType.startsWith('audio/') ? undefined : caption,
            messageType: finalMessageType
          });

          // Atualizar status da mensagem
          if (whatsappResult.sent) {
            await this.supabase
              .from('messages')
              .update({ evolution_status: 'sent' })
              .eq('id', message.id);
            console.log('✅ WhatsApp sent successfully');
          } else {
            await this.supabase
              .from('messages')
              .update({ evolution_status: 'failed' })
              .eq('id', message.id);
            console.log('⚠️ WhatsApp failed, but file saved');
          }
        } catch (whatsappError) {
          console.error('❌ WhatsApp sending failed:', whatsappError);
          whatsappResult = {
            sent: false,
            messageId: undefined,
            error: whatsappError instanceof Error ? whatsappError.message : 'Unknown error'
          };
          
          await this.supabase
            .from('messages')
            .update({ evolution_status: 'failed' })
            .eq('id', message.id);
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
    console.log('🔍 Validating file:', {
      filename,
      mimeType,
      size: file.length,
      isAudio: mimeType.startsWith('audio/')
    });

    // Validação básica de tamanho
    if (file.length === 0) {
      throw new Error('Arquivo vazio');
    }

    if (file.length > 50 * 1024 * 1024) { // 50MB
      throw new Error('Arquivo muito grande (máximo 50MB)');
    }

    // Validação específica para arquivos de áudio
    if (mimeType.startsWith('audio/')) {
      console.log('🎵 Validating audio file...');
      
      // Verificar se é um arquivo de áudio válido
      if (file.length < 100) {
        throw new Error('Arquivo de áudio muito pequeno (possível arquivo corrompido)');
      }

      // Verificar extensão do arquivo
      const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.opus', '.mp4'];
      const hasValidExtension = audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension) {
        console.warn('⚠️ Audio file without valid extension:', filename);
        // Não bloquear, mas logar warning
    }

      // Verificar MIME type específico
      const validAudioMimes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 
        'audio/aac', 'audio/ogg', 'audio/webm', 'audio/opus',
        'audio/mp4'
      ];
      
      if (!validAudioMimes.includes(mimeType)) {
        console.warn('⚠️ Audio file with unusual MIME type:', mimeType);
        // Não bloquear, mas logar warning
      }

      console.log('✅ Audio file validation passed');
    }

    // Validação de tipos MIME permitidos
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/webm',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/webm',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/json', 'application/octet-stream'
    ];

    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Tipo de arquivo não permitido: ${mimeType}`);
    }

    console.log('✅ File validation passed');
  }

  private sanitizeFilename(filename: string): string {
    if (!filename) return 'unnamed-file';
    
    console.log('🔧 Sanitizing filename:', filename);
    
    // Mapeamento de caracteres especiais
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
      
      // Caracteres especiais
      ' ': '_', '\t': '_', '\n': '_', '\r': '_',
      '!': '', '?': '', '@': '', '#': '', '$': '', '%': '', '&': '', '*': '',
      '(': '', ')': '', '[': '', ']': '', '{': '', '}': '', '|': '', '\\': '',
      '/': '_', ':': '', ';': '', '<': '', '>': '', '=': '', '+': '', '~': '',
      '`': '', "'": '', '"': '', ',': '', '^': ''
    };
    
    // Aplicar mapeamento
    let sanitized = filename
      .split('')
      .map(char => {
        if (characterMap.hasOwnProperty(char)) {
          return characterMap[char];
        }
        const code = char.charCodeAt(0);
        if ((code >= 48 && code <= 57) ||  // 0-9
            (code >= 65 && code <= 90) ||  // A-Z
            (code >= 97 && code <= 122) || // a-z
            code === 46 ||                 // .
            code === 45 ||                 // -
            code === 95) {                 // _
          return char;
        }
        return '';
      })
      .join('')
      .replace(/_{2,}/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^[._-]+|[._-]+$/g, '')
      .toLowerCase();
    
    // Fallback se vazio
    if (!sanitized || sanitized.length === 0 || sanitized === '.' || sanitized === '_') {
      const timestamp = Date.now();
      const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
      sanitized = `arquivo_${timestamp}.${extension}`;
    }
    
    console.log('✅ Sanitized filename:', sanitized);
    return sanitized;
  }

  private async uploadToSupabase(params: {
    file: Buffer;
    filename: string;
    mimeType: string;
    conversationId: string;
    clinicId: number;
  }) {
    console.log('📤 Uploading to Supabase Storage...');

    const timestamp = Date.now();
    const category = this.getCategoryFromMime(params.mimeType);
    const storagePath = `clinic-${params.clinicId}/conversation-${params.conversationId}/${category}/${timestamp}-${params.filename}`;
    const bucketName = 'conversation-attachments';
    
    console.log('🗂️ Storage path:', storagePath);
    console.log('📤 Uploading to bucket:', bucketName);
    
    // Upload para Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(storagePath, params.file, {
        contentType: params.mimeType,
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Upload error: ${error.message}`);
    }

    console.log('✅ Upload successful:', data.path);

    // Gerar URL assinada (24h)
    console.log('🔗 Generating signed URL...');
    const { data: signedData, error: signedError } = await this.supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 86400); // 24 horas

    if (signedError) {
      console.error('❌ Signed URL error:', signedError);
      throw new Error(`Signed URL error: ${signedError.message}`);
    }

    console.log('✅ Signed URL generated');
    
    return {
      bucket: bucketName,
      path: storagePath,
      storage_path: storagePath,
      signed_url: signedData.signedUrl,
      signedUrl: signedData.signedUrl,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      publicUrl: null
    };
  }

  private async sendToEvolution(params: {
    conversationId: string;
    clinicId: number;
    mediaType: 'image' | 'video' | 'document' | 'audio';
    mediaUrl: string;
    fileName?: string;
    caption?: string;
    messageType?: string;
  }): Promise<{ sent: boolean; messageId: string | undefined; error: string | undefined }> {
    try {
      console.log('🔍 Starting Evolution API media send...');
      
      // Buscar instância WhatsApp ativa
      const { data: instanceArray, error: instanceError } = await this.supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('clinic_id', params.clinicId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const activeInstance = instanceArray?.[0];
      
      if (instanceError || !activeInstance) {
        console.error('❌ No active WhatsApp instance found');
        throw new Error('Nenhuma instância WhatsApp ativa encontrada');
      }

      console.log('✅ Active WhatsApp instance found:', activeInstance.instance_name);

      // Buscar informações de contato
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          contacts!inner(phone, name)
        `)
        .eq('id', params.conversationId)
        .single();

      if (!conversation?.contacts?.phone) {
        console.error('❌ No contact phone found');
        throw new Error('Conversa não possui contato com telefone');
      }

      console.log('📤 Sending to Evolution API:', {
        phone: conversation.contacts.phone,
        instance: activeInstance.instance_name,
        mediaType: params.mediaType,
        fileName: params.fileName,
        messageType: params.messageType
      });

      const evolutionUrl = process.env.EVOLUTION_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY;
      
      if (!evolutionApiKey) {
        throw new Error('Evolution API Key não configurada');
      }

      // Detectar se é mensagem de voz gravada vs arquivo de áudio
      const isVoiceMessage = params.messageType === 'audio_voice' || 
                            params.fileName?.includes('gravacao_') ||
                            params.fileName?.toLowerCase().includes('recording');
      
      console.log('🔍 Audio detection:', {
        messageType: params.messageType,
        fileName: params.fileName,
        isVoiceMessage,
        mediaType: params.mediaType
      });
      
      let response;
      
      if (isVoiceMessage && params.mediaType === 'audio') {
        console.log('🎤 Using /sendWhatsAppAudio endpoint for voice message');
        
        // CORREÇÃO CRÍTICA: Baixar arquivo e converter para base64 (como painelespelho)
        console.log('📥 Baixando arquivo do Supabase para conversão base64...');
        
        let base64Audio: string;
        try {
          // Baixar arquivo do Supabase Storage
          const response = await fetch(params.mediaUrl);
          if (!response.ok) {
            throw new Error(`Failed to download audio file: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Audio = buffer.toString('base64');
          
          console.log('✅ Arquivo convertido para base64:', {
            originalSize: buffer.length,
            base64Length: base64Audio.length
          });
        } catch (downloadError) {
          console.error('❌ Erro ao baixar/converter arquivo:', downloadError);
          throw new Error('Falha ao processar arquivo de áudio');
    }

        // Payload para /sendWhatsAppAudio (mensagem de voz) - usando base64
        const audioPayload = {
          number: conversation.contacts.phone,
          audio: base64Audio, // Base64 encoded audio for better Evolution API compatibility
      delay: 1000
    };

    console.log('🎤 Audio Payload (Evolution API V2):', {
          endpoint: `${evolutionUrl}/message/sendWhatsAppAudio/${activeInstance.instance_name}`,
          number: audioPayload.number,
          audioLength: audioPayload.audio.length,
          delay: audioPayload.delay
    });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

        response = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${activeInstance.instance_name}`, {
        method: 'POST',
        headers: {
            'apikey': evolutionApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
          body: JSON.stringify(audioPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      } else {
        console.log('📎 Using /sendMedia endpoint for media file');
        
        // Payload para /sendMedia (arquivo normal)
    const payload = {
          number: conversation.contacts.phone,
      mediatype: params.mediaType,
          mimetype: this.getMimeTypeFromEvolutionType(params.mediaType),
      media: params.mediaUrl,
      fileName: params.fileName || 'attachment',
      delay: 1000,
      ...(params.caption && params.mediaType !== 'audio' && { caption: params.caption })
    };
    
        console.log('📤 Evolution API payload:', {
          endpoint: `${evolutionUrl}/message/sendMedia/${activeInstance.instance_name}`,
          mediatype: payload.mediatype,
          fileName: payload.fileName,
          hasCaption: !!payload.caption
        });

        response = await fetch(`${evolutionUrl}/message/sendMedia/${activeInstance.instance_name}`, {
        method: 'POST',
        headers: {
            'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      }

      if (response.ok) {
        const result = await response.json() as EvolutionResponse;
        console.log('✅ Evolution API success:', {
          messageId: result.key?.id,
          status: result.status,
          audioMessage: isVoiceMessage ? !!result.message?.audioMessage : undefined,
          mimetype: isVoiceMessage ? result.message?.audioMessage?.mimetype : undefined
        });
        
        return {
          sent: true,
          messageId: result.key?.id,
          error: undefined
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Evolution API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          isVoiceMessage,
          endpoint: isVoiceMessage ? 'sendWhatsAppAudio' : 'sendMedia'
        });
        
        return {
          sent: false,
          messageId: undefined,
          error: `Evolution API error: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ Evolution API send failed:', error);
      return {
        sent: false,
        messageId: undefined,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getMimeToMessageType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private getCategoryFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  private getEvolutionMediaType(mimeType: string): 'image' | 'video' | 'document' | 'audio' {
    return evolutionTypeMapping[mimeType] || 'document';
  }

  private getMimeTypeFromEvolutionType(mediaType: string): string {
    const mimeTypes = {
      'image': 'image/png',
      'video': 'video/mp4', 
      'audio': 'audio/mpeg',
      'document': 'application/pdf'
    };
    return mimeTypes[mediaType as keyof typeof mimeTypes] || 'application/octet-stream';
  }

  private shouldIncludeFileName(mimeType: string): boolean {
    return this.getEvolutionMediaType(mimeType) === 'document';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Método específico para receber arquivos do N8N (origem: pacientes via WhatsApp)
   * Não envia via Evolution API - apenas armazena no Supabase Storage
   */
  async uploadFromN8N(params: N8NUploadParams): Promise<{
    success: boolean;
    message: any;
    attachment: any;
    signedUrl: string;
    expiresAt: string;
  }> {
    const {
      file,
      filename,
      mimeType,
      conversationId,
      clinicId,
      caption,
      whatsappMessageId,
      whatsappMediaId,
      whatsappMediaUrl,
      timestamp,
      senderType // 🤖 Novo: identificação da origem (patient/ai)
    } = params;

    console.log(`📥 N8N Upload: ${filename} (${mimeType}) for conversation ${conversationId}`);
    console.log(`🤖 Sender Type: ${senderType || 'patient (default)'}`); // Log identificação da origem

    try {
      // 1. Validar arquivo
      this.validateFile(file, mimeType, filename);

      // 2. Sanitizar filename 
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // 3. Upload para Supabase Storage
      console.log('📁 Uploading N8N file to Supabase Storage...');
      const storageResult = await this.uploadToSupabase({
        file,
        filename: sanitizedFilename,
        mimeType,
        conversationId,
        clinicId
      });
      
      // 4. Validar conversation (mesmo código robusto do uploadFile)
      console.log('🔍 Validating conversation exists...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let conversation;
      const isScientificNotation = typeof conversationId === 'string' && conversationId.includes('e+');
      
      if (isScientificNotation) {
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
      
      // 5. Criar mensagem no banco com identificação correta baseada no senderType
      console.log('💾 Creating N8N message in database...');
      
      // 🤖 NOVA LÓGICA: Identificação da origem (patient/ai)
      const isAIMessage = senderType === 'ai';
      console.log(`🤖 Message identification: ${isAIMessage ? 'AI-generated' : 'Patient-sent'}`);
      
      // Determinar sender_type baseado na origem
      const finalSenderType = isAIMessage ? 'ai' : 'patient';
      
      console.log(`📝 Using sender_type: '${finalSenderType}'`);
      
      // Se cliente enviar caption, usar caption. Se não enviar, deixar mensagem vazia (só arquivo)
      let messageContent = '';
      if (caption !== undefined && caption !== null && caption.trim() !== '') {
        messageContent = caption.trim();
      }
      // Deixar content vazio para arquivos sem caption do cliente
      
      // Usar método específico para WhatsApp (audio_voice ao invés de audio_file)
      const messageType = this.getWhatsAppMessageType(mimeType);
      
      // Usar timestamp do WhatsApp se disponível, senão usar atual
      const messageTimestamp = timestamp ? new Date(timestamp) : new Date();
      
      console.log('🕐 Adjusting timestamp to GMT-3 (Brasília)...');
      const brasiliaTimestamp = new Date(messageTimestamp.getTime() - 3 * 60 * 60 * 1000);
      
      // Use only the fields that exist in the actual database schema
      const { data: message, error: messageError } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id.toString(),
          content: messageContent,
          sender_type: finalSenderType, // 'ai' ou 'patient' baseado na identificação
          message_type: messageType,
          timestamp: brasiliaTimestamp
          // Removed: ai_generated, direction, whatsapp_message_id - these columns don't exist
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ Error creating N8N message:', messageError);
        throw new Error(`Error creating N8N message: ${messageError.message}`);
      }

      console.log('✅ N8N Message created:', message.id);

      // 6. Criar attachment no banco com todos os campos necessários
      console.log('📎 Creating N8N attachment...');
      
      const attachmentData = {
        message_id: message.id,
        clinic_id: clinicId,
        file_name: sanitizedFilename,
        file_type: mimeType, // Use file_type instead of mime_type
        file_size: file.length,
        file_url: storageResult.signed_url // Use file_url instead of signed_url
        // Note: storage_path, signed_url, expires_at don't exist in message_attachments table
      };
      
      console.log('📎 N8N Attachment data:', attachmentData);
      
      const { data: attachment, error: attachmentError } = await this.supabase
        .from('message_attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (attachmentError) {
        console.error('❌ Error creating N8N attachment:', attachmentError);
        throw new Error(`Error creating N8N attachment: ${attachmentError.message || 'Unknown attachment error'}`);
      }

      console.log('✅ N8N Attachment created:', attachment.id);

      return {
        success: true,
        message,
        attachment,
        signedUrl: storageResult.signed_url,
        expiresAt: storageResult.expires_at.toISOString()
      };

    } catch (error) {
      console.error('❌ N8N Upload error:', error);
      throw error;
    }
  }

  private getWhatsAppMessageType(mimeType: string): string {
    if (mimeType.startsWith('audio/')) return 'audio_voice'; // Diferencia de audio_file
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  private getMessageTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }
}