export declare const appConfig: (() => {
    port: number;
    name: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    name: string;
}>;
export declare const databaseConfig: (() => {
    url: string | undefined;
    poolSize: number;
    ssl: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    url: string | undefined;
    poolSize: number;
    ssl: boolean;
}>;
export declare const redisConfig: (() => {
    host: string;
    port: number;
    password: string | undefined;
    url: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string | undefined;
    url: string;
}>;
export declare const jwtConfig: (() => {
    secret: string;
    audience: string;
    issuer: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string;
    audience: string;
    issuer: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
}>;
export declare const corsConfig: (() => {
    origin: string;
    credentials: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    origin: string;
    credentials: boolean;
}>;
//# sourceMappingURL=configuration.d.ts.map