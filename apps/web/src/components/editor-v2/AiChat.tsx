'use client';

import { useState, useRef, useEffect } from 'react';
import { generateScenario, getAiGenerationsRemaining, getAiGenerationsLimit } from '@/lib/ai/openrouter';

// ==================== Types ====================
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AiChatProps {
  scenarioJson: string | null; // null = новый сценарий, string = доработка
  onApply: (data: any) => void;
  onClose: () => void;
}

// ==================== Quick Prompts ====================
const QUICK_PROMPTS = [
  { icon: '🏙️', text: 'Городской квест по центру Москвы с 10 точками' },
  { icon: '🏫', text: 'Квест для школьников на знание истории' },
  { icon: '🎄', text: 'Новогодний квест для корпоратива' },
  { icon: '📈', text: 'Сделай задания сложнее' },
  { icon: '💡', text: 'Добавь подсказки' },
  { icon: '🎭', text: 'Добавь больше диалогов' },
];

// ==================== Mock fallback ====================
function generateMockScenario(prompt: string) {
  const startScene = {
    id: 'ai-start',
    type: 'location' as const,
    title: 'Старт',
    description: prompt,
    missions: [{
      id: 'ai-mission-1',
      type: 'text' as const,
      title: 'Начало',
      description: 'Напишите "готов" чтобы начать',
      config: { correctAnswer: 'готов', matchMode: 'case_insensitive' as const, maxAttempts: 99 },
      rewards: [],
      conditions: [],
      hints: [],
    }],
    metadata: {},
    view: { type: 'list' as const, config: {} },
    position: { x: 100, y: 100 },
    transitions: [],
  };
  const finishScene = {
    id: 'ai-finish',
    type: 'location' as const,
    title: 'Финиш',
    description: 'Сценарий завершён!',
    missions: [],
    metadata: {},
    view: { type: 'list' as const, config: {} },
    position: { x: 400, y: 100 },
    transitions: [],
  };
  return {
    name: `AI: ${prompt.slice(0, 40)}...`,
    description: prompt,
    scenes: [startScene, finishScene],
    edges: [{ id: 'ai-edge-1', source: startScene.id, target: finishScene.id, type: 'auto' as const }],
    variables: [],
    settings: {
      totalTime: 0,
      defaultPoints: 10,
      defaultPenalty: 0,
      hintLimit: 3,
      maxAttempts: 3,
      variables: [],
    },
  };
}

// ==================== Component ====================
export default function AiChat({ scenarioJson, onApply, onClose }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isEnhance = scenarioJson !== null;
  const remaining = getAiGenerationsRemaining();
  const limit = getAiGenerationsLimit();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Приветственное сообщение
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: isEnhance
            ? '👋 Привет! Я помогу доработать твой сценарий. Что хочешь изменить или добавить?'
            : '👋 Привет! Опиши идею сценария, и я создам структуру для твоего квеста.',
        },
      ]);
    }
  }, []);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || loading) return;

    setPrompt('');
    setError(null);

    // Добавляем сообщение пользователя
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);

    try {
      let result: { success: boolean; data?: any; error?: string };

      if (isEnhance && scenarioJson) {
        // Режим доработки — используем OpenRouter
        result = await generateScenario(text, scenarioJson);
      } else {
        // Режим создания — пробуем OpenRouter, fallback на мок
        try {
          result = await generateScenario(text, '{}');
        } catch {
          result = { success: true, data: generateMockScenario(text) };
        }

        // Если OpenRouter вернул ошибку — используем мок
        if (!result.success) {
          result = { success: true, data: generateMockScenario(text) };
        }
      }

      if (result.success && result.data) {
        setLastResult(result.data);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `✅ Готово! Сценарий "${result.data.name || 'Без названия'}" сгенерирован. Нажми «Применить», чтобы загрузить его в редактор.`,
          },
        ]);
      } else {
        setError(result.error || 'Неизвестная ошибка');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `❌ Ошибка: ${result.error || 'Не удалось сгенерировать сценарий'}`,
          },
        ]);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Неизвестная ошибка';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Ошибка: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
  };

  const handleApply = () => {
    if (lastResult) {
      onApply(lastResult);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in flex flex-col max-h-[80vh]">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xl shadow-lg">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">AI-ассистент</h2>
              <p className="text-[10px] text-text-secondary">
                {isEnhance ? '✨ Доработка существующего сценария' : '✨ Создание нового сценария'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Лимиты */}
            <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${
              remaining > 0
                ? 'bg-primary/5 border-primary/10 text-text-secondary'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <span>🔑</span>
              <span>{remaining}/{limit}</span>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===== Messages ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white rounded-br-md'
                    : 'bg-background-modifier-hover border border-border text-text-primary rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Индикатор печатания */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-background-modifier-hover border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ===== Quick Prompts (чипы) ===== */}
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.text}
                onClick={() => handleQuickPrompt(item.text)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                  prompt === item.text
                    ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                    : 'bg-background-modifier-hover border-border text-text-secondary hover:border-accent-primary/30 hover:text-text-primary'
                }`}
              >
                {item.icon} {item.text}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Input ===== */}
        <div className="p-4 border-t border-border">
          <div className="flex items-end gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEnhance ? 'Что изменить в сценарии?' : 'Опиши идею квеста...'}
              className="flex-1 bg-background-modifier-hover border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/50 min-h-[44px] max-h-[120px]"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !prompt.trim() || remaining === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-1.5"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '➤'
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-text-secondary">
              {remaining === 0
                ? '❌ Лимит генераций исчерпан'
                : `🔒 Осталось ${remaining} из ${limit} генераций сегодня`
              }
            </p>
            {lastResult && (
              <button
                onClick={handleApply}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-all"
              >
                ✅ Применить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}