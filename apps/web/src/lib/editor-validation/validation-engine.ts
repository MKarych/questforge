// ============================================================
// Validation Engine — Валидация сценария в реальном времени
// По спецификации docs/49 (раздел 8) и docs/50 (раздел 9)
// ============================================================

import {
  Scene,
  Edge,
  ValidationResult,
  ValidationError,
} from '../editor-store/editor.types';

export class ValidationEngine {
  /**
   * Полная валидация сценария
   */
  validate(scenes: Scene[], edges: Edge[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Проверка START сцены
    this.checkStartScene(scenes, errors);

    // 2. Проверка FINISH сцены
    this.checkFinishScene(scenes, errors);

    // 3. Проверка достижимости всех сцен (BFS)
    this.checkReachability(scenes, edges, errors, warnings);

    // 4. Проверка на бесконечные циклы
    this.checkInfiniteLoops(scenes, edges, errors);

    // 5. Проверка переходов в никуда
    this.checkBrokenTransitions(scenes, edges, errors);

    // 6. Проверка конфигурации миссий
    this.checkMissionConfigs(scenes, errors);

    // 7. Проверка переменных
    this.checkVariables(scenes, errors);

    // 8. Проверка конфигурации циклов
    this.checkLoopConfigs(scenes, edges, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private checkStartScene(scenes: Scene[], errors: ValidationError[]): void {
    const startScenes = scenes.filter(s => s.type === 'location' && s.title === 'Старт');
    if (startScenes.length === 0) {
      errors.push({
        code: 'NO_START',
        message: 'Сценарий должен иметь стартовую сцену',
        severity: 'error',
      });
    } else if (startScenes.length > 1) {
      errors.push({
        code: 'MULTIPLE_START',
        message: 'Сценарий не может иметь более одной стартовой сцены',
        severity: 'error',
      });
    }
  }

  private checkFinishScene(scenes: Scene[], errors: ValidationError[]): void {
    const finishScenes = scenes.filter(s => s.type === 'location' && s.title === 'Финиш');
    if (finishScenes.length === 0) {
      errors.push({
        code: 'NO_FINISH',
        message: 'Сценарий должен иметь финишную сцену',
        severity: 'error',
      });
    }
  }

  private checkReachability(
    scenes: Scene[],
    edges: Edge[],
    _errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (scenes.length === 0) return;

    const startScene = scenes.find(s => s.type === 'location' && s.title === 'Старт');
    if (!startScene) return;

    // BFS
    const graph = new Map<string, string[]>();
    scenes.forEach(s => graph.set(s.id, []));
    edges.forEach(e => {
      const targets = graph.get(e.source) || [];
      targets.push(e.target);
      graph.set(e.source, targets);
    });

    const reachable = new Set<string>();
    const queue = [startScene.id];
    reachable.add(startScene.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const targets = graph.get(current) || [];
      for (const target of targets) {
        if (!reachable.has(target)) {
          reachable.add(target);
          queue.push(target);
        }
      }
    }

    // Orphan scenes
    for (const scene of scenes) {
      if (!reachable.has(scene.id)) {
        warnings.push({
          code: 'ORPHAN_SCENE',
          sceneId: scene.id,
          message: `Сцена "${scene.title}" недостижима из стартовой сцены`,
          severity: 'warning',
        });
      }
    }
  }

  private checkInfiniteLoops(
    scenes: Scene[],
    edges: Edge[],
    errors: ValidationError[]
  ): void {
    if (scenes.length === 0) return;

    const startScene = scenes.find(s => s.type === 'location' && s.title === 'Старт');
    if (!startScene) return;

    const graph = new Map<string, string[]>();
    scenes.forEach(s => graph.set(s.id, []));
    edges.forEach(e => {
      const targets = graph.get(e.source) || [];
      targets.push(e.target);
      graph.set(e.source, targets);
    });

    // DFS cycle detection
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (sceneId: string): boolean => {
      visited.add(sceneId);
      recStack.add(sceneId);

      const targets = graph.get(sceneId) || [];
      for (const target of targets) {
        if (!visited.has(target)) {
          if (hasCycle(target)) return true;
        } else if (recStack.has(target)) {
          return true;
        }
      }

      recStack.delete(sceneId);
      return false;
    };

    if (hasCycle(startScene.id)) {
      errors.push({
        code: 'INFINITE_LOOP',
        message: 'Сценарий содержит бесконечный цикл',
        severity: 'error',
      });
    }
  }

  private checkBrokenTransitions(
    scenes: Scene[],
    edges: Edge[],
    errors: ValidationError[]
  ): void {
    const sceneIds = new Set(scenes.map(s => s.id));

    for (const edge of edges) {
      if (!sceneIds.has(edge.source)) {
        errors.push({
          code: 'BROKEN_TRANSITION',
          message: `Переход из несуществующей сцены: ${edge.source}`,
          severity: 'error',
        });
      }
      if (!sceneIds.has(edge.target)) {
        errors.push({
          code: 'BROKEN_TRANSITION',
          message: `Переход в несуществующую сцену: ${edge.target}`,
          severity: 'error',
        });
      }
    }

    // Check transitions inside scenes
    for (const scene of scenes) {
      for (const transition of scene.transitions) {
        if (!sceneIds.has(transition.toSceneId)) {
          errors.push({
            code: 'BROKEN_TRANSITION',
            sceneId: scene.id,
            message: `Переход "${transition.label || transition.id}" ведёт в несуществующую сцену`,
            severity: 'error',
          });
        }
      }
    }
  }

  private checkMissionConfigs(
    scenes: Scene[],
    errors: ValidationError[]
  ): void {
    for (const scene of scenes) {
      for (const mission of scene.missions) {
        // Проверка наличия конфига
        if (!mission.config) {
          errors.push({
            code: 'MISSION_NO_CONFIG',
            sceneId: scene.id,
            missionId: mission.id,
            message: `Миссия "${mission.title}" не имеет конфигурации`,
            severity: 'error',
          });
          continue;
        }

        // Специфичные проверки
        switch (mission.type) {
          case 'text': {
            const cfg = mission.config as any;
            if (!cfg.correctAnswer) {
              errors.push({
                code: 'MISSING_ANSWER',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Текст) не имеет правильного ответа`,
                severity: 'error',
              });
            }
            break;
          }
          case 'code': {
            const cfg = mission.config as any;
            if (!cfg.correctCode) {
              errors.push({
                code: 'MISSING_CODE',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Код) не имеет правильного кода`,
                severity: 'error',
              });
            }
            break;
          }
          case 'gps': {
            const cfg = mission.config as any;
            if (!cfg.lat || !cfg.lng) {
              errors.push({
                code: 'MISSING_COORDINATES',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (GPS) не имеет координат`,
                severity: 'error',
              });
            }
            break;
          }
          case 'qr': {
            const cfg = mission.config as any;
            if (!cfg.data) {
              errors.push({
                code: 'MISSING_QR_DATA',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (QR) не имеет данных`,
                severity: 'error',
              });
            }
            break;
          }
          case 'choice': {
            const cfg = mission.config as any;
            if (!cfg.options || cfg.options.length < 2) {
              errors.push({
                code: 'MISSING_OPTIONS',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Выбор) должна иметь минимум 2 варианта`,
                severity: 'error',
              });
            }
            if (cfg.correctIndex === undefined || cfg.correctIndex < 0) {
              errors.push({
                code: 'MISSING_CORRECT_OPTION',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Выбор) не имеет правильного варианта`,
                severity: 'error',
              });
            }
            break;
          }
          case 'collect': {
            const cfg = mission.config as any;
            if (!cfg.itemId) {
              errors.push({
                code: 'MISSING_ITEM_ID',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Сбор) не имеет ID предмета`,
                severity: 'error',
              });
            }
            break;
          }
          case 'dialogue': {
            const cfg = mission.config as any;
            if (!cfg.npcName) {
              errors.push({
                code: 'MISSING_NPC_NAME',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Диалог) не имеет имени NPC`,
                severity: 'warning',
              });
            }
            if (!cfg.dialogues || cfg.dialogues.length === 0) {
              errors.push({
                code: 'MISSING_DIALOGUES',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Диалог) не имеет реплик`,
                severity: 'error',
              });
            }
            break;
          }
          case 'audio':
          case 'video':
          case 'image': {
            const cfg = mission.config as any;
            if (!cfg.assetId) {
              errors.push({
                code: 'MISSING_ASSET',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" не имеет привязанного медиа-файла`,
                severity: 'error',
              });
            }
            break;
          }
          case 'inventory_get':
          case 'inventory_spend':
          case 'inventory_check': {
            const cfg = mission.config as any;
            if (!cfg.itemId) {
              errors.push({
                code: 'MISSING_ITEM_ID',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" не имеет ID предмета`,
                severity: 'error',
              });
            }
            if (!cfg.itemName) {
              errors.push({
                code: 'MISSING_ITEM_NAME',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" не имеет названия предмета`,
                severity: 'warning',
              });
            }
            break;
          }
          case 'achievement': {
            const cfg = mission.config as any;
            if (!cfg.achievementId) {
              errors.push({
                code: 'MISSING_ACHIEVEMENT_ID',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Достижение) не имеет ID`,
                severity: 'error',
              });
            }
            if (!cfg.achievementName) {
              errors.push({
                code: 'MISSING_ACHIEVEMENT_NAME',
                sceneId: scene.id,
                missionId: mission.id,
                message: `Миссия "${mission.title}" (Достижение) не имеет названия`,
                severity: 'warning',
              });
            }
            break;
          }
        }
      }
    }
  }

  private checkVariables(
    scenes: Scene[],
    errors: ValidationError[]
  ): void {
    for (const scene of scenes) {
      for (const mission of scene.missions) {
        // Check conditions reference valid variables
        for (const condition of mission.conditions) {
          this.validateCondition(condition, scene.id, mission.id, errors);
        }
      }
    }
  }

  private validateCondition(
    condition: any,
    sceneId: string,
    missionId: string,
    errors: ValidationError[]
  ): void {
    if (!condition) return;

    // ConditionGroup (AND/OR)
    if (condition.operator === 'AND' || condition.operator === 'OR') {
      if (condition.conditions && Array.isArray(condition.conditions)) {
        for (const sub of condition.conditions) {
          this.validateCondition(sub, sceneId, missionId, errors);
        }
      }
      return;
    }

    // SingleCondition
    if (!condition.type || !condition.operator) {
      errors.push({
        code: 'INVALID_CONDITION',
        sceneId,
        missionId,
        message: 'Условие должно иметь type и operator',
        severity: 'error',
      });
    }
  }

  /**
   * 8. Проверка конфигурации циклов
   */
  private checkLoopConfigs(
    scenes: Scene[],
    edges: Edge[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const loopScenes = scenes.filter((s) => s.type === 'loop');

    for (const scene of loopScenes) {
      const loop = scene.metadata?.loop;
      if (!loop) {
        errors.push({
          code: 'LOOP_NO_CONFIG',
          sceneId: scene.id,
          message: `Сцена цикла "${scene.title}" не имеет конфигурации цикла`,
          severity: 'error',
        });
        continue;
      }

      // Проверка: for-цикл должен иметь count > 0
      if (loop.type === 'for') {
        if (!loop.count || loop.count <= 0) {
          errors.push({
            code: 'LOOP_FOR_NO_COUNT',
            sceneId: scene.id,
            message: `For-цикл "${scene.title}" должен иметь количество повторений > 0`,
            severity: 'error',
          });
        }
      }

      // Проверка: while-цикл должен иметь условие
      if (loop.type === 'while') {
        if (!loop.condition) {
          errors.push({
            code: 'LOOP_WHILE_NO_CONDITION',
            sceneId: scene.id,
            message: `While-цикл "${scene.title}" должен иметь условие продолжения`,
            severity: 'error',
          });
        }
      }

      // Проверка: forEach должен иметь collectionVariable
      if (loop.type === 'forEach') {
        if (!loop.collectionVariable) {
          errors.push({
            code: 'LOOP_FOREACH_NO_COLLECTION',
            sceneId: scene.id,
            message: `ForEach-цикл "${scene.title}" должен иметь переменную-массив`,
            severity: 'error',
          });
        }
      }

      // Проверка: maxIterations не может быть > 1000
      if (loop.maxIterations && loop.maxIterations > 1000) {
        errors.push({
          code: 'LOOP_MAX_ITERATIONS_EXCEEDED',
          sceneId: scene.id,
          message: `Максимум итераций цикла "${scene.title}" не может превышать 1000`,
          severity: 'error',
        });
      }

      // Предупреждение: если тело цикла не ведёт к выходу (потенциально бесконечный цикл)
      const loopBodyEdges = edges.filter(
        (e) => e.source === scene.id && e.sourceHandle?.includes('loop-body')
      );
      const loopExitEdges = edges.filter(
        (e) => e.source === scene.id && e.sourceHandle?.includes('loop-exit')
      );

      if (loopBodyEdges.length === 0) {
        warnings.push({
          code: 'LOOP_NO_BODY',
          sceneId: scene.id,
          message: `Цикл "${scene.title}" не имеет соединения для тела цикла`,
          severity: 'warning',
        });
      }

      if (loopExitEdges.length === 0 && !loop.onCompleteSceneId) {
        warnings.push({
          code: 'LOOP_NO_EXIT',
          sceneId: scene.id,
          message: `Цикл "${scene.title}" не имеет выхода (ни соединения loop-exit, ни onCompleteSceneId)`,
          severity: 'warning',
        });
      }
    }
  }
}

export const validationEngine = new ValidationEngine();