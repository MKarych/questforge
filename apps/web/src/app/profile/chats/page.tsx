'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { apiClient, type ChatPreviewDto, type ChatMessageDto } from '@/lib/api/client';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes}м назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}д назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

function ChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const [chats, setChats] = useState<ChatPreviewDto[]>([]);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeUserId = searchParams.get('userId');
  const activeChat = activeUserId ? chats.find(c => c.participant.id === activeUserId) : null;

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login');
    }
  }, [userLoading, user, router]);

  // Load chats
  useEffect(() => {
    async function loadChats() {
      try {
        const res = await apiClient.getChats();
        setChats(res.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (user) loadChats();
  }, [user]);

  // Load chat history when active user changes
  const loadMessages = useCallback(async () => {
    if (!activeUserId) return;
    setMessagesLoading(true);
    try {
      const res = await apiClient.getChatHistory(activeUserId);
      setMessages(res.data || []);
    } catch {
      // ignore
    } finally {
      setMessagesLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for new messages every 10 seconds when chat is open
  useEffect(() => {
    if (!activeUserId) return;
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [activeUserId, loadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserId || !text.trim() || sending) return;

    setSending(true);
    try {
      const res = await apiClient.sendMessage(activeUserId, text.trim());
      setMessages(prev => [...prev, res.data]);
      setText('');
      // Refresh chats to update last message
      const chatsRes = await apiClient.getChats();
      setChats(chatsRes.data || []);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
              aria-label="Назад"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-text-primary">Мои чаты</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Chat List */}
            <div className={`w-full md:w-80 shrink-0 ${activeUserId ? 'hidden md:block' : 'block'}`}>
              <div className="card">
                <h2 className="text-lg font-semibold text-text-primary mb-4">💬 Диалоги</h2>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-sm text-text-secondary">Нет активных чатов</p>
                    <p className="text-xs text-text-muted mt-1">
                      Напишите кому-нибудь из профиля
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.set('userId', chat.participant.id);
                          router.push(`/profile/chats?${params.toString()}`);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          activeUserId === chat.participant.id
                            ? 'bg-primary/10'
                            : 'hover:bg-surface-elevated'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                          {chat.participant.avatarUrl ? (
                            <img src={chat.participant.avatarUrl} alt={chat.participant.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm text-primary font-semibold">
                              {chat.participant.username?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-primary truncate">
                              @{chat.participant.username}
                            </span>
                            {chat.lastMessage && (
                              <span className="text-xs text-text-muted shrink-0 ml-2">
                                {timeAgo(chat.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary truncate">
                              {chat.lastMessage
                                ? (chat.lastMessage.senderId === user?.id || chat.lastMessage.senderId === user?.uuid
                                    ? `Вы: ${chat.lastMessage.text}`
                                    : chat.lastMessage.text)
                                : 'Нет сообщений'}
                            </span>
                            {chat.unreadCount > 0 && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-bold text-white bg-primary rounded-full shrink-0">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 ${!activeUserId ? 'hidden md:flex' : 'flex'}`}>
              {activeUserId ? (
                <div className="card flex flex-col h-[70vh]">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
                    {/* Mobile back button */}
                    <button
                      onClick={() => router.push('/profile/chats')}
                      className="md:hidden p-1 text-text-secondary hover:text-text-primary transition-colors"
                      aria-label="Назад к списку чатов"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <Link href={`/profile/${activeUserId}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                        {activeChat?.participant.avatarUrl ? (
                          <img src={activeChat.participant.avatarUrl} alt={activeChat.participant.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-primary font-semibold">
                            {activeChat?.participant.username?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-text-primary truncate">
                          @{activeChat?.participant.username || 'Пользователь'}
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-3xl mb-2">💬</div>
                        <p className="text-sm text-text-secondary">Напишите первое сообщение</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderId === user?.id || msg.senderId === user?.uuid;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                                isMine
                                  ? 'bg-primary text-white rounded-br-md'
                                  : 'bg-surface-elevated text-text-primary rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                              <div className={`flex items-center gap-1 mt-1 ${
                                isMine ? 'justify-end' : 'justify-start'
                              }`}>
                                <span className={`text-xs ${isMine ? 'text-white/70' : 'text-text-muted'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {msg.readAt && isMine && (
                                  <span className={`text-xs ${isMine ? 'text-white/70' : 'text-text-muted'}`}>
                                    ✓✓
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSend} className="pt-4 border-t border-border shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Напишите сообщение..."
                        className="input-field flex-1"
                        maxLength={2000}
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!text.trim() || sending}
                        className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="card flex items-center justify-center h-[70vh]">
                  <div className="text-center">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-text-secondary">Выберите диалог из списка</p>
                    <p className="text-xs text-text-muted mt-1">
                      Или начните новый из профиля пользователя
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    }>
      <ChatsContent />
    </Suspense>
  );
}