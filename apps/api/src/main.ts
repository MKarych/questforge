import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as figlet from 'figlet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Serve static files from public/ directory
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
  });

  // Serve uploaded files with cache control for avatars
  app.useStaticAssets(join(process.cwd(), 'public', 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:3001',
    credentials: true,
  });

  // Prefix
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log('\n' + figlet.textSync('ADVENTURE ENGINE', {
    font: 'Slant',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }));
  console.log(`🏙️  Город Приключений — Adventure Engine`);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
}

bootstrap();
