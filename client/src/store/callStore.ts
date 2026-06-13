import { create } from 'zustand';

export interface RemoteStream {
  peerId: string;
  peerName: string;
  kind: 'audio' | 'video';
  stream: MediaStream;
}

interface CallState {
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  pinnedPeerId: string | null;
  networkQuality: 'hd' | 'sd' | 'degraded';
  callDuration: number;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (remote: RemoteStream) => void;
  removeRemoteStream: (peerId: string, kind: string) => void;
  setMuted: (muted: boolean) => void;
  setCameraOff: (off: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setRecording: (recording: boolean) => void;
  setPinnedPeerId: (peerId: string | null) => void;
  setNetworkQuality: (quality: 'hd' | 'sd' | 'degraded') => void;
  setCallDuration: (duration: number) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  localStream: null,
  remoteStreams: [],
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isRecording: false,
  pinnedPeerId: null,
  networkQuality: 'hd',
  callDuration: 0,
  setLocalStream: (stream) => set({ localStream: stream }),
  addRemoteStream: (remote) =>
    set((state) => {
      const filtered = state.remoteStreams.filter(
        (r) => !(r.peerId === remote.peerId && r.kind === remote.kind)
      );
      return { remoteStreams: [...filtered, remote] };
    }),
  removeRemoteStream: (peerId, kind) =>
    set((state) => ({
      remoteStreams: state.remoteStreams.filter(
        (r) => !(r.peerId === peerId && r.kind === kind)
      ),
    })),
  setMuted: (muted) => set({ isMuted: muted }),
  setCameraOff: (off) => set({ isCameraOff: off }),
  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setRecording: (recording) => set({ isRecording: recording }),
  setPinnedPeerId: (peerId) => set({ pinnedPeerId: peerId }),
  setNetworkQuality: (quality) => set({ networkQuality: quality }),
  setCallDuration: (duration) => set({ callDuration: duration }),
  reset: () => {
    // Explicitly stop all local media tracks to turn off the camera/microphone indicator LED
    const localStream = useCallStore.getState().localStream;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[Media] Stopped track: ${track.kind}`);
      });
    }
    set({
      localStream: null,
      remoteStreams: [],
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isRecording: false,
      pinnedPeerId: null,
      networkQuality: 'hd',
      callDuration: 0,
    });
  },
}));
