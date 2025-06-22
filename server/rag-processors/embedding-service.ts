import { OpenAI } from 'openai';

export interface EmbeddingChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  embedding: number[];
  metadata: Record<string, any>;
}

export class EmbeddingService {
  private openai: OpenAI;
  private readonly MODEL = 'text-embedding-3-small';
  private readonly BATCH_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    
    this.openai = new OpenAI({ apiKey });
    console.log('🤖 EmbeddingService inicializado com OpenAI');
  }

  async generateEmbeddings(chunks: any[]): Promise<EmbeddingChunk[]> {
    try {
      console.log(`🔮 Gerando embeddings para ${chunks.length} chunks`);
      
      const embeddingChunks: EmbeddingChunk[] = [];
      
      // Processar em lotes para otimizar custos
      for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
        const batch = chunks.slice(i, i + this.BATCH_SIZE);
        console.log(`📦 Processando lote ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(chunks.length / this.BATCH_SIZE)}`);
        
        const batchEmbeddings = await this.processBatch(batch);
        embeddingChunks.push(...batchEmbeddings);
        
        // Rate limiting - pequena pausa entre lotes
        if (i + this.BATCH_SIZE < chunks.length) {
          await this.delay(200);
        }
      }
      
      console.log(`✅ Embeddings gerados com sucesso: ${embeddingChunks.length} chunks`);
      return embeddingChunks;
    } catch (error) {
      console.error('❌ Erro ao gerar embeddings:', error);
      throw new Error(`Falha na geração de embeddings: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async processBatch(chunks: any[]): Promise<EmbeddingChunk[]> {
    let attempt = 0;
    
    while (attempt < this.MAX_RETRIES) {
      try {
        const texts = chunks.map(chunk => this.prepareTextForEmbedding(chunk.content));
        
        const response = await this.openai.embeddings.create({
          model: this.MODEL,
          input: texts,
          encoding_format: 'float'
        });
        
        return chunks.map((chunk, index) => ({
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          tokenCount: chunk.tokenCount,
          embedding: response.data[index].embedding,
          metadata: chunk.metadata
        }));
        
      } catch (error) {
        attempt++;
        
        if (this.isRateLimitError(error)) {
          console.log(`⏳ Rate limit atingido, aguardando ${this.RETRY_DELAY * attempt}ms...`);
          await this.delay(this.RETRY_DELAY * attempt);
          continue;
        }
        
        if (attempt >= this.MAX_RETRIES) {
          throw error;
        }
        
        console.log(`🔄 Tentativa ${attempt}/${this.MAX_RETRIES} falhou, tentando novamente...`);
        await this.delay(this.RETRY_DELAY * attempt);
      }
    }
    
    throw new Error('Falha após múltiplas tentativas');
  }

  private prepareTextForEmbedding(text: string): string {
    // Limitar a 8000 tokens (limite do modelo)
    const maxLength = 8000 * 4; // Aproximadamente 4 chars por token
    
    if (text.length > maxLength) {
      return text.substring(0, maxLength).trim();
    }
    
    return text.trim();
  }

  private isRateLimitError(error: any): boolean {
    return error?.status === 429 || 
           error?.code === 'rate_limit_exceeded' ||
           (error?.message && error.message.includes('rate limit'));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateSingleEmbedding(text: string): Promise<number[]> {
    try {
      const preparedText = this.prepareTextForEmbedding(text);
      
      const response = await this.openai.embeddings.create({
        model: this.MODEL,
        input: preparedText,
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Erro ao gerar embedding único:', error);
      throw new Error(`Falha na geração de embedding: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  getEmbeddingDimensions(): number {
    return 1536; // Dimensões do text-embedding-3-small
  }
}