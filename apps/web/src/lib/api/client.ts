// API Base URL — используем относительный путь, чтобы запросы шли через Next.js rewrite
// на тот же origin (localhost:3001), избегая CORS-проблем
const API_BASE_URL = '/api';

// Shared types from backend
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
  user: {
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
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
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
  duration: number;
  price: number;
  maxTeams: number;
  scenarioId?: string;
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
    this.saveToken(response.data.token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User & AuthTokens>> {
    const response = await this.request<ApiResponse<User & AuthTokens>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.saveToken(response.data.token);
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
    return this.request(`/games${query ? `?${query}` : ''}`);
  }

  async getGame(id: string): Promise<ApiResponse<GameDetails>> {
    return this.request(`/games/${id}`);
  }

  async updateGame(id: string, data: Partial<CreateGameRequest>): Promise<ApiResponse<GameDetails>> {
    return this.request(`/games/${id}`, {
      method: 'PUT',
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
    return this.request(`/games/${gameId}/register-team`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
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
  }>> {
    return this.request('/admin/stats');
  }

  async getPendingGamesAdmin(params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ items: any[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return this.request(`/admin/games/pending${query ? `?${query}` : ''}`);
  }

  async approveGame(gameId: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/games/${gameId}/approve`, { method: 'POST' });
  }

  async rejectGame(gameId: string, reason: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/games/${gameId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
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
}

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
