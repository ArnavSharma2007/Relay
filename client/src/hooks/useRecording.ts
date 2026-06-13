import { useRef, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

export function useRecording(sessionId: string | undefined) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (stream: MediaStream | null) => {
    if (!sessionId || !stream) return;

    const socket = getSocket();
    socket.emit('recording:start', { sessionId });

    socket.once('recording:status', (data: { recordingId?: string; status: string }) => {
      if (data.recordingId) recordingIdRef.current = data.recordingId;
    });

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      recorderRef.current = recorder;
    } catch {
      // Recording not supported in this browser
    }
  }, [sessionId]);

  const stopRecording = useCallback(async () => {
    if (!sessionId) return;

    const socket = getSocket();
    socket.emit('recording:stop', { sessionId });

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (recordingIdRef.current && blob.size > 0) {
          const form = new FormData();
          form.append('recording', blob, `session-${sessionId}.webm`);
          form.append('sessionId', sessionId);
          form.append('recordingId', recordingIdRef.current);
          form.append('duration', String(duration));

          try {
            await api.post('/recordings/upload', form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch {
            // Upload failed — recording metadata stays in processing state
          }
        }

        recorderRef.current = null;
        recordingIdRef.current = null;
        resolve();
      };

      recorder.stop();
    });
  }, [sessionId]);

  return { startRecording, stopRecording };
}
