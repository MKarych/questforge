// ============================================================
// Multiplayer Engine Tests (spec 3.1)
// ============================================================

import {
  MultiplayerEngine,
  VotingSession,
  AuctionSession,
  ChoiceSession,
  ChallengeSession,
  VotingResults,
  AuctionResult,
  ChallengeResult,
} from '../runtime-engine';

// ==================== Voting Tests ====================

describe('MultiplayerEngine — Voting', () => {
  let engine: MultiplayerEngine;

  beforeEach(() => {
    engine = new MultiplayerEngine();
  });

  it('должен создать сессию голосования с 2 вариантами', () => {
    const session = engine.startVoting({
      id: 'vote-1',
      options: ['Вариант А', 'Вариант Б'],
      duration: 60,
    });

    expect(session.id).toBe('vote-1');
    expect(session.status).toBe('active');
    expect(session.options).toEqual(['Вариант А', 'Вариант Б']);
    expect(session.duration).toBe(60);
    expect(session.votes).toEqual({});
    expect(session.results).toEqual({ 0: 0, 1: 0 });
  });

  it('должен принимать голоса 3 игроков и подсчитывать результаты', () => {
    engine.startVoting({
      id: 'vote-2',
      options: ['Вариант А', 'Вариант Б'],
      duration: 60,
    });

    // 3 игрока голосуют
    expect(engine.castVote('vote-2', 'player-1', 0)).toBe(true);
    expect(engine.castVote('vote-2', 'player-2', 1));
    expect(engine.castVote('vote-2', 'player-3', 0));

    const results = engine.getVotingResults('vote-2');
    expect(results).not.toBeNull();
    expect(results!.results[0]).toBe(2); // Вариант А — 2 голоса
    expect(results!.results[1]).toBe(1); // Вариант Б — 1 голос
    expect(results!.winnerIndex).toBe(0); // Победитель — Вариант А
  });

  it('должен возвращать null при ничьей', () => {
    engine.startVoting({
      id: 'vote-3',
      options: ['Вариант А', 'Вариант Б'],
      duration: 60,
    });

    engine.castVote('vote-3', 'player-1', 0);
    engine.castVote('vote-3', 'player-2', 1);

    const results = engine.getVotingResults('vote-3');
    expect(results!.winnerIndex).toBeNull(); // Ничья
  });

  it('должен позволять переголосование (замена голоса)', () => {
    engine.startVoting({
      id: 'vote-4',
      options: ['Вариант А', 'Вариант Б'],
      duration: 60,
    });

    engine.castVote('vote-4', 'player-1', 0);
    engine.castVote('vote-4', 'player-1', 1); // меняет голос

    const results = engine.getVotingResults('vote-4');
    expect(results!.results[0]).toBe(0); // Вариант А — 0
    expect(results!.results[1]).toBe(1); // Вариант Б — 1
  });

  it('должен отклонять голос за пределами допустимых вариантов', () => {
    engine.startVoting({
      id: 'vote-5',
      options: ['Вариант А', 'Вариант Б'],
      duration: 60,
    });

    expect(engine.castVote('vote-5', 'player-1', 5)).toBe(false); // Невалидный индекс
  });

  it('должен завершать голосование принудительно', () => {
    engine.startVoting({
      id: 'vote-6',
      options: ['Да', 'Нет'],
      duration: 60,
    });

    engine.castVote('vote-6', 'player-1', 0);
    const completed = engine.completeVoting('vote-6');
    expect(completed!.status).toBe('completed');

    // После завершения голоса не принимаются
    expect(engine.castVote('vote-6', 'player-2', 1)).toBe(false);
  });
});

// ==================== Auction Tests ====================

