import { Router, type Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { rag_knowledge_bases, rag_documents, rag_chunks, rag_embeddings, rag_queries } from "../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Middleware simplificado que usa usuário fixo para demonstração
const ragAuth = (req: any, res: any, next: any) => {
  // Usar usuário padrão para demonstração
  req.user = {
    id: "3cd96e6d-81f2-4c8a-a54d-3abac77b37a4",
    email: "cr@caiorodrigo.com.br",
    name: "Caio Rodrigo"
  };
  next();
};

const router = Router();

// Configurar multer para upload de PDFs
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'rag');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Listar bases de conhecimento do usuário
router.get('/knowledge-bases', ragAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    
    // Buscar bases de conhecimento
    const knowledgeBases = await db
      .select()
      .from(rag_knowledge_bases)
      .where(eq(rag_knowledge_bases.external_user_id, userId))
      .orderBy(desc(rag_knowledge_bases.created_at));

    // Buscar documentos para contar itens por base
    const documents = await db
      .select()
      .from(rag_documents)
      .where(eq(rag_documents.external_user_id, userId));

    // Adicionar contagem de documentos para cada base
    const basesWithCounts = knowledgeBases.map(base => {
      const docsInBase = documents.filter(doc => 
        doc.metadata && 
        typeof doc.metadata === 'object' && 
        (doc.metadata as any).knowledge_base === base.name
      );
      
      return {
        ...base,
        documentCount: docsInBase.length,
        lastUpdated: docsInBase.length > 0 
          ? new Date(Math.max(...docsInBase.map(d => d.updated_at ? new Date(d.updated_at).getTime() : 0))).toISOString()
          : base.updated_at?.toISOString() || new Date().toISOString()
      };
    });

    res.json(basesWithCounts);
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    res.status(500).json({ error: 'Falha ao buscar bases de conhecimento' });
  }
});

// Listar documentos do usuário
router.get('/documents', ragAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    
    const documents = await db
      .select()
      .from(rag_documents)
      .where(eq(rag_documents.external_user_id, userId))
      .orderBy(desc(rag_documents.created_at));

    res.json(documents);
  } catch (error) {
    console.error('Error fetching RAG documents:', error);
    res.status(500).json({ error: 'Falha ao buscar documentos' });
  }
});

// Criar nova base de conhecimento
router.post('/knowledge-bases', ragAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    const { name, description } = req.body;
    
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Name:', name, 'Description:', description);
    
    if (!name || !name.trim()) {
      console.log('❌ Validation failed - name is required');
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    // Descrição é opcional, usar valor padrão se vazia
    const finalDescription = description && description.trim() ? description.trim() : `Base de conhecimento ${name}`;
    
    // Criar base de conhecimento na tabela dedicada
    const [newKnowledgeBase] = await db
      .insert(rag_knowledge_bases)
      .values({
        external_user_id: userId,
        name: name.trim(),
        description: finalDescription,
        created_by: req.user?.name || req.user?.email
      })
      .returning();

    res.json({ 
      success: true, 
      message: 'Base de conhecimento criada com sucesso',
      knowledgeBase: newKnowledgeBase 
    });
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    res.status(500).json({ error: 'Falha ao criar base de conhecimento' });
  }
});

// Upload de documento de texto
router.post('/documents/text', ragAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    }

    const [document] = await db
      .insert(rag_documents)
      .values({
        external_user_id: userId,
        title,
        content_type: 'text',
        original_content: content,
        extracted_content: content,
        processing_status: 'pending'
      })
      .returning();

    // Iniciar processamento em background
    processDocumentAsync(document.id);

    res.json({
      documentId: document.id,
      status: 'queued',
      message: 'Documento adicionado para processamento'
    });
  } catch (error) {
    console.error('Error creating text document:', error);
    res.status(500).json({ error: 'Falha ao criar documento' });
  }
});

// Upload de URL
router.post('/documents/url', ragAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    const { title, url } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Título e URL são obrigatórios' });
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'URL inválida' });
    }

    const [document] = await db
      .insert(rag_documents)
      .values({
        external_user_id: userId,
        title,
        content_type: 'url',
        source_url: url,
        processing_status: 'pending'
      })
      .returning();

    // Iniciar processamento em background
    processDocumentAsync(document.id);

    res.json({
      documentId: document.id,
      status: 'queued',
      message: 'URL adicionada para processamento'
    });
  } catch (error) {
    console.error('Error creating URL document:', error);
    res.status(500).json({ error: 'Falha ao criar documento' });
  }
});

