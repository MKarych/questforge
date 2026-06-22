import { Module } from '@nestjs/common';
import { OrganizerController } from './organizer.controller';
import { OrganizerService } from './organizer.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizerController],
  providers: [OrganizerService],
  exports: [OrganizerService],
})
export class OrganizerModule {}