describe('MultiplayerEngine — Auction', () => {
  let engine: MultiplayerEngine;

  beforeEach(() => {
    engine = new MultiplayerEngine();
  });

  it('должен создать сессию аукциона с начальными параметрами', () => {
    const session = engine.startAuction({
      id: 'auc-1',
      itemName: 'Магический артефакт',
      startingBid: 100,
      minBidStep: 10,
      currency: 'монет',
      duration: 120,
    });

    expect(session.id).toBe('auc-1');
    expect(session.status).toBe('active');
    expect(session.startingBid).toBe(100);
    expect(session.minBidStep).toBe(10);
    expect(session.currentBid).toBe(100);
    expect(session.currentWinnerId).toBeNull();
  });

  it('должен принимать ставки и определять победителя', () => {
    engine.startAuction({
      id: 'auc-2',
      itemName: 'Редкий свиток',
      startingBid: 50,
      minBidStep: 5,
      currency: 'монет',
      duration: 120,
    });

    // Игроки делают ставки
    expect(engine.placeBid('auc-2', 'player-1', 50)).toBe(true);
    expect(engine.placeBid('auc-2', 'player-2', 60)).toBe(true);
    expect(engine.placeBid('auc-2', 'player-1', 70)).toBe(true);
    expect(engine.placeBid('auc-2', 'player-3', 100)).toBe(true);

    const result = engine.getAuctionResult('auc-2');
    expect(result).not.toBeNull();
    expect(result!.winnerId).toBe('player-3');
    expect(result!.winningBid).toBe(100);
    expect(result!.totalBids).toBe(4);
    expect(result!.participants).toEqual(['player-1', 'player-2', 'player-3']);
  });

  it('должен отклонять ставки ниже минимального шага', () => {
    engine.startAuction({
      id: 'auc-3',
      itemName: 'Обычный камень',
      startingBid: 100,
      minBidStep: 20,
      currency: 'монет',
      duration: 120,
    });

    expect(engine.placeBid('auc-3', 'player-1', 100)).toBe(true);
    // Ставка 105 — меньше минимального шага (100 + 20 = 120)
    expect(engine.placeBid('auc-3', 'player-2', 105)).toBe(false);
    // Ставка 120 — корректна
    expect(engine.placeBid('auc-3', 'player-2', 120)).toBe(true);
  });

  it('должен завершать аукцион принудительно', () => {
    engine.startAuction({
      id: 'auc-4',
      itemName: 'Тест',
      startingBid: 10,
      minBidStep: 1,
      currency: 'монет',
      duration: 60,
    });

    engine.placeBid('auc-4', 'player-1', 10);
    const completed = engine.completeAuction('auc-4');
    expect(completed!.status).toBe('completed');

    // После завершения ставки не принимаются
    expect(engine.placeBid('auc-4', 'player-2', 20)).toBe(false);
  });

  it('должен возвращать null для несуществующей сессии', () => {
    expect(engine.getAuctionResult('nonexistent')).toBeNull();
  });
});

// ==================== Simultaneous Choice Tests ====================

describe('MultiplayerEngine — Simultaneous Choice', () => {
  let engine: MultiplayerEngine;

  beforeEach(() => {
    engine = new MultiplayerEngine();
  });

  it('должен создавать сессию одновременного выбора', () => {
    const session = engine.startSimultaneousChoice({
      id: 'choice-1',
      duration: 30,
    });

    expect(session.id).toBe('choice-1');
    expect(session.status).toBe('active');
    expect(session.choices).toEqual({});
  });

  it('должен принимать выборы игроков', () => {
    engine.startSimultaneousChoice({
      id: 'choice-2',
      duration: 30,
    });

    engine.submitChoice('choice-2', 'player-1', 'камень');
    engine.submitChoice('choice-2', 'player-2', 'ножницы');
    engine.submitChoice('choice-2', 'player-3', 'бумага');

    const choices = engine.getChoices('choice-2');
    expect(choices).toEqual({
      'player-1': 'камень',
      'player-2': 'ножницы',
      'player-3': 'бумага',
    });
  });

  it('должен позволять перезапись выбора', () => {
    engine.startSimultaneousChoice({
      id: 'choice-3',
      duration: 30,
    });

    engine.submitChoice('choice-3', 'player-1', 'камень');
    engine.submitChoice('choice-3', 'player-1', 'бумага'); // перезапись

    const choices = engine.getChoices('choice-3');
    expect(choices!['player-1']).toBe('бумага');
  });

  it('должен завершать сессию принудительно', () => {
    engine.startSimultaneousChoice({
      id: 'choice-4',
      duration: 30,
    });

    engine.submitChoice('choice-4', 'player-1', 'A');
    const completed = engine.completeSimultaneousChoice('choice-4');
    expect(completed!.status).toBe('completed');

    // После завершения выборы не принимаются
    expect(engine.submitChoice('choice-4', 'player-2', 'B')).toBe(false);
  });
});

// ==================== Challenge Tests ====================

