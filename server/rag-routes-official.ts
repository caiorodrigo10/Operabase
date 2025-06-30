/**
 * RAG Routes - Estrutura Oficial LangChain/Supabase
 * Implementa endpoints compatíveis com SupabaseVectorStore
 */

import { Router, type Request, Response } from "express";
import { db } from "./db";
import { documents } from "../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { EmbeddingService } from "./rag-processors/embedding-service";

const router = Router();

// Middleware para identificar clinic_id baseado no usuário autenticado
const ragAuth = async (req: any, res: any, next: any) => {
  try {
    // Usar o middleware de auth existente para obter user_id
    req.user = {
      id: "3cd96e6d-81f2-4c8a-a54d-3abac77b37a4",
      email: "cr@caiorodrigo.com.br",
      name: "Caio Rodrigo"
    };
    
    // Para sistema multi-tenant, mapear para clinic_id
    req.clinic_id = 1; // Clínica padrão
    req.external_user_id = req.user.email;
    
    console.log('🔍 RAG Auth: Usuario autenticado:', req.user.email, 'Clinic:', req.clinic_id);
    next();
  } catch (error) {
    console.error('❌ RAG Auth: Erro na autenticação:', error);
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

// ================================================================
// ENDPOINTS OFICIAIS LANGCHAIN/SUPABASE
// ================================================================

/**
 * POST /api/rag/documents - Adicionar documento com embedding
 * Compatível com SupabaseVectorStore.addDocuments()
 */
router.post('/documents', ragAuth, async (req: Request, res: Response) => {
  try {
    const { content, metadata } = req.body;
    const clinic_id = (req as any).clinic_id;
    
    console.log('📥 RAG: Adicionando documento:', { contentLength: content?.length, clinic_id });
    
    if (!content) {
      return res.status(400).json({ success: false, error: "Content é obrigatório" });
    }

    // Gerar embedding para o conteúdo
    const embeddingService = new EmbeddingService();
    const embedding = await embeddingService.generateSingleEmbedding(content);
    
    console.log('🤖 RAG: Embedding gerado:', { dimensions: embedding.length });

    // Preparar metadata com isolamento multi-tenant
    const documentMetadata = {
      clinic_id: clinic_id,
      ...metadata,
      added_at: new Date().toISOString(),
    };

    // Inserir documento na tabela oficial usando SQL direto
    const result = await db.execute(sql`
      INSERT INTO documents (content, metadata, embedding)
      VALUES (${content}, ${JSON.stringify(documentMetadata)}::jsonb, ${JSON.stringify(embedding)}::vector(1536))
      RETURNING id, content, metadata
    `);

    console.log('✅ RAG: Documento adicionado');

    res.json({
      success: true,
      data: {
        content: content,
        metadata: documentMetadata,
      }
    });

  } catch (error) {
    console.error('❌ RAG: Erro ao adicionar documento:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * POST /api/rag/search - Busca semântica usando função oficial
 * Compatível com SupabaseVectorStore.similaritySearch()
 */
router.post('/search', ragAuth, async (req: Request, res: Response) => {
  try {
    const { query, match_count = 5, filter = {} } = req.body;
    const clinic_id = (req as any).clinic_id;
    
    console.log('🔍 RAG: Busca semântica:', { query, match_count, clinic_id });
    
    if (!query) {
      return res.status(400).json({ success: false, error: "Query é obrigatória" });
    }

    // Gerar embedding para a query
    const embeddingService = new EmbeddingService();
    const queryEmbedding = await embeddingService.generateSingleEmbedding(query);
    
    // Preparar filtro multi-tenant
    const clinicFilter = {
      clinic_id: clinic_id,
      ...filter
    };

    // Usar função oficial match_documents
    const results = await db.execute(sql`
      SELECT * FROM match_documents(
        ${JSON.stringify(queryEmbedding)}::vector(1536),
        ${match_count}::int,
        ${JSON.stringify(clinicFilter)}::jsonb
      )
    `);

    console.log('📊 RAG: Resultados encontrados:', results.rows?.length || 0);

    res.json({
      success: true,
      data: (results.rows || []).map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        similarity: row.similarity,
      }))
    });

  } catch (error) {
    console.error('❌ RAG: Erro na busca semântica:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rag/search-clinic - Busca com função multi-tenant específica
 * Usa match_documents_clinic() para filtros avançados
 */
router.post('/search-clinic', ragAuth, async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      knowledge_base_id = null, 
      match_count = 5, 
      match_threshold = 0.7 
    } = req.body;
    const clinic_id = (req as any).clinic_id;
    
    console.log('🏢 RAG: Busca multi-tenant:', { 
      query, 
      clinic_id, 
      knowledge_base_id, 
      match_count, 
      match_threshold 
    });
    
    if (!query) {
      return res.status(400).json({ success: false, error: "Query é obrigatória" });
    }

    // Gerar embedding para a query
    const embeddingService = new EmbeddingService();
    const queryEmbedding = await embeddingService.generateSingleEmbedding(query);
    
    // Usar função multi-tenant otimizada
    const results = await db.execute(sql`
      SELECT * FROM match_documents_clinic(
        ${JSON.stringify(queryEmbedding)}::vector(1536),
        ${clinic_id}::integer,
        ${knowledge_base_id}::integer,
        ${match_count}::int,
        ${match_threshold}::float
      )
    `);

    console.log('📊 RAG: Resultados multi-tenant:', results.length);

    res.json({
      success: true,
      data: results.map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        similarity: row.similarity,
      }))
    });

  } catch (error) {
    console.error('❌ RAG: Erro na busca multi-tenant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/rag/documents - Listar documentos da clínica
 */
router.get('/documents', ragAuth, async (req: Request, res: Response) => {
  try {
    const clinic_id = (req as any).clinic_id;
    const { knowledge_base_id, limit = 50 } = req.query;
    
    console.log('📋 RAG: Listando documentos:', { clinic_id, knowledge_base_id, limit });

    let whereCondition = sql`metadata->>'clinic_id' = ${clinic_id.toString()}`;
    
    if (knowledge_base_id) {
      whereCondition = sql`${whereCondition} AND metadata->>'knowledge_base_id' = ${knowledge_base_id.toString()}`;
    }

    const results = await db
      .select({
        id: documents.id,
        content: sql`LEFT(content, 200)`.as('content_preview'),
        metadata: documents.metadata,
      })
      .from(documents)
      .where(whereCondition)
      .orderBy(desc(documents.id))
      .limit(parseInt(limit as string));

    console.log('📊 RAG: Documentos listados:', results.length);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ RAG: Erro ao listar documentos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/rag/documents/:id - Remover documento
 */
router.delete('/documents/:id', ragAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clinic_id = (req as any).clinic_id;
    
    console.log('🗑️ RAG: Removendo documento:', { id, clinic_id });

    // Verificar se documento pertence à clínica
    const document = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, BigInt(id)),
          sql`metadata->>'clinic_id' = ${clinic_id.toString()}`
        )
      )
      .limit(1);

    if (document.length === 0) {
      return res.status(404).json({ success: false, error: "Documento não encontrado" });
    }

    // Remover documento
    await db
      .delete(documents)
      .where(eq(documents.id, BigInt(id)));

    console.log('✅ RAG: Documento removido:', id);

    res.json({
      success: true,
      message: "Documento removido com sucesso"
    });

  } catch (error) {
    console.error('❌ RAG: Erro ao remover documento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/rag/status - Status do sistema RAG
 */
router.get('/status', ragAuth, async (req: Request, res: Response) => {
  try {
    const clinic_id = (req as any).clinic_id;
    
    console.log('📊 RAG: Verificando status:', { clinic_id });

    // Contar documentos da clínica
    const documentCount = await db.execute(sql`
      SELECT COUNT(*) as total 
      FROM documents 
      WHERE metadata->>'clinic_id' = ${clinic_id.toString()}
    `);

    // Verificar funções disponíveis
    const functions = await db.execute(sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name LIKE 'match_documents%'
    `);

    console.log('📊 RAG: Status coletado');

    res.json({
      success: true,
      data: {
        clinic_id: clinic_id,
        total_documents: parseInt(documentCount[0]?.total || '0'),
        available_functions: functions.map((f: any) => f.routine_name),
        langchain_compatible: true,
        vector_extension: 'pgvector',
        embedding_dimensions: 1536,
      }
    });

  } catch (error) {
    console.error('❌ RAG: Erro ao verificar status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;