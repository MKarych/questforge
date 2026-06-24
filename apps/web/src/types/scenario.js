"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCK_CATEGORIES = exports.BLOCK_TYPES = void 0;
exports.BLOCK_TYPES = [
    { type: 'START', label: 'Старт', icon: '🚀', description: 'Начало сценария', color: 'bg-green-500' },
    { type: 'FINISH', label: 'Финиш', icon: '🏁', description: 'Конец сценария', color: 'bg-red-500' },
    { type: 'TEXT', label: 'Текст', icon: '📝', description: 'Текстовое задание', color: 'bg-blue-500' },
    { type: 'CODE', label: 'Код', icon: '🔢', description: 'Ввод кода', color: 'bg-purple-500' },
    { type: 'PHOTO', label: 'Фото', icon: '📷', description: 'Фото-задание', color: 'bg-pink-500' },
    { type: 'GPS', label: 'GPS', icon: '📍', description: 'GPS-локация', color: 'bg-yellow-500' },
    { type: 'QR', label: 'QR', icon: '📱', description: 'QR-код', color: 'bg-indigo-500' },
    { type: 'CHOICE', label: 'Выбор', icon: '🎯', description: 'Выбор варианта', color: 'bg-orange-500' },
    { type: 'TIMER', label: 'Таймер', icon: '⏱', description: 'Ограничение по времени', color: 'bg-red-400' },
    { type: 'BRANCH', label: 'Ветвление', icon: '🔀', description: 'Ветвление сценария', color: 'bg-teal-500' },
    { type: 'NPC', label: 'NPC', icon: '🗣', description: 'Взаимодействие с персонажем', color: 'bg-cyan-500' },
    { type: 'AR', label: 'AR', icon: '🧩', description: 'Дополненная реальность', color: 'bg-gray-500' },
];
exports.BLOCK_CATEGORIES = [
    {
        name: 'Базовые',
        blocks: ['START', 'FINISH'],
    },
    {
        name: 'Задания',
        blocks: ['TEXT', 'CODE', 'PHOTO', 'GPS', 'QR', 'CHOICE'],
    },
    {
        name: 'Логика',
        blocks: ['TIMER', 'BRANCH'],
    },
    {
        name: 'Персонажи',
        blocks: ['NPC'],
    },
    {
        name: 'Экспериментальные',
        blocks: ['AR'],
    },
];
//# sourceMappingURL=scenario.js.map