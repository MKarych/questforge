```markdown
# API Contracts: Контракты запросов и ответов

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный
> **Статус:** Утвержден

---

## 1. Принципы

- Все запросы и ответы строго типизированы
- Ошибки имеют коды и понятные сообщения
- Версионирование через заголовок `Accept-Version`

---

## 2. Общий формат

### 2.1. Успешный ответ

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: number;
    version: string;
  };
}
```

### 2.2. Ошибка

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 2.3. Коды ошибок

```typescript
enum ErrorCode {
  // Auth
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  FORBIDDEN = 'FORBIDDEN',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  
  // Game Engine
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_LOCKED = 'SESSION_LOCKED',
  INVALID_ANSWER = 'INVALID_ANSWER',
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  GAME_NOT_ACTIVE = 'GAME_NOT_ACTIVE',
  TIME_TRAVEL_FAILED = 'TIME_TRAVEL_FAILED',
  
  // Rate Limiting
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

---

## 3. Auth

### 3.1. Register

```typescript
// Request
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Response
interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
  refreshToken: string;
}
```

### 3.2. Login

```typescript
// Request
interface LoginRequest {
  email: string;
  password: string;
}

// Response
interface LoginResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
  refreshToken: string;
}
```

---

## 4. Games

### 4.1. Create Game

```typescript
// Request
interface CreateGameRequest {
  title: string;
  description: string;
  city: string;
  date: string; // ISO
  duration: number;
  price: number;
  maxTeams: number;
  scenarioId?: string;
  imageUrl?: string;
}

// Response
interface CreateGameResponse {
  id: string;
  title: string;
  shareLink: string;
  status: GameStatus;
  createdAt: string;
}
```

### 4.2. Get Game

```typescript
// Request
// GET /games/:id

// Response
interface GetGameResponse {
  id: string;
  title: string;
  description: string;
  city: string;
  date: string;
  duration: number;
  price: number;
  maxTeams: number;
  status: GameStatus;
  shareLink: string;
  organizer: {
    id: string;
    name: string;
    rating: number;
  };
  teams: {
    id: string;
    name: string;
    score: number;
    members: number;
  }[];
  createdAt: string;
}
```

---

## 5. Sessions

### 5.1. Start Session

```typescript
// Request
interface StartSessionRequest {
  gameId: string;
  teamName: string;
  playerName: string;
}

// Response
interface StartSessionResponse {
  sessionId: string;
  teamId: string;
  currentNode: {
    id: string;
    type: string;
    title: string;
    description: string;
  };
  score: number;
  status: TeamStatus;
  startedAt: string;
}
```

### 5.2. Submit Answer

```typescript
// Request
interface SubmitAnswerRequest {
  commandId: string;
  nodeId: string;
  answer: string | number | boolean;
  answerType: 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice';
  metadata?: {
    lat?: number;
    lng?: number;
    photoUrl?: string;
    accuracy?: number;
  };
}

// Response
interface SubmitAnswerResponse {
  status: 'success' | 'fail' | 'pending' | 'finished';
  score: number;
  message: string;
  nextNode?: {
    id: string;
    type: string;
    title: string;
    description: string;
  };
  totalTime?: number;
}
```

### 5.3. Get Session State

```typescript
// Request
// GET /sessions/:id

// Response
interface GetSessionStateResponse {
  sessionId: string;
  teamId: string;
  teamName: string;
  currentNodeId: string;
  score: number;
  penalties: number;
  status: TeamStatus;
  startedAt: string;
  finishedAt?: string;
  history: {
    nodeId: string;
    result: 'success' | 'fail' | 'timeout';
    timestamp: string;
  }[];
}
```

---

## 6. Scenarios

### 6.1. Create Scenario

```typescript
// Request
interface CreateScenarioRequest {
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  startNodeId: string;
  metadata: ScenarioMetadata;
}

// Response
interface CreateScenarioResponse {
  id: string;
  name: string;
  version: number;
  valid: boolean;
  validationErrors: ValidationError[];
  createdAt: string;
}
```

### 6.2. Validate Scenario

```typescript
// Request
// POST /scenarios/:id/validate

// Response
interface ValidateScenarioResponse {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

---

## 7. Marketplace

### 7.1. List Scenarios

```typescript
// Request
// GET /marketplace?category=quest&limit=20&offset=0

// Response
interface ListScenariosResponse {
  items: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    reviewsCount: number;
    author: {
      id: string;
      name: string;
    };
    createdAt: string;
  }[];
  total: number;
  limit: number;
  offset: number;
}
```

### 7.2. Purchase Scenario

```typescript
// Request
interface PurchaseScenarioRequest {
  scenarioId: string;
  licenseType: 'single' | 'multi_city' | 'commercial' | 'white_label';
  city?: string;
}

// Response
interface PurchaseScenarioResponse {
  purchaseId: string;
  scenarioId: string;
  licenseType: string;
  price: number;
  status: 'active';
  expiresAt: string;
}
```

---

## 8. Admin

### 8.1. Moderate Game

```typescript
// Request
interface ModerateGameRequest {
  status: 'approved' | 'rejected';
  comment?: string;
}

// Response
interface ModerateGameResponse {
  id: string;
  status: 'approved' | 'rejected';
  moderatedAt: string;
  moderatorComment: string;
}
```

### 8.2. Moderate Organizer Application

```typescript
// Request
interface ModerateApplicationRequest {
  status: 'approved' | 'rejected';
  reason?: string;
}

// Response
interface ModerateApplicationResponse {
  id: string;
  status: 'approved' | 'rejected';
  reviewedAt: string;
}
```

---

## 9. Итоговый контракт

> **Все запросы и ответы типизированы.**
>
> **Ошибки имеют коды.**
>
> **Контракты версионируются.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Контракты — основа взаимодействия.*
```