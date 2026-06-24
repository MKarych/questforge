import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
export declare class ScenariosController {
    private readonly scenariosService;
    private readonly logger;
    constructor(scenariosService: ScenariosService);
    create(req: any, dto: CreateScenarioDto): Promise<{
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
    findAll(req: any, published?: string, limit?: number, offset?: number): Promise<{
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
    findOne(req: any, scenarioId: string): Promise<{
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
    update(req: any, scenarioId: string, dto: Partial<CreateScenarioDto>): Promise<{
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
    delete(req: any, scenarioId: string): Promise<{
        message: string;
    }>;
    validate(req: any, scenarioId: string): Promise<{
        valid: boolean;
        errors: any[];
        warnings: any[];
    }>;
    publish(req: any, scenarioId: string, price?: number, licenseType?: string): Promise<{
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
    createVersion(req: any, scenarioId: string, nodes: any[], versionNote?: string): Promise<{
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
//# sourceMappingURL=scenarios.controller.d.ts.map