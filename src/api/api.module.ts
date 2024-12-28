import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HomeModule } from './home/home.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [AuthModule, HomeModule, UserModule, PostModule],
})
export class ApiModule {}
