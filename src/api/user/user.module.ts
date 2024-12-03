import { PrismaModule } from '@/database/prisma.module';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
