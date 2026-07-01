'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { askQuestion, getQuestions, sendChatMessage, getChatMessages, getOrganizerMessages } from '@/lib/api/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface GameChatProps {
  gameId: string;
  isOrganizer?: boolean;
}

export default function GameChat({ gameId, isOrganizer = false }: GameChatProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'questions'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'chat') {
        const [chatRes, orgRes] = await Promise.allSettled([
          getChatMessages(gameId),
          isOrganizer ? getOrganizerMessages(gameId) : Promise.resolve(null),
        ]);
        const chatMessages = (chatRes as any).value?.data || [];
        const orgMessages = orgRes && (orgRes as any).value?.data || [];
        setMessages([...chatMessages, ...orgMessages].sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ));
      } else {
        const res = await getQuestions(gameId);
        setQuestions(res.data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [gameId, activeTab, isOrganizer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, questions]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      if (activeTab === 'chat') {
        await sendChatMessage(gameId, text);
      } else {
        await askQuestion(gameId, text);
      }
      setText('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card flex flex-col h-[400px]">
      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Чат
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'questions'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Вопросы организатору
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button onClick={loadData} className="text-primary text-xs hover:underline">
              Попробовать снова
            </button>
          </div>
        ) : activeTab === 'chat' && messages.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">Сообщений пока нет</p>
        ) : activeTab === 'questions' && questions.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">Вопросов пока нет</p>
        ) : activeTab === 'chat' ? (
          messages.map((msg: any) => (
            <div key={msg.id} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                {msg.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-primary">{msg.user?.name || 'Пользователь'}</span>
                  <span className="text-[10px] text-text-secondary/60">
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{msg.text}</p>
              </div>
            </div>
          ))
        ) : (
          questions.map((q: any) => (
            <div key={q.id} className="card p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-primary">{q.user?.name || 'Игрок'}</span>
                  <span className="text-[10px] text-text-secondary/60">
                    {new Date(q.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-secondary">{q.text}</p>
              {q.answer && (
                <div className="mt-2 p-2 bg-primary/5 border border-primary/10 rounded-lg">
                  <p className="text-xs text-primary font-medium mb-0.5">Ответ организатора:</p>
                  <p className="text-sm text-text-primary">{q.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border shrink-0 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={activeTab === 'chat' ? 'Написать сообщение...' : 'Задать вопрос...'}
          className="input-field flex-1 text-sm"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {sending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}