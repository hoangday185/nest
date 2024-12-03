import { IEmailJob, IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { AllConfigType } from '@/config/config.type';
import { CacheKey } from '@/constants/cache.constants';
import { ErrorCode } from '@/constants/error-code.constants';
import { JobName, QueueName } from '@/constants/job.constants';
import { ValidationException } from '@/exceptions/validation.exception';
import { createCacheKey } from '@/utils/cache.util';
import { hashPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import ms from 'ms';
import { UserService } from '../user/user.service';
import { RegisterReqDto } from './dto/register.dto.req';
import { RegisterResDto } from './dto/register.dto.res';
import { JwtPayloadType } from './types/jwt-payload.type';

Injectable();
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
  ) {}
  async verifyAccessToken(accessToken: string): Promise<JwtPayloadType> {
    let payload: JwtPayloadType;
    try {
      payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.getOrThrow('app.debug', { infer: true }),
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    return payload;
  }

  async register(dto: RegisterReqDto): Promise<RegisterResDto> {
    //check email is exist

    const isExist = await this.userService.findUserByEmail(dto.email);

    if (isExist) {
      throw new ValidationException(ErrorCode.E003);
    }

    const hashPass = await hashPassword(dto.password);
    const userId = await this.userService.create({
      ...dto,
      password: hashPass,
    });

    const token = await this.createVerificationToken(userId);
    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpireIn',
      {
        infer: true,
      },
    );
    await this.cacheManager.set(
      createCacheKey(CacheKey.EMAIL_VERIFICATION, userId),
      token,
      ms(tokenExpiresIn),
    );

    await this.emailQueue.add(
      JobName.EMAIL_VERIFICATION,
      {
        email: dto.email,
        token,
      } as IVerifyEmailJob,
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );

    return plainToInstance(RegisterResDto, {
      userId: userId,
    });
  }

  private async createVerificationToken(userId: string): Promise<string> {
    return await this.jwtService.signAsync(
      {
        id: userId,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpireIn', {
          infer: true,
        }),
      },
    );
  }
}
