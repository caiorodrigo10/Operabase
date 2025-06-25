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

      // 2. Upload para Supabase Storage
      console.log('📁 Uploading to Supabase Storage...');
      const storageResult = await this.uploadToSupabase({
        file,
        filename,
        mimeType,
        conversationId,
        clinicId
      });

      // 4. Sanitizar filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // 5. Criar mensagem no banco
      console.log('💾 Creating message in database...');
      const messageContent = caption || `📎 ${sanitizedFilename}`;
      const message = await this.storage.createMessage({
        conversation_id: conversationId,
        sender_type: 'professional',
        content: messageContent
      });

      // 6. Criar attachment
      console.log('📎 Creating attachment record...');
      const attachment = await this.storage.createAttachment({
        message_id: message.id,
        clinic_id: clinicId,
        file_name: sanitizedFilename,
        file_type: mimeType,
        file_size: file.length,
        file_url: storageResult.signed_url,
        storage_bucket: 'conversation-attachments',
        storage_path: storageResult.storage_path,
        signed_url: storageResult.signed_url,
        signed_url_expires: storageResult.expires_at
      });

      let whatsappResult = { sent: false, messageId: undefined, error: undefined };

      // 5. Enviar via Evolution API (se solicitado)
      if (sendToWhatsApp) {
        console.log('📱 Sending via Evolution API...');
        try {
          whatsappResult = await this.sendToEvolution({
            conversationId,
            clinicId,
            mediaType: this.getEvolutionMediaType(mimeType),
            mediaUrl: storageResult.signed_url,
            fileName: this.shouldIncludeFileName(mimeType) ? filename : undefined,
            caption: mimeType.startsWith('audio/') ? undefined : caption
          });

          // Atualizar status da mensagem
          if (whatsappResult.sent) {
            await this.storage.updateMessage(message.id, {
              status: 'sent',
              whatsapp_message_id: whatsappResult.messageId
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
    
    // Remover acentos e caracteres especiais de forma mais agressiva
    return filename
      .normalize('NFD') // Decompor caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/[àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]/gi, (match) => {
        const map: { [key: string]: string } = {
          'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
          'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
          'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
          'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
          'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
          'ý': 'y', 'ÿ': 'y'
        };
        return map[match.toLowerCase()] || match;
      })
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui qualquer caractere especial por underscore
      .replace(/_{2,}/g, '_') // Remove underscores duplos
      .replace(/^_+|_+$/g, '') // Remove underscores no início e fim
      .toLowerCase();
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
      // Buscar conversa para obter número WhatsApp
      const conversation = await this.storage.getConversationById(params.conversationId);
      if (!conversation?.whatsapp_chat_id) {
        throw new Error('Conversa não possui número WhatsApp');
      }

      // Buscar instância ativa da clínica
      const whatsappInstance = await this.storage.getActiveWhatsAppInstance(params.clinicId);
      if (!whatsappInstance) {
        throw new Error('Nenhuma instância WhatsApp ativa encontrada');
      }

      // Preparar payload
      const payload = {
        number: conversation.whatsapp_chat_id,
        mediaMessage: {
          mediaType: params.mediaType,
          media: params.mediaUrl,
          ...(params.fileName && { fileName: params.fileName }),
          ...(params.caption && params.mediaType !== 'audio' && { caption: params.caption })
        },
        options: {
          delay: 1000,
          presence: params.mediaType === 'audio' ? 'recording' : 'composing'
        }
      };

      console.log('📡 Sending to Evolution API:', {
        instance: whatsappInstance.instance_id,
        number: conversation.whatsapp_chat_id,
        mediaType: params.mediaType
      });

      const result = await this.evolutionAPI.sendMedia(whatsappInstance.instance_id, payload);
      
      return {
        sent: true,
        messageId: result.key?.id
      };

    } catch (error) {
      console.error('Evolution API error:', error);
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