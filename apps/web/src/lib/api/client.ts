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
  email: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  bio: string | null;
  telegram: string | null;
  vk: string | null;
  whatsapp: string | null;
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN' | 'MODERATOR' | 'AUTHOR';
  organizerStatus: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  organizerApprovedAt?: string;
  rating?: number;
  reputation?: number;
  achievements?: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
  gamesCreated?: number;
  scenariosCreated?: number;
  gamesConducted?: number;
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
  description: string | null;
  captain: {
    id: string;
    name: string;
    avatar: string | null;
  };
  membersCount: number;
  rating: number;
  createdAt: string;
}

export interface TeamDetails extends Team {
  members: Array<{
    id: string;
    name: string;
    avatar: string | null;
    role: 'captain' | 'member';
    joinedAt: string;
  }>;
  gamesPlayed: number;
  gamesWon: number;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface InviteUserRequest {
  userId: string;
}

export interface MyTeam extends Team {
  myRole: 'captain' | 'member';
  joinedAt: string;
  members: Array<{
    id: string;
    name: string;
    avatar: string | null;
    role: 'captain' | 'member';
  }>;
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
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

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
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

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
