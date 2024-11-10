import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';
import { DatabaseConfig } from './database-config.type';
class EnviromentVariablesValidator {
  //validateIf dùng cho việc validate 1 property dựa trên 1 field khác của object

  @ValidateIf((envValues) => envValues.DATABASE_URL)
  @IsString()
  DATABASE_URL: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATEBASE_TYPE: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_HOST: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsInt()
  @IsPositive()
  DATABASE_PORT: number;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_PASSWORD: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_NAME: string;

  @ValidateIf((envValues) => !envValues.DATABASE_URL)
  @IsString()
  DATABASE_USERNAME: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  DATABASE_MAX_CONNECTION: number;

  @IsBoolean()
  @IsOptional()
  DATABASE_SYNCHRONIZE: boolean;
}

export default registerAs<DatabaseConfig>('database', () => {
  console.log('Register DatabaseConfig from environment variables');
  validateConfig(process.env, EnviromentVariablesValidator);

  return {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
    maxConnections: process.env.DATABASE_MAX_CONNECTIONS
      ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
      : 100,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  };
});
