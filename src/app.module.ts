import { BullModule } from '@nestjs/bullmq';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { ApiModule } from './api/api.module';
import authConfig from './api/auth/config/auth-config';
import { BackgroundModule } from './background/background.module';
import appConfig from './config/app-config';
import { AllConfigType } from './config/config.type';
import databaseConfig from './database/config/database-config';
import { PrismaModule } from './database/prisma.module';
import mailConfig from './mail/config/mail-config';
import { MailModule } from './mail/mail.module';
import redisConfig from './Redis/config/redis-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, redisConfig, authConfig, mailConfig, databaseConfig],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        return {
          connection: {
            host: configService.getOrThrow('redis.host', {
              infer: true,
            }),
            port: configService.getOrThrow('redis.port', {
              infer: true,
            }),
            password: configService.getOrThrow('redis.password', {
              infer: true,
            }),
          },
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AllConfigType>) => {
        const store = await redisStore({
          host: configService.getOrThrow('redis.host', {
            infer: true,
          }),
          port: configService.getOrThrow('redis.port', {
            infer: true,
          }),
          password: configService.getOrThrow('redis.password', {
            infer: true,
          }),
          ttl: 3 * 60000, // 3 minutes (milliseconds)
        });
        return {
          store: store as unknown as CacheStore,
        };
      },
      isGlobal: true,
      inject: [ConfigService],
    }),
    ApiModule,
    BackgroundModule,
    MailModule,
    PrismaModule,
  ],
})
export class AppModule {}