describe('MultiplayerEngine — Challenge', () => {
  let engine: MultiplayerEngine;

  beforeEach(() => {
    engine = new MultiplayerEngine();
  });

  it('должен создавать сессию челленджа', () => {
    const session = engine.startChallenge({
      id: 'ch-1',
      duration: 60,
    });

    expect(session.id).toBe('ch-1');
    expect(session.status).toBe('active');
    expect(session.results).toEqual([]);
  });

  it('должен принимать результаты игроков и определять победителя', () => {
    engine.startChallenge({
      id: 'ch-2',
      duration: 60,
    });

    engine.completeChallenge('ch-2', 'player-1', 5000);  // 5 сек
    engine.completeChallenge('ch-2', 'player-2', 3000);  // 3 сек — победитель
    engine.completeChallenge('ch-2', 'player-3', 7000);  // 7 сек

    const result = engine.getChallengeResult('ch-2');
    expect(result).not.toBeNull();
    expect(result!.winnerId).toBe('player-2'); // Самый быстрый
    expect(result!.rankings).toHaveLength(3);
    expect(result!.rankings[0].playerId).toBe('player-2');
    expect(result!.rankings[1].playerId).toBe('player-1');
    expect(result!.rankings[2].playerId).toBe('player-3');
  });

  it('должен предотвращать повторную отправку результата игроком', () => {
    engine.startChallenge({
      id: 'ch-3',
      duration: 60,
    });

    expect(engine.completeChallenge('ch-3', 'player-1', 1000)).toBe(true);
    expect(engine.completeChallenge('ch-3', 'player-1', 500)).toBe(false); // повтор
  });

  it('должен возвращать null победителя, если никто не завершил', () => {
    engine.startChallenge({
      id: 'ch-4',
      duration: 60,
    });

    const result = engine.getChallengeResult('ch-4');
    expect(result!.winnerId).toBeNull();
    expect(result!.rankings).toEqual([]);
  });

  it('должен завершать сессию принудительно', () => {
    engine.startChallenge({
      id: 'ch-5',
      duration: 60,
    });

    engine.completeChallenge('ch-5', 'player-1', 2000);
    const completed = engine.completeChallengeSession('ch-5');
    expect(completed!.status).toBe('completed');

    // После завершения результаты не принимаются
    expect(engine.completeChallenge('ch-5', 'player-2', 1000)).toBe(false);
  });
});

// ==================== Sync Timer Tests ====================

describe('MultiplayerEngine — Sync Timer', () => {
  let engine: MultiplayerEngine;

  beforeEach(() => {
    engine = new MultiplayerEngine();
  });

  it('должен запускать синхронизированный таймер', () => {
    engine.startSyncTimer('timer-1', 60);
    const remaining = engine.getRemainingTime('timer-1');
    expect(remaining).toBeGreaterThan(55); // Прошло меньше 5 секунд
    expect(remaining).toBeLessThanOrEqual(60);
  });

  it('должен возвращать 0 для несуществующего таймера', () => {
    expect(engine.getRemainingTime('nonexistent')).toBe(0);
  });

  it('должен останавливать таймер', () => {
    engine.startSyncTimer('timer-2', 60);
    engine.stopSyncTimer('timer-2');
    expect(engine.getRemainingTime('timer-2')).toBe(0);
  });
});

// ==================== Session Management Tests ====================

describe('MultiplayerEngine — Session Management', () => {
  let engine: MultiplayerEngine;

  beforeEach(() => {
    engine = new MultiplayerEngine();
  });

  it('должен возвращать null для несуществующих сессий', () => {
    expect(engine.getVotingSession('nonexistent')).toBeNull();
    expect(engine.getAuctionSession('nonexistent')).toBeNull();
    expect(engine.getChoiceSession('nonexistent')).toBeNull();
    expect(engine.getChallengeSession('nonexistent')).toBeNull();
  });

  it('должен возвращать активные сессии', () => {
    engine.startVoting({ id: 'vote-1', options: ['A', 'B'], duration: 60 });
    engine.startAuction({
      id: 'auc-1',
      itemName: 'Item',
      startingBid: 10,
      minBidStep: 1,
      currency: 'gold',
      duration: 60,
    });
    engine.startSimultaneousChoice({ id: 'choice-1', duration: 30 });
    engine.startChallenge({ id: 'ch-1', duration: 60 });

    expect(engine.getVotingSession('vote-1')?.status).toBe('active');
    expect(engine.getAuctionSession('auc-1')?.status).toBe('active');
    expect(engine.getChoiceSession('choice-1')?.status).toBe('active');
    expect(engine.getChallengeSession('ch-1')?.status).toBe('active');
  });

  it('должен очищать завершённые сессии (cleanup)', () => {
    // Создаём и завершаем сессии
    engine.startVoting({ id: 'vote-old', options: ['A', 'B'], duration: 0 });
    engine.completeVoting('vote-old');

    // Мокаем startedAt в прошлое, чтобы cleanup сработал
    const oldSession = engine.getVotingSession('vote-old') as VotingSession;
    Object.assign(oldSession, { startedAt: Date.now() - 7200000 }); // 2 часа назад

    engine.cleanupCompletedSessions();
    expect(engine.getVotingSession('vote-old')).toBeNull();
  });
});