import { Router, type Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { rag_documents, rag_chunks, rag_embeddings, rag_queries } from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";

// Middleware de autenticação específico para RAG que funciona com sessões
const ragAuth = (req: any, res: any, next: any) => {
  console.log('🔍 RAG Auth - Session:', req.session);
  console.log('🔍 RAG Auth - User:', req.user);
  console.log('🔍 RAG Auth - ragAuth:', typeof req.ragAuth === 'function' ? req.ragAuth() : false);
  
  // Verificar se há usuário na sessão
  if (req.user && req.user.email) {
    console.log('✅ RAG Auth - Usuario autenticado:', req.user.email);
    return next();
  }
  
  // Verificar se há sessão ativa
  if (req.session && req.session.passport && req.session.passport.user) {
    console.log('✅ RAG Auth - Sessão ativa encontrada');
    return next();
  }
  
  console.log('❌ RAG Auth - Usuário não autenticado');
  return res.status(401).json({ error: "Usuário não autenticado" });
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

// Listar documentos do usuário
router.get('/documents', ragAuth, async (req: any, res: Response) => {
  try {
    console.log('🔍 RAG Documents - User data:', req.user);
    const userId = req.user?.email || req.user?.id?.toString();
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }
    
    const documents = await db
      .select()
      .from(rag_documents)
      .where(eq(rag_documents.external_user_id, userId))
      .orderBy(desc(rag_documents.created_at));

    console.log('📊 RAG Documents found:', documents.length);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching RAG documents:', error);
    res.status(500).json({ error: 'Falha ao buscar documentos' });
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

// Upload de PDF
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

// Deletar documento
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

// Busca semântica (placeholder - será implementado na próxima fase)
router.post('/search', ragAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.email || req.user?.id?.toString();
    const { query, maxResults = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    // Por enquanto, retornar resposta placeholder
    res.json({
      results: [],
      totalFound: 0,
      queryTime: 0,
      message: 'Busca semântica será implementada na Fase 3'
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ error: 'Falha na busca' });
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