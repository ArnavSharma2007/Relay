import { Router } from 'express';
import { getFiles, addFile } from '../services/sessionService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import { uploadFile } from '../services/storage.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/:sessionId', async (req, res) => {
  res.json(await getFiles(req.params.sessionId));
});

router.post('/upload', upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }

  const ext = req.file.originalname.split('.').pop() || 'bin';
  const key = `uploads/${sessionId}/${uuidv4()}.${ext}`;
  const { url } = await uploadFile(key, req.file.buffer, req.file.mimetype);

  const file = await addFile({
    sessionId,
    name: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadedBy: req.user!.id,
    uploadedByName: req.user!.name,
    url,
    storageKey: key,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(sessionId).emit('file:added', { file });
  }

  res.status(201).json(file);
});

export default router;
