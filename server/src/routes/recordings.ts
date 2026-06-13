import { Router } from 'express';
import multer from 'multer';
import { getRecordings, getRecordingById, getRecordingBySessionId, updateRecording } from '../services/recordingService.js';
import { getSessionById } from '../services/sessionService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadFile } from '../services/storage.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { search, status } = req.query;
  const statusFilter = status ? (Array.isArray(status) ? status : [status]).map(String) : undefined;
  const recordings = await getRecordings({ search: search as string | undefined, status: statusFilter });
  const { getStorageUsed } = await import('../services/recordingService.js');
  const storage = await getStorageUsed();
  res.json({ recordings, storage });
});

router.get('/:id', async (req, res) => {
  const recording = await getRecordingById(req.params.id);
  if (!recording) {
    res.status(404).json({ error: 'Recording not found' });
    return;
  }
  res.json(recording);
});

router.post('/upload', upload.single('recording'), async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No recording file provided' });
    return;
  }

  const { sessionId, recordingId, duration } = req.body;
  if (!sessionId || !recordingId) {
    res.status(400).json({ error: 'sessionId and recordingId required' });
    return;
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const key = `recordings/${sessionId}/${uuidv4()}.webm`;
  const { url } = await uploadFile(key, req.file.buffer, req.file.mimetype || 'video/webm');

  const recording = await updateRecording(recordingId, {
    status: 'ready',
    duration: parseInt(duration || '0', 10),
    size: req.file.size,
    url,
    storageKey: key,
  });

  res.json({ recording });
});

export default router;
