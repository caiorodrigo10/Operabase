import express from 'express';
import multer from 'multer';
import { ProfilePictureService } from '../services/ProfilePictureService.js';

const router = express.Router();
const profilePictureService = new ProfilePictureService();

// Configurar multer para upload de arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use JPEG, PNG ou WebP.'));
    }
  }
});

// Upload de profile picture
router.post('/upload-profile-picture', upload.single('image'), async (req, res) => {
  try {
    // Verificar autenticação
    const session = req.session as any;
    const user = session?.user || session?.supabaseUser || session?.userData;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Verificar se arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada'
      });
    }

    console.log('📸 Upload de profile picture iniciado:', {
      userId: user.id,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });

    // Fazer upload da imagem
    const result = await profilePictureService.uploadProfilePicture({
      file: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      userId: user.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('✅ Profile picture upload realizado com sucesso:', {
      userId: user.id,
      url: result.profilePictureUrl
    });

    // TODO: Atualizar campo profile_picture na tabela users
    // Por enquanto, apenas retornamos a URL
    
    res.json({
      success: true,
      profilePictureUrl: result.profilePictureUrl,
      message: 'Imagem de perfil atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no upload de profile picture:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Arquivo muito grande. Máximo de 5MB.'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar profile picture atual
router.get('/profile-picture', async (req, res) => {
  try {
    // Verificar autenticação
    const session = req.session as any;
    const user = session?.user || session?.supabaseUser || session?.userData;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    console.log('🔍 Buscando profile picture para usuário:', user.id);

    // Buscar URL da imagem
    const profilePictureUrl = await profilePictureService.getProfilePictureUrl(user.id);

    res.json({
      success: true,
      profilePictureUrl: profilePictureUrl
    });

  } catch (error) {
    console.error('❌ Erro ao buscar profile picture:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Remover profile picture
router.delete('/profile-picture', async (req, res) => {
  try {
    // Verificar autenticação
    const session = req.session as any;
    const user = session?.user || session?.supabaseUser || session?.userData;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    console.log('🗑️ Removendo profile picture do usuário:', user.id);

    // Remover arquivos do storage
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of extensions) {
      try {
        await profilePictureService['deleteExistingProfilePicture'](user.id);
      } catch (error) {
        console.log('Aviso: Erro ao deletar arquivo:', error);
      }
    }

    // TODO: Limpar campo profile_picture na tabela users

    res.json({
      success: true,
      message: 'Imagem de perfil removida com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao remover profile picture:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;