// Upload de PDF (endpoint original)
router.post('/documents/pdf', ragAuth, upload.single('file'), async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ error: 'Título e arquivo são obrigatórios' });
    }

    const [document] = await db
      .insert(rag_documents)
      .values({
        external_user_id: userId,
        title,
        content_type: 'pdf',
        file_path: file.path,
        processing_status: 'pending'
      })
      .returning();

    // Iniciar processamento em background
    processDocumentAsync(document.id);

    res.json({
      documentId: document.id,
      status: 'queued',
      message: 'PDF enviado para processamento'
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Falha ao enviar PDF' });
  }
});

// Upload de PDF (endpoint usado pelo frontend)
router.post('/documents/upload', ragAuth, upload.single('file'), async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    const { knowledge_base } = req.body;
    const file = req.file;

    if (!knowledge_base || !file) {
      return res.status(400).json({ error: 'Base de conhecimento e arquivo são obrigatórios' });
    }

    const [document] = await db
      .insert(rag_documents)
      .values({
        external_user_id: userId,
        title: file.originalname.replace('.pdf', ''),
        content_type: 'pdf',
        file_path: file.path,
        metadata: { 
          knowledge_base: knowledge_base,
          created_by: req.user?.name || req.user?.email
        },
        processing_status: 'pending'
      })
      .returning();

    // Iniciar processamento em background
    processDocumentAsync(document.id);

    res.json({
      documentId: document.id,
      status: 'queued',
      message: 'PDF enviado para processamento'
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Falha ao enviar PDF' });
  }
});

// Buscar status de processamento
router.get('/processing/:id', ragAuth, async (req: any, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user?.email || req.user?.id?.toString();

    const [document] = await db
      .select()
      .from(rag_documents)
      .where(and(
        eq(rag_documents.id, documentId),
        eq(rag_documents.external_user_id, userId)
      ));

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    res.json({
      documentId: document.id,
      status: document.processing_status,
      errorMessage: document.error_message,
      title: document.title,
      contentType: document.content_type
    });
  } catch (error) {
    console.error('Error fetching processing status:', error);
    res.status(500).json({ error: 'Falha ao buscar status' });
  }
});

// Deletar base de conhecimento completa
router.delete('/knowledge-bases/:name', ragAuth, async (req: any, res: Response) => {
  try {
    const knowledgeBaseName = decodeURIComponent(req.params.name);
    const userId = req.user?.email || req.user?.id?.toString();

    console.log(`🗑️ Deleting knowledge base: ${knowledgeBaseName} for user: ${userId}`);

    // Buscar a base de conhecimento
    const [knowledgeBase] = await db
      .select()
      .from(rag_knowledge_bases)
      .where(and(
        eq(rag_knowledge_bases.external_user_id, userId),
        eq(rag_knowledge_bases.name, knowledgeBaseName)
      ));

    if (!knowledgeBase) {
      return res.status(404).json({ error: 'Base de conhecimento não encontrada' });
    }

    // Buscar todos os documentos da base de conhecimento
    const allDocuments = await db
      .select()
      .from(rag_documents)
      .where(eq(rag_documents.external_user_id, userId));

    // Filtrar documentos que pertencem à base de conhecimento
    const documents = allDocuments.filter(doc => {
      if (doc.metadata && typeof doc.metadata === 'object') {
        const metadata = doc.metadata as any;
        return metadata.knowledge_base === knowledgeBaseName;
      }
      return false;
    });

    console.log(`📊 Found ${documents.length} documents to delete`);

    // Deletar arquivos físicos se existirem
    for (const document of documents) {
      if (document.content_type === 'pdf' && document.file_path) {
        try {
          if (fs.existsSync(document.file_path)) {
            fs.unlinkSync(document.file_path);
            console.log(`🗂️ Deleted file: ${document.file_path}`);
          }
        } catch (error) {
          console.warn('Warning: Could not delete file:', error);
        }
      }
    }

    // Deletar todos os documentos encontrados
    for (const document of documents) {
      await db
        .delete(rag_documents)
        .where(eq(rag_documents.id, document.id));
    }

    // Deletar a base de conhecimento
    await db
      .delete(rag_knowledge_bases)
      .where(eq(rag_knowledge_bases.id, knowledgeBase.id));

    console.log(`✅ Deleted knowledge base with ${documents.length} documents`);

    res.json({ 
      message: 'Base de conhecimento deletada com sucesso',
      deletedDocuments: documents.length
    });
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    res.status(500).json({ error: 'Falha ao deletar base de conhecimento' });
  }
});

