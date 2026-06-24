// ============================================================
// OpenRouter AI Client
// Используется для AI-доработки сценариев
// Лимиты проверяются через API /billing/ai-check
// ============================================================

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_BASE = '/api';

const STORAGE_KEY = 'questforge_ai_usage';

interface AiUsageData {
  generationsUsed: number;
  date: string; // ISO date string (YYYY-MM-DD)
  lastGenerationAt: string | null;
}

interface AiCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: string;
  error?: string;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage(): AiUsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as AiUsageData;
      if (data.date !== getTodayKey()) {
        const reset: AiUsageData = { generationsUsed: 0, date: getTodayKey(), lastGenerationAt: null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
        return reset;
      }
      return data;
    }
  } catch {
    // ignore
  }
  const initial: AiUsageData = { generationsUsed: 0, date: getTodayKey(), lastGenerationAt: null };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveUsage(data: AiUsageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Получить лимиты AI-генераций через API.
 * Если API недоступен — использует localStorage (3 генерации, FREE).
 */
async function fetchAiLimitsFromApi(): Promise<AiCheckResult | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return null;

    const response = await fetch(`${API_BASE}/billing/ai-check`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;

    const json = await response.json();
    // TransformInterceptor оборачивает в { success, data }
    return json.data || json;
  } catch {
    return null;
  }
}

/**
 * Инкрементировать счётчик AI-генераций на сервере.
 */
async function incrementAiGenerationsOnServer(): Promise<boolean> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return false;

    const response = await fetch(`${API_BASE}/billing/ai-increment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Проверить, может ли пользователь использовать AI.
 * Сначала пытается через API, затем fallback на localStorage.
 */
export async function canUseAiAsync(): Promise<boolean> {
  const apiLimits = await fetchAiLimitsFromApi();
  if (apiLimits) {
    return apiLimits.allowed;
  }
  // Fallback на localStorage
  return getAiGenerationsRemaining() > 0;
}

/**
 * Получить количество оставшихся генераций.
 */
export async function getAiGenerationsRemainingAsync(): Promise<{ remaining: number; limit: number; tier: string }> {
  const apiLimits = await fetchAiLimitsFromApi();
  if (apiLimits) {
    return {
      remaining: apiLimits.remaining,
      limit: apiLimits.limit,
      tier: apiLimits.tier,
    };
  }
  // Fallback
  return {
    remaining: getAiGenerationsRemaining(),
    limit: getAiGenerationsLimit(),
    tier: 'FREE',
  };
}

/**
 * Получить лимит генераций (синхронно, из localStorage).
 */
export function getAiGenerationsRemaining(): number {
  const usage = loadUsage();
  return Math.max(0, 3 - usage.generationsUsed);
}

export function getAiGenerationsUsed(): number {
  return loadUsage().generationsUsed;
}

export function getAiGenerationsLimit(): number {
  return 3;
}

export function canUseAi(): boolean {
  return getAiGenerationsRemaining() > 0;
}

/**
 * Генерация сценария через OpenRouter.
 * Проверяет лимиты через API перед генерацией.
 */
export async function generateScenario(
  prompt: string,
  currentScenarioJson: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Проверка лимита через API
  const apiLimits = await fetchAiLimitsFromApi();

  if (apiLimits) {
    if (!apiLimits.allowed) {
      return { success: false, error: apiLimits.error || '❌ Лимит генераций исчерпан. Купите PRO для большего количества.' };
    }
  } else {
    // Fallback на localStorage
    if (!canUseAi()) {
      return { success: false, error: '❌ Лимит генераций исчерпан. Купите PRO для большего количества.' };
    }
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://questforge.app',
        'X-Title': 'QuestForge',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content: `Ты — помощник по созданию игровых сценариев для платформы QuestForge.
Твоя задача — доработать сценарий по запросу пользователя.
Возвращай ТОЛЬКО JSON, без пояснений, без markdown-разметки.
Формат JSON должен соответствовать структуре сценария: { name, description, scenes: Scene[], edges: Edge[], variables, settings }.
Каждая Scene имеет: id, type, title, description, view, missions, transitions, position, metadata.
Каждая Mission имеет: id, type, title, description, config, rewards, conditions, hints.
Не меняй id существующих сцен и миссий — только их содержимое.
Можешь добавлять новые сцены и миссии если нужно.`,
          },
          {
            role: 'user',
            content: `Вот текущий сценарий: ${currentScenarioJson}. Сделай следующее: ${prompt}. Верни только JSON, без пояснений.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Ошибка API: ${response.status} — ${errorText.slice(0, 200)}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'Пустой ответ от AI' };
    }

    // Парсим JSON из ответа (убираем возможные markdown-обёртки)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    // Сохраняем использование (локально + сервер)
    const usage = loadUsage();
    usage.generationsUsed += 1;
    usage.lastGenerationAt = new Date().toISOString();
    saveUsage(usage);

    // Инкрементим на сервере
    await incrementAiGenerationsOnServer();

    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: `Ошибка: ${err.message || 'Неизвестная ошибка'}` };
  }
}