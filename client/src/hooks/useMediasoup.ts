import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';
import * as mediasoupClient from 'mediasoup-client';

type Device = mediasoupClient.types.Device;
type Transport = mediasoupClient.types.Transport;
type Producer = mediasoupClient.types.Producer;

export function useMediasoup(sessionId: string | undefined) {
  const deviceRef = useRef<Device | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302', 'stun:openrelay.metered.ca:80'] },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turns:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    }
  ]);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());

  const setLocalStream = useCallStore((s) => s.setLocalStream);
  const addRemoteStream = useCallStore((s) => s.addRemoteStream);
  const removeRemoteStream = useCallStore((s) => s.removeRemoteStream);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const queuedCandidatesRef = useRef<any[]>([]);
  const isReadyRef = useRef(false);

  const getPeerConnection = useCallback((peerId: string, peerName: string) => {
    if (pcRef.current) return pcRef.current;

    console.log(`[P2P] Creating new RTCPeerConnection for ${peerId} (${peerName})`);
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
    });

    pc.onconnectionstatechange = () => {
      console.log(`[P2P ConnectionState] Change: ${pc.connectionState}`);
    };
    pc.oniceconnectionstatechange = () => {
      console.log(`[P2P ICE ConnectionState] Change: ${pc.iceConnectionState}`);
    };
    pc.onsignalingstatechange = () => {
      console.log(`[P2P SignalingState] Change: ${pc.signalingState}`);
    };
    pc.onicecandidateerror = (e) => {
      console.warn(`[P2P ICE Candidate Error]`, e);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log(`[P2P Candidate] Sending candidate to socket`);
        getSocket().emit('rtc:signal', {
          sessionId,
          signal: { type: 'candidate', candidate: e.candidate },
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      if (!isReadyRef.current) return;
      try {
        if (pc.signalingState !== 'stable') return;
        console.log('[P2P renegotiation] Creating offer');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        getSocket().emit('rtc:signal', {
          sessionId,
          signal: { type: 'offer', sdp: offer.sdp },
        });
      } catch (err) {
        console.error('P2P negotiation error:', err);
      }
    };

    pc.ontrack = (e) => {
      console.log(`[P2P ontrack] Received remote track of kind: ${e.track.kind}, id: ${e.track.id}`);
      const stream = e.streams[0] || new MediaStream([e.track]);
      console.log(`[P2P ontrack] Stream has ${stream.getVideoTracks().length} video tracks, ${stream.getAudioTracks().length} audio tracks`);
      addRemoteStream({
        peerId,
        peerName,
        kind: e.track.kind as 'audio' | 'video',
        stream,
      });

      if (e.track.kind === 'audio') {
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.play().catch((err) => console.error('P2P Audio play error:', err));
      }
    };

    // Add local tracks
    const localStream = useCallStore.getState().localStream;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [sessionId, addRemoteStream]);
  const user = useAuthStore((s) => s.user);

  const socketRequest = useCallback(
    <T>(event: string, data: Record<string, unknown>): Promise<T> => {
      return new Promise((resolve, reject) => {
        const socket = getSocket();
        socket.emit(event, data, (response: T & { error?: string }) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    []
  );

  const initDevice = useCallback(async () => {
    if (!sessionId || deviceRef.current) return deviceRef.current;

    const { rtpCapabilities, iceServers } = await socketRequest<{
      rtpCapabilities: mediasoupClient.types.RtpCapabilities;
      iceServers?: RTCIceServer[];
    }>(
      'rtc:getCapabilities',
      { sessionId }
    );

    if (iceServers?.length) {
      iceServersRef.current = iceServers;
    }

    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    deviceRef.current = device;
    return device;
  }, [sessionId, socketRequest]);

  const createSendTransport = useCallback(async () => {
    if (!sessionId) return null;

    const device = await initDevice();
    if (!device) return null;

    const { transport } = await socketRequest<{
      transport: {
        id: string;
        iceParameters: mediasoupClient.types.IceParameters;
        iceCandidates: mediasoupClient.types.IceCandidate[];
        dtlsParameters: mediasoupClient.types.DtlsParameters;
      };
    }>('rtc:createTransport', { sessionId, direction: 'send' });

    const sendTransport = device.createSendTransport({ ...transport, iceServers: iceServersRef.current });

    sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      socketRequest('rtc:transport:connect', {
        sessionId,
        transportId: sendTransport.id,
        dtlsParameters,
      })
        .then(() => callback())
        .catch((err) => errback(err));
    });

    sendTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
      socketRequest<{ producerId: string }>('rtc:produce', {
        sessionId,
        transportId: sendTransport.id,
        kind,
        rtpParameters,
      })
        .then(({ producerId }) => callback({ id: producerId }))
        .catch((err) => errback(err));
    });

    sendTransportRef.current = sendTransport;
    return sendTransport;
  }, [sessionId, initDevice, socketRequest]);

  const createRecvTransport = useCallback(async () => {
    if (!sessionId) return null;

    const device = await initDevice();
    if (!device) return null;

    const { transport } = await socketRequest<{
      transport: {
        id: string;
        iceParameters: mediasoupClient.types.IceParameters;
        iceCandidates: mediasoupClient.types.IceCandidate[];
        dtlsParameters: mediasoupClient.types.DtlsParameters;
      };
    }>('rtc:createTransport', { sessionId, direction: 'recv' });

    const recvTransport = device.createRecvTransport({ ...transport, iceServers: iceServersRef.current });

    recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      socketRequest('rtc:transport:connect', {
        sessionId,
        transportId: recvTransport.id,
        dtlsParameters,
      })
        .then(() => callback())
        .catch((err) => errback(err));
    });

    recvTransportRef.current = recvTransport;
    return recvTransport;
  }, [sessionId, initDevice, socketRequest]);

  const consumeProducer = useCallback(
    async (producerId: string, peerId: string, peerName: string, kind: mediasoupClient.types.MediaKind) => {
      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;
      if (!device || !recvTransport || !sessionId) return;

      const { consumer } = await socketRequest<{
        consumer: {
          id: string;
          producerId: string;
          kind: mediasoupClient.types.MediaKind;
          rtpParameters: mediasoupClient.types.RtpParameters;
        };
      }>('rtc:consume', {
        sessionId,
        producerId,
        rtpCapabilities: device.rtpCapabilities,
      });

      const msConsumer = await recvTransport.consume({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });

      await socketRequest('rtc:resumeConsumer', {
        sessionId,
        consumerId: msConsumer.id,
      });

      const stream = new MediaStream([msConsumer.track]);
      addRemoteStream({ peerId, peerName, kind, stream });

      if (kind === 'audio') {
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.play().catch((e) => console.error('Audio play error:', e));
      }
    },
    [sessionId, socketRequest, addRemoteStream]
  );

  const startLocalMedia = useCallback(async () => {
    if (!sessionId) return;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
      });
    } catch (err) {
      console.warn('Failed to get both audio and video, trying audio only:', err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err2) {
        console.warn('Failed to get audio only, trying video only:', err2);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        } catch (err3) {
          console.error('Failed to get any media devices:', err3);
        }
      }
    }

    if (stream) {
      setLocalStream(stream);

      // Add local tracks to P2P PeerConnection if it exists
      if (pcRef.current) {
        stream.getTracks().forEach((track) => {
          pcRef.current?.addTrack(track, stream!);
        });
      }
    }

    // Always send P2P hello to trigger negotiation (even if local camera/mic is blocked or unavailable)
    getSocket().emit('rtc:signal', { sessionId, signal: { type: 'hello' } });

    if (!import.meta.env.PROD && stream) {
      try {
        const sendTransport = sendTransportRef.current || (await createSendTransport());
        if (!sendTransport) return;

        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        if (audioTrack) {
          const producer = await sendTransport.produce({ track: audioTrack });
          producersRef.current.set('audio', producer);
        }
        if (videoTrack) {
          const producer = await sendTransport.produce({ track: videoTrack });
          producersRef.current.set('video', producer);
        }
      } catch (err) {
        console.error('Mediasoup local publish error:', err);
      }
    }
  }, [sessionId, setLocalStream, createSendTransport]);

  const toggleMute = useCallback(() => {
    const stream = useCallStore.getState().localStream;
    const isMuted = useCallStore.getState().isMuted;
    stream?.getAudioTracks().forEach((t) => {
      t.enabled = isMuted;
    });
    useCallStore.getState().setMuted(!isMuted);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = useCallStore.getState().localStream;
    const isCameraOff = useCallStore.getState().isCameraOff;
    stream?.getVideoTracks().forEach((t) => {
      t.enabled = isCameraOff;
    });
    useCallStore.getState().setCameraOff(!isCameraOff);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();

    const setup = async () => {
      if (!import.meta.env.PROD) {
        try {
          await initDevice();
          await createSendTransport();
          await createRecvTransport();

          const { producers } = await socketRequest<{
            producers: { peerId: string; producerId: string; kind: mediasoupClient.types.MediaKind }[];
          }>('rtc:getProducers', { sessionId });

          for (const p of producers) {
            await consumeProducer(p.producerId, p.peerId, 'Participant', p.kind);
          }
        } catch (err) {
          console.error('Mediasoup setup failed:', err);
        }
      }

      await startLocalMedia();
    };

    setup();

    socket.on('rtc:signal', async ({ from, signal }: { from: string; signal: any }) => {
      if (from === user?.id) return;

      if (signal.type === 'hello') {
        const pc = getPeerConnection(from, 'Participant');
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('rtc:signal', {
            sessionId,
            signal: { type: 'offer', sdp: offer.sdp },
          });
        } catch (err) {
          console.error('Failed to create initial offer:', err);
        }
      } else if (signal.type === 'offer') {
        const pc = getPeerConnection(from, 'Participant');
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('rtc:signal', {
          sessionId,
          signal: { type: 'answer', sdp: answer.sdp },
        });
        isReadyRef.current = true;

        // Apply queued candidates
        if (queuedCandidatesRef.current.length > 0) {
          console.log(`Applying ${queuedCandidatesRef.current.length} queued ICE candidates`);
          for (const candidate of queuedCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
              console.error('Error adding queued ICE candidate:', err);
            });
          }
          queuedCandidatesRef.current = [];
        }
      } else if (signal.type === 'answer') {
        const pc = getPeerConnection(from, 'Participant');
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        isReadyRef.current = true;

        // Apply queued candidates
        if (queuedCandidatesRef.current.length > 0) {
          console.log(`Applying ${queuedCandidatesRef.current.length} queued ICE candidates`);
          for (const candidate of queuedCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
              console.error('Error adding queued ICE candidate:', err);
            });
          }
          queuedCandidatesRef.current = [];
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        const pc = getPeerConnection(from, 'Participant');
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((err) => {
            console.error('Error adding ICE candidate:', err);
          });
        } else {
          console.log('Queuing ICE candidate (remoteDescription not set yet)');
          queuedCandidatesRef.current.push(signal.candidate);
        }
      }
    });

    socket.on(
      'rtc:new-producer',
      async ({ producerId, kind, peerId, peerName }: {
        producerId: string;
        kind: mediasoupClient.types.MediaKind;
        peerId: string;
        peerName: string;
      }) => {
        if (!import.meta.env.PROD && peerId !== user?.id) {
          try {
            await consumeProducer(producerId, peerId, peerName, kind);
          } catch (err) {
            console.error('Failed to consume producer:', err);
          }
        }
      }
    );

    socket.on('rtc:peer-left', ({ peerId }: { peerId: string }) => {
      removeRemoteStream(peerId, 'audio');
      removeRemoteStream(peerId, 'video');
      isReadyRef.current = false;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    });

    return () => {
      socket.off('rtc:signal');
      socket.off('rtc:new-producer');
      socket.off('rtc:peer-left');
      producersRef.current.forEach((p) => p.close());
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      isReadyRef.current = false;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      deviceRef.current = null;
    };
  }, [
    sessionId,
    initDevice,
    createSendTransport,
    createRecvTransport,
    consumeProducer,
    startLocalMedia,
    removeRemoteStream,
    user?.id,
    socketRequest,
  ]);

  return { toggleMute, toggleCamera };
}
