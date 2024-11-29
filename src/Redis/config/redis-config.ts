import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { RedisConfig } from './redis-config.type';

class EnviromentVariablesValidators {
  @IsString()
  REDIS_HOST: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  REDIS_PORT: number;

  @IsString()
  REDIS_PASSWORD: string;

  @IsBoolean()
  REDIS_TLS_ENABLE: boolean;
}

export default registerAs<RedisConfig>('redis', () => {
  console.info(`Register AppConfig from environment variables`);
  validateConfig(process.env, EnviromentVariablesValidators);
  return {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
    tlsEnable: process.env.REDIS_TLS_ENABLE === 'true',
  };
});
