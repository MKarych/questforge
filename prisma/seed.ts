// prisma/seed.ts
import { PrismaClient, Role, UserStatus, TeamStatus, GameStatus, RegistrationStatus, TeamVisibility, JoinPolicy, TeamRole, MemberStatus, InviteStatus, JoinRequestStatus, TransferStatus, Tier, ListingStatus, LicenseType, UpdatePolicy, PurchaseStatus, LicenseStatus, ReviewStatus, PromoCodeType, PromoCodeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD = '123456';
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateShareLink(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createScenarioNodes(type: string): any[] {
  const base = [
    { id: 'start', type: 'START', question: 'Начало' },
    { id: 'finish', type: 'FINISH', question: 'Финиш' },
  ];

  const nodes: Record<string, any[]> = {
    text: [...base.slice(0, 1), { id: 'text', type: 'TEXT', question: 'Как называется главная площадь?', answer: 'Красная' }, ...base.slice(1)],
    code: [...base.slice(0, 1), { id: 'code', type: 'CODE', question: 'Введите код на колонне', answer: '12345' }, ...base.slice(1)],
    photo: [...base.slice(0, 1), { id: 'photo', type: 'PHOTO', question: 'Сфотографируйте фонтан' }, ...base.slice(1)],
    gps: [...base.slice(0, 1), { id: 'gps', type: 'GPS', question: 'Найдите точку на карте', lat: 55.7558, lng: 37.6173, radius: 50 }, ...base.slice(1)],
    choice: [...base.slice(0, 1), { id: 'choice', type: 'CHOICE', question: 'Какой год основания города?', options: ['1723', '1745', '1760'], correctOption: '1723' }, ...base.slice(1)],
    qr: [...base.slice(0, 1), { id: 'qr', type: 'QR', question: 'Отсканируйте QR-код', answer: 'SECRET_001' }, ...base.slice(1)],
    mixed: [...base.slice(0, 1), { id: 'text', type: 'TEXT', question: 'Текстовый вопрос', answer: 'Ответ' }, { id: 'code', type: 'CODE', question: 'Кодовый вопрос', answer: '123' }, ...base.slice(1)],
    geocaching: [...base.slice(0, 1), { id: 'gps', type: 'GPS', question: 'Найдите тайник', lat: 55.7558, lng: 37.6173, radius: 30 }, { id: 'photo', type: 'PHOTO', question: 'Сфотографируйте находку' }, ...base.slice(1)],
    detective: [...base.slice(0, 1), { id: 'text', type: 'TEXT', question: 'Кто убийца?', answer: 'Дворецкий' }, { id: 'choice', type: 'CHOICE', question: 'Где произошло преступление?', options: ['В спальне', 'На кухне', 'В библиотеке'], correctOption: 'В спальне' }, ...base.slice(1)],
  };

  return nodes[type] || base;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================
  // 1. ПОЛНАЯ ОЧИСТКА ТАБЛИЦ (DELETE FROM для надёжности)
  // ============================================================
  // Marketplace (snake_case из-за @@map в схеме)
  await prisma.$executeRaw`DELETE FROM "marketplace_analytics";`;
  await prisma.$executeRaw`DELETE FROM "author_earnings";`;
  await prisma.$executeRaw`DELETE FROM "payouts";`;
  await prisma.$executeRaw`DELETE FROM "marketplace_reviews";`;
  await prisma.$executeRaw`DELETE FROM "cart_items";`;
  await prisma.$executeRaw`DELETE FROM "carts";`;
  await prisma.$executeRaw`DELETE FROM "favorite_listings";`;
  await prisma.$executeRaw`DELETE FROM "scenario_runs";`;
  await prisma.$executeRaw`DELETE FROM "user_licenses";`;
  await prisma.$executeRaw`DELETE FROM "purchases";`;
  await prisma.$executeRaw`DELETE FROM "promo_codes";`;
  await prisma.$executeRaw`DELETE FROM "marketplace_listings";`;
  await prisma.$executeRaw`DELETE FROM "scenario_versions";`;
  // Остальные таблицы (PascalCase — стандартное именование Prisma)
  await prisma.$executeRaw`DELETE FROM "ActivityLog";`;
  await prisma.$executeRaw`DELETE FROM "Notification";`;
  await prisma.$executeRaw`DELETE FROM "UserAchievement";`;
  await prisma.$executeRaw`DELETE FROM "Comment";`;
  await prisma.$executeRaw`DELETE FROM "Review";`;
  await prisma.$executeRaw`DELETE FROM "OrganizerApplication";`;
  await prisma.$executeRaw`DELETE FROM "HeatmapData";`;
  await prisma.$executeRaw`DELETE FROM "GameRegistration";`;
  await prisma.$executeRaw`DELETE FROM "GameTeam";`;
  await prisma.$executeRaw`DELETE FROM "GameComment";`;
  await prisma.$executeRaw`DELETE FROM "GameQuestion";`;
  await prisma.$executeRaw`DELETE FROM "Game";`;
  await prisma.$executeRaw`DELETE FROM "Scenario";`;
  await prisma.$executeRaw`DELETE FROM "TeamMember";`;
  await prisma.$executeRaw`DELETE FROM "TeamInvite";`;
  await prisma.$executeRaw`DELETE FROM "JoinRequest";`;
  await prisma.$executeRaw`DELETE FROM "OwnershipTransfer";`;
  await prisma.$executeRaw`DELETE FROM "Team";`;
  await prisma.$executeRaw`DELETE FROM "SessionState";`;
  await prisma.$executeRaw`DELETE FROM "Event";`;
  await prisma.$executeRaw`DELETE FROM "Media";`;
  await prisma.$executeRaw`DELETE FROM "Inventory";`;
  await prisma.$executeRaw`DELETE FROM "Resource";`;
  await prisma.$executeRaw`DELETE FROM "AuditLog";`;
  await prisma.$executeRaw`DELETE FROM "Follow";`;
  await prisma.$executeRaw`DELETE FROM "User";`;

  const passwordHash = await hashPassword(PASSWORD);

  // ============================================================
  // 2. ПОЛЬЗОВАТЕЛИ (15)
  // ============================================================
  const users: Record<string, any> = {};
  const userData = [
    // Базовые пользователи (по одному на каждую роль)
    { email: 'admin@test.com', name: 'Админ', role: 'ADMIN', username: 'admin', slug: 'admin' },
    { email: 'moderator@test.com', name: 'Модератор', role: 'MODERATOR', username: 'moderator', slug: 'moderator' },
    { email: 'organizer@test.com', name: 'Организатор', role: 'ORGANIZER', username: 'organizer', slug: 'organizer' },
    { email: 'player@test.com', name: 'Игрок', role: 'PLAYER', username: 'player', slug: 'player' },
    // Дополнительные пользователи
    { email: 'organizer1@test.com', name: 'Иван Петров', role: 'ORGANIZER', username: 'ivan_petrov', slug: 'ivan-petrov' },
    { email: 'organizer2@test.com', name: 'Мария Смирнова', role: 'ORGANIZER', username: 'maria_smirnova', slug: 'maria-smirnova' },
    { email: 'player1@test.com', name: 'Алексей', role: 'PLAYER', username: 'alexey', slug: 'alexey' },
    { email: 'player2@test.com', name: 'Дмитрий', role: 'PLAYER', username: 'dmitry', slug: 'dmitry' },
    { email: 'player3@test.com', name: 'Екатерина', role: 'PLAYER', username: 'ekaterina', slug: 'ekaterina' },
    { email: 'player4@test.com', name: 'Сергей', role: 'PLAYER', username: 'sergey', slug: 'sergey' },
    { email: 'player5@test.com', name: 'Анна', role: 'PLAYER', username: 'anna', slug: 'anna' },
    { email: 'player6@test.com', name: 'Ольга', role: 'PLAYER', username: 'olga', slug: 'olga' },
    { email: 'player7@test.com', name: 'Максим', role: 'PLAYER', username: 'maxim', slug: 'maxim' },
  ];

  for (const u of userData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        name: u.name,
        username: u.username,
        slug: u.slug,
        role: u.role as Role,
        roles: [u.role as Role],
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        verificationToken: null,
        verified: { email: true, phone: false, telegram: false },
        profile: {
          avatar: `https://placehold.co/128x128/EEE/999?text=${u.username.substring(0, 2)}`,
          bio: '',
          city: '',
          socialLinks: { tg: '', vk: '', discord: '', youtube: '', github: '' },
          favorites: { games: [], scenarios: [], authors: [] },
          metadata: {},
        },
        settings: {
          language: 'ru',
          timezone: 'Europe/Moscow',
          theme: 'dark',
          notifications: { email: true, telegram: false, push: true },
          privacy: { showCity: true, showContacts: false, showStats: true, showAchievements: true },
        },
        security: {
          lastLoginAt: null,
          failedLoginAttempts: 0,
          passwordChangedAt: new Date(),
          trustedDevices: [],
        },
        capabilities: [],
        featureFlags: {},
        aiProfile: {
          favoriteGenres: ['detective', 'horror'],
          averageTeamSize: 4,
          averageGameDuration: 120,
          favoriteDifficulty: 'medium',
        },
        reputationData: {
          rating: 4.5,
          trustScore: 80,
          reviewsCount: 0,
          violations: 0,
          completedGames: 0,
          achievements: [],
        },
      },
    });
    users[u.email] = user;
  }
  console.log(`✅ ${Object.keys(users).length} users created`);

  // ============================================================
  // 3. КОМАНДЫ (5)
  // ============================================================
  const teams: Record<string, any> = {};
  const teamData = [
    { name: 'Ночные Волки', captain: 'player1@test.com', members: ['player1@test.com', 'player2@test.com', 'player3@test.com'] },
    { name: 'Спецназ', captain: 'player2@test.com', members: ['player2@test.com', 'player4@test.com', 'player5@test.com'] },
    { name: 'Искатели', captain: 'player3@test.com', members: ['player3@test.com', 'player1@test.com', 'player4@test.com'] },
    { name: 'Следопыты', captain: 'player4@test.com', members: ['player4@test.com', 'player2@test.com', 'player5@test.com'] },
    { name: 'Элита', captain: 'player6@test.com', members: ['player6@test.com', 'player7@test.com'] },
  ];

  for (const t of teamData) {
    const captain = users[t.captain];
    const slug = slugify(t.name) + '-' + Math.random().toString(36).substring(2, 6);
    const team = await prisma.team.create({
      data: {
        name: t.name,
        slug,
        description: `Команда "${t.name}" — тестовая команда`,
        captainId: captain.id,
        status: TeamStatus.ACTIVE,
        privacy: TeamVisibility.PUBLIC,
        joinPolicy: JoinPolicy.INVITE_ONLY,
        tags: ['test', 'seed'],
        maxMembers: 20,
        maxInvitesPerDay: 10,
        maxPendingRequests: 5,
        maxChatMessagesPerMinute: 30,
        socials: { discord: '', vk: '', telegram: '', youtube: '' },
        members: {
          create: t.members.map((email) => ({
            userId: users[email].id,
            role: email === t.captain ? TeamRole.CAPTAIN : TeamRole.MEMBER,
            status: MemberStatus.ACTIVE,
          })),
        },
      },
    });
    teams[t.name] = team;
  }
  console.log(`✅ ${Object.keys(teams).length} teams created`);

  // ============================================================
  // 4. СЦЕНАРИИ (10)
  // ============================================================
  const scenarios: Record<string, any> = {};
  const scenarioData = [
    { name: 'Тайны старого города', type: 'text', author: 'organizer1@test.com', published: true, description: 'Квест по историческому центру' },
    { name: 'Ночной дозор', type: 'code', author: 'organizer1@test.com', published: true, description: 'Автоквест по ночному городу' },
    { name: 'Фотоохота', type: 'photo', author: 'organizer2@test.com', published: true, description: 'Фото-квест по городу' },
    { name: 'GPS-квест', type: 'gps', author: 'organizer2@test.com', published: true, description: 'GPS-квест по достопримечательностям' },
    { name: 'Квиз-марафон', type: 'choice', author: 'organizer1@test.com', published: true, description: 'Интеллектуальный квиз' },
    { name: 'QR-детектив', type: 'qr', author: 'organizer1@test.com', published: true, description: 'QR-квест с детективным сюжетом' },
    { name: 'Смешанный квест', type: 'mixed', author: 'organizer2@test.com', published: true, description: 'Квест с разными типами заданий' },
    { name: 'Геокэшинг', type: 'geocaching', author: 'organizer2@test.com', published: true, description: 'Поиск тайников' },
    { name: 'Детектив', type: 'detective', author: 'organizer1@test.com', published: true, description: 'Детективный квест' },
    { name: 'Ночной автоквест', type: 'mixed', author: 'organizer1@test.com', published: false, description: '' },
  ];

  for (const s of scenarioData) {
    const author = users[s.author];
    const nodes = createScenarioNodes(s.type);
    const scenario = await prisma.scenario.create({
      data: {
        name: s.name,
        description: s.description || null,
        authorId: author.id,
        isPublished: s.published,
        nodes: nodes,
        edges: [],
        startNodeId: 'start',
        metadata: {
          type: s.type,
          difficulty: 'medium',
          estimatedDuration: 60,
          tags: [],
          coverImage: null,
        },
        validationStatus: s.published ? 'VALIDATED' : 'DRAFT',
        publishedAt: s.published ? new Date() : null,
      },
    });
    scenarios[s.name] = scenario;
  }
  console.log(`✅ ${Object.keys(scenarios).length} scenarios created`);

  // ============================================================
  // 5. ИГРЫ (10)
  // ============================================================
  const games: Record<string, any> = {};
  const gameData = [
    { title: 'Тайны старого города', city: 'Москва', status: 'PUBLISHED', organizer: 'organizer1@test.com', scenario: 'Тайны старого города', tags: ['history', 'walking'] },
    { title: 'Ночной дозор', city: 'Минск', status: 'PUBLISHED', organizer: 'organizer1@test.com', scenario: 'Ночной дозор', tags: ['night', 'adventure'] },
    { title: 'Фотоохота', city: 'Санкт-Петербург', status: 'PUBLISHED', organizer: 'organizer2@test.com', scenario: 'Фотоохота', tags: ['photo', 'walking'] },
    { title: 'GPS-квест', city: 'Рига', status: 'HIDDEN', organizer: 'organizer2@test.com', scenario: 'GPS-квест', tags: ['gps', 'exploration'] },
    { title: 'Квиз-марафон', city: 'Казань', status: 'PUBLISHED', organizer: 'organizer1@test.com', scenario: 'Квиз-марафон', tags: ['quiz', 'intellectual'] },
    { title: 'QR-детектив', city: 'Москва', status: 'PUBLISHED', organizer: 'organizer1@test.com', scenario: 'QR-детектив', tags: ['qr', 'detective'] },
    { title: 'Смешанный квест', city: 'Минск', status: 'DRAFT', organizer: 'organizer2@test.com', scenario: 'Смешанный квест', tags: ['mixed'] },
    { title: 'Геокэшинг', city: 'Санкт-Петербург', status: 'DRAFT', organizer: 'organizer2@test.com', scenario: 'Геокэшинг', tags: ['geocaching'] },
    { title: 'Детектив', city: 'Рига', status: 'DRAFT', organizer: 'organizer1@test.com', scenario: 'Детектив', tags: ['detective'] },
    { title: 'Ночной автоквест', city: 'Казань', status: 'DRAFT', organizer: 'organizer1@test.com', scenario: 'Ночной автоквест', tags: ['night', 'auto'] },
  ];

  for (const g of gameData) {
    const organizer = users[g.organizer];
    const scenario = scenarios[g.scenario];
    const isPublished = g.status === 'PUBLISHED';
    const game = await prisma.game.create({
      data: {
        title: g.title,
        description: `${g.title} — тестовая игра`,
        city: g.city,
        address: null,
        date: new Date('2026-07-15'),
        time: '19:00',
        duration: 120,
        maxTeams: 10,
        price: 0,
        shareLink: generateShareLink(),
        slug: slugify(g.title) + '-' + Math.random().toString(36).substring(2, 6),
        organizerId: organizer.id,
        scenarioId: scenario.id,
        status: g.status as GameStatus,
        imageUrl: `https://placehold.co/800x600/1a1a2e/EEE?text=${encodeURIComponent(g.title.substring(0, 6))}`,
        tags: g.tags,
        autoStart: false,
        autoStartDelay: 0,
        allowEarlyStart: true,
        startBuffer: 15,
        allowLateRegistration: false,
        publishedAt: isPublished ? new Date() : null,
      },
    });
    games[g.title] = game;
  }
  console.log(`✅ ${Object.keys(games).length} games created`);

  // ============================================================
  // 6. GAME TEAM связки (7)
  // ============================================================
  const gameTeamData = [
    { game: 'Квиз-марафон', team: 'Ночные Волки' },
    { game: 'Квиз-марафон', team: 'Спецназ' },
    { game: 'QR-детектив', team: 'Ночные Волки' },
    { game: 'Смешанный квест', team: 'Ночные Волки' },
    { game: 'Смешанный квест', team: 'Спецназ' },
    { game: 'Смешанный квест', team: 'Искатели' },
    { game: 'Фотоохота', team: 'Ночные Волки' },
  ];

  for (const gt of gameTeamData) {
    await prisma.gameTeam.create({
      data: {
        gameId: games[gt.game].id,
        teamId: teams[gt.team].id,
      },
    });
  }
  console.log(`✅ ${gameTeamData.length} game-team links created`);

  // ============================================================
  // 7. РЕГИСТРАЦИИ КОМАНД (7)
  // ============================================================
  const registrationData = [
    { game: 'Квиз-марафон', team: 'Ночные Волки', status: 'READY' },
    { game: 'Квиз-марафон', team: 'Спецназ', status: 'NOT_READY' },
    { game: 'QR-детектив', team: 'Ночные Волки', status: 'REGISTERED' },
    { game: 'Смешанный квест', team: 'Ночные Волки', status: 'REGISTERED' },
    { game: 'Смешанный квест', team: 'Спецназ', status: 'REGISTERED' },
    { game: 'Смешанный квест', team: 'Искатели', status: 'REGISTERED' },
    { game: 'Фотоохота', team: 'Ночные Волки', status: 'REGISTERED' },
  ];

  for (const r of registrationData) {
    await prisma.gameRegistration.create({
      data: {
        gameId: games[r.game].id,
        teamId: teams[r.team].id,
        status: r.status as RegistrationStatus,
      },
    });
  }
  console.log(`✅ ${registrationData.length} registrations created`);

  // ============================================================
  // 8. ОТЗЫВЫ (20)
  // ============================================================
  const reviews = [
    { game: 'Тайны старого города', author: 'player1@test.com', rating: 5, text: 'Отличная игра! Очень понравилась атмосфера.' },
    { game: 'Тайны старого города', author: 'player2@test.com', rating: 4, text: 'Хорошо, но местами сложно.' },
    { game: 'Ночной дозор', author: 'player3@test.com', rating: 5, text: 'Лучший автоквест в Минске!' },
    { game: 'Фотоохота', author: 'player4@test.com', rating: 3, text: 'Нормально, но ожидал большего.' },
    { game: 'Смешанный квест', author: 'player5@test.com', rating: 4, text: 'Интересно, команда в восторге.' },
    { game: 'GPS-квест', author: 'player1@test.com', rating: 5, text: 'Точки расставлены идеально!' },
    { game: 'Квиз-марафон', author: 'player2@test.com', rating: 2, text: 'Слишком сложно для новичков.' },
    { game: 'QR-детектив', author: 'player3@test.com', rating: 4, text: 'Интересно, но QR-код был смазан.' },
    { game: 'Детектив', author: 'player4@test.com', rating: 5, text: 'Лучший сценарий! Сюжет затягивает.' },
    { game: 'Тайны старого города', author: 'player6@test.com', rating: 5, text: 'Второй раз прохожу, всё ещё круто.' },
    { game: 'Ночной дозор', author: 'player7@test.com', rating: 4, text: 'Отличная игра, но мало времени.' },
    { game: 'Фотоохота', author: 'organizer1@test.com', rating: 5, text: 'Мария, ты гений!' },
    { game: 'GPS-квест', author: 'player5@test.com', rating: 4, text: 'Хорошо, но навигация иногда глючила.' },
    { game: 'Квиз-марафон', author: 'player1@test.com', rating: 3, text: 'Средненько, ожидал большего.' },
    { game: 'QR-детектив', author: 'player2@test.com', rating: 5, text: 'QR-код нашёл за 10 минут!' },
    { game: 'Детектив', author: 'player3@test.com', rating: 4, text: 'Отличный сюжет, но концовка предсказуема.' },
    { game: 'Смешанный квест', author: 'player4@test.com', rating: 5, text: 'Лучшая игра в этом сезоне!' },
    { game: 'Ночной дозор', author: 'player5@test.com', rating: 4, text: 'Хорошо, но мало загадок.' },
    { game: 'Тайны старого города', author: 'player7@test.com', rating: 5, text: 'Атмосфера просто шикарная!' },
    { game: 'Фотоохота', author: 'player1@test.com', rating: 4, text: 'Фото получились отличные, игра понравилась.' },
  ];

  for (const r of reviews) {
    await prisma.review.create({
      data: {
        gameId: games[r.game].id,
        userId: users[r.author].id,
        rating: r.rating,
        text: r.text,
      },
    });
  }
  console.log(`✅ ${reviews.length} reviews created`);

  // ============================================================
  // 9. КОММЕНТАРИИ (30)
  // ============================================================
  const comments = [
    { game: 'Тайны старого города', author: 'player1@test.com', text: 'Когда будет следующая игра?' },
    { game: 'Тайны старого города', author: 'organizer1@test.com', text: 'Следите за анонсами!' },
    { game: 'Ночной дозор', author: 'player2@test.com', text: 'Хочу ещё!' },
    { game: 'Фотоохота', author: 'player3@test.com', text: 'Фото загрузили, ждём проверки.' },
    { game: 'Смешанный квест', author: 'organizer2@test.com', text: 'Все молодцы! Спасибо за игру.' },
    { game: 'GPS-квест', author: 'player4@test.com', text: 'Точка 3 была очень сложной!' },
    { game: 'Квиз-марафон', author: 'player5@test.com', text: 'Не хватило времени на последний вопрос.' },
    { game: 'QR-детектив', author: 'player6@test.com', text: 'Организатор, спасибо за игру!' },
    { game: 'Детектив', author: 'player7@test.com', text: 'Сюжет держит в напряжении до конца.' },
    { game: 'Тайны старого города', author: 'player2@test.com', text: 'Рекомендую всем друзьям!' },
    { game: 'Ночной дозор', author: 'player3@test.com', text: 'Было страшно и интересно.' },
    { game: 'Фотоохота', author: 'player4@test.com', text: 'Фото на память останутся надолго.' },
    { game: 'GPS-квест', author: 'player1@test.com', text: 'Игра на свежем воздухе — это кайф!' },
    { game: 'Квиз-марафон', author: 'player2@test.com', text: 'Команда была слабая, но мы выиграли!' },
    { game: 'QR-детектив', author: 'player3@test.com', text: 'В следующий раз возьму с собой друзей.' },
    { game: 'Детектив', author: 'player4@test.com', text: 'Интересно, но концовка немного смазана.' },
    { game: 'Смешанный квест', author: 'player5@test.com', text: 'Сочетание жанров — это круто!' },
    { game: 'Ночной дозор', author: 'player6@test.com', text: 'Хочу пройти снова!' },
    { game: 'Тайны старого города', author: 'player3@test.com', text: 'Когда будет следующая игра?' },
    { game: 'Фотоохота', author: 'player2@test.com', text: 'Обязательно поучаствую ещё!' },
    { game: 'GPS-квест', author: 'player5@test.com', text: 'Игра отличная, но было холодно.' },
    { game: 'Квиз-марафон', author: 'player1@test.com', text: 'Хочу больше вопросов про историю.' },
    { game: 'QR-детектив', author: 'player4@test.com', text: 'QR-коды — это гениально!' },
    { game: 'Детектив', author: 'player6@test.com', text: 'Сюжетная линия — 10 из 10.' },
    { game: 'Смешанный квест', author: 'player7@test.com', text: 'Лучшее, что я проходил!' },
    { game: 'Ночной дозор', author: 'player1@test.com', text: 'Ночная атмосфера — отдельный кайф.' },
    { game: 'Тайны старого города', author: 'player4@test.com', text: 'Гид по городу — супер!' },
    { game: 'Фотоохота', author: 'player5@test.com', text: 'Фотосессия удалась!' },
    { game: 'GPS-квест', author: 'player3@test.com', text: 'Навигация была идеальной.' },
    { game: 'Квиз-марафон', author: 'player2@test.com', text: 'Отличный интеллектуальный вечер.' },
  ];

  for (const c of comments) {
    await prisma.comment.create({
      data: {
        gameId: games[c.game].id,
        userId: users[c.author].id,
        text: c.text,
      },
    });
  }
  console.log(`✅ ${comments.length} comments created`);

  // ============================================================
  // 10. GAME COMMENT (чат в играх — 50 сообщений)
  // ============================================================
  const gameCommentAuthors = ['player1', 'player2', 'player3', 'player4', 'player5', 'organizer1', 'organizer2'];
  for (let i = 0; i < 50; i++) {
    const game = Object.values(games)[i % Object.values(games).length];
    const authorEmail = `${gameCommentAuthors[i % gameCommentAuthors.length]}@test.com`;
    await prisma.gameComment.create({
      data: {
        gameId: game.id,
        authorId: users[authorEmail].id,
        text: `Сообщение в чате игры ${i + 1}: обсуждаем задание!`,
      },
    });
  }
  console.log(`✅ 50 game chat messages created`);

  // ============================================================
  // 11. УВЕДОМЛЕНИЯ (20)
  // ============================================================
  const notifications = [
    { userId: 'player2@test.com', type: 'INVITE', title: 'Приглашение в команду', message: 'Вас пригласили в команду "Ночные Волки"', link: '/teams/1' },
    { userId: 'player3@test.com', type: 'INVITE', title: 'Приглашение в команду', message: 'Вас пригласили в команду "Ночные Волки"', link: '/teams/1' },
    { userId: 'player1@test.com', type: 'GAME_START', title: 'Игра началась', message: 'Игра "QR-детектив" началась!', link: '/games/6' },
    { userId: 'player2@test.com', type: 'GAME_START', title: 'Игра началась', message: 'Игра "QR-детектив" началась!', link: '/games/6' },
    { userId: 'player3@test.com', type: 'GAME_START', title: 'Игра началась', message: 'Игра "QR-детектив" началась!', link: '/games/6' },
    { userId: 'player1@test.com', type: 'GAME_FINISH', title: 'Игра завершена', message: 'Игра "Смешанный квест" завершена!', link: '/games/7' },
    { userId: 'player2@test.com', type: 'GAME_FINISH', title: 'Игра завершена', message: 'Игра "Смешанный квест" завершена!', link: '/games/7' },
    { userId: 'player3@test.com', type: 'GAME_FINISH', title: 'Игра завершена', message: 'Игра "Смешанный квест" завершена!', link: '/games/7' },
    { userId: 'organizer1@test.com', type: 'COMMENT', title: 'Новый комментарий', message: 'player1 оставил комментарий под вашей игрой', link: '/games/1' },
    { userId: 'organizer2@test.com', type: 'REVIEW', title: 'Новый отзыв', message: 'player4 оставил отзыв на вашу игру', link: '/games/3' },
    { userId: 'player1@test.com', type: 'ANSWER', title: 'Ответ организатора', message: 'organizer1 ответил на ваш вопрос', link: '/games/1' },
    { userId: 'player1@test.com', type: 'RESCHEDULE', title: 'Перенос игры', message: 'Игра "Квиз-марафон" перенесена на 20.07.2026', link: '/games/5' },
    { userId: 'player2@test.com', type: 'RESCHEDULE', title: 'Перенос игры', message: 'Игра "Квиз-марафон" перенесена на 20.07.2026', link: '/games/5' },
    { userId: 'player3@test.com', type: 'CANCEL', title: 'Отмена игры', message: 'Игра "Геокэшинг" отменена организатором', link: '/games/8' },
    { userId: 'player4@test.com', type: 'CANCEL', title: 'Отмена игры', message: 'Игра "Геокэшинг" отменена организатором', link: '/games/8' },
    { userId: 'organizer1@test.com', type: 'APPROVE', title: 'Сценарий одобрен', message: 'Ваш сценарий "Ночной автоквест" одобрен модератором', link: '/scenarios/10' },
    { userId: 'organizer2@test.com', type: 'REJECT', title: 'Сценарий отклонён', message: 'Ваш сценарий "Детектив" отклонён модератором', link: '/scenarios/9' },
    { userId: 'organizer1@test.com', type: 'REGISTER', title: 'Регистрация на игру', message: 'Команда "Ночные Волки" зарегистрировалась на вашу игру', link: '/games/5' },
    { userId: 'player1@test.com', type: 'ACCEPT', title: 'Приглашение принято', message: 'Вы приняли приглашение в команду "Ночные Волки"', link: '/teams/1' },
    { userId: 'player2@test.com', type: 'DECLINE', title: 'Приглашение отклонено', message: 'player1 отклонил ваше приглашение', link: '/teams/1' },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        userId: users[n.userId].id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
      },
    });
  }
  console.log(`✅ ${notifications.length} notifications created`);

  // ============================================================
  // 12. ДОСТИЖЕНИЯ (15)
  // ============================================================
  const achievements = [
    { userId: 'player1@test.com', type: 'FIRST_GAME', name: 'Первая игра', description: 'Пройдите свою первую игру' },
    { userId: 'player2@test.com', type: 'FIRST_GAME', name: 'Первая игра', description: 'Пройдите свою первую игру' },
    { userId: 'player1@test.com', type: 'FIRST_WIN', name: 'Первая победа', description: 'Одержите первую победу' },
    { userId: 'player3@test.com', type: 'TEN_GAMES', name: '10 игр', description: 'Пройдите 10 игр' },
    { userId: 'player4@test.com', type: 'FIFTY_GAMES', name: '50 игр', description: 'Пройдите 50 игр' },
    { userId: 'organizer1@test.com', type: 'FIRST_SCENARIO', name: 'Первый сценарий', description: 'Создайте первый сценарий' },
    { userId: 'player5@test.com', type: 'FIRST_REVIEW', name: 'Первый отзыв', description: 'Оставьте первый отзыв' },
    { userId: 'organizer1@test.com', type: 'ORGANIZER', name: 'Организатор', description: 'Станьте организатором' },
    { userId: 'organizer2@test.com', type: 'ORGANIZER', name: 'Организатор', description: 'Станьте организатором' },
    { userId: 'organizer1@test.com', type: 'AUTHOR', name: 'Автор', description: 'Создайте 5 сценариев' },
    { userId: 'player2@test.com', type: 'EXPLORER', name: 'Исследователь', description: 'Пройдите 3 игры разных жанров' },
    { userId: 'player3@test.com', type: 'DETECTIVE', name: 'Мастер детектива', description: 'Пройдите 5 игр в жанре детектив' },
    { userId: 'player1@test.com', type: 'TEAM_PLAYER', name: 'Командный игрок', description: 'Сыграйте 10 игр в команде' },
    { userId: 'player2@test.com', type: 'TEAM_PLAYER', name: 'Командный игрок', description: 'Сыграйте 10 игр в команде' },
    { userId: 'player1@test.com', type: 'LEADER', name: 'Лидер', description: 'Станьте капитаном команды' },
  ];

  for (const a of achievements) {
    await prisma.userAchievement.create({
      data: {
        userId: users[a.userId].id,
        type: a.type,
        name: a.name,
        description: a.description,
      },
    });
  }
  console.log(`✅ ${achievements.length} achievements created`);

  // ============================================================
  // 13. АКТИВНОСТЬ (100)
  // ============================================================
  const activityTypes = ['GAME_CREATED', 'SCENARIO_CREATED', 'TEAM_JOINED', 'ACHIEVEMENT_UNLOCKED', 'REVIEW_LEFT'];
  const userIds = Object.values(users);

  for (let i = 0; i < 100; i++) {
    const user = userIds[i % userIds.length];
    const type = activityTypes[i % activityTypes.length];
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: type,
        payload: { message: `Событие ${i + 1}` },
      },
    });
  }
  console.log(`✅ 100 activity events created`);

  // ============================================================
  // 14. ЗАЯВКИ НА ОРГАНИЗАТОРА (5)
  // ============================================================
  const applications = [
    { userId: 'player1@test.com', city: 'Минск', phone: '+375291111111', status: 'PENDING' },
    { userId: 'player2@test.com', city: 'Москва', phone: '+74951111111', status: 'PENDING' },
    { userId: 'player3@test.com', city: 'Санкт-Петербург', phone: '+78121111111', status: 'PENDING' },
    { userId: 'player4@test.com', city: 'Казань', phone: '+78431111111', status: 'APPROVED' },
    { userId: 'player5@test.com', city: 'Рига', phone: '+37121111111', status: 'REJECTED' },
  ];

  for (const a of applications) {
    await prisma.organizerApplication.create({
      data: {
        userId: users[a.userId].id,
        city: a.city,
        phone: a.phone,
        status: a.status,
      },
    });
  }
  console.log(`✅ ${applications.length} organizer applications created`);

  // ============================================================
  // 15. ГЕОДАННЫЕ (30+ точек)
  // ============================================================
  const heatmapPoints = [
    { lat: 55.7558, lng: 37.6173, game: 'Тайны старого города', team: 'Ночные Волки' },
    { lat: 55.7512, lng: 37.6184, game: 'Тайны старого города', team: 'Ночные Волки' },
    { lat: 55.7600, lng: 37.6200, game: 'Тайны старого города', team: 'Ночные Волки' },
    { lat: 55.7700, lng: 37.6300, game: 'QR-детектив', team: 'Ночные Волки' },
    { lat: 55.7800, lng: 37.6400, game: 'QR-детектив', team: 'Ночные Волки' },
    { lat: 55.7900, lng: 37.6500, game: 'QR-детектив', team: 'Ночные Волки' },
    { lat: 55.8000, lng: 37.6600, game: 'QR-детектив', team: 'Ночные Волки' },
    { lat: 59.9343, lng: 30.3351, game: 'Фотоохота', team: 'Спецназ' },
    { lat: 59.9400, lng: 30.3400, game: 'Фотоохота', team: 'Спецназ' },
    { lat: 59.9500, lng: 30.3500, game: 'Фотоохота', team: 'Спецназ' },
    { lat: 59.9600, lng: 30.3600, game: 'Фотоохота', team: 'Спецназ' },
    { lat: 53.9045, lng: 27.5615, game: 'Ночной дозор', team: 'Ночные Волки' },
    { lat: 53.9100, lng: 27.5700, game: 'Ночной дозор', team: 'Следопыты' },
    { lat: 53.9200, lng: 27.5800, game: 'Ночной дозор', team: 'Следопыты' },
    { lat: 53.9300, lng: 27.5900, game: 'Ночной дозор', team: 'Следопыты' },
    { lat: 56.9460, lng: 24.1059, game: 'GPS-квест', team: 'Искатели' },
    { lat: 56.9500, lng: 24.1100, game: 'GPS-квест', team: 'Следопыты' },
    { lat: 56.9600, lng: 24.1200, game: 'GPS-квест', team: 'Искатели' },
    { lat: 56.9700, lng: 24.1300, game: 'GPS-квест', team: 'Искатели' },
    { lat: 55.7963, lng: 49.1088, game: 'Квиз-марафон', team: 'Спецназ' },
    { lat: 55.8000, lng: 49.1100, game: 'Квиз-марафон', team: 'Спецназ' },
    { lat: 55.8100, lng: 49.1200, game: 'Квиз-марафон', team: 'Спецназ' },
    { lat: 55.7700, lng: 37.6300, game: 'Смешанный квест', team: 'Искатели' },
    { lat: 55.7750, lng: 37.6350, game: 'Смешанный квест', team: 'Искатели' },
    { lat: 55.7800, lng: 37.6400, game: 'Смешанный квест', team: 'Искатели' },
    { lat: 55.7850, lng: 37.6450, game: 'Смешанный квест', team: 'Ночные Волки' },
    { lat: 55.7900, lng: 37.6500, game: 'Смешанный квест', team: 'Ночные Волки' },
    { lat: 55.7950, lng: 37.6550, game: 'Смешанный квест', team: 'Ночные Волки' },
    { lat: 56.9460, lng: 24.1059, game: 'Детектив', team: 'Искатели' },
    { lat: 56.9480, lng: 24.1080, game: 'Детектив', team: 'Искатели' },
    { lat: 56.9500, lng: 24.1100, game: 'Детектив', team: 'Искатели' },
    { lat: 59.9343, lng: 30.3351, game: 'Геокэшинг', team: 'Спецназ' },
    { lat: 59.9360, lng: 30.3380, game: 'Геокэшинг', team: 'Спецназ' },
    { lat: 59.9380, lng: 30.3400, game: 'Геокэшинг', team: 'Спецназ' },
  ];

  for (const p of heatmapPoints) {
    await prisma.heatmapData.create({
      data: {
        gameId: games[p.game].id,
        teamId: teams[p.team].id,
        lat: p.lat,
        lng: p.lng,
      },
    });
  }
  console.log(`✅ ${heatmapPoints.length} heatmap points created`);

  // ============================================================
  // 16. MEDIA (10 обложек игр + 10 баннеров + 10 аватаров + 20 изображений сценариев + 5 аватаров команд)
  // ============================================================
  // Обложки игр (10)
  for (const [index, game] of Object.values(games).entries()) {
    await prisma.media.create({
      data: {
        filename: `game-${index + 1}-cover.jpg`,
        originalName: `cover-${game.title}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024 * 100,
        path: `/uploads/games/${game.id}/cover.jpg`,
        url: `https://placehold.co/800x600/1a1a2e/EEE?text=Game+${index + 1}`,
        gameId: game.id,
      },
    });
  }

  // Баннеры игр (10)
  for (const [index, game] of Object.values(games).entries()) {
    await prisma.media.create({
      data: {
        filename: `game-banner-${index + 1}.jpg`,
        originalName: `banner-${game.title}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024 * 200,
        path: `/uploads/games/${game.id}/banner.jpg`,
        url: `https://placehold.co/1200x400/16213e/EEE?text=Banner+${index + 1}`,
        gameId: game.id,
      },
    });
  }

  // Изображения сценариев (20)
  for (const [index, scenario] of Object.values(scenarios).entries()) {
    for (let i = 0; i < 2; i++) {
      await prisma.media.create({
        data: {
          filename: `scenario-${index + 1}-${i + 1}.jpg`,
          originalName: `scenario-${scenario.name}-${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          size: 1024 * 50,
          path: `/uploads/scenarios/${scenario.id}/image-${i + 1}.jpg`,
          url: `https://placehold.co/400x300/0f3460/EEE?text=Scene+${index + 1}-${i + 1}`,
        },
      });
    }
  }

  // Аватары пользователей (10)
  for (const [index, user] of Object.values(users).entries()) {
    await prisma.media.create({
      data: {
        filename: `user-avatar-${index + 1}.jpg`,
        originalName: `avatar-${user.username}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024 * 10,
        path: `/uploads/users/${user.id}/avatar.jpg`,
        url: `https://placehold.co/128x128/533483/EEE?text=U${index + 1}`,
      },
    });
  }

  // Аватары команд (5)
  for (const [index, team] of Object.values(teams).entries()) {
    await prisma.media.create({
      data: {
        filename: `team-avatar-${index + 1}.jpg`,
        originalName: `avatar-${team.name}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024 * 10,
        path: `/uploads/teams/${team.id}/avatar.jpg`,
        url: `https://placehold.co/128x128/533483/EEE?text=T${index + 1}`,
        teamId: team.id,
      },
    });
  }

  console.log(`✅ Media created (covers, banners, scenario images, avatars)`);

  // ============================================================
  // 17. GAME SESSIONS (SessionState + Event)
  // ============================================================
  // Квиз-марафон (WAITING)
  await prisma.sessionState.create({
    data: {
      teamId: teams['Ночные Волки'].id,
      state: { currentNodeId: 'start', score: 0, status: 'WAITING' },
      sequence: 1,
    },
  });

  // QR-детектив (RUNNING)
  await prisma.sessionState.create({
    data: {
      teamId: teams['Ночные Волки'].id,
      state: { currentNodeId: 'qr', score: 10, status: 'RUNNING', progress: 2, total: 3 },
      sequence: 3,
    },
  });

  // Смешанный квест (FINISHED)
  await prisma.sessionState.create({
    data: {
      teamId: teams['Ночные Волки'].id,
      state: { currentNodeId: 'finish', score: 45, status: 'FINISHED', totalTime: 120 },
      sequence: 10,
    },
  });

  // Events
  const events = [
    { game: 'Квиз-марафон', team: 'Ночные Волки', type: 'SESSION_CREATE', payload: {} },
    { game: 'Квиз-марафон', team: 'Ночные Волки', type: 'PLAYER_JOIN', payload: { playerId: users['player1@test.com'].id } },
    { game: 'QR-детектив', team: 'Ночные Волки', type: 'GAME_START', payload: { startedAt: new Date() } },
    { game: 'QR-детектив', team: 'Ночные Волки', type: 'NODE_ENTER', payload: { nodeId: 'qr' } },
    { game: 'QR-детектив', team: 'Ночные Волки', type: 'PLAYER_ANSWER', payload: { answer: 'SECRET_001' } },
    { game: 'QR-детектив', team: 'Ночные Волки', type: 'NODE_EXIT', payload: { result: 'success', score: 10 } },
    { game: 'Смешанный квест', team: 'Ночные Волки', type: 'GAME_FINISH', payload: { finalScore: 45, totalTime: 120 } },
    { game: 'Смешанный квест', team: 'Ночные Волки', type: 'LEADERBOARD_UPDATE', payload: { rank: 1, totalTeams: 3 } },
  ];

  for (const e of events) {
    await prisma.event.create({
      data: {
        gameId: games[e.game].id,
        teamId: teams[e.team].id,
        type: e.type,
        payload: e.payload,
        timestamp: new Date(),
        sequence: 1,
      },
    });
  }

  console.log(`✅ Game sessions created (SessionState + Events)`);

  // ============================================================
  // 18. SOFT DELETE (3 записи)
  // ============================================================
  await prisma.game.create({
    data: {
      title: 'Удалённая игра',
      description: 'Эта игра была удалена',
      city: 'Москва',
      date: new Date('2026-07-15'),
      time: '19:00',
      duration: 120,
      maxTeams: 10,
      price: 0,
      shareLink: generateShareLink(),
      slug: 'deleted-game',
      organizerId: users['organizer1@test.com'].id,
      scenarioId: scenarios['Ночной автоквест'].id,
      status: GameStatus.CANCELLED,
      deletedAt: new Date(),
    },
  });

  await prisma.scenario.create({
    data: {
      name: 'Удалённый сценарий',
      description: 'Этот сценарий был удалён',
      authorId: users['organizer1@test.com'].id,
      isPublished: false,
      nodes: createScenarioNodes('text'),
      edges: [],
      startNodeId: 'start',
      metadata: { type: 'text', difficulty: 'medium', estimatedDuration: 60, tags: [], coverImage: null },
      validationStatus: 'DRAFT',
      deletedAt: new Date(),
    },
  });

  await prisma.team.create({
    data: {
      name: 'Удалённая команда',
      slug: 'deleted-team',
      captainId: users['player1@test.com'].id,
      status: TeamStatus.DELETED,
      privacy: TeamVisibility.PRIVATE,
      joinPolicy: JoinPolicy.INVITE_ONLY,
      deletedAt: new Date(),
    },
  });

  console.log(`✅ Soft Delete cases created`);

  // ============================================================
  // 19. TEAM INVITE (4)
  // ============================================================
  const invites = [
    { team: 'Ночные Волки', invitedUser: 'player4@test.com', invitedBy: 'player1@test.com' },
    { team: 'Спецназ', invitedUser: 'player1@test.com', invitedBy: 'player2@test.com' },
    { team: 'Искатели', invitedUser: 'player5@test.com', invitedBy: 'player3@test.com' },
    { team: 'Следопыты', invitedUser: 'player3@test.com', invitedBy: 'player4@test.com' },
  ];

  for (const inv of invites) {
    await prisma.teamInvite.create({
      data: {
        teamId: teams[inv.team].id,
        invitedUserId: users[inv.invitedUser].id,
        invitedBy: users[inv.invitedBy].id,
        token: Math.random().toString(36).substring(2, 10),
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ ${invites.length} team invites created`);

  // ============================================================
  // 20. JOIN REQUEST (4)
  // ============================================================
  const joinRequests = [
    { team: 'Ночные Волки', user: 'player5@test.com', status: 'PENDING' },
    { team: 'Спецназ', user: 'player3@test.com', status: 'PENDING' },
    { team: 'Искатели', user: 'player2@test.com', status: 'PENDING' },
    { team: 'Элита', user: 'player1@test.com', status: 'PENDING' },
  ];

  for (const jr of joinRequests) {
    await prisma.joinRequest.create({
      data: {
        teamId: teams[jr.team].id,
        userId: users[jr.user].id,
        status: jr.status as JoinRequestStatus,
        message: `Хочу вступить в команду ${jr.team}!`,
      },
    });
  }
  console.log(`✅ ${joinRequests.length} join requests created`);

  // ============================================================
  // 21. GAME QUESTION (5)
  // ============================================================
  const gameQuestions = [
    { game: 'Тайны старого города', author: 'player1@test.com', question: 'Когда начинается игра?' },
    { game: 'Ночной дозор', author: 'player2@test.com', question: 'Нужно ли брать фонарик?' },
    { game: 'Фотоохота', author: 'player3@test.com', question: 'Можно ли участвовать без команды?' },
    { game: 'GPS-квест', author: 'player4@test.com', question: 'Какое приложение использовать для GPS?' },
    { game: 'Квиз-марафон', author: 'player5@test.com', question: 'Сколько будет вопросов?' },
  ];

  for (const gq of gameQuestions) {
    await prisma.gameQuestion.create({
      data: {
        gameId: games[gq.game].id,
        authorId: users[gq.author].id,
        question: gq.question,
      },
    });
  }
  console.log(`✅ ${gameQuestions.length} game questions created`);

  // ============================================================
  // 22. INVENTORY & RESOURCE
  // ============================================================
  for (const team of Object.values(teams)) {
    await prisma.inventory.create({
      data: {
        teamId: team.id,
        items: [
          { name: 'Ключ', quantity: 1 },
          { name: 'Карта', quantity: 1 },
        ],
        capacity: 10,
      },
    });

    await prisma.resource.create({
      data: {
        teamId: team.id,
        score: 0,
        reputation: 0,
        money: 100,
        energy: 100,
        lives: 3,
      },
    });
  }
  console.log(`✅ Inventory & Resources created for all teams`);

  // ============================================================
  // 23. AUDIT LOG
  // ============================================================
  const auditActions = [
    { user: 'admin@test.com', action: 'USER_CREATED', entity: 'User', entityId: users['admin@test.com'].id },
    { user: 'organizer1@test.com', action: 'GAME_CREATED', entity: 'Game', entityId: games['Тайны старого города'].id },
    { user: 'organizer1@test.com', action: 'SCENARIO_CREATED', entity: 'Scenario', entityId: scenarios['Тайны старого города'].id },
    { user: 'player1@test.com', action: 'TEAM_JOINED', entity: 'Team', entityId: teams['Ночные Волки'].id },
    { user: 'moderator@test.com', action: 'GAME_APPROVED', entity: 'Game', entityId: games['Тайны старого города'].id },
  ];

  for (const audit of auditActions) {
    await prisma.auditLog.create({
      data: {
        userId: users[audit.user].id,
        action: audit.action,
        entity: audit.entity,
        entityId: audit.entityId,
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
      },
    });
  }
  console.log(`✅ ${auditActions.length} audit logs created`);

  // ============================================================
  // 24. FOLLOW (подписки)
  // ============================================================
  const follows = [
    { follower: 'player1@test.com', following: 'organizer1@test.com' },
    { follower: 'player2@test.com', following: 'organizer1@test.com' },
    { follower: 'player3@test.com', following: 'organizer2@test.com' },
    { follower: 'player4@test.com', following: 'organizer2@test.com' },
    { follower: 'player5@test.com', following: 'organizer1@test.com' },
    { follower: 'player1@test.com', following: 'player2@test.com' },
    { follower: 'player2@test.com', following: 'player3@test.com' },
    { follower: 'player3@test.com', following: 'player1@test.com' },
  ];

  for (const f of follows) {
    await prisma.follow.create({
      data: {
        followerId: users[f.follower].id,
        followingId: users[f.following].id,
      },
    });
  }
  console.log(`✅ ${follows.length} follows created`);

  // ============================================================
  // 25. NEGATIVE DATA
  // ============================================================
  // Игра без обложки
  await prisma.game.create({
    data: {
      title: 'Игра без обложки',
      slug: 'game-without-cover',
      description: 'Эта игра без обложки для теста',
      city: 'Москва',
      date: new Date('2026-07-15'),
      time: '19:00',
      duration: 120,
      maxTeams: 10,
      price: 0,
      shareLink: generateShareLink(),
      organizerId: users['organizer1@test.com'].id,
      scenarioId: scenarios['Тайны старого города'].id,
      status: GameStatus.DRAFT,
      imageUrl: null,
      tags: [],
      autoStart: false,
      autoStartDelay: 0,
      allowEarlyStart: true,
      startBuffer: 15,
      allowLateRegistration: false,
    },
  });

  // Пользователь без аватара
  await prisma.user.create({
    data: {
      email: 'noavatar@test.com',
      passwordHash,
      name: 'Без Аватара',
      username: 'noavatar',
      slug: 'noavatar',
      role: Role.PLAYER,
      roles: [Role.PLAYER],
      status: UserStatus.ACTIVE,
      isEmailVerified: false,
      verified: { email: false, phone: false, telegram: false },
      profile: { avatar: null },
      settings: {
        language: 'ru',
        timezone: 'Europe/Moscow',
        theme: 'dark',
        notifications: { email: true, telegram: false, push: true },
        privacy: { showCity: true, showContacts: false, showStats: true, showAchievements: true },
      },
      security: {
        lastLoginAt: null,
        failedLoginAttempts: 0,
        passwordChangedAt: new Date(),
        trustedDevices: [],
      },
      capabilities: [],
      featureFlags: {},
    },
  });

  // Команда без участников
  await prisma.team.create({
    data: {
      name: 'Команда без участников',
      slug: 'team-without-members',
      description: 'Тестовая команда без участников',
      captainId: users['player1@test.com'].id,
      status: TeamStatus.RECRUITING,
      privacy: TeamVisibility.PUBLIC,
      joinPolicy: JoinPolicy.OPEN,
      tags: ['test'],
      maxMembers: 20,
      maxInvitesPerDay: 10,
      maxPendingRequests: 5,
      maxChatMessagesPerMinute: 30,
      socials: { discord: '', vk: '', telegram: '', youtube: '' },
    },
  });

  console.log(`✅ Negative Data created`);

  // ============================================================
  // 26. MARKETPLACE — СЦЕНАРИИ ДЛЯ МАРКЕТПЛЕЙСА (10)
  // ============================================================
  // Создаём ScenarioVersion для каждого сценария, который будет опубликован
  const scenarioVersions: Record<string, any> = {};

  for (const [name, scenario] of Object.entries(scenarios)) {
    const version = await prisma.scenarioVersion.create({
      data: {
        scenarioId: scenario.id,
        version: 1,
        versionLabel: '1.0.0',
        nodes: scenario.nodes,
        edges: scenario.edges,
        startNodeId: scenario.startNodeId,
        status: 'PUBLISHED' as any,
        changelog: 'Первый релиз',
        createdById: scenario.authorId,
      },
    });
    scenarioVersions[name] = version;
  }
  console.log(`✅ ${Object.keys(scenarioVersions).length} scenario versions created`);

  // ============================================================
  // 27. MARKETPLACE — ЛИСТИНГИ (10)
  // ============================================================
  const listings: Record<string, any> = {};
  const listingData = [
    {
      scenario: 'Тайны старого города', author: 'organizer1@test.com',
      title: 'Тайны старого города — пешеходный квест',
      description: 'Погрузитесь в историю старого города! Вас ждут загадки, архитектурные памятники и увлекательные факты. Идеально для прогулки с друзьями или семьёй.',
      shortDescription: 'Исторический пешеходный квест по центру города',
      category: 'QUEST', price: 9.99, licenseType: 'SINGLE' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['history', 'walking', 'family'], views: 245, favorites: 18, sales: 12, avgRating: 4.5, reviewsCount: 4,
    },
    {
      scenario: 'Ночной дозор', author: 'organizer1@test.com',
      title: 'Ночной дозор — авто-приключение',
      description: 'Ночной автоквест по самым загадочным местам города. Проверьте свою смелость и знание городских легенд!',
      shortDescription: 'Автоквест по ночному городу с загадками',
      category: 'AUTO_QUEST', price: 19.99, licenseType: 'MULTI_CITY' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['night', 'auto', 'adventure'], views: 189, favorites: 15, sales: 8, avgRating: 4.3, reviewsCount: 3,
    },
    {
      scenario: 'Фотоохота', author: 'organizer2@test.com',
      title: 'Фотоохота — городской фотоквест',
      description: 'Квест для любителей фотографии. Ищите интересные ракурсы, выполняйте креативные задания и делитесь результатами!',
      shortDescription: 'Фотоквест с креативными заданиями',
      category: 'QUEST', price: 5.99, licenseType: 'SINGLE' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['photo', 'creative', 'walking'], views: 312, favorites: 25, sales: 20, avgRating: 4.7, reviewsCount: 5,
    },
    {
      scenario: 'GPS-квест', author: 'organizer2@test.com',
      title: 'GPS-квест: сокровища города',
      description: 'Настоящий геокэшинг-квест! Используйте GPS-навигацию, чтобы найти скрытые сокровища и узнать тайны города.',
      shortDescription: 'GPS-квест по достопримечательностям',
      category: 'ESCAPE', price: 14.99, licenseType: 'SINGLE' as LicenseType, updatePolicy: 'MAJOR_ONLY' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['gps', 'exploration', 'outdoor'], views: 156, favorites: 12, sales: 6, avgRating: 4.0, reviewsCount: 2,
    },
    {
      scenario: 'Квиз-марафон', author: 'organizer1@test.com',
      title: 'Квиз-марафон: битва умов',
      description: 'Интеллектуальный квиз для эрудитов. Вопросы из разных областей знаний: история, наука, искусство, поп-культура.',
      shortDescription: 'Интеллектуальный квиз для эрудитов',
      category: 'QUIZ', price: 7.99, licenseType: 'SINGLE' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['quiz', 'intellectual', 'team'], views: 420, favorites: 35, sales: 28, avgRating: 4.8, reviewsCount: 6,
    },
    {
      scenario: 'QR-детектив', author: 'organizer1@test.com',
      title: 'QR-детектив: расследование',
      description: 'Детективный квест с QR-кодами. Собирайте улики, допрашивайте свидетелей и раскройте преступление!',
      shortDescription: 'Детективный квест с QR-кодами',
      category: 'RPG', price: 12.99, licenseType: 'SINGLE' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['qr', 'detective', 'mystery'], views: 278, favorites: 22, sales: 15, avgRating: 4.6, reviewsCount: 4,
    },
    {
      scenario: 'Смешанный квест', author: 'organizer2@test.com',
      title: 'Смешанный квест: всё включено',
      description: 'Самый разнообразный квест! Текстовые задания, фото, GPS, QR-коды — попробуйте всё в одном приключении.',
      shortDescription: 'Квест с разными типами заданий',
      category: 'QUEST', price: 16.99, licenseType: 'COMMERCIAL' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['mixed', 'variety', 'adventure'], views: 198, favorites: 16, sales: 10, avgRating: 4.4, reviewsCount: 3,
    },
    {
      scenario: 'Геокэшинг', author: 'organizer2@test.com',
      title: 'Геокэшинг: охота за тайниками',
      description: 'Классический геокэшинг-квест. Ищите тайники, обменивайтесь трофеями и открывайте новые места.',
      shortDescription: 'Поиск тайников в городских локациях',
      category: 'FAMILY', price: 8.99, licenseType: 'SINGLE' as LicenseType, updatePolicy: 'FIXES_ONLY' as UpdatePolicy,
      status: 'DRAFT' as ListingStatus, tags: ['geocaching', 'family', 'outdoor'], views: 45, favorites: 3, sales: 0, avgRating: 0, reviewsCount: 0,
    },
    {
      scenario: 'Детектив', author: 'organizer1@test.com',
      title: 'Детектив: запутанное дело',
      description: 'Станьте детективом и раскройте запутанное преступление. Собирайте улики, анализируйте факты и найдите убийцу!',
      shortDescription: 'Детективный квест с запутанным сюжетом',
      category: 'RPG', price: 11.99, licenseType: 'SINGLE' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'PUBLISHED' as ListingStatus, tags: ['detective', 'mystery', 'story'], views: 534, favorites: 42, sales: 35, avgRating: 4.9, reviewsCount: 7,
    },
    {
      scenario: 'Ночной автоквест', author: 'organizer1@test.com',
      title: 'Ночной автоквест: экстрим',
      description: 'Экстремальный автоквест для опытных водителей. Ночные гонки с загадками и испытаниями.',
      shortDescription: 'Экстремальный ночной автоквест',
      category: 'AUTO_QUEST', price: 29.99, licenseType: 'COMMERCIAL' as LicenseType, updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
      status: 'ARCHIVED' as ListingStatus, tags: ['night', 'auto', 'extreme'], views: 67, favorites: 5, sales: 2, avgRating: 3.5, reviewsCount: 1,
    },
  ];

  for (const ld of listingData) {
    const author = users[ld.author];
    const scenario = scenarios[ld.scenario];
    const listing = await prisma.marketplaceListing.create({
      data: {
        scenarioId: scenario.id,
        authorId: author.id,
        title: ld.title,
        description: ld.description,
        shortDescription: ld.shortDescription,
        category: ld.category,
        tags: ld.tags,
        coverUrl: `https://placehold.co/800x450/1a1a2e/EEE?text=${encodeURIComponent(ld.title.substring(0, 20))}`,
        bannerUrl: `https://placehold.co/1200x400/16213e/EEE?text=${encodeURIComponent(ld.title.substring(0, 20))}`,
        price: ld.price,
        licenseType: ld.licenseType,
        updatePolicy: ld.updatePolicy,
        status: ld.status,
        publishedVersionId: scenarioVersions[ld.scenario].id,
        views: ld.views,
        favorites: ld.favorites,
        sales: ld.sales,
        avgRating: ld.avgRating,
        reviewsCount: ld.reviewsCount,
        publishedAt: ld.status === 'PUBLISHED' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      },
    });
    listings[ld.scenario] = listing;
  }
  console.log(`✅ ${Object.keys(listings).length} marketplace listings created`);

  // ============================================================
  // 28. MARKETPLACE — ПОКУПКИ И ЛИЦЕНЗИИ (8)
  // ============================================================
  const purchaseData = [
    { listing: 'Тайны старого города', buyer: 'player1@test.com', licenseType: 'SINGLE' as LicenseType, price: 9.99, status: 'COMPLETED' as PurchaseStatus },
    { listing: 'Фотоохота', buyer: 'player2@test.com', licenseType: 'SINGLE' as LicenseType, price: 5.99, status: 'COMPLETED' as PurchaseStatus },
    { listing: 'Квиз-марафон', buyer: 'player3@test.com', licenseType: 'SINGLE' as LicenseType, price: 7.99, status: 'COMPLETED' as PurchaseStatus },
    { listing: 'QR-детектив', buyer: 'player4@test.com', licenseType: 'SINGLE' as LicenseType, price: 12.99, status: 'COMPLETED' as PurchaseStatus },
    { listing: 'Детектив', buyer: 'player5@test.com', licenseType: 'SINGLE' as LicenseType, price: 11.99, status: 'COMPLETED' as PurchaseStatus },
    { listing: 'Ночной дозор', buyer: 'player6@test.com', licenseType: 'MULTI_CITY' as LicenseType, price: 19.99, status: 'COMPLETED' as PurchaseStatus },
    { listing: 'Смешанный квест', buyer: 'player7@test.com', licenseType: 'SINGLE' as LicenseType, price: 16.99, status: 'COMPLETED' as PurchaseStatus },
    { listing: 'Детектив', buyer: 'player1@test.com', licenseType: 'SINGLE' as LicenseType, price: 11.99, status: 'COMPLETED' as PurchaseStatus },
  ];

  for (const pd of purchaseData) {
    const listing = listings[pd.listing];
    const buyer = users[pd.buyer];
    const scenarioVersion = scenarioVersions[Object.keys(scenarios).find(k => scenarios[k].id === listing.scenarioId)!];

    const purchase = await prisma.purchase.create({
      data: {
        listingId: listing.id,
        scenarioVersionId: scenarioVersion.id,
        buyerId: buyer.id,
        listingSnapshotTitle: listing.title,
        listingSnapshotVersion: '1.0.0',
        listingSnapshotPrice: pd.price,
        licenseType: pd.licenseType,
        price: pd.price,
        commission: pd.price * 0.15,
        royalty: pd.price * 0.85,
        status: pd.status,
        completedAt: pd.status === 'COMPLETED' ? new Date() : null,
      },
    });

    // Создаём лицензию для каждой завершённой покупки
    await prisma.userLicense.create({
      data: {
        userId: buyer.id,
        listingId: listing.id,
        scenarioVersionId: scenarioVersion.id,
        licenseType: pd.licenseType,
        status: 'ACTIVE' as LicenseStatus,
        activationsUsed: 0,
        activationsLimit: pd.licenseType === 'SINGLE' ? 1 : 10,
        updatePolicy: 'ALL_UPDATES' as UpdatePolicy,
        expiresAt: pd.licenseType === 'MULTI_CITY' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        purchasedAt: new Date(),
      },
    });

    // Создаём запись о доходе автора
    const listingRecord = await prisma.marketplaceListing.findUnique({ where: { id: listing.id } });
    if (listingRecord) {
      await prisma.authorEarning.create({
        data: {
          authorId: listingRecord.authorId,
          purchaseId: purchase.id,
          amount: pd.price * 0.85,
          commission: pd.price * 0.15,
          royalty: pd.price * 0.85,
          status: 'AVAILABLE' as any,
        },
      });
    }
  }
  console.log(`✅ ${purchaseData.length} purchases + licenses + earnings created`);

  // ============================================================
  // 29. MARKETPLACE — КОРЗИНЫ (2-3 пользователя)
  // ============================================================
  const cartData = [
    { user: 'player1@test.com', items: [{ listing: 'Ночной дозор', licenseType: 'MULTI_CITY' as LicenseType }, { listing: 'GPS-квест', licenseType: 'SINGLE' as LicenseType }] },
    { user: 'player3@test.com', items: [{ listing: 'Детектив', licenseType: 'SINGLE' as LicenseType }] },
    { user: 'player5@test.com', items: [{ listing: 'Фотоохота', licenseType: 'SINGLE' as LicenseType }, { listing: 'Смешанный квест', licenseType: 'COMMERCIAL' as LicenseType }] },
  ];

  for (const cd of cartData) {
    const user = users[cd.user];
    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
        items: {
          create: cd.items.map(item => ({
            listingId: listings[item.listing].id,
            licenseType: item.licenseType,
          })),
        },
      },
    });
  }
  console.log(`✅ ${cartData.length} carts created`);

  // ============================================================
  // 30. MARKETPLACE — ИЗБРАННОЕ (у каждого пользователя по 2-3)
  // ============================================================
  const favoriteData = [
    { user: 'player1@test.com', listings: ['Тайны старого города', 'Квиз-марафон', 'Детектив'] },
    { user: 'player2@test.com', listings: ['Фотоохота', 'QR-детектив'] },
    { user: 'player3@test.com', listings: ['Квиз-марафон', 'Детектив', 'Ночной дозор'] },
    { user: 'player4@test.com', listings: ['QR-детектив', 'Смешанный квест'] },
    { user: 'player5@test.com', listings: ['Детектив', 'Тайны старого города', 'Фотоохота'] },
    { user: 'player6@test.com', listings: ['Ночной дозор', 'GPS-квест'] },
    { user: 'player7@test.com', listings: ['Смешанный квест', 'Квиз-марафон'] },
    { user: 'organizer1@test.com', listings: ['Фотоохота', 'GPS-квест'] },
    { user: 'organizer2@test.com', listings: ['Тайны старого города', 'Детектив'] },
    { user: 'moderator@test.com', listings: ['Квиз-марафон', 'QR-детектив'] },
    { user: 'admin@test.com', listings: ['Детектив', 'Смешанный квест'] },
  ];

  for (const fd of favoriteData) {
    const user = users[fd.user];
    for (const listingName of fd.listings) {
      await prisma.favoriteListing.create({
        data: {
          userId: user.id,
          listingId: listings[listingName].id,
        },
      });
    }
  }
  console.log(`✅ Favorites created for ${favoriteData.length} users`);

  // ============================================================
  // 31. MARKETPLACE — ОТЗЫВЫ (10)
  // ============================================================
  const marketplaceReviews = [
    { listing: 'Тайны старого города', user: 'player1@test.com', rating: 5, text: 'Отличный квест! Очень познавательно и интересно. Прошли всей семьёй.' },
    { listing: 'Тайны старого города', user: 'player2@test.com', rating: 4, text: 'Хороший квест, но некоторые вопросы были сложноваты для детей.' },
    { listing: 'Фотоохота', user: 'player3@test.com', rating: 5, text: 'Обожаю фотоквесты! Этот один из лучших.' },
    { listing: 'Квиз-марафон', user: 'player4@test.com', rating: 5, text: 'Лучший квиз на платформе! Вопросы очень интересные.' },
    { listing: 'QR-детектив', user: 'player5@test.com', rating: 4, text: 'Интересный сюжет, но QR-коды могли быть покрупнее.' },
    { listing: 'Детектив', user: 'player6@test.com', rating: 5, text: 'Шедевр! Сюжет держит в напряжении до самого конца.' },
    { listing: 'Ночной дозор', user: 'player7@test.com', rating: 4, text: 'Атмосферный квест, особенно ночью. Рекомендую!' },
    { listing: 'Смешанный квест', user: 'player1@test.com', rating: 5, text: 'Разнообразие заданий — это супер! Не даёт заскучать.' },
    { listing: 'Детектив', user: 'player2@test.com', rating: 5, text: 'Прошёл два раза, чтобы увидеть все концовки.' },
    { listing: 'Квиз-марафон', user: 'player3@test.com', rating: 4, text: 'Отличный квиз, но хотелось бы больше вопросов про науку.' },
  ];

  for (const r of marketplaceReviews) {
    await prisma.marketplaceReview.create({
      data: {
        listingId: listings[r.listing].id,
        userId: users[r.user].id,
        rating: r.rating,
        text: r.text,
        status: 'APPROVED' as ReviewStatus,
      },
    });
  }
  console.log(`✅ ${marketplaceReviews.length} marketplace reviews created`);

  // ============================================================
  // 32. MARKETPLACE — ПРОМОКОДЫ (2)
  // ============================================================
  await prisma.promoCode.create({
    data: {
      code: 'WELCOME10',
      type: 'PERCENTAGE' as PromoCodeType,
      value: 10,
      maxUses: 100,
      usedCount: 5,
      minAmount: 5,
      maxAmount: 50,
      status: 'ACTIVE' as PromoCodeStatus,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdById: users['admin@test.com'].id,
    },
  });

  await prisma.promoCode.create({
    data: {
      code: 'QUEST25',
      type: 'FIXED' as PromoCodeType,
      value: 25,
      maxUses: 50,
      usedCount: 12,
      minAmount: 10,
      status: 'ACTIVE' as PromoCodeStatus,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdById: users['admin@test.com'].id,
    },
  });
  console.log(`✅ 2 promo codes created`);

  // ============================================================
  // 33. MARKETPLACE — АНАЛИТИКА (10 записей)
  // ============================================================
  for (const [name, listing] of Object.entries(listings)) {
    await prisma.marketplaceAnalytics.create({
      data: {
        listingId: listing.id,
        views: Math.floor(Math.random() * 100),
        favorites: Math.floor(Math.random() * 10),
        sales: Math.floor(Math.random() * 5),
        conversionRate: Math.random() * 0.15,
        avgRating: Math.random() * 2 + 3,
        reviewsCount: Math.floor(Math.random() * 3),
        period: 'DAY' as any,
        date: new Date(),
      },
    });
  }
  console.log(`✅ ${Object.keys(listings).length} analytics records created`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });