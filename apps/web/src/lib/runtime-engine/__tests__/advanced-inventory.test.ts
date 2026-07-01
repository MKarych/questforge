import {
  CraftingSystem,
  TradeSystem,
  ItemUseSystem,
  ExecutionEngine,
  GameSession,
  Team,
  ExecutionContext,
} from '../runtime-engine';
import { Scenario, Scene, CraftRecipe, TradeOffer, ItemUseConfig, ItemUseAction, InventoryItem } from '@/lib/editor-store/editor.types';

// ==================== Helpers ====================

function createMockContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  const engine = new ExecutionEngine();
  const team: Team = {
    id: 'team-1',
    name: 'Команда 1',
    captainId: 'player-1',
    members: [{ id: 'player-1', name: 'Игрок 1', role: 'captain' }],
    inventory: { items: [], capacity: 100, maxWeight: 1000, gold: 100 },
    variables: { level: 5 },
    score: 0,
    reputation: 0,
    achievements: [],
  };

  const scenario: Scenario = {
    id: 'scenario-1',
    title: 'Тестовый сценарий',
    description: '',
    status: 'draft',
    scenes: [],
    variables: [],
    metadata: {
      author: { id: 'author-1', name: 'Автор' },
      version: 1,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: { roles: [], timeLimit: 0, maxPlayers: 10, difficulty: 'medium', allowHints: true },
    },
    startSceneId: 'scene-1',
    isTemplate: false,
    isPublished: false,
    rating: 0,
    plays: 0,
    achievements: [],
    roles: [],
    triggers: [],
    parallelScenarios: [],
    syncPoints: [],
    crossScenarioComm: { events: [], globalVariables: [] },
    multiplayerMechanics: [],
    marketplace: undefined,
    schedule: undefined,
    loopConfigs: [],
    subScenarios: [],
    inventoryItems: [],
    craftRecipes: [],
    tradeOffers: [],
    itemUseConfigs: [],
  };

  const session = engine.createSession(scenario, team);

  const scene: Scene = {
    id: 'scene-1',
    title: 'Тестовая сцена',
    type: 'mission',
    missions: [],
    transitions: [],
    conditions: { operator: 'AND', conditions: [] },
    rewards: [],
    metadata: {},
    view: { type: 'single', elements: [] },
    triggers: [],
  };

  return {
    session,
    scene,
    team,
    variables: { ...session.variables, level: 5, health: 100 },
    inventory: team.inventory,
    score: 0,
    timestamp: new Date(),
    roles: [],
    roleAssignments: [],
    ...overrides,
  };
}

function addItemToInventory(context: ExecutionContext, itemId: string, name: string, quantity: number, useable = false): void {
  const item: InventoryItem = {
    id: itemId,
    name,
    description: '',
    quantity,
    icon: '📦',
    type: 'material',
    rarity: 'common',
    stackable: true,
    maxStack: 99,
    useable,
    usableInScenario: false,
    tradeable: true,
    weight: 0,
    effects: [],
  };
  context.team.inventory.items.push(item);
}

// ==================== CraftingSystem Tests ====================

