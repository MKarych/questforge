"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PlaySessionPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const client_1 = require("@/lib/api/client");
const Header_1 = __importDefault(require("@/components/ui/Header"));
const Timer_1 = __importDefault(require("@/components/game/Timer"));
const HintsPanel_1 = __importDefault(require("@/components/game/HintsPanel"));
const ProgressBar_1 = __importDefault(require("@/components/game/ProgressBar"));
const Feedback_1 = __importDefault(require("@/components/game/Feedback"));
const useGameSession_1 = require("@/hooks/useGameSession");
// Mock node data - in real implementation this comes from backend
const MOCK_NODE_DATA = {
    'node-1': {
        id: 'node-1',
        type: 'TEXT',
        title: 'Первое задание',
        description: 'Найдите код на памятнике. Посмотрите на постамент с северной стороны.',
        timeout: 120,
        maxAttempts: 3,
        hints: [
            { level: 1, text: 'Посмотрите на постамент', penalty: -2, unlockedAt: 30 },
            { level: 2, text: 'Код выгравирован на бронзовой табличке', penalty: -5, unlockedAt: 60 },
            { level: 3, text: 'Код состоит из 4 цифр', penalty: -10, unlockedAt: 90 },
        ],
    },
    'node-2': {
        id: 'node-2',
        type: 'CODE',
        title: 'Второе задание',
        description: 'Введите координаты места, где был сделан первый снимок.',
        timeout: 180,
        maxAttempts: 3,
        hints: [
            { level: 1, text: 'Это место в центре города', penalty: -2, unlockedAt: 30 },
            { level: 2, text: 'Рядом с главной площадью', penalty: -5, unlockedAt: 60 },
            { level: 3, text: '55.7558, 37.6173', penalty: -10, unlockedAt: 90 },
        ],
    },
};
function PlaySessionPage() {
    const params = (0, navigation_1.useParams)();
    const router = (0, navigation_1.useRouter)();
    const sessionId = params.sessionId;
    const shareLink = params.shareLink;
    const [sessionState, setSessionState] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [answer, setAnswer] = (0, react_1.useState)('');
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [currentNodeData, setCurrentNodeData] = (0, react_1.useState)(null);
    const [totalNodes] = (0, react_1.useState)(10);
    const [currentNodeIndex, setCurrentNodeIndex] = (0, react_1.useState)(1);
    const [hintPenalty, setHintPenalty] = (0, react_1.useState)(0);
    const [transitionFeedback, setTransitionFeedback] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        async function loadState() {
            try {
                const response = await (0, client_1.getSessionState)(sessionId);
                setSessionState(response.data);
                // Load node data (in real implementation from backend)
                const nodeData = MOCK_NODE_DATA[response.data.currentNodeId] || {
                    id: response.data.currentNodeId,
                    type: 'TEXT',
                    title: `Задание`,
                    description: 'Текст задания загружается из сценария...',
                    timeout: 120,
                    maxAttempts: 3,
                    hints: [
                        { level: 1, text: 'Подсказка 1', penalty: -2, unlockedAt: 30 },
                        { level: 2, text: 'Подсказка 2', penalty: -5, unlockedAt: 60 },
                        { level: 3, text: 'Подсказка 3', penalty: -10, unlockedAt: 90 },
                    ],
                };
                setCurrentNodeData(nodeData);
            }
            catch (err) {
                console.error('Failed to load session state:', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadState();
    }, [sessionId]);
    const handleTimeout = (0, react_1.useCallback)(() => {
        setTransitionFeedback({
            type: 'error',
            message: 'Время вышло!',
            points: -5,
        });
        // Auto-advance to next node would happen here via backend
        setTimeout(() => {
            router.push(`/play/${shareLink}/${sessionId}/finish`);
        }, 2000);
    }, [shareLink, sessionId, router]);
    const handleHintUsed = (0, react_1.useCallback)((_level, penalty) => {
        setHintPenalty((prev) => prev + Math.abs(penalty));
        setTransitionFeedback({
            type: 'error',
            message: `Подсказка использована!`,
            points: penalty,
        });
    }, []);
    const handleSubmitAnswer = (0, react_1.useCallback)(async (answerText) => {
        if (!sessionState)
            return;
        setSubmitting(true);
        try {
            const response = await (0, client_1.submitAnswer)(sessionState.teamId, sessionState.sessionId, // gameId — sessionId is used as gameId reference
            sessionState.currentNodeId, answerText);
            // Update session state
            setSessionState({
                ...sessionState,
                score: response.data.score,
                penalties: response.data.penalties,
                currentNodeId: response.data.nextNode?.id || sessionState.currentNodeId,
                history: response.data.history,
            });
            // Check if finished
            if (response.data.status === 'finished') {
                setTransitionFeedback({
                    type: 'success',
                    message: 'Игра завершена!',
                    points: response.data.score,
                });
                setTimeout(() => {
                    router.push(`/play/${shareLink}/${sessionId}/finish`);
                }, 2000);
                return;
            }
            // Show feedback
            const points = response.data.status === 'success'
                ? (response.data.score - sessionState.score)
                : -3;
            setTransitionFeedback({
                type: response.data.status === 'success' ? 'success' : 'error',
                message: response.data.status === 'success' ? 'Правильно!' : 'Неверно',
                points,
            });
            // Update node index for progress
            if (response.data.status === 'success') {
                setCurrentNodeIndex((prev) => prev + 1);
            }
            setAnswer('');
        }
        catch (err) {
            console.error('Failed to submit answer:', err);
        }
        finally {
            setSubmitting(false);
        }
    }, [sessionState, shareLink, sessionId, router]);
    const handleFormSubmit = (0, react_1.useCallback)(async (e) => {
        e.preventDefault();
        if (!answer.trim())
            return;
        await handleSubmitAnswer(answer.trim());
    }, [answer, handleSubmitAnswer]);
    const { timeLeft, hasTimedOut, unlockedHints, usedHints, useHint, attempts, maxAttempts, feedback, isTransitioning, } = (0, useGameSession_1.useGameSession)(currentNodeData, {
        onTimeout: handleTimeout,
        onHintUsed: handleHintUsed,
        onAnswerSubmit: handleSubmitAnswer,
    });
    if (loading) {
        return (<div className="min-h-screen">
        <Header_1.default />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded mb-4 w-1/2"/>
            <div className="h-4 bg-surface rounded mb-2 w-3/4"/>
            <div className="h-64 bg-surface rounded-xl"/>
          </div>
        </div>
      </div>);
    }
    if (!sessionState || !currentNodeData) {
        return (<div className="min-h-screen">
        <Header_1.default />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">Сессия не найдена</p>
            <link_1.default href="/games" className="btn-primary">
              Вернуться к каталогу
            </link_1.default>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      <Header_1.default />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Top Bar: Score & Timer */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Score */}
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary">{sessionState.score}</div>
            <div className="text-xs text-text-secondary">Очки</div>
          </div>
          
          {/* Timer */}
          <div className="flex justify-center">
            <Timer_1.default seconds={timeLeft} totalSeconds={currentNodeData.timeout || 120} showCircular={true}/>
          </div>
          
          {/* Penalties */}
          <div className="card text-center">
            <div className="text-3xl font-bold text-error">
              {sessionState.penalties + hintPenalty}
            </div>
            <div className="text-xs text-text-secondary">Штрафы</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar_1.default current={currentNodeIndex} total={totalNodes} difficulty="medium"/>
        </div>

        {/* Feedback Overlay */}
        {(feedback || transitionFeedback) && (<Feedback_1.default type={feedback?.type || transitionFeedback.type} message={feedback?.message || transitionFeedback.message} points={feedback?.points || transitionFeedback.points} visible={!!(feedback || transitionFeedback)}/>)}

        {/* Task Card */}
        <div className={`card mb-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary">
              {currentNodeData.title}
            </h2>
            <span className="text-sm text-text-secondary bg-surface px-3 py-1 rounded-full">
              {currentNodeData.type}
            </span>
          </div>
          
          <p className="text-text-secondary mb-6 text-lg leading-relaxed">
            {currentNodeData.description}
          </p>

          {/* Attempts indicator */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-text-secondary">Попытки:</span>
            <div className="flex gap-1">
              {[...Array(maxAttempts)].map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full ${i < attempts ? 'bg-error' : 'bg-surface border border-border'}`}/>))}
            </div>
          </div>

          {/* Answer Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="label">Ваш ответ</label>
              <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Введите ответ" className="input-field text-lg" disabled={submitting || hasTimedOut || attempts >= maxAttempts} autoFocus/>
            </div>
            
            {hasTimedOut && (<div className="text-error text-sm text-center">
                ⏰ Время вышло! Переход к следующему заданию...
              </div>)}
            
            {attempts >= maxAttempts && (<div className="text-error text-sm text-center">
                ❌ Превышено количество попыток
              </div>)}
            
            <button type="submit" disabled={submitting || !answer.trim() || hasTimedOut || attempts >= maxAttempts} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3">
              {submitting ? 'Отправка...' : 'Отправить ответ'}
            </button>
          </form>
        </div>

        {/* Hints Panel */}
        {currentNodeData.hints && (<HintsPanel_1.default hints={currentNodeData.hints} unlockedLevels={unlockedHints} usedLevels={usedHints} onUseHint={useHint} currentPenalty={hintPenalty}/>)}

        {/* History */}
        {sessionState.history.length > 0 && (<div className="card mt-6">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">История прохождений</h3>
            <div className="space-y-2">
              {sessionState.history.map((entry, index) => (<div key={index} className={`flex items-center justify-between p-3 rounded-lg ${entry.result === 'success' ? 'bg-success/10' : 'bg-error/10'}`}>
                  <span className="text-sm text-text-secondary">
                    Задание {entry.nodeId}
                  </span>
                  <div className="flex items-center gap-3">
                    {entry.score && (<span className={`text-sm font-bold ${entry.score > 0 ? 'text-success' : 'text-error'}`}>
                        {entry.score > 0 ? '+' : ''}{entry.score}
                      </span>)}
                    <span className={`text-lg font-bold ${entry.result === 'success' ? 'text-success' : 'text-error'}`}>
                      {entry.result === 'success' ? '✓' : '✗'}
                    </span>
                  </div>
                </div>))}
            </div>
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map