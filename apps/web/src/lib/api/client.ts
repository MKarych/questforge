// API Base URL — используем относительный путь, чтобы запросы шли через Next.js rewrite
// на тот же origin (localhost:3001), избегая CORS-проблем
const API_BASE_URL = '/api';

// ==================== Home Page Aggregated DTO ====================

export interface GameCard {
  id: string;
  title: string;
  description: string | null;
  city: string;
  date: string;
  duration: number;
  price: number;
  maxTeams: number;
  shareLink: string;
  status: string;
  imageUrl: string | null;
  publishedAt: string | null;
  organizer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  averageRating: number;
  reviewsCount: number;
  teamsCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  gamesCount: number;
}

export interface OrganizerCard {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  gamesCount: number;
  reviewsCount: number;
}

export interface TeamCard {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  rating: number;
  wins: number;
  membersCount: number;
  city: string | null;
}

export interface WinnerCard {
  teamName: string;
  gameName: string;
  gameId: string;
  wonAt: string;
}

export interface ReviewCard {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FeatureFlags {
  search: boolean;
  notifications: boolean;
  marketplace: boolean;
  ai: boolean;
  reviews: boolean;
  chat: boolean;
  liveActivity: boolean;
  mapPreview: boolean;
  partners: boolean;
  press: boolean;
  downloadApp: boolean;
}

// ==================== Social DTO ====================

export interface FriendDto {
  id: string;
  username: string;
  slug: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  friendsSince: string;
}

export interface FriendRequestDto {
  id: string;
  sender: {
    id: string;
    username: string;
    slug: string;
    avatarUrl: string | null;
  };
  receiver: {
    id: string;
    username: string;
    slug: string;
    avatarUrl: string | null;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedUserDto {
  id: string;
  username: string;
  slug: string;
  avatarUrl: string | null;
  blockedAt: string;
  reason: string | null;
}

export interface ChatPreviewDto {
  id: string;
  participant: {
    id: string;
    username: string;
    slug: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessageDto {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
}

export interface SystemStatus {
  status: 'online' | 'maintenance' | 'beta' | 'error';
  message: string;
}

export interface HomePageResponse {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
  };
  stats: {
    games: number;
    teams: number;
    players: number;
    cities: number;
    organizers: number;
  };
  games: {
    featured: GameCard[];
    popular: GameCard[];
    recent: GameCard[];
    trending: GameCard[];
  };
  categories: Category[];
  topOrganizers: OrganizerCard[];
  topTeams: TeamCard[];
  recentWinners: WinnerCard[];
  recentReviews: ReviewCard[];
  faq: FAQItem[];
  featureFlags: FeatureFlags;
  systemStatus: SystemStatus;
}

// ==================== Shared types from backend ====================

export interface Game {
  id: string;
  title: string;
  description: string | null;
  city: string;
  date: string;
  duration: number;
  price: number;
  maxTeams: number;
  shareLink: string;
  status: string;
  imageUrl: string | null;
  publishedAt: string | null;
  scenarioId: string | null;
  organizer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  averageRating: number;
  reviewsCount: number;
  teamsCount: number;
}

export interface GameDetails extends Game {
  scenario: {
    id: string;
    name: string;
    description: string | null;
    version: number;
  } | null;
  reviews: Review[];
  comments: Comment[];
  organizer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  averageRating: number;
  reviewsCount: number;
  teamsCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isRegistered: boolean;
}

export interface Review {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface Session {
  sessionId: string;
  teamId: string;
  teamName: string;
  currentNode: {
    id: string;
    type: string;
    title: string;
    description: string;
  };
  score: number;
  status: string;
  startedAt: string;
}

export interface SessionState {
  sessionId: string;
  teamId: string;
  teamName: string;
  currentNodeId: string;
  score: number;
  penalties: number;
  status: string;
  startedAt: string;
  finishedAt?: string;
  history: {
    nodeId: string;
    result: 'success' | 'fail' | 'timeout';
    timestamp: number;
    score?: number;
  }[];
}

export interface SubmitAnswerRequest {
  answer: string;
  nodeId: string;
}

export interface SubmitAnswerResponse {
  status: 'success' | 'fail' | 'pending' | 'finished';
  score: number;
  penalties: number;
  message: string;
  nextNode?: {
    id: string;
    type: string;
    title: string;
    description: string;
  } | null;
  history: {
    nodeId: string;
    result: 'success' | 'fail' | 'timeout';
    timestamp: number;
    score?: number;
  }[];
  totalTime: number;
}

export interface User {
  id: string;
  uuid: string;
  email: string;
  username: string;
  name: string;
  isEmailVerified: boolean;
  slug: string;
  avatarUrl: string | null;
  avatar: string | null;
  city: string;
  bio: string;
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN' | 'MODERATOR';
  roles: string[];
  status: string;
  organizerStatus: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  rating: number;
  trustScore: number;
  reputation: number;
  achievements: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
  gamesCreated: number;
  scenariosCreated: number;
  gamesConducted: number;
  language: string;
  timezone: string;
  theme: string;
  socialLinks: {
    tg?: string;
    vk?: string;
    discord?: string;
    youtube?: string;
    github?: string;
  };
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  stats: {
    gamesPlayed: number;
    gamesCompleted: number;
    averageScore: number;
  };
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
  captchaAnswer?: number;
}

export interface CreateSessionRequest {
  gameId: string;
  teamName: string;
  teamId?: string;
}

export interface CreateGameRequest {
  title: string;
  description: string;
  city: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  maxTeams: number;
  scenarioId?: string | null;
  status?: string;
}

export interface CreateGameResponse {
  id: string;
  title: string;
  city: string;
  status: string;
  shareLink: string;
  createdAt: string;
}

export interface Scenario {
  id: string;
  name: string;
  version: number;
  isPublished: boolean;
  salesCount: number;
  rating: number;
  createdAt: string;
}

export interface CreateScenarioRequest {
  name: string;
  nodes: Array<{
    id: string;
    type: string;
    question: string;
    answer?: string;
    transitions?: Array<{ when: string; to: string }>;
  }>;
  startNodeId: string;
}

export interface CreateScenarioResponse {
  id: string;
  name: string;
  version: number;
  nodesCount: number;
  valid: boolean;
  createdAt: string;
}

// ==================== Teams ====================

export interface Team {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  description: string | null;
  city: string | null;
  captain: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  membersCount: number;
  status: string;
  tags: string[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
  lastActiveAt?: string | null;
}

export interface TeamDetails {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  banner: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  socials: Record<string, string>;
  captain: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  members: TeamMember[];
  membersCount: number;
  status: string;
  privacy: string;
  joinPolicy: string;
  tags: string[];
  createdAt: string;
}

export interface TeamPrivateDetails extends TeamDetails {
  settings: {
    privacy: string;
    joinPolicy: string;
    limits: {
      maxMembers: number;
      maxInvitesPerDay: number;
      maxPendingRequests: number;
      maxChatMessagesPerMinute: number;
    };
  };
  invites: Array<{
    id: string;
    invitedUser: { id: string; name: string; avatarUrl: string | null };
    status: string;
    createdAt: string;
    expiresAt: string;
  }>;
  joinRequests: Array<{
    id: string;
    user: { id: string; name: string; avatarUrl: string | null };
    message: string | null;
    status: string;
    createdAt: string;
  }>;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  slug?: string;
  city?: string;
  country?: string;
  website?: string;
  socials?: Record<string, string>;
  privacy?: string;
  joinPolicy?: string;
  tags?: string[];
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  city?: string;
  country?: string;
  website?: string;
  socials?: Record<string, string>;
  privacy?: string;
  joinPolicy?: string;
  tags?: string[];
  maxMembers?: number;
}

export interface InviteUserRequest {
  userId: string;
  message?: string;
}

export interface CreateJoinRequest {
  message?: string;
}

export interface TransferOwnershipRequest {
  toUserId: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

export interface MyTeam {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  description: string | null;
  captain: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  members: TeamMember[];
  membersCount: number;
  myRole: string;
  joinedAt: string;
}

// API Error
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// API Response wrapper
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: number;
    version: string;
  };
}

// ==================== Search ====================

export interface SearchResultItem {
  id: string;
  type: 'game' | 'user' | 'team';
  label: string;
  description?: string;
  href: string;
  imageUrl?: string;
}

// API Client Class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private saveToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2,
  ): Promise<T> {
    // Проверка онлайн-статуса перед запросом
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Нет подключения к интернету');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          // Если 401 — токен невалидный, очищаем его
          if (response.status === 401) {
            this.removeToken();
          }
          const error: ApiError = data;
          throw new Error(error.error?.message || 'Request failed');
        }

        return data as T;
      } catch (err) {
        // Если это последняя попытка — пробрасываем ошибку
        if (attempt === retries) {
          // Проверяем, не связано ли с офлайн-статусом
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error('Нет подключения к интернету');
          }
          throw err;
        }

        // Экспоненциальная задержка перед повторной попыткой
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
        );
      }
    }

    throw new Error('Request failed');
  }

  /**
   * Public request method for custom endpoints not covered by named methods.
   * Returns the raw API response (wrapped in TransformInterceptor format).
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  /**
   * GET-запрос с query-параметрами. Строит URLSearchParams из переданного объекта.
   */
  async getWithParams<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const queryParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      }
    }
    const query = queryParams.toString();
    return this.request<T>(`${endpoint}${query ? `?${query}` : ''}`);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // ==================== Auth ====================

  async login(credentials: LoginRequest): Promise<ApiResponse<User & AuthTokens>> {
    const response = await this.request<ApiResponse<User & AuthTokens>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Бэкенд возвращает accessToken, а интерфейс ожидает token
    this.saveToken((response.data as any).accessToken || response.data.token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User & AuthTokens>> {
    const response = await this.request<ApiResponse<User & AuthTokens>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    // Бэкенд возвращает accessToken, а интерфейс ожидает token
    this.saveToken((response.data as any).accessToken || response.data.token);
    return response;
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request<ApiResponse<{ message: string }>>('/auth/logout', {
      method: 'POST',
    });
    this.removeToken();
    return response;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/me');
  }

  async updateUserSettings(settings: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.patch<ApiResponse<User>>('/users/me', settings);
  }

  // ==================== Games (Public) ====================

  async getPublicGames(params?: {
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ data: Game[]; meta: { total: number; limit: number; offset: number } }>> {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/games/public${query ? `?${query}` : ''}`);
  }

  async getPublicGame(id: string): Promise<ApiResponse<GameDetails>> {
    return this.request(`/games/public/${id}`);
  }

  async getPublicComments(gameId: string, limit?: number, offset?: number): Promise<ApiResponse<{ data: Comment[]; meta: { total: number; limit: number; offset: number } }>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    return this.request(`/games/public/${gameId}/comments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  }

  async addPublicComment(gameId: string, text: string): Promise<ApiResponse<Comment>> {
    return this.request(`/games/public/${gameId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async deletePublicComment(gameId: string, commentId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/games/public/${gameId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async updatePublicComment(gameId: string, commentId: string, text: string): Promise<ApiResponse<Comment>> {
    return this.request(`/games/public/${gameId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text }),
    });
  }

  // ==================== Games (Organizer) ====================

  async createGame(data: CreateGameRequest): Promise<ApiResponse<CreateGameResponse>> {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyGames(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ data: Game[]; meta: { total: number; limit: number; offset: number } }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/games/me${query ? `?${query}` : ''}`);
  }

  async getGame(id: string): Promise<ApiResponse<GameDetails>> {
    return this.request(`/games/${id}`);
  }

  async updateGame(id: string, data: Partial<CreateGameRequest>): Promise<ApiResponse<GameDetails>> {
    return this.request(`/games/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publishGame(id: string): Promise<ApiResponse<GameDetails>> {
    return this.request(`/games/${id}/publish`, {
      method: 'POST',
    });
  }

  async getGameReviews(gameId: string, limit?: number, offset?: number): Promise<ApiResponse<{ data: Review[]; meta: { total: number; limit: number; offset: number } }>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    return this.request(`/games/${gameId}/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  }

  async getGameTeams(gameId: string, limit?: number, offset?: number): Promise<ApiResponse<{ data: Array<{ id: string; name: string; score: number; penalties: number; status: string; captain: { name: string } }>; meta: { total: number; limit: number; offset: number } }>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    return this.request(`/games/${gameId}/teams${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  }

  async removeGame(id: string): Promise<ApiResponse<GameDetails>> {
    return this.request(`/games/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Scenarios ====================

  async getScenarios(params?: {
    published?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ data: Scenario[]; meta: { total: number; limit: number; offset: number } }>> {
    const queryParams = new URLSearchParams();
    if (params?.published !== undefined) queryParams.append('published', params.published.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/scenarios${query ? `?${query}` : ''}`);
  }

  async getScenario(id: string): Promise<ApiResponse<Scenario>> {
    return this.request(`/scenarios/${id}`);
  }

  async updateScenario(id: string, data: Partial<CreateScenarioRequest>): Promise<ApiResponse<Scenario>> {
    return this.request(`/scenarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createScenario(data: CreateScenarioRequest): Promise<ApiResponse<CreateScenarioResponse>> {
    return this.request('/scenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async publishScenario(id: string, price?: number, licenseType?: string): Promise<ApiResponse<Scenario>> {
    return this.request(`/scenarios/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ price, licenseType }),
    });
  }

  async deleteScenario(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/scenarios/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Sessions ====================

  async createSession(data: CreateSessionRequest): Promise<ApiResponse<Session>> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSessionState(teamId: string): Promise<ApiResponse<SessionState>> {
    return this.request(`/sessions/${teamId}`);
  }

  async submitAnswer(teamId: string, gameId: string, nodeId: string, answer: string): Promise<ApiResponse<SubmitAnswerResponse>> {
    return this.request(`/sessions/${teamId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ gameId, nodeId, answer }),
    });
  }

  async finishSession(teamId: string): Promise<ApiResponse<{ status: string; finishedAt: string }>> {
    return this.request(`/sessions/${teamId}/finish`, {
      method: 'POST',
    });
  }

  // ==================== Teams ====================

  async createTeam(data: CreateTeamRequest): Promise<ApiResponse<Team>> {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTeams(params?: {
    city?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ items: Team[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/teams${query ? `?${query}` : ''}`);
  }

  async getTeam(id: string): Promise<ApiResponse<TeamDetails>> {
    return this.request(`/teams/${id}`);
  }

  async inviteToTeam(teamId: string, data: InviteUserRequest): Promise<ApiResponse<{ status: string; inviteId: string; message: string }>> {
    return this.request(`/teams/${teamId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinTeam(teamId: string, inviteToken?: string): Promise<ApiResponse<{ status: string; teamId: string; message: string }>> {
    return this.request(`/teams/${teamId}/join`, {
      method: 'POST',
      body: JSON.stringify({ inviteToken }),
    });
  }

  async leaveTeam(teamId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/members/me`, {
      method: 'DELETE',
    });
  }

  async removeMember(teamId: string, userId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getTeamPrivate(id: string): Promise<ApiResponse<TeamPrivateDetails>> {
    return this.request(`/teams/${id}/private`);
  }

  async updateTeam(id: string, data: UpdateTeamRequest): Promise<ApiResponse<TeamDetails>> {
    return this.request(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(id: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${id}`, {
      method: 'DELETE',
    });
  }

  async getTeamMembers(id: string): Promise<ApiResponse<TeamMember[]>> {
    return this.request(`/teams/${id}/members`);
  }

  async updateMemberRole(teamId: string, userId: string, data: UpdateMemberRoleRequest): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createJoinRequest(teamId: string, data: CreateJoinRequest): Promise<ApiResponse<{ status: string; requestId: string; message: string }>> {
    return this.request(`/teams/${teamId}/join-request`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveJoinRequest(teamId: string, requestId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/join-request/${requestId}/approve`, {
      method: 'POST',
    });
  }

  async rejectJoinRequest(teamId: string, requestId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/join-request/${requestId}/reject`, {
      method: 'POST',
    });
  }

  async acceptInvite(teamId: string, inviteId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/invite/${inviteId}/accept`, {
      method: 'POST',
    });
  }

  async declineInvite(teamId: string, inviteId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/invite/${inviteId}/decline`, {
      method: 'POST',
    });
  }

  async transferOwnership(teamId: string, data: TransferOwnershipRequest): Promise<ApiResponse<{ status: string; transferId: string; message: string }>> {
    return this.request(`/teams/${teamId}/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptTransfer(teamId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/teams/${teamId}/transfer/accept`, {
      method: 'POST',
    });
  }

  async getTeamHistory(id: string): Promise<ApiResponse<Array<{ id: string; action: string; actorName: string; details: Record<string, unknown>; createdAt: string }>>> {
    return this.request(`/teams/${id}/history`);
  }

  async getMyTeam(): Promise<ApiResponse<MyTeam | null>> {
    return this.request('/teams/me/team');
  }

  async getMyTeams(): Promise<ApiResponse<MyTeam[]>> {
    return this.request('/teams/my');
  }

  async registerTeam(gameId: string, teamId: string): Promise<ApiResponse<{ id: string; teamId: string; gameId: string; team: { id: string; name: string; captainId: string }; joinedAt: string }>> {
    return this.request(`/games/${gameId}/register`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  async registerTeamByName(gameId: string, teamName: string): Promise<ApiResponse<{ id: string; teamId: string; gameId: string; team: { id: string; name: string; slug: string }; status: string }>> {
    return this.request(`/games/${gameId}/register-by-name`, {
      method: 'POST',
      body: JSON.stringify({ teamName }),
    });
  }

  async addReview(gameId: string, rating: number, text?: string): Promise<ApiResponse<{ id: string; rating: number; text: string | null; createdAt: string; user: { id: string; name: string; avatarUrl: string | null } }>> {
    return this.request(`/games/${gameId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, text }),
    });
  }

  async startGame(gameId: string): Promise<ApiResponse<{ id: string; status: string; startedAt: string }>> {
    return this.request(`/games/${gameId}/start`, {
      method: 'POST',
    });
  }

  async getGameRegistrations(gameId: string): Promise<ApiResponse<Array<{ teamId: string; team: { id: string; name: string; slug: string; avatar: string | null }; status: string; readyAt: string | null; registeredAt: string }>>> {
    return this.request(`/games/${gameId}/teams-status`);
  }

  // ==================== Gameplay (Организатор) ====================

  async openRegistration(gameId: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return this.request(`/games/${gameId}/open-registration`, {
      method: 'POST',
    });
  }

  async closeRegistration(gameId: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return this.request(`/games/${gameId}/close-registration`, {
      method: 'POST',
    });
  }

  async cancelGame(gameId: string): Promise<ApiResponse<{ id: string; status: string; message: string }>> {
    return this.request(`/games/${gameId}/cancel`, {
      method: 'POST',
    });
  }

  async rescheduleGame(gameId: string, date: string, time: string): Promise<ApiResponse<{ id: string; status: string; scheduledAt: string; message: string }>> {
    return this.request(`/games/${gameId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ date, time }),
    });
  }

  async moveToLobby(gameId: string): Promise<ApiResponse<{ id: string; status: string; message: string }>> {
    return this.request(`/games/${gameId}/move-to-lobby`, {
      method: 'POST',
    });
  }

  async finishGame(gameId: string): Promise<ApiResponse<{ id: string; status: string; finishedAt: string }>> {
    return this.request(`/games/${gameId}/finish`, {
      method: 'POST',
    });
  }

  async setTeamReady(gameId: string, teamId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/games/${gameId}/ready`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  /**
   * getMyTeamStatus: получить статус команды текущего пользователя относительно игры.
   * Используется для авто-редиректа при повторном входе.
   */
  async getMyTeamStatus(gameId: string): Promise<ApiResponse<{
    registered: boolean;
    teamId: string | null;
    teamName: string | null;
    registrationStatus: string | null;
    gameStatus: string;
    sessionId: string | null;
  }>> {
    return this.request(`/games/${gameId}/my-team-status`);
  }

  /**
   * getSessionByTeamAndGame: получить последнюю сессию команды для данной игры.
   * Используется для восстановления sessionId при повторном входе.
   */
  async getSessionByTeamAndGame(teamId: string, gameId: string): Promise<ApiResponse<{
    sessionId: string | null;
    teamId: string;
    status: string;
    score?: number;
    currentNodeId?: string | null;
  }>> {
    return this.request(`/sessions/by-team/${teamId}/game/${gameId}`);
  }

  /**
   * getMyActiveRegistrations: получить все активные регистрации текущего пользователя.
   * Используется для баннера в Header и виджета на главной.
   */
  async getMyActiveRegistrations(): Promise<ApiResponse<Array<{
    gameId: string;
    gameTitle: string;
    shareLink: string;
    gameStatus: string;
    teamId: string;
    teamName: string;
    sessionId: string | null;
    timer: {
      canStart: boolean;
      timeUntilStart: number;
      startTime: string;
    } | null;
    city: string;
    duration: number;
  }>>> {
    return this.request('/games/my-active-registrations');
  }

  async askQuestion(gameId: string, text: string): Promise<ApiResponse<{ id: string; text: string; createdAt: string }>> {
    return this.request(`/games/${gameId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getQuestions(gameId: string): Promise<ApiResponse<Array<{ id: string; text: string; answer: string | null; createdAt: string; user: { id: string; name: string } }>>> {
    return this.request(`/games/${gameId}/questions`);
  }

  async sendChatMessage(gameId: string, text: string): Promise<ApiResponse<{ id: string; text: string; createdAt: string; user: { id: string; name: string } }>> {
    return this.request(`/games/${gameId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getChatMessages(gameId: string): Promise<ApiResponse<Array<{ id: string; text: string; createdAt: string; user: { id: string; name: string; avatarUrl: string | null } }>>> {
    return this.request(`/games/${gameId}/chat`);
  }

  async sendOrganizerMessage(gameId: string, text: string): Promise<ApiResponse<{ id: string; text: string; createdAt: string }>> {
    return this.request(`/games/${gameId}/chat/organizer`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getOrganizerMessages(gameId: string): Promise<ApiResponse<Array<{ id: string; text: string; createdAt: string; user: { id: string; name: string } }>>> {
    return this.request(`/games/${gameId}/chat/organizer`);
  }

  async uploadCover(gameId: string, formData: FormData): Promise<ApiResponse<{ coverUrl: string }>> {
    return this.request(`/games/${gameId}/upload-cover`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  // ==================== Sessions (Игрок) ====================

  async requestHint(teamId: string): Promise<ApiResponse<{ hint: string; penalty: number }>> {
    return this.request(`/sessions/${teamId}/hint`, {
      method: 'POST',
    });
  }

  async getCurrentNode(teamId: string): Promise<ApiResponse<{ id: string; title: string; description: string; type: string; hint: string | null; mediaUrl: string | null; startedAt: string }>> {
    return this.request(`/sessions/${teamId}/current-node`);
  }

  async getInventory(teamId: string): Promise<ApiResponse<Array<{ id: string; itemId: string; name: string; description: string; icon: string | null; quantity: number; acquiredAt: string }>>> {
    return this.request(`/sessions/${teamId}/inventory`);
  }

  async addInventoryItem(teamId: string, itemId: string, quantity?: number): Promise<ApiResponse<{ id: string; itemId: string; quantity: number; message: string }>> {
    return this.request(`/sessions/${teamId}/inventory`, {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity: quantity || 1 }),
    });
  }

  async removeInventoryItem(teamId: string, itemId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/sessions/${teamId}/inventory/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getResources(teamId: string): Promise<ApiResponse<{ hp: number; maxHp: number; energy: number; maxEnergy: number; score: number; bonuses: Array<{ id: string; name: string; value: number; expiresAt: string | null }> }>> {
    return this.request(`/sessions/${teamId}/resources`);
  }

  // ==================== Users (Социальное) ====================

  async getFollowers(userId: string, limit = 20, offset = 0): Promise<ApiResponse<{ data: Array<{ id: string; name: string; avatarUrl: string | null; followedAt: string }>; meta: { total: number; limit: number; offset: number } }>> {
    return this.request(`/users/${userId}/followers?limit=${limit}&offset=${offset}`);
  }

  async getFollowing(userId: string, limit = 20, offset = 0): Promise<ApiResponse<{ data: Array<{ id: string; name: string; avatarUrl: string | null; followedAt: string }>; meta: { total: number; limit: number; offset: number } }>> {
    return this.request(`/users/${userId}/following?limit=${limit}&offset=${offset}`);
  }

  async followUser(userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  async getFavorites(userId: string): Promise<ApiResponse<Array<{ id: string; category: string; itemId: string; createdAt: string; item?: any }>>> {
    return this.request(`/users/${userId}/favorites`);
  }

  async addFavorite(category: string, itemId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/users/me/favorites/${category}/${itemId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(category: string, itemId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/users/me/favorites/${category}/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getActivityFeed(userId: string, limit = 20, offset = 0): Promise<ApiResponse<{ data: Array<{ id: string; type: string; description: string; createdAt: string; metadata?: any }>; meta: { total: number; limit: number; offset: number } }>> {
    return this.request(`/users/${userId}/activity?limit=${limit}&offset=${offset}`);
  }

  async getUserTeams(userId: string): Promise<ApiResponse<Array<{ id: string; name: string; slug: string; avatar: string | null; memberCount: number; role: string }>>> {
    return this.request(`/users/${userId}/teams`);
  }

  async getUserScenarios(userId: string, limit = 20, offset = 0): Promise<ApiResponse<{ data: Array<{ id: string; title: string; description: string; status: string; createdAt: string; updatedAt: string }>; meta: { total: number; limit: number; offset: number } }>> {
    return this.request(`/users/${userId}/scenarios?limit=${limit}&offset=${offset}`);
  }

  async getUserAchievements(userId: string): Promise<ApiResponse<Array<{ id: string; name: string; description: string; icon: string; unlockedAt: string | null; progress: number; maxProgress: number }>>> {
    return this.request(`/users/${userId}/achievements`);
  }

  async checkAchievements(): Promise<ApiResponse<Array<{ id: string; name: string; unlocked: boolean }>>> {
    return this.request(`/users/me/check-achievements`, {
      method: 'POST',
    });
  }

  async deleteAvatar(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/users/me/avatar`, {
      method: 'DELETE',
    });
  }

  async deleteUser(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/users/me`, {
      method: 'DELETE',
    });
  }

  // ==================== Notifications ====================

  async getNotifications(limit = 20, offset = 0): Promise<ApiResponse<{ data: Array<{ id: string; type: string; title: string; message: string; read: boolean; link: string | null; createdAt: string }>; meta: { total: number; limit: number; offset: number } }>> {
    return this.request(`/notifications?limit=${limit}&offset=${offset}`);
  }

  async markNotificationRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/notifications/read-all`, {
      method: 'PATCH',
    });
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request(`/notifications/unread-count`);
  }

  // ==================== Admin ====================

  async getAdminStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalOrganizers: number;
    totalGames: number;
    activeGames: number;
    totalScenarios: number;
    pendingGames: number;
    pendingApplications: number;
    pendingComplaints: number;
    newSupportTickets: number;
    inProgressSupportTickets: number;
  }>> {
    return this.request('/admin/stats');
  }

  async getAdminNotificationCounts(): Promise<ApiResponse<{
    pendingApplications: number;
    pendingComplaints: number;
    newSupportTickets: number;
  }>> {
    return this.request('/admin/notification-counts');
  }

  // ==================== Admin Games (пост-модерация) ====================

  async getAdminGames(params?: {
    status?: string;
    city?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ data: any[]; meta: { total: number; limit: number; offset: number } }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return this.request(`/games/admin/all${query ? `?${query}` : ''}`);
  }

  async adminHideGame(gameId: string, comment?: string): Promise<ApiResponse<any>> {
    return this.request(`/games/admin/${gameId}/hide`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    });
  }

  async adminUnhideGame(gameId: string): Promise<ApiResponse<any>> {
    return this.request(`/games/admin/${gameId}/unhide`, { method: 'PATCH' });
  }

  async adminBlockGame(gameId: string, comment?: string): Promise<ApiResponse<any>> {
    return this.request(`/games/admin/${gameId}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    });
  }

  async adminDeleteGame(gameId: string): Promise<ApiResponse<any>> {
    return this.request(`/games/admin/${gameId}`, { method: 'DELETE' });
  }

  async getPendingApplications(): Promise<ApiResponse<any[]>> {
    return this.request('/admin/organizer-applications');
  }

  async approveApplication(applicationId: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/organizer-applications/${applicationId}/approve`, { method: 'POST' });
  }

  async rejectApplication(applicationId: string, reason: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/organizer-applications/${applicationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getUsersAdmin(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ items: any[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async blockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/users/${userId}/block`, { method: 'PATCH' });
  }

  async unblockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/users/${userId}/unblock`, { method: 'PATCH' });
  }

  async changeUserRole(userId: string, role: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // ==================== Admin Teams ====================

  async getAdminTeams(params?: {
    search?: string;
    status?: string;
    city?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ items: any[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return this.request(`/admin/teams${query ? `?${query}` : ''}`);
  }

  async getAdminTeam(id: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/teams/${id}`);
  }

  async updateAdminTeam(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminTeam(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/teams/${id}`, { method: 'DELETE' });
  }

  // ==================== Support ====================

  async createSupportTicket(data: {
    email: string;
    name: string;
    category: string;
    message: string;
    attachments?: string[];
  }): Promise<ApiResponse<any>> {
    return this.request('/support', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSupportTickets(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ items: any[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return this.request(`/support${query ? `?${query}` : ''}`);
  }

  async getSupportTicket(id: string): Promise<ApiResponse<any>> {
    return this.request(`/support/${id}`);
  }

  async updateSupportTicket(id: string, data: {
    status?: string;
    response?: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/support/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getSupportStats(): Promise<ApiResponse<{
    new: number;
    inProgress: number;
    closed: number;
    total: number;
  }>> {
    return this.request('/support/stats');
  }
  // ==================== Search ====================

  async search(q: string, limit = 10): Promise<ApiResponse<{
    games: SearchResultItem[];
    users: SearchResultItem[];
    teams: SearchResultItem[];
  }>> {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('limit', limit.toString());
    return this.request(`/search?${params.toString()}`);
  }

  // ==================== Social ====================

  async sendFriendRequest(userId: string): Promise<ApiResponse<FriendRequestDto>> {
    return this.post<ApiResponse<FriendRequestDto>>(`/users/${userId}/friend-request`);
  }

  async respondToFriendRequest(requestId: string, action: 'accepted' | 'rejected'): Promise<ApiResponse<FriendRequestDto>> {
    return this.patch<ApiResponse<FriendRequestDto>>(`/users/friend-requests/${requestId}`, { action });
  }

  async cancelFriendRequest(requestId: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete<ApiResponse<{ message: string }>>(`/users/friend-requests/${requestId}`);
  }

  async getFriendRequests(): Promise<ApiResponse<{ incoming: FriendRequestDto[]; outgoing: FriendRequestDto[] }>> {
    return this.get<ApiResponse<{ incoming: FriendRequestDto[]; outgoing: FriendRequestDto[] }>>('/users/me/friend-requests');
  }

  async getMyFriends(): Promise<ApiResponse<FriendDto[]>> {
    return this.get<ApiResponse<FriendDto[]>>('/users/me/friends');
  }

  async getUserFriends(userId: string): Promise<ApiResponse<FriendDto[]>> {
    return this.get<ApiResponse<FriendDto[]>>(`/users/${userId}/friends`);
  }

  async removeFriend(friendId: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete<ApiResponse<{ message: string }>>(`/users/${friendId}/friend`);
  }

  async socialBlockUser(userId: string, reason?: string): Promise<ApiResponse<BlockedUserDto>> {
    return this.post<ApiResponse<BlockedUserDto>>(`/users/${userId}/block`, reason ? { reason } : undefined);
  }

  async socialUnblockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete<ApiResponse<{ message: string }>>(`/users/${userId}/block`);
  }

  async getBlockedUsers(): Promise<ApiResponse<BlockedUserDto[]>> {
    return this.get<ApiResponse<BlockedUserDto[]>>('/users/me/blocked');
  }

  async sendMessage(userId: string, text: string): Promise<ApiResponse<ChatMessageDto>> {
    return this.post<ApiResponse<ChatMessageDto>>(`/users/${userId}/chat`, { text });
  }

  async getChats(): Promise<ApiResponse<ChatPreviewDto[]>> {
    return this.get<ApiResponse<ChatPreviewDto[]>>('/users/me/chats');
  }

  async getChatHistory(userId: string): Promise<ApiResponse<ChatMessageDto[]>> {
    return this.get<ApiResponse<ChatMessageDto[]>>(`/users/${userId}/chat`);
  }
}

// ==================== Home Page ====================

export const getHomePage = () => apiClient.get<ApiResponse<HomePageResponse>>('/home');

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Upload avatar — используем абсолютный URL, минуя Next.js rewrite,
// так как Next.js не умеет корректно проксировать multipart/form-data
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch('http://localhost:3000/api/upload/avatar', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Ошибка загрузки аватара');
  }

  const json = await res.json();
  // TransformInterceptor оборачивает в { success: true, data: { avatarUrl }, meta }
  const avatarUrl = json?.data?.avatarUrl;
  if (!avatarUrl) {
    throw new Error('Сервер не вернул URL аватара');
  }
  return avatarUrl;
}

// Export named methods for convenience
export const getPublicGames = (params?: {
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) => apiClient.getPublicGames(params);
export const getPublicGame = (id: string) => apiClient.getPublicGame(id);
export const createGame = (data: CreateGameRequest) => apiClient.createGame(data);
export const getMyGames = (params?: { status?: string }) => apiClient.getMyGames(params);
export const getGames = () => apiClient.getMyGames();
export const getGame = (id: string) => apiClient.getGame(id);
export const updateGame = (id: string, data: Partial<CreateGameRequest>) =>
  apiClient.updateGame(id, data);
export const removeGame = (id: string) => apiClient.removeGame(id);
export const publishGame = (id: string) => apiClient.publishGame(id);
export const getScenarios = (params?: { published?: boolean }) => apiClient.getScenarios(params);
export const getScenario = (id: string) => apiClient.getScenario(id);
export const updateScenario = (id: string, data: Partial<CreateScenarioRequest>) =>
  apiClient.updateScenario(id, data);
export const createScenario = (data: CreateScenarioRequest) => apiClient.createScenario(data);
export const publishScenario = (id: string, price?: number, licenseType?: string) =>
  apiClient.publishScenario(id, price, licenseType);
export const deleteScenario = (id: string) => apiClient.deleteScenario(id);
export const getScenariosForGame = () => apiClient.getScenarios({ published: true });
export const startSession = (data: CreateSessionRequest) => apiClient.createSession(data);
export const submitAnswer = (teamId: string, gameId: string, nodeId: string, answer: string) =>
  apiClient.submitAnswer(teamId, gameId, nodeId, answer);
export const getSessionState = (teamId: string) => apiClient.getSessionState(teamId);
export const login = (credentials: LoginRequest) => apiClient.login(credentials);
export const register = (userData: RegisterRequest) => apiClient.register(userData);
export const logout = () => apiClient.logout();
export const getProfile = () => apiClient.getProfile();
export const updateUserSettings = (settings: Record<string, unknown>) => apiClient.updateUserSettings(settings);

// Teams
export const createTeam = (data: CreateTeamRequest) => apiClient.createTeam(data);
export const getTeams = (params?: { city?: string; limit?: number; offset?: number }) => apiClient.getTeams(params);
export const getTeam = (id: string) => apiClient.getTeam(id);
export const inviteToTeam = (teamId: string, data: InviteUserRequest) => apiClient.inviteToTeam(teamId, data);
export const joinTeam = (teamId: string, inviteToken?: string) => apiClient.joinTeam(teamId, inviteToken);
export const leaveTeam = (teamId: string) => apiClient.leaveTeam(teamId);
export const removeMember = (teamId: string, userId: string) => apiClient.removeMember(teamId, userId);
export const getMyTeam = () => apiClient.getMyTeam();
export const getMyTeams = () => apiClient.getMyTeams();
export const registerTeam = (gameId: string, teamId: string) => apiClient.registerTeam(gameId, teamId);
export const registerTeamByName = (gameId: string, teamName: string) => apiClient.registerTeamByName(gameId, teamName);
export const addReview = (gameId: string, rating: number, text?: string) => apiClient.addReview(gameId, rating, text);
export const startGame = (gameId: string) => apiClient.startGame(gameId);
export const getMyActiveRegistrations = () => apiClient.getMyActiveRegistrations();
export const finishGame = (gameId: string) => apiClient.finishGame(gameId);
export const getGameRegistrations = (gameId: string) => apiClient.getGameRegistrations(gameId);
export const cancelGame = (gameId: string) => apiClient.cancelGame(gameId);
export const rescheduleGame = (gameId: string, date: string, time: string) => apiClient.rescheduleGame(gameId, date, time);
export const moveToLobby = (gameId: string) => apiClient.moveToLobby(gameId);
export const openRegistration = (gameId: string) => apiClient.openRegistration(gameId);
export const closeRegistration = (gameId: string) => apiClient.closeRegistration(gameId);
export const setTeamReady = (gameId: string, teamId: string) => apiClient.setTeamReady(gameId, teamId);
export const askQuestion = (gameId: string, text: string) => apiClient.askQuestion(gameId, text);
export const getQuestions = (gameId: string) => apiClient.getQuestions(gameId);
export const sendChatMessage = (gameId: string, text: string) => apiClient.sendChatMessage(gameId, text);
export const getChatMessages = (gameId: string) => apiClient.getChatMessages(gameId);
export const sendOrganizerMessage = (gameId: string, text: string) => apiClient.sendOrganizerMessage(gameId, text);
export const getOrganizerMessages = (gameId: string) => apiClient.getOrganizerMessages(gameId);
export const getMyTeamStatus = (gameId: string) => apiClient.getMyTeamStatus(gameId);
export const getSessionByTeamAndGame = (teamId: string, gameId: string) => apiClient.getSessionByTeamAndGame(teamId, gameId);
export const uploadCover = (gameId: string, formData: FormData) => apiClient.uploadCover(gameId, formData);
export const requestHint = (teamId: string) => apiClient.requestHint(teamId);
export const getCurrentNode = (teamId: string) => apiClient.getCurrentNode(teamId);
export const getInventory = (teamId: string) => apiClient.getInventory(teamId);
export const addInventoryItem = (teamId: string, itemId: string, quantity?: number) => apiClient.addInventoryItem(teamId, itemId, quantity);
export const removeInventoryItem = (teamId: string, itemId: string) => apiClient.removeInventoryItem(teamId, itemId);
export const getResources = (teamId: string) => apiClient.getResources(teamId);
export const getFollowers = (userId: string, limit?: number, offset?: number) => apiClient.getFollowers(userId, limit, offset);
export const getFollowing = (userId: string, limit?: number, offset?: number) => apiClient.getFollowing(userId, limit, offset);
export const followUser = (userId: string) => apiClient.followUser(userId);
export const unfollowUser = (userId: string) => apiClient.unfollowUser(userId);
export const getFavorites = (userId: string) => apiClient.getFavorites(userId);
export const addFavorite = (category: string, itemId: string) => apiClient.addFavorite(category, itemId);
export const removeFavorite = (category: string, itemId: string) => apiClient.removeFavorite(category, itemId);
export const getActivityFeed = (userId: string, limit?: number, offset?: number) => apiClient.getActivityFeed(userId, limit, offset);
export const getUserTeams = (userId: string) => apiClient.getUserTeams(userId);
export const getUserScenarios = (userId: string, limit?: number, offset?: number) => apiClient.getUserScenarios(userId, limit, offset);
export const getUserAchievements = (userId: string) => apiClient.getUserAchievements(userId);
export const checkAchievements = () => apiClient.checkAchievements();
export const deleteAvatar = () => apiClient.deleteAvatar();
export const deleteUser = () => apiClient.deleteUser();
export const getNotifications = (limit?: number, offset?: number) => apiClient.getNotifications(limit, offset);
export const markNotificationRead = (id: string) => apiClient.markNotificationRead(id);
export const markAllNotificationsRead = () => apiClient.markAllNotificationsRead();
export const getUnreadNotificationCount = () => apiClient.getUnreadNotificationCount();
export const getPublicComments = (gameId: string, limit?: number, offset?: number) => apiClient.getPublicComments(gameId, limit, offset);
export const addPublicComment = (gameId: string, text: string) => apiClient.addPublicComment(gameId, text);
export const deletePublicComment = (gameId: string, commentId: string) => apiClient.deletePublicComment(gameId, commentId);
export const updatePublicComment = (gameId: string, commentId: string, text: string) => apiClient.updatePublicComment(gameId, commentId, text);
export const getTeamPrivate = (id: string) => apiClient.getTeamPrivate(id);
export const updateTeam = (id: string, data: UpdateTeamRequest) => apiClient.updateTeam(id, data);
export const deleteTeam = (id: string) => apiClient.deleteTeam(id);
export const getTeamMembers = (id: string) => apiClient.getTeamMembers(id);
export const updateMemberRole = (teamId: string, userId: string, data: UpdateMemberRoleRequest) => apiClient.updateMemberRole(teamId, userId, data);
export const createJoinRequest = (teamId: string, data: CreateJoinRequest) => apiClient.createJoinRequest(teamId, data);
export const approveJoinRequest = (teamId: string, requestId: string) => apiClient.approveJoinRequest(teamId, requestId);
export const rejectJoinRequest = (teamId: string, requestId: string) => apiClient.rejectJoinRequest(teamId, requestId);
export const acceptInvite = (teamId: string, inviteId: string) => apiClient.acceptInvite(teamId, inviteId);
export const declineInvite = (teamId: string, inviteId: string) => apiClient.declineInvite(teamId, inviteId);
export const transferOwnership = (teamId: string, data: TransferOwnershipRequest) => apiClient.transferOwnership(teamId, data);
export const acceptTransfer = (teamId: string) => apiClient.acceptTransfer(teamId);
export const getTeamHistory = (id: string) => apiClient.getTeamHistory(id);

// Admin Teams
export const getAdminTeams = (params?: { search?: string; status?: string; city?: string; limit?: number; offset?: number }) => apiClient.getAdminTeams(params);
export const getAdminTeam = (id: string) => apiClient.getAdminTeam(id);
export const updateAdminTeam = (id: string, data: any) => apiClient.updateAdminTeam(id, data);
export const deleteAdminTeam = (id: string) => apiClient.deleteAdminTeam(id);

// ==================== Social ====================
export const sendFriendRequest = (userId: string) => apiClient.sendFriendRequest(userId);
export const respondToFriendRequest = (requestId: string, action: 'accepted' | 'rejected') => apiClient.respondToFriendRequest(requestId, action);
export const cancelFriendRequest = (requestId: string) => apiClient.cancelFriendRequest(requestId);
export const getFriendRequests = () => apiClient.getFriendRequests();
export const getMyFriends = () => apiClient.getMyFriends();
export const getUserFriends = (userId: string) => apiClient.getUserFriends(userId);
export const removeFriend = (friendId: string) => apiClient.removeFriend(friendId);
export const socialBlockUser = (userId: string, reason?: string) => apiClient.socialBlockUser(userId, reason);
export const socialUnblockUser = (userId: string) => apiClient.socialUnblockUser(userId);
export const getBlockedUsers = () => apiClient.getBlockedUsers();
export const sendMessage = (userId: string, text: string) => apiClient.sendMessage(userId, text);
export const getChats = () => apiClient.getChats();
export const getChatHistory = (userId: string) => apiClient.getChatHistory(userId);

// ==================== Marketplace ====================
export interface MarketplaceListingDto {
  id: string;
  title: string;
  description: string | null;
  price: number;
  licenseType: string;
  category: string;
  tags: string[];
  status: string;
  views: number;
  favorites: number;
  sales: number;
  avgRating: number;
  reviewsCount: number;
  imageUrl: string | null;
  createdAt: string;
  publishedAt: string | null;
  author: { id: string; username: string; avatarUrl: string | null };
  scenario: { id: string; name: string; version: number };
}

export interface MarketplaceSearchParams {
  search?: string;
  category?: string;
  licenseType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}

export const searchMarketplace = (params?: MarketplaceSearchParams) =>
  apiClient.getWithParams<ApiResponse<{ items: MarketplaceListingDto[]; total: number }>>('/marketplace', params as any);

export const getMarketplaceListing = (id: string) =>
  apiClient.get<ApiResponse<MarketplaceListingDto>>(`/marketplace/${id}`);

export const incrementListingViews = (id: string) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(`/marketplace/${id}/views`, {});

export const getMarketplaceCategories = () =>
  apiClient.get<ApiResponse<string[]>>('/marketplace/categories');

export const getMarketplaceTypes = () =>
  apiClient.get<ApiResponse<string[]>>('/marketplace/types');

export const getListingReviews = (id: string, params?: { status?: string; limit?: number; offset?: number }) =>
  apiClient.getWithParams<ApiResponse<any>>(`/marketplace/${id}/reviews`, params as any);

export const createListing = (data: any) =>
  apiClient.post<ApiResponse<MarketplaceListingDto>>('/marketplace', data);

export const updateListing = (id: string, data: any) =>
  apiClient.patch<ApiResponse<MarketplaceListingDto>>(`/marketplace/${id}`, data);

export const publishListing = (id: string) =>
  apiClient.post<ApiResponse<MarketplaceListingDto>>(`/marketplace/${id}/publish`, {});

export const unpublishListing = (id: string) =>
  apiClient.post<ApiResponse<MarketplaceListingDto>>(`/marketplace/${id}/unpublish`, {});

export const getMyListings = () =>
  apiClient.get<ApiResponse<MarketplaceListingDto[]>>('/marketplace/me/listings');

export const getMySales = () =>
  apiClient.get<ApiResponse<any[]>>('/marketplace/me/sales');

export const getMyEarnings = () =>
  apiClient.get<ApiResponse<any>>('/marketplace/me/earnings');

export const purchaseListing = (id: string, data: { licenseType?: string; promoCode?: string }) =>
  apiClient.post<ApiResponse<any>>(`/marketplace/${id}/purchase`, data);

export const addFavoriteListing = (id: string) =>
  apiClient.post<ApiResponse<any>>(`/marketplace/${id}/favorite`, {});

export const removeFavoriteListing = (id: string) =>
  apiClient.delete<ApiResponse<{ success: boolean }>>(`/marketplace/${id}/favorite`);

export const getMyFavorites = () =>
  apiClient.get<ApiResponse<MarketplaceListingDto[]>>('/marketplace/me/favorites');

export const getMyPurchases = (params?: { limit?: number; offset?: number }) =>
  apiClient.getWithParams<ApiResponse<any[]>>('/marketplace/me/purchases', params as any);

export const getMyLicenses = () =>
  apiClient.get<ApiResponse<any[]>>('/marketplace/me/licenses');

export const getCart = () =>
  apiClient.get<ApiResponse<any>>('/marketplace/cart');

export const addToCart = (data: { listingId: string; licenseType?: string }) =>
  apiClient.post<ApiResponse<any>>('/marketplace/cart', data);

export const removeFromCart = (itemId: string) =>
  apiClient.delete<ApiResponse<{ success: boolean }>>(`/marketplace/cart/${itemId}`);

export const clearCart = () =>
  apiClient.post<ApiResponse<{ success: boolean }>>('/marketplace/cart/clear', {});

export const getCartCount = () =>
  apiClient.get<ApiResponse<{ count: number }>>('/marketplace/cart/count');

export const checkoutCart = () =>
  apiClient.post<ApiResponse<any>>('/marketplace/cart/checkout', {});

export const validatePromo = (data: { code: string; listingId: string; amount: number }) =>
  apiClient.post<ApiResponse<any>>('/marketplace/promo/validate', data);

export const createReview = (listingId: string, data: { rating: number; text?: string }) =>
  apiClient.post<ApiResponse<any>>(`/marketplace/${listingId}/review`, data);

export const updateReview = (reviewId: string, data: { rating: number; text?: string }) =>
  apiClient.patch<ApiResponse<any>>(`/marketplace/reviews/${reviewId}`, data);

export const deleteReview = (reviewId: string) =>
  apiClient.delete<ApiResponse<{ success: boolean }>>(`/marketplace/reviews/${reviewId}`);

export const getMyBalance = () =>
  apiClient.get<ApiResponse<any>>('/marketplace/me/balance');

export const requestPayout = (data: { amount: number }) =>
  apiClient.post<ApiResponse<any>>('/marketplace/me/payouts', data);

export const getMyPayouts = (params?: { limit?: number; offset?: number }) =>
  apiClient.getWithParams<ApiResponse<any[]>>('/marketplace/me/payouts', params as any);

export const getMyEarningsHistory = (params?: { limit?: number; offset?: number }) =>
  apiClient.getWithParams<ApiResponse<any[]>>('/marketplace/me/earnings-history', params as any);

export const getMyAnalytics = (params?: { period?: string; limit?: number; offset?: number }) =>
  apiClient.getWithParams<ApiResponse<any>>('/marketplace/me/analytics', params as any);

export const getMyAnalyticsSummary = () =>
  apiClient.get<ApiResponse<any>>('/marketplace/me/analytics/summary');

// ============================================================
// LISTING QUESTIONS
// ============================================================

export interface ListingQuestionDto {
  id: string;
  listingId: string;
  userId: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  answeredBy: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  listing?: {
    id: string;
    title: string;
  };
}

export const getListingQuestions = (listingId: string) =>
  apiClient.get<ApiResponse<ListingQuestionDto[]>>(`/marketplace/${listingId}/questions`);

export const askListingQuestion = (listingId: string, question: string) =>
  apiClient.post<ApiResponse<ListingQuestionDto>>(`/marketplace/${listingId}/questions`, { question });

export const answerListingQuestion = (questionId: string, answer: string) =>
  apiClient.patch<ApiResponse<ListingQuestionDto>>(`/marketplace/questions/${questionId}/answer`, { answer });

export const getSellerQuestions = () =>
  apiClient.get<ApiResponse<ListingQuestionDto[]>>('/marketplace/seller/questions');

export const getUnansweredQuestions = () =>
  apiClient.get<ApiResponse<ListingQuestionDto[]>>('/marketplace/seller/questions/unanswered');

export const getUnansweredQuestionsCount = () =>
  apiClient.get<ApiResponse<{ count: number }>>('/marketplace/seller/questions/unanswered/count');

// ============================================================
// COMPLAINT / REPORT SYSTEM
// ============================================================

export type ComplaintTargetType = 'GAME' | 'SCENARIO' | 'COMMENT' | 'REVIEW' | 'MARKETPLACE_REVIEW' | 'USER' | 'TEAM' | 'CHAT_MESSAGE';
export type ComplaintReason = 'SPAM' | 'ABUSE' | 'NSFW' | 'COPYRIGHT' | 'FRAUD' | 'HARASSMENT' | 'IMPERSONATION' | 'FALSE_INFO' | 'OTHER';
export type ComplaintStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateComplaintData {
  targetType: ComplaintTargetType;
  targetId: string;
  reason: ComplaintReason;
  description?: string;
}

export interface ModerateComplaintData {
  action: 'soft' | 'hard';
  moderationNote?: string;
}

export interface ComplaintDto {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar: string | null;
  targetType: ComplaintTargetType;
  targetId: string;
  reason: ComplaintReason;
  description: string | null;
  status: ComplaintStatus;
  moderatedBy: string | null;
  moderatedByName: string | null;
  moderatedAt: string | null;
  moderationNote: string | null;
  createdAt: string;
  updatedAt: string;
  targetInfo?: Record<string, unknown>;
}

export interface ComplaintListResponse {
  items: ComplaintDto[];
  total: number;
}

export const createComplaint = (data: CreateComplaintData) =>
  apiClient.post<ApiResponse<ComplaintDto>>('/complaints', data);

export const getAdminComplaints = (params?: {
  status?: string;
  targetType?: string;
  limit?: number;
  offset?: number;
}) => apiClient.getWithParams<ApiResponse<ComplaintListResponse>>('/admin/complaints', params as any);

export const getAdminComplaintDetail = (id: string) =>
  apiClient.get<ApiResponse<ComplaintDto>>(`/admin/complaints/${id}`);

export const approveComplaint = (id: string, data: ModerateComplaintData) =>
  apiClient.post<ApiResponse<ComplaintDto>>(`/admin/complaints/${id}/approve`, data);

export const rejectComplaint = (id: string, moderationNote?: string) =>
  apiClient.post<ApiResponse<ComplaintDto>>(`/admin/complaints/${id}/reject`, { moderationNote });