describe('CraftingSystem', () => {
  let craftingSystem: CraftingSystem;
  let context: ExecutionContext;

  beforeEach(() => {
    craftingSystem = new CraftingSystem();
    context = createMockContext();
  });

  describe('registerRecipe / getRecipe / getAllRecipes', () => {
    test('должен регистрировать и возвращать рецепт', () => {
      const recipe: CraftRecipe = {
        id: 'recipe-1',
        name: 'Тестовый рецепт',
        description: 'Описание',
        icon: '🔨',
        category: 'weapon',
        ingredients: [{ itemId: 'wood', itemName: 'Древесина', quantity: 2, consume: true }],
        results: [{ itemId: 'sword', itemName: 'Меч', quantity: 1 }],
        craftTime: 0,
        cooldown: 0,
        successRate: 1,
      };

      craftingSystem.registerRecipe(recipe);
      expect(craftingSystem.getRecipe('recipe-1')).toBeDefined();
      expect(craftingSystem.getRecipe('recipe-1')?.name).toBe('Тестовый рецепт');
      expect(craftingSystem.getAllRecipes()).toHaveLength(1);
    });

    test('должен регистрировать несколько рецептов через registerRecipes', () => {
      const recipes: CraftRecipe[] = [
        { id: 'r1', name: 'Рецепт 1', description: '', icon: '', category: '', ingredients: [], results: [], craftTime: 0, cooldown: 0, successRate: 1 },
        { id: 'r2', name: 'Рецепт 2', description: '', icon: '', category: '', ingredients: [], results: [], craftTime: 0, cooldown: 0, successRate: 1 },
      ];
      craftingSystem.registerRecipes(recipes);
      expect(craftingSystem.getAllRecipes()).toHaveLength(2);
    });
  });

  describe('canCraft', () => {
    test('должен возвращать false если рецепт не найден', () => {
      const result = craftingSystem.canCraft('non-existent', context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('не найден');
    });

    test('должен проверять наличие ингредиентов', () => {
      const recipe: CraftRecipe = {
        id: 'recipe-1',
        name: 'Меч',
        description: '',
        icon: '',
        category: '',
        ingredients: [{ itemId: 'wood', itemName: 'Древесина', quantity: 2, consume: true }],
        results: [{ itemId: 'sword', itemName: 'Меч', quantity: 1 }],
        craftTime: 0,
        cooldown: 0,
        successRate: 1,
      };
      craftingSystem.registerRecipe(recipe);

      // Нет ингредиентов
      expect(craftingSystem.canCraft('recipe-1', context).allowed).toBe(false);

      // Добавляем ингредиенты
      addItemToInventory(context, 'wood', 'Древесина', 2);
      expect(craftingSystem.canCraft('recipe-1', context).allowed).toBe(true);
    });

    test('должен проверять requiredLevel', () => {
      const recipe: CraftRecipe = {
        id: 'recipe-1',
        name: 'Меч',
        description: '',
        icon: '',
        category: '',
        ingredients: [{ itemId: 'wood', itemName: 'Древесина', quantity: 1, consume: true }],
        results: [{ itemId: 'sword', itemName: 'Меч', quantity: 1 }],
        craftTime: 0,
        cooldown: 0,
        successRate: 1,
        requiredLevel: 10,
      };
      craftingSystem.registerRecipe(recipe);
      addItemToInventory(context, 'wood', 'Древесина', 1);

      // Уровень 5, требуется 10
      expect(craftingSystem.canCraft('recipe-1', context).allowed).toBe(false);

      // Повышаем уровень
      context.variables.level = 10;
      expect(craftingSystem.canCraft('recipe-1', context).allowed).toBe(true);
    });

    test('должен проверять cooldown', () => {
      const recipe: CraftRecipe = {
        id: 'recipe-1',
        name: 'Меч',
        description: '',
        icon: '',
        category: '',
        ingredients: [{ itemId: 'wood', itemName: 'Древесина', quantity: 1, consume: true }],
        results: [{ itemId: 'sword', itemName: 'Меч', quantity: 1 }],
        craftTime: 0,
        cooldown: 60000, // 1 минута
        successRate: 1,
      };
      craftingSystem.registerRecipe(recipe);
      addItemToInventory(context, 'wood', 'Древесина', 1);

      // Первый раз — можно
      expect(craftingSystem.canCraft('recipe-1', context).allowed).toBe(true);

      // "Крафтим" (устанавливаем cooldown вручную)
      (craftingSystem as any).craftCooldowns.set('team-1:recipe-1', Date.now());

      // Сразу после крафта — нельзя
      expect(craftingSystem.canCraft('recipe-1', context).allowed).toBe(false);
    });
  });

  describe('craft', () => {
    test('должен успешно создавать предмет из ингредиентов', () => {
      const recipe: CraftRecipe = {
        id: 'recipe-1',
        name: 'Меч',
        description: '',
        icon: '',
        category: '',
        ingredients: [{ itemId: 'wood', itemName: 'Древесина', quantity: 2, consume: true }],
        results: [{ itemId: 'sword', itemName: 'Меч', quantity: 1 }],
        craftTime: 0,
        cooldown: 0,
        successRate: 1,
      };
      craftingSystem.registerRecipe(recipe);
      addItemToInventory(context, 'wood', 'Древесина', 2);

      const result = craftingSystem.craft('recipe-1', context);

      expect(result.success).toBe(true);
      expect(result.itemsLost).toHaveLength(1);
      expect(result.itemsLost[0].itemId).toBe('wood');
      expect(result.itemsLost[0].quantity).toBe(2);

      // Проверяем, что ингредиенты потратились
      expect(context.team.inventory.items.find((i) => i.id === 'wood')).toBeUndefined();

      // Проверяем, что результат появился
      expect(context.team.inventory.items.find((i) => i.id === 'sword')).toBeDefined();
      expect(context.team.inventory.items.find((i) => i.id === 'sword')?.quantity).toBe(1);
    });

    test('должен возвращать failure при неудачном крафте', () => {
      const recipe: CraftRecipe = {
        id: 'recipe-1',
        name: 'Меч',
        description: '',
        icon: '',
        category: '',
        ingredients: [{ itemId: 'wood', itemName: 'Древесина', quantity: 1, consume: true }],
        results: [{ itemId: 'sword', itemName: 'Меч', quantity: 1 }],
        failureResults: [{ itemId: 'scrap', itemName: 'Обломки', quantity: 1 }],
        craftTime: 0,
        cooldown: 0,
        successRate: 0, // Всегда провал
      };
      craftingSystem.registerRecipe(recipe);
      addItemToInventory(context, 'wood', 'Древесина', 1);

      const result = craftingSystem.craft('recipe-1', context);

      expect(result.success).toBe(false);
      // Должны получить failure results
      expect(context.team.inventory.items.find((i) => i.id === 'scrap')).toBeDefined();
    });

    test('должен возвращать ошибку если рецепт не найден', () => {
      const result = craftingSystem.craft('non-existent', context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('не найден');
    });
  });

  describe('getAvailableRecipes', () => {
    test('должен возвращать только доступные рецепты', () => {
      const recipe1: CraftRecipe = {
        id: 'r1', name: 'Доступный', description: '', icon: '', category: '',
        ingredients: [{ itemId: 'wood', itemName: 'Древесина', quantity: 1, consume: true }],
        results: [{ itemId: 'sword', itemName: 'Меч', quantity: 1 }],
        craftTime: 0, cooldown: 0, successRate: 1,
      };
      const recipe2: CraftRecipe = {
        id: 'r2', name: 'Недоступный', description: '', icon: '', category: '',
        ingredients: [{ itemId: 'diamond', itemName: 'Алмаз', quantity: 1, consume: true }],
        results: [{ itemId: 'staff', itemName: 'Посох', quantity: 1 }],
        craftTime: 0, cooldown: 0, successRate: 1,
      };

      craftingSystem.registerRecipes([recipe1, recipe2]);
      addItemToInventory(context, 'wood', 'Древесина', 1);

      const available = craftingSystem.getAvailableRecipes(context);
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('r1');
    });
  });
});

// ==================== TradeSystem Tests ====================

describe('TradeSystem', () => {
  let tradeSystem: TradeSystem;
  let context: ExecutionContext;

  beforeEach(() => {
    tradeSystem = new TradeSystem();
    context = createMockContext();
  });

  test('должен создавать предложение обмена', () => {
    const offer = tradeSystem.createOffer({
      fromTeamId: 'team-1',
      offeredItems: [{ itemId: 'wood', quantity: 5 }],
      requestedItems: [{ itemId: 'stone', quantity: 3 }],
    });

    expect(offer.id).toBeDefined();
    expect(offer.status).toBe('open');
    expect(offer.fromTeamId).toBe('team-1');
  });

  test('должен принимать предложение и выполнять обмен', () => {
    addItemToInventory(context, 'wood', 'Древесина', 10);
    addItemToInventory(context, 'stone', 'Камень', 5);

    const offer = tradeSystem.createOffer({
      fromTeamId: 'team-1',
      offeredItems: [{ itemId: 'wood', quantity: 3 }],
      requestedItems: [{ itemId: 'stone', quantity: 2 }],
    });

    const result = tradeSystem.acceptOffer(offer.id, context);

    expect(result.success).toBe(true);

    // Проверяем, что wood уменьшился (отдали)
    const wood = context.team.inventory.items.find((i) => i.id === 'wood');
    expect(wood?.quantity).toBe(7); // 10 - 3

    // Проверяем, что stone уменьшился (забрали)
    const stone = context.team.inventory.items.find((i) => i.id === 'stone');
    expect(stone?.quantity).toBe(3); // 5 - 2
  });

  test('должен отклонять предложение', () => {
    const offer = tradeSystem.createOffer({
      fromTeamId: 'team-1',
      offeredItems: [{ itemId: 'wood', quantity: 1 }],
      requestedItems: [],
    });

    const result = tradeSystem.declineOffer(offer.id);
    expect(result.success).toBe(true);
    expect(tradeSystem.getOffer(offer.id)?.status).toBe('declined');
  });

  test('должен отменять предложение', () => {
    const offer = tradeSystem.createOffer({
      fromTeamId: 'team-1',
      offeredItems: [{ itemId: 'wood', quantity: 1 }],
      requestedItems: [],
    });

    const result = tradeSystem.cancelOffer(offer.id, 'team-1');
    expect(result.success).toBe(true);
    expect(tradeSystem.getOffer(offer.id)?.status).toBe('cancelled');
  });

  test('должен возвращать ошибку при недостатке предметов', () => {
    const offer = tradeSystem.createOffer({
      fromTeamId: 'team-1',
      offeredItems: [{ itemId: 'wood', quantity: 100 }], // Нет столько
      requestedItems: [],
    });

    const result = tradeSystem.acceptOffer(offer.id, context);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Недостаточно');
  });

  test('должен получать предложения по команде', () => {
    tradeSystem.createOffer({ fromTeamId: 'team-1', offeredItems: [], requestedItems: [] });
    tradeSystem.createOffer({ fromTeamId: 'team-2', offeredItems: [], requestedItems: [] });

    expect(tradeSystem.getOpenOffers()).toHaveLength(2);
    expect(tradeSystem.getOffersByTeam('team-1')).toHaveLength(1);
    expect(tradeSystem.getOffersByTeam('team-2')).toHaveLength(1);
  });

  test('должен очищать просроченные предложения', () => {
    const offer = tradeSystem.createOffer({
      fromTeamId: 'team-1',
      offeredItems: [],
      requestedItems: [],
      expiresAt: Date.now() - 1000, // Просрочено
    });

    tradeSystem.cleanupExpired();
    expect(tradeSystem.getOffer(offer.id)?.status).toBe('expired');
  });
});

// ==================== ItemUseSystem Tests ====================

describe('ItemUseSystem', () => {
  let itemUseSystem: ItemUseSystem;
  let context: ExecutionContext;

  beforeEach(() => {
    itemUseSystem = new ItemUseSystem();
    context = createMockContext();
  });

  test('должен регистрировать конфигурацию использования', () => {
    const config: ItemUseConfig = {
      itemId: 'potion',
      actions: [{ type: 'heal', value: 50, target: 'self', description: 'Лечит 50 HP' }],
      consumeOnUse: true,
      quantity: 1,
      cooldown: 0,
      requireConfirmation: false,
      requireTargetSelection: false,
    };

    itemUseSystem.registerItemUse(config);
    expect(itemUseSystem.getItemUseConfig('potion')).toBeDefined();
  });

  test('canUse должен проверять наличие предмета', () => {
    const config: ItemUseConfig = {
      itemId: 'potion',
      actions: [{ type: 'heal', value: 50, target: 'self', description: '' }],
      consumeOnUse: true,
      quantity: 1,
      cooldown: 0,
      requireConfirmation: false,
      requireTargetSelection: false,
    };

    itemUseSystem.registerItemUse(config);

    // Нет предмета
    expect(itemUseSystem.canUse('potion', context).allowed).toBe(false);

    // Добавляем предмет, но он не useable
    addItemToInventory(context, 'potion', 'Зелье', 1, false);
    expect(itemUseSystem.canUse('potion', context).allowed).toBe(false);

    // Делаем предмет useable
    const potion = context.team.inventory.items.find((i) => i.id === 'potion')!;
    potion.useable = true;
    expect(itemUseSystem.canUse('potion', context).allowed).toBe(true);
  });

  test('должен использовать предмет и применять эффект heal', () => {
    const config: ItemUseConfig = {
      itemId: 'potion',
      actions: [{ type: 'heal', value: 50, target: 'self', description: 'Лечит 50 HP' }],
      consumeOnUse: true,
      quantity: 1,
      cooldown: 0,
      requireConfirmation: false,
      requireTargetSelection: false,
    };

    itemUseSystem.registerItemUse(config);
    addItemToInventory(context, 'potion', 'Зелье', 1, true);

    context.variables['health'] = 50;

    const result = itemUseSystem.useItem('potion', context);

    expect(result.success).toBe(true);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].type).toBe('heal');

    // Здоровье должно увеличиться
    expect(context.variables['health']).toBe(100);

    // Предмет должен потратиться
    expect(context.team.inventory.items.find((i) => i.id === 'potion')).toBeUndefined();
  });

  test('должен применять эффект buff', () => {
    const config: ItemUseConfig = {
      itemId: 'buff_scroll',
      actions: [{ type: 'buff', value: 'strength', target: 'self', duration: 30000, description: 'Сила' }],
      consumeOnUse: true,
      quantity: 1,
      cooldown: 0,
      requireConfirmation: false,
      requireTargetSelection: false,
    };

    itemUseSystem.registerItemUse(config);
    addItemToInventory(context, 'buff_scroll', 'Свиток силы', 1, true);

    const result = itemUseSystem.useItem('buff_scroll', context);

    expect(result.success).toBe(true);
    expect(context.variables['buff_strength']).toBeDefined();
    expect(context.variables['buff_strength'].active).toBe(true);
    expect(context.variables['buff_strength'].duration).toBe(30000);
  });

  test('должен применять эффект teleport', () => {
    const config: ItemUseConfig = {
      itemId: 'scroll',
      actions: [{ type: 'teleport', value: 'scene-5', target: 'self', description: 'Телепорт' }],
      consumeOnUse: true,
      quantity: 1,
      cooldown: 0,
      requireConfirmation: false,
      requireTargetSelection: false,
    };

    itemUseSystem.registerItemUse(config);
    addItemToInventory(context, 'scroll', 'Свиток телепорта', 1, true);

    const result = itemUseSystem.useItem('scroll', context);

    expect(result.success).toBe(true);
    expect(context.variables['_teleportTo']).toBe('scene-5');
  });

  test('должен проверять cooldown', () => {
    const config: ItemUseConfig = {
      itemId: 'potion',
      actions: [{ type: 'heal', value: 10, target: 'self', description: '' }],
      consumeOnUse: false,
      quantity: 1,
      cooldown: 60000, // 1 минута
      requireConfirmation: false,
      requireTargetSelection: false,
    };

    itemUseSystem.registerItemUse(config);
    addItemToInventory(context, 'potion', 'Зелье', 5, true);

    // Первый раз — можно
    expect(itemUseSystem.canUse('potion', context).allowed).toBe(true);

    // "Используем"
    itemUseSystem.useItem('potion', context);

    // Сразу после — нельзя
    expect(itemUseSystem.canUse('potion', context).allowed).toBe(false);
  });

  test('getUsableItems должен возвращать только доступные предметы', () => {
    const config: ItemUseConfig = {
      itemId: 'potion',
      actions: [{ type: 'heal', value: 10, target: 'self', description: '' }],
      consumeOnUse: false,
      quantity: 1,
      cooldown: 0,
      requireConfirmation: false,
      requireTargetSelection: false,
    };

    itemUseSystem.registerItemUse(config);
    addItemToInventory(context, 'potion', 'Зелье', 1, true);
    addItemToInventory(context, 'rock', 'Камень', 1, false); // Не useable

    const usable = itemUseSystem.getUsableItems(context);
    expect(usable).toHaveLength(1);
    expect(usable[0].id).toBe('potion');
  });

  test('должен проверять allowedScenes', () => {
    const config: ItemUseConfig = {
      itemId: 'potion',
      actions: [{ type: 'heal', value: 10, target: 'self', description: '' }],
      consumeOnUse: false,
      quantity: 1,
      cooldown: 0,
      requireConfirmation: false,
      requireTargetSelection: false,
      allowedScenes: ['scene-2'], // Только в scene-2
    };

    itemUseSystem.registerItemUse(config);
    addItemToInventory(context, 'potion', 'Зелье', 1, true);

    // Сейчас мы в scene-1
    expect(itemUseSystem.canUse('potion', context).allowed).toBe(false);

    // Меняем сцену
    context.session.currentSceneId = 'scene-2';
    expect(itemUseSystem.canUse('potion', context).allowed).toBe(true);
  });
});