// Deletar documento individual
router.delete('/documents/:id', ragAuth, async (req: any, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user?.email || req.user?.id?.toString();

    // Buscar documento para verificar ownership e obter file_path
    const [document] = await db
      .select()
      .from(rag_documents)
      .where(and(
        eq(rag_documents.id, documentId),
        eq(rag_documents.external_user_id, userId)
      ));

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Deletar arquivo físico se for PDF
    if (document.content_type === 'pdf' && document.file_path) {
      try {
        if (fs.existsSync(document.file_path)) {
          fs.unlinkSync(document.file_path);
        }
      } catch (error) {
        console.warn('Warning: Could not delete file:', error);
      }
    }

    // Deletar documento (cascata irá deletar chunks e embeddings)
    await db
      .delete(rag_documents)
      .where(eq(rag_documents.id, documentId));

    res.json({ message: 'Documento deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Falha ao deletar documento' });
  }
});

// Reprocessar documento
router.post('/documents/:id/reprocess', ragAuth, async (req: any, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user?.email || req.user?.id?.toString();

    // Verificar ownership do documento
    const [document] = await db
      .select()
      .from(rag_documents)
      .where(and(
        eq(rag_documents.id, documentId),
        eq(rag_documents.external_user_id, userId)
      ));

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Iniciar reprocessamento
    const { DocumentWorkflow } = await import('./rag-processors/document-workflow');
    const workflow = new DocumentWorkflow();
    
    setImmediate(async () => {
      try {
        await workflow.reprocessDocument(documentId);
        console.log(`✅ Document ${documentId} reprocessed successfully`);
      } catch (error) {
        console.error(`❌ Error reprocessing document ${documentId}:`, error);
      }
    });

    res.json({
      message: 'Reprocessamento iniciado',
      documentId
    });
  } catch (error) {
    console.error('Error starting reprocessing:', error);
    res.status(500).json({ error: 'Falha ao iniciar reprocessamento' });
  }
});

// Busca semântica RAG
router.post('/search', ragAuth, async (req: any, res: Response) => {
  try {
    const { query: searchText, limit = 5, knowledge_base } = req.body;
    const userId = req.user?.email || req.user?.id?.toString();
    
    if (!searchText || typeof searchText !== 'string') {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    const startTime = Date.now();
    console.log(`🔍 RAG Search: "${searchText}" for user: ${userId}`);

    // Gerar embedding da query usando OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key não configurada' });
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: searchText,
        model: 'text-embedding-3-small'
      })
    });

    if (!embeddingResponse.ok) {
      throw new Error('Falha ao gerar embedding da query');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Buscar chunks similares usando drizzle
    let searchQuery = db
      .select({
        content: rag_chunks.content,
        chunk_index: rag_chunks.chunk_index,
        title: rag_documents.title,
        content_type: rag_documents.content_type,
        source_url: rag_documents.source_url,
        metadata: rag_documents.metadata,
        distance: sql`${rag_embeddings.embedding} <=> ${queryEmbedding}::vector`,
        similarity: sql`1 - (${rag_embeddings.embedding} <=> ${queryEmbedding}::vector)`
      })
      .from(rag_chunks)
      .innerJoin(rag_documents, eq(rag_chunks.document_id, rag_documents.id))
      .innerJoin(rag_embeddings, eq(rag_chunks.id, rag_embeddings.chunk_id))
      .where(eq(rag_documents.external_user_id, userId));

    // Filtrar por knowledge base se especificado
    if (knowledge_base) {
      searchQuery = searchQuery.where(sql`${rag_documents.metadata}->>'knowledge_base' = ${knowledge_base}`);
    }

    const results = await searchQuery
      .orderBy(sql`${rag_embeddings.embedding} <=> ${queryEmbedding}::vector`)
      .limit(limit);
    
    const queryTime = Date.now() - startTime;
    
    console.log(`📊 Found ${results.length} results in ${queryTime}ms`);

    // Formatar resultados
    const formattedResults = results.map((row: any) => ({
      content: row.content,
      chunkIndex: row.chunk_index,
      documentTitle: row.title,
      contentType: row.content_type,
      sourceUrl: row.source_url,
      metadata: row.metadata,
      similarity: parseFloat(row.similarity?.toString() || '0'),
      distance: parseFloat(row.distance?.toString() || '1')
    }));

    res.json({
      query,
      results: formattedResults,
      totalFound: results.length,
      queryTime,
      userId
    });

  } catch (error) {
    console.error('Error in RAG search:', error);
    res.status(500).json({ error: 'Falha na busca semântica' });
  }
});

// Função auxiliar para processamento assíncrono real
async function processDocumentAsync(documentId: number) {
  try {
    const { DocumentWorkflow } = await import('./rag-processors/document-workflow');
    const workflow = new DocumentWorkflow();
    
    // Processar documento em background
    setImmediate(async () => {
      try {
        await workflow.processDocument(documentId);
        console.log(`✅ Document ${documentId} processed successfully`);
      } catch (error) {
        console.error(`❌ Error processing document ${documentId}:`, error);
      }
    });

  } catch (error) {
    console.error(`Error starting processing for document ${documentId}:`, error);
  }
}

export default router;