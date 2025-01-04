import { IEmailJob, IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { Branded } from '@/common/types/types';
import { AllConfigType } from '@/config/config.type';
import { CacheKey } from '@/constants/cache.constants';
import { ErrorCode } from '@/constants/error-code.constants';
import { JobName, QueueName } from '@/constants/job.constants';
import { ValidationException } from '@/exceptions/validation.exception';
import { createCacheKey } from '@/utils/cache.util';
import { verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import crypto from 'crypto';
import ms from 'ms';
import { Repository } from 'typeorm';
import { Session } from '../user/entities/sessions.entity';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginReqDto } from './dto/login.dto.req';
import { LoginResDto } from './dto/login.dto.res';
import { RegisterReqDto } from './dto/register.dto.req';
import { RegisterResDto } from './dto/register.dto.res';
import { JwtPayloadType } from './types/jwt-payload.type';
type Token = Branded<
  {
    accessToken: string;
    refreshToken: string;
    tokenExpires: number;
  },
  'token'
>;

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
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

    const isExistsUser = await this.userRepository.exists({
      where: { email: dto.email },
    });

    if (isExistsUser) {
      throw new ValidationException(ErrorCode.E003);
    }

    const user = new User();
    user.email = dto.email;
    user.password = dto.password;

    await this.userRepository.save(user);

    const token = await this.createVerificationToken(user.id);
    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpireIn',
      {
        infer: true,
      },
    );
    await this.cacheManager.set(
      createCacheKey(CacheKey.EMAIL_VERIFICATION, user.id),
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
      userId: user.id,
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

  async login(dto: LoginReqDto): Promise<LoginResDto> {
    const { email, password } = dto;
    const user = await this.userRepository.findOne({
      where: { email },
    });

    const isPasswordValid =
      user && (await verifyPassword(user.password, password));

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = new Session();
    session.hash = hash;
    session.userId = user.id;

    await this.sessionRepository.save(session);

    const token = await this.createToken({
      sessionId: session.id,
      hash,
      id: user.id,
    });

    return plainToInstance(LoginResDto, {
      userId: user.id,
      ...token,
    });
  }

  private async createToken(data: {
    id: string;
    sessionId: string;
    hash: string;
  }): Promise<Token> {
    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.accessExpireIn',
      {
        infer: true,
      },
    );
    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: '', // TODO: add role
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.accessSecret', {
            infer: true,
          }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpireIn', {
            infer: true,
          }),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
      tokenExpires,
    } as Token;
  }
}
