// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
  role: string;
  organizerStatus: string;
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
}

export interface CreateGameResponse {
  id: string;
  title: string;
  city: string;
  status: string;
  shareLink: string;
  createdAt: string;
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
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export named methods for convenience
export const getPublicGames = (params?: { city?: string }) => apiClient.getPublicGames(params);
export const getPublicGame = (id: string) => apiClient.getPublicGame(id);
export const createGame = (data: CreateGameRequest) => apiClient.createGame(data);
export const getMyGames = (params?: { status?: string }) => apiClient.getMyGames(params);
export const getGames = () => apiClient.getMyGames();
export const getGame = (id: string) => apiClient.getGame(id);
export const startSession = (data: CreateSessionRequest) => apiClient.createSession(data);
export const submitAnswer = (teamId: string, gameId: string, nodeId: string, answer: string) =>
  apiClient.submitAnswer(teamId, gameId, nodeId, answer);
export const getSessionState = (teamId: string) => apiClient.getSessionState(teamId);
export const login = (credentials: LoginRequest) => apiClient.login(credentials);
export const register = (userData: RegisterRequest) => apiClient.register(userData);
export const logout = () => apiClient.logout();
export const getProfile = () => apiClient.getProfile();
