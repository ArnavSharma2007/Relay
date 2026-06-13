import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Paperclip, Send } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import api from '@/lib/api';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  sessionId: string;
  onSend: (content: string, type?: string) => void;
  onTyping: (isTyping: boolean) => void;
  readOnly?: boolean;
  messages?: ChatMessage[];
}

function MessageStatus({ status }: { status: ChatMessage['status'] }) {
  if (status === 'seen')      return <span style={{ color: 'var(--primary-light)' }}>✓✓</span>;
  if (status === 'delivered') return <span style={{ color: 'var(--muted)' }}>✓✓</span>;
  return <span style={{ color: 'var(--subtle)' }}>✓</span>;
}

export function ChatPanel({
  sessionId,
  onSend,
  onTyping,
  readOnly = false,
  messages: messagesProp,
}: ChatPanelProps) {
  const [input,     setInput]     = useState('');
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);

  const storeMessages = useSessionStore((s) => s.chatMessages);
  const messages      = messagesProp ?? storeMessages;
  const typingUsers   = useSessionStore((s) => s.typingUsers);
  const addFile       = useSessionStore((s) => s.addFile);
  const user          = useAuthStore((s) => s.user);
  const addToast      = useUIStore((s) => s.addToast);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const typingNames = Object.entries(typingUsers).filter(([id, typing]) => typing && id !== user?.id);

  // Scroll to bottom on new messages — but don't affect layout
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
    onTyping(false);
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        addToast('error', 'File exceeds 25 MB limit');
        return;
      }
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('sessionId', sessionId);
        const { data } = await api.post('/files/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addFile(data);
        onSend(`📎 ${file.name}`, 'file');
        addToast('success', `Uploaded ${file.name}`);
      } catch {
        addToast('error', 'Failed to upload file');
      } finally {
        setUploading(false);
      }
    },
    [sessionId, addFile, onSend, addToast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    /*
     * LAYOUT FIX:
     * - Outer: flex-col h-full   → fills exactly the parent's height
     * - Message list: flex-1 min-h-0 overflow-y-auto → scrolls inside, never grows
     * - Input bar: flex-shrink-0  → fixed at bottom, never affected by messages
     * All of this means new messages NEVER push siblings or cause layout reflow.
     */
    <div className="flex flex-col h-full relative">
      {/* Drag overlay — pointer-events-none so it doesn't block scroll */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none m-2 rounded-[var(--radius)]"
            style={{
              background: 'rgba(124,92,252,0.08)',
              border: '2px dashed rgba(124,92,252,0.6)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--primary-light)' }}>
              Drop file to attach
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message list — scrollable, isolated from layout */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {messages.length === 0 ? (
          <p className="text-[13px] text-center py-10" style={{ color: 'var(--muted)' }}>
            Chat history starts when the customer joins.
          </p>
        ) : (
          messages.map((msg) => {
            const isAgentMsg = msg.role === 'agent' || msg.role === 'admin';
            return (
              <motion.div
                key={msg.id}
                /*
                 * FIX: No delay, no layout={}, and using translateY only.
                 * Previous code used `delay: i * 0.02` which caused a cascade
                 * of layout changes every time a new message arrived.
                 */
                initial={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className={`flex flex-col ${isAgentMsg ? 'items-end' : 'items-start'}`}
                style={{ willChange: 'opacity, transform' }}
              >
                <span className="text-[10px] mb-0.5 px-1 font-medium select-none" style={{ color: 'var(--muted)' }}>
                  {msg.userName}
                </span>
                <div
                  className="max-w-[85%] px-3 py-2 text-[13px] leading-relaxed"
                  style={{
                    borderRadius: isAgentMsg
                      ? '12px 12px 2px 12px'
                      : '12px 12px 12px 2px',
                    background: isAgentMsg
                      ? 'linear-gradient(135deg, rgba(124,92,252,0.22) 0%, rgba(0,229,255,0.10) 100%)'
                      : 'var(--panel)',
                    border: isAgentMsg
                      ? '1px solid rgba(124,92,252,0.25)'
                      : '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  {msg.content}
                </div>
                <div
                  className="flex items-center gap-1.5 mt-1 text-[11px]"
                  style={{ color: 'var(--muted)' }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isAgentMsg && <MessageStatus status={msg.status} />}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
            <span>Customer is typing</span>
            <span className="flex gap-0.5">
              <span className="typing-dot w-1 h-1 rounded-full" style={{ background: 'var(--muted)' }} />
              <span className="typing-dot w-1 h-1 rounded-full" style={{ background: 'var(--muted)' }} />
              <span className="typing-dot w-1 h-1 rounded-full" style={{ background: 'var(--muted)' }} />
            </span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — flex-shrink-0 so it's always at bottom */}
      {!readOnly && (
        <div
          className="flex-shrink-0 p-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0 p-2 rounded-full transition-all disabled:opacity-40"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'white';
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Paperclip size={15} />
            </button>

            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                onTyping(e.target.value.length > 0);
              }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={uploading ? 'Uploading...' : 'Type a message…'}
              disabled={uploading}
              className="flex-1 h-9 px-3 text-[13px] rounded-full outline-none disabled:opacity-50 transition-all"
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,92,252,0.5)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(124,92,252,0.12)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || uploading}
              className="flex-shrink-0 p-2 rounded-full transition-all disabled:opacity-30"
              style={{
                color: 'var(--primary-light)',
                background: input.trim() ? 'rgba(124,92,252,0.15)' : 'transparent',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
