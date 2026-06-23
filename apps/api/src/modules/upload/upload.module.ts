import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './public/uploads/avatars',
    }),
    UsersModule,
  ],
  controllers: [UploadController],
})
export class UploadModule {}