import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [],
  exports: [],
})
export class UsersModule {}
