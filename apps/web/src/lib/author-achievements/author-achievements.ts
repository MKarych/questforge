'use client';

export interface AuthorAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: AuthorStats) => boolean;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface AuthorStats {
  scenariosCreated: number;
  scenariosPublished: number;
  totalMissions: number;
  totalScenes: number;
  totalEdges: number;
  totalVariables: number;
  totalAchievements: number;
  totalDialogueNodes: number;
  totalMediaNodes: number;
  totalInventoryNodes: number;
  editorTimeMinutes: number;
}

export const AUTHOR_ACHIEVEMENTS: AuthorAchievement[] = [
  {
    id: 'first_scenario',
    name: 'Первый шаг',
    description: 'Создайте свой первый сценарий',
    icon: '🌱',
    condition: (s) => s.scenariosCreated >= 1,
    unlocked: false,
  },
  {
    id: 'three_scenarios',
    name: 'Начинающий автор',
    description: 'Создайте 3 сценария',
    icon: '✏️',
    condition: (s) => s.scenariosCreated >= 3,
    unlocked: false,
  },
  {
    id: 'ten_scenarios',
    name: 'Плодовитый автор',
    description: 'Создайте 10 сценариев',
    icon: '📚',
    condition: (s) => s.scenariosCreated >= 10,
    unlocked: false,
  },
  {
    id: 'first_publish',
    name: 'Публикация',
    description: 'Опубликуйте свой первый сценарий',
    icon: '🚀',
    condition: (s) => s.scenariosPublished >= 1,
    unlocked: false,
  },
  {
    id: 'hundred_missions',
    name: 'Мастер заданий',
    description: 'Создайте 100 миссий',
    icon: '🎯',
    condition: (s) => s.totalMissions >= 100,
    unlocked: false,
  },
  {
    id: 'fifty_scenes',
    name: 'Архитектор',
    description: 'Создайте 50 сцен',
    icon: '🏗️',
    condition: (s) => s.totalScenes >= 50,
    unlocked: false,
  },
  {
    id: 'complex_web',
    name: 'Паутина',
    description: 'Создайте сценарий с 20+ связями',
    icon: '🕸️',
    condition: (s) => s.totalEdges >= 20,
    unlocked: false,
  },
  {
    id: 'media_master',
    name: 'Медиа-магнат',
    description: 'Используйте 10+ медиа-блоков',
    icon: '🎬',
    condition: (s) => s.totalMediaNodes >= 10,
    unlocked: false,
  },
  {
    id: 'inventory_king',
    name: 'Инвентаризатор',
    description: 'Создайте 15+ блоков инвентаря',
    icon: '🎒',
    condition: (s) => s.totalInventoryNodes >= 15,
    unlocked: false,
  },
  {
    id: 'storyteller',
    name: 'Рассказчик',
    description: 'Создайте 5+ диалоговых сцен',
    icon: '💬',
    condition: (s) => s.totalDialogueNodes >= 5,
    unlocked: false,
  },
  {
    id: 'achievement_hunter',
    name: 'Охотник за достижениями',
    description: 'Создайте 10+ достижений в сценариях',
    icon: '🏆',
    condition: (s) => s.totalAchievements >= 10,
    unlocked: false,
  },
  {
    id: 'hour_in_editor',
    name: 'Творец',
    description: 'Проведите 1 час в редакторе',
    icon: '⏰',
    condition: (s) => s.editorTimeMinutes >= 60,
    unlocked: false,
  },
  {
    id: 'five_hours',
    name: 'Одержимый',
    description: 'Проведите 5 часов в редакторе',
    icon: '🔥',
    condition: (s) => s.editorTimeMinutes >= 300,
    unlocked: false,
  },
  {
    id: 'variable_master',
    name: 'Программист',
    description: 'Создайте 20+ переменных',
    icon: '⚙️',
    condition: (s) => s.totalVariables >= 20,
    unlocked: false,
  },
];

export function checkAchievements(stats: AuthorStats, unlockedIds: string[]): AuthorAchievement[] {
  return AUTHOR_ACHIEVEMENTS
    .filter((a) => !unlockedIds.includes(a.id))
    .filter((a) => a.condition(stats))
    .map((a) => ({ ...a, unlocked: true, unlockedAt: Date.now() }));
}

export function computeStats(scenarios: any[]): AuthorStats {
  let totalMissions = 0;
  let totalScenes = 0;
  let totalEdges = 0;
  let totalVariables = 0;
  let totalAchievements = 0;
  let totalDialogueNodes = 0;
  let totalMediaNodes = 0;
  let totalInventoryNodes = 0;

  for (const scenario of scenarios) {
    const scenes = scenario.scenes || [];
    totalScenes += scenes.length;
    totalEdges += (scenario.edges || []).length;
    totalVariables += (scenario.variables || []).length;

    for (const scene of scenes) {
      const missions = scene.missions || [];
      totalMissions += missions.length;
      if (scene.type === 'dialogue') totalDialogueNodes++;
      if (scene.type === 'slide') totalMediaNodes++;

      for (const mission of missions) {
        if (mission.type === 'achievement') totalAchievements++;
        if (mission.type?.startsWith('inventory_')) totalInventoryNodes++;
      }
    }
  }

  return {
    scenariosCreated: scenarios.length,
    scenariosPublished: scenarios.filter((s: any) => s.published).length,
    totalMissions,
    totalScenes,
    totalEdges,
    totalVariables,
    totalAchievements,
    totalDialogueNodes,
    totalMediaNodes,
    totalInventoryNodes,
    editorTimeMinutes: 0,
  };
}