import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
export declare class ScenariosService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateScenarioDto): Promise<{
        id: string;
        version: number;
        createdAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
        publishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
        authorId: string;
        isPublished: boolean;
        licenseType: string | null;
        nodes: import("@prisma/client/runtime/library").JsonValue;
        edges: import("@prisma/client/runtime/library").JsonValue;
        startNodeId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        validationStatus: string | null;
        validationErrors: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(userId: string, params: {
        published?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: {
            id: string;
            version: number;
            createdAt: Date;
            name: string;
            isPublished: boolean;
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    findOne(userId: string, scenarioId: string): Promise<{
        id: string;
        version: number;
        createdAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
        publishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
        authorId: string;
        isPublished: boolean;
        licenseType: string | null;
        nodes: import("@prisma/client/runtime/library").JsonValue;
        edges: import("@prisma/client/runtime/library").JsonValue;
        startNodeId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        validationStatus: string | null;
        validationErrors: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(userId: string, scenarioId: string, dto: Partial<CreateScenarioDto>): Promise<{
        id: string;
        version: number;
        createdAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
        publishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
        authorId: string;
        isPublished: boolean;
        licenseType: string | null;
        nodes: import("@prisma/client/runtime/library").JsonValue;
        edges: import("@prisma/client/runtime/library").JsonValue;
        startNodeId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        validationStatus: string | null;
        validationErrors: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    validate(userId: string, scenarioId: string): Promise<{
        valid: boolean;
        errors: any[];
        warnings: any[];
    }>;
    publish(userId: string, scenarioId: string, price?: number, licenseType?: string): Promise<{
        id: string;
        version: number;
        createdAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
        publishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
        authorId: string;
        isPublished: boolean;
        licenseType: string | null;
        nodes: import("@prisma/client/runtime/library").JsonValue;
        edges: import("@prisma/client/runtime/library").JsonValue;
        startNodeId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        validationStatus: string | null;
        validationErrors: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    delete(userId: string, scenarioId: string): Promise<{
        message: string;
    }>;
    createVersion(userId: string, scenarioId: string, nodes: any[], versionNote?: string): Promise<{
        id: string;
        version: number;
        createdAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
        publishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
        authorId: string;
        isPublished: boolean;
        licenseType: string | null;
        nodes: import("@prisma/client/runtime/library").JsonValue;
        edges: import("@prisma/client/runtime/library").JsonValue;
        startNodeId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        validationStatus: string | null;
        validationErrors: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
//# sourceMappingURL=scenarios.service.d.ts.map