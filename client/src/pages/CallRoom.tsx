import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { VideoTile } from '@/components/call/VideoTile';
import { ControlBar } from '@/components/call/ControlBar';
import { ChatPanel } from '@/components/call/ChatPanel';
import { Timeline } from '@/components/call/Timeline';
import { ReconnectBanner } from '@/components/shared/ReconnectBanner';
import { Drawer } from '@/components/shared/Drawer';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { useSessionSocket } from '@/hooks/useSocket';
import { useRecording } from '@/hooks/useRecording';
import { useMediasoup } from '@/hooks/useMediasoup';
import { useReconnect } from '@/hooks/useReconnect';
import { useSessionStore } from '@/store/sessionStore';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useLiveDuration, formatDuration } from '@/hooks/useSession';
import api, { getAssetUrl } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { FileText, MessageSquare, Clock, PanelRightOpen, PanelRightClose } from 'lucide-react';

type PanelTab = 'chat' | 'timeline' | 'files';

export function CallRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  const currentSession    = useSessionStore((s) => s.currentSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const setChatMessages   = useSessionStore((s) => s.setChatMessages);
  const setTimelineEvents = useSessionStore((s) => s.setTimelineEvents);
  const setFiles          = useSessionStore((s) => s.setFiles);
  const timelineEvents    = useSessionStore((s) => s.timelineEvents);
  const files             = useSessionStore((s) => s.files);

  const localStream    = useCallStore((s) => s.localStream);
  const remoteStreams   = useCallStore((s) => s.remoteStreams);
  const isRecording    = useCallStore((s) => s.isRecording);
  const networkQuality = useCallStore((s) => s.networkQuality);
  const setPinnedPeerId = useCallStore((s) => s.setPinnedPeerId);
  const reset          = useCallStore((s) => s.reset);

  const showChatPanel    = useUIStore((s) => s.showChatPanel);
  const setShowChatPanel = useUIStore((s) => s.setShowChatPanel);
  const addToast         = useUIStore((s) => s.addToast);

  const [activeTab, setActiveTab]           = useState<PanelTab>('chat');
  const [swapped, setSwapped]               = useState(false);
  const [showIssueDrawer, setShowIssueDrawer] = useState(false);
  const [issueType, setIssueType]           = useState('network');

  const { sendMessage, sendTyping } = useSessionSocket(sessionId);
  const { startRecording: startMediaRecording, stopRecording: stopMediaRecording } = useRecording(sessionId);
  const { toggleMute, toggleCamera } = useMediasoup(sessionId);
  useReconnect();

  const duration = useLiveDuration(currentSession?.startedAt ?? null, true);

  useEffect(() => {
    connectSocket();
    if (!sessionId) return;

    api.get(`/sessions/${sessionId}`).then(({ data }) => {
      setCurrentSession(data.session);
      setChatMessages(data.chat);
      setTimelineEvents(data.timeline);
      setFiles(data.files);
    });

    return () => { reset(); };
  }, [sessionId, setCurrentSession, setChatMessages, setTimelineEvents, setFiles, reset]);

  const remoteVideo    = remoteStreams.find((r) => r.kind === 'video');
  const primaryStream  = swapped ? localStream : remoteVideo?.stream;
  const secondaryStream = swapped ? remoteVideo?.stream : localStream;
  const primaryName    = swapped ? 'You' : remoteVideo?.peerName || currentSession?.customerName || 'Participant';
  const secondaryName  = swapped ? remoteVideo?.peerName || 'Participant' : 'You';

  const handleLeave = () => navigate(isAgent ? '/live-sessions' : '/login');

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopMediaRecording();
      useCallStore.getState().setRecording(false);
    } else {
      const stream = useCallStore.getState().localStream;
      await startMediaRecording(stream);
      useCallStore.getState().setRecording(true);
    }
  };

  const handleRaiseIssue = () => {
    addToast('warning', `Issue flagged: ${issueType.replace('_', ' ')}`);
    setShowIssueDrawer(false);
  };

  const panelTabs: { id: PanelTab; label: string; icon: typeof MessageSquare }[] = [
    { id: 'chat',     label: 'Chat',     icon: MessageSquare },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'files',    label: 'Files',    icon: FileText },
  ];

  const showPanel = isAgent || showChatPanel;

  return (
    /*
     * LAYOUT FIX:
     * The root is h-screen flex-col so the entire page fills the screen.
     * The inner flex row (video + panel) uses flex-1 overflow-hidden so
     * it never grows beyond the viewport. No child can push it.
     */
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <ReconnectBanner />

      {/* Session meta bar — fixed height, never grows */}
      {isAgent && currentSession && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-2"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm" style={{ color: 'var(--text)' }}>
              {currentSession.sessionCode}
            </span>
            <span style={{ color: 'var(--subtle)' }}>·</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {currentSession.customerName}
            </span>
            {isRecording && <AnimatedBadge variant="recording">REC</AnimatedBadge>}
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
            <span className="font-mono tabular-nums">{formatDuration(duration)}</span>
            <AnimatedBadge variant="live">Live</AnimatedBadge>
          </div>
        </div>
      )}

      {/* Main body — fills remaining height, no overflow */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
        {/* Video area — fills left */}
        <div
          className={`relative flex flex-col transition-all duration-200 w-full ${
            showPanel && isAgent ? 'md:w-[calc(100%-360px)]' : 'w-full'
          }`}
          style={{ minWidth: 0 }}
        >
          {/* Video area — fills all vertical space except the control bar */}
          <div className="flex-1 relative overflow-hidden" style={{ paddingBottom: '72px' }}>
            <VideoTile
              stream={primaryStream}
              name={primaryName}
              isPrimary
              isRecording={isRecording}
              networkQuality={networkQuality}
              duration={duration}
              onPin={() => setPinnedPeerId(remoteVideo?.peerId ?? null)}
              className="w-full h-full min-h-[300px]"
            />

            {/* PiP tile — absolutely positioned, no layout={} prop to avoid jitter */}
            <div
              className="absolute bottom-6 left-4 md:left-5 w-[120px] md:w-[180px] h-[90px] md:h-[135px] z-10 rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                border: '1.5px solid rgba(124,92,252,0.3)',
              }}
            >
              <VideoTile
                stream={secondaryStream}
                name={secondaryName}
                isSelf={!swapped}
                onClick={() => setSwapped(!swapped)}
                className="w-full h-full"
              />
            </div>

            {/* Chat toggle for customer */}
            {!isAgent && (
              <button
                onClick={() => setShowChatPanel(!showChatPanel)}
                className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all rounded-full"
                style={{
                  background: 'rgba(13,15,26,0.8)',
                  border: '1px solid rgba(124,92,252,0.3)',
                  color: 'var(--muted)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {showChatPanel ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
                Chat
              </button>
            )}
          </div>

          {/* Control bar — absolutely sits at the bottom of the video column */}
          <div className="flex-shrink-0" style={{ height: '72px' }}>
            <ControlBar
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={() => addToast('info', 'Screen share started')}
              onToggleRecording={handleToggleRecording}
              onLeave={handleLeave}
              onRaiseIssue={isAgent ? () => setShowIssueDrawer(true) : undefined}
              isAgent={isAgent}
            />
          </div>
        </div>

        {/* Side panel — responsive width and height, flex column, fully isolated */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-shrink-0 flex flex-col overflow-hidden w-full md:w-[360px] h-[350px] md:h-full border-t md:border-t-0 md:border-l border-[var(--border)]"
              style={{
                background: 'var(--surface)',
                /* Key fix: this panel is a fixed-size flex column —
                   inner content scrolls, outer never resizes */
              }}
            >
              {isAgent ? (
                <>
                  {/* Tab bar — fixed height */}
                  <div
                    className="flex-shrink-0 flex"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {panelTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'text-[var(--text)]'
                            : 'text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <tab.icon size={13} />
                        {tab.label}
                        {activeTab === tab.id && (
                          <motion.div
                            layoutId="call-tab-indicator"
                            className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                            style={{ background: 'var(--primary)' }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab content — takes remaining height, scrolls inside */}
                  <div className="flex-1 overflow-hidden min-h-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.13 }}
                        className="h-full"
                      >
                        {activeTab === 'chat' && (
                          <ChatPanel
                            sessionId={sessionId!}
                            onSend={sendMessage}
                            onTyping={sendTyping}
                          />
                        )}
                        {activeTab === 'timeline' && <Timeline events={timelineEvents} />}
                        {activeTab === 'files' && (
                          <div className="p-4 space-y-2 overflow-y-auto h-full">
                            {files.length === 0 ? (
                              <p
                                className="text-[13px] text-center py-10"
                                style={{ color: 'var(--muted)' }}
                              >
                                No files shared yet
                              </p>
                            ) : (
                              files.map((f) => (
                                <div
                                  key={f.id}
                                  className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)]"
                                  style={{
                                    background: 'var(--panel)',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <FileText size={15} style={{ color: 'var(--primary)' }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] truncate">{f.name}</p>
                                    <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                                      {(f.size / 1024).toFixed(0)} KB
                                    </p>
                                  </div>
                                  <a
                                    href={getAssetUrl(f.url)}
                                    className="text-[11px] hover:underline"
                                    style={{ color: 'var(--primary-light)' }}
                                  >
                                    Download
                                  </a>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                /* Customer: just chat */
                <>
                  <div
                    className="flex-shrink-0 px-4 py-3 text-[13px] font-semibold"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    Chat
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <ChatPanel
                      sessionId={sessionId!}
                      onSend={sendMessage}
                      onTyping={sendTyping}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Issue drawer */}
      <Drawer open={showIssueDrawer} onClose={() => setShowIssueDrawer(false)} title="Raise Issue">
        <div className="space-y-4">
          <Select
            label="Issue type"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            options={[
              { value: 'network',     label: 'Network connectivity' },
              { value: 'audio',       label: 'Audio quality' },
              { value: 'video',       label: 'Video quality' },
              { value: 'screenshare', label: 'Screen share failure' },
              { value: 'escalation',  label: 'Escalation required' },
            ]}
          />
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
            This flags the session for engineering review. The customer will not be notified.
          </p>
          <Button className="w-full" onClick={handleRaiseIssue}>
            Submit Issue
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
