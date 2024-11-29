import { Enviroment } from '@/constants/app.constants';
import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';
import { AppConfig } from './app-config.type';

class EnviromentVariablesValidators {
  @IsEnum(Enviroment)
  @IsOptional()
  NODE_ENV: string;

  @IsString()
  @IsOptional()
  APP_NAME: string;

  @IsString()
  @IsOptional()
  APP_URL: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  APP_PORT: number;

  @IsBoolean()
  @IsOptional()
  APP_DEBUG: boolean;

  @IsString()
  @Matches(
    /^(true|false|\*|([\w]+:\/\/)?([\w.-]+)(:[0-9]+)?)?(,([\w]+:\/\/)?([\w.-]+)(:[0-9]+)?)*$/,
  )
  @IsOptional()
  APP_CORS_ORIGIN: string;
}

export default registerAs<AppConfig>('app', () => {
  console.info(`Register AppConfig from environment variables`);
  validateConfig(process.env, EnviromentVariablesValidators);

  return {
    nodeEnv: process.env.NODE_ENV,
    name: process.env.APP_NAME,
    url: process.env.APP_URL,
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 5555,
    apiPrefix: process.env.APP_API_PREFIX,
    debug: process.env.APP_DEBUG === 'true',
    corsOrigin: getCorsOrigin(),
  };
});

function getCorsOrigin() {
  const corsOrigin = process.env.APP_CORS_ORIGIN;
  if (corsOrigin === 'true') return true;
  if (corsOrigin === '*') return '*';
  if (!corsOrigin || corsOrigin === 'false') return false;

  return corsOrigin.split(',').map((origin) => origin.trim());
}
