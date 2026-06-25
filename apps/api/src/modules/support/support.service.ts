import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTicket(dto: CreateTicketDto, userId?: string) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: userId || null,
        email: dto.email,
        name: dto.name,
        category: dto.category,
        message: dto.message,
        attachments: dto.attachments || [],
      },
    });

    this.logger.log(`Создан тикет #${ticket.id} от ${dto.email}`);

    return ticket;
  }

  async getTickets(params: {
    status?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
          assignee: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total };
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Тикет не найден');
    }

    return ticket;
  }

  async updateTicket(id: string, dto: UpdateTicketDto, moderatorId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Тикет не найден');
    }

    const updateData: any = { ...dto };

    // Если тикет берут в работу
    if (dto.status === 'IN_PROGRESS' && !ticket.assignedTo) {
      updateData.assignedTo = moderatorId;
    }

    // Если тикет закрывают
    if (dto.status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        assignee: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    this.logger.log(`Тикет #${id} обновлён: статус=${dto.status}`);

    return updated;
  }

  async getStats() {
    const [new_, inProgress, closed, total] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'NEW' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      this.prisma.supportTicket.count(),
    ]);

    return { new: new_, inProgress, closed, total };
  }
}