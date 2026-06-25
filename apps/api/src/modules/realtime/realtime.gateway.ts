import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RealtimeEvent, RealtimeEventType } from '../../engine/types/engine.types';

/**
 * WebSocket Gateway for real-time game synchronization.
 *
 * Каналы (спека 58):
 * - team:{teamId} — внутри команды
 * - game:{gameId} — все участники игры
 * - organizer:{userId} — организатору
 *
 * События синхронизации:
 * - STATE_SYNC — полная синхронизация состояния
 * - NODE_ASSIGNED — переход на новый узел
 * - NODE_COMPLETED — узел завершён
 * - ANSWER_ACCEPTED — ответ принят
 * - ANSWER_REJECTED — ответ отклонён
 * - SCORE_UPDATED — обновление счёта
 * - INVENTORY_UPDATED — обновление инвентаря
 * - TEAM_FINISHED — команда завершила игру
 * - MEMBER_JOINED — новый участник
 * - MEMBER_LEFT — участник покинул команду
 * - PRESENCE_UPDATE — статус присутствия
 * - CHAT_MESSAGE — сообщение в чате
 * - HINT_REVEALED — подсказка раскрыта
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  // Хранилище подключений: socketId -> { userId, teamIds, gameIds }
  private connections = new Map<string, {
    userId: string;
    teamIds: Set<string>;
    gameIds: Set<string>;
    lastPing: number;
  }>();

  // Heartbeat interval (30 seconds, спека 58)
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  afterInit() {
    this.logger.log('Realtime WebSocket Gateway initialized');
    this.startHeartbeat();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Инициализируем подключение
    this.connections.set(client.id, {
      userId: client.handshake.query.userId as string || 'anonymous',
      teamIds: new Set(),
      gameIds: new Set(),
      lastPing: Date.now(),
    });

    // Отправляем подтверждение подключения
    client.emit('connected', {
      socketId: client.id,
      timestamp: Date.now(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connections.delete(client.id);
  }

  // ================================================================
  // Подписка на каналы
  // ================================================================

  /**
   * Подписаться на канал команды.
   */
  @SubscribeMessage('join:team')
  handleJoinTeam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { teamId: string },
  ) {
    const room = `team:${data.teamId}`;
    client.join(room);

    const conn = this.connections.get(client.id);
    if (conn) {
      conn.teamIds.add(data.teamId);
    }

    this.logger.log(`Client ${client.id} joined team room: ${room}`);
    return { success: true, room };
  }

  /**
   * Отписаться от канала команды.
   */
  @SubscribeMessage('leave:team')
  handleLeaveTeam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { teamId: string },
  ) {
    const room = `team:${data.teamId}`;
    client.leave(room);

    const conn = this.connections.get(client.id);
    if (conn) {
      conn.teamIds.delete(data.teamId);
    }

    this.logger.log(`Client ${client.id} left team room: ${room}`);
    return { success: true };
  }

  /**
   * Подписаться на канал игры.
   */
  @SubscribeMessage('join:game')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    const room = `game:${data.gameId}`;
    client.join(room);

    const conn = this.connections.get(client.id);
    if (conn) {
      conn.gameIds.add(data.gameId);
    }

    this.logger.log(`Client ${client.id} joined game room: ${room}`);
    return { success: true, room };
  }

  /**
   * Отписаться от канала игры.
   */
  @SubscribeMessage('leave:game')
  handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    const room = `game:${data.gameId}`;
    client.leave(room);

    const conn = this.connections.get(client.id);
    if (conn) {
      conn.gameIds.delete(data.gameId);
    }

    this.logger.log(`Client ${client.id} left game room: ${room}`);
    return { success: true };
  }

  /**
   * Подписаться на канал организатора.
   */
  @SubscribeMessage('join:organizer')
  handleJoinOrganizer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizerId: string },
  ) {
    const room = `organizer:${data.organizerId}`;
    client.join(room);

    this.logger.log(`Client ${client.id} joined organizer room: ${room}`);
    return { success: true, room };
  }

  // ================================================================
  // Heartbeat (Ping/Pong, спека 58)
  // ================================================================

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    const conn = this.connections.get(client.id);
    if (conn) {
      conn.lastPing = Date.now();
    }

    client.emit('pong', { timestamp: Date.now() });
  }

  // ================================================================
  // Публичные методы для отправки событий (из сервисов)
  // ================================================================

  /**
   * Отправить событие всем участникам команды.
   */
  broadcastToTeam(teamId: string, event: RealtimeEvent): void {
    this.server.to(`team:${teamId}`).emit('realtime:event', event);
  }

  /**
   * Отправить событие всем участникам игры.
   */
  broadcastToGame(gameId: string, event: RealtimeEvent): void {
    this.server.to(`game:${gameId}`).emit('realtime:event', event);
  }

  /**
   * Отправить событие организатору.
   */
  broadcastToOrganizer(organizerId: string, event: RealtimeEvent): void {
    this.server.to(`organizer:${organizerId}`).emit('realtime:event', event);
  }

  /**
   * Отправить событие конкретному клиенту.
   */
  sendToClient(clientId: string, event: RealtimeEvent): void {
    this.server.to(clientId).emit('realtime:event', event);
  }

  // ================================================================
  // Приватные методы
  // ================================================================

  /**
   * Запуск heartbeat для проверки присутствия.
   * Каждые 30 секунд проверяем статус подключений.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [socketId, conn] of this.connections.entries()) {
        const timeSinceLastPing = now - conn.lastPing;

        let presenceStatus: 'ONLINE' | 'IDLE' | 'OFFLINE';
        if (timeSinceLastPing < 60000) {
          presenceStatus = 'ONLINE';
        } else if (timeSinceLastPing < 120000) {
          presenceStatus = 'IDLE';
        } else {
          presenceStatus = 'OFFLINE';
        }

        // Отправляем обновление присутствия всем командам пользователя
        const presenceEvent: RealtimeEvent = {
          type: 'PRESENCE_UPDATE',
          teamId: '',
          payload: {
            userId: conn.userId,
            status: presenceStatus,
            lastSeenAt: now,
          },
          timestamp: now,
        };

        for (const teamId of conn.teamIds) {
          presenceEvent.teamId = teamId;
          this.broadcastToTeam(teamId, presenceEvent);
        }
      }
    }, 30000); // каждые 30 секунд
  }
}