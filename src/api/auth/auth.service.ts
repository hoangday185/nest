import { IEmailJob, IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { Branded } from '@/common/types/types';
import { AllConfigType } from '@/config/config.type';
import { CacheKey } from '@/constants/cache.constants';
import { ErrorCode } from '@/constants/error-code.constants';
import { JobName, QueueName } from '@/constants/job.constants';
import { PrismaService } from '@/database/prisma.service';
import { ValidationException } from '@/exceptions/validation.exception';
import { createCacheKey } from '@/utils/cache.util';
import { hashPassword, verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import crypto from 'crypto';
import ms from 'ms';
import { UserService } from '../user/user.service';
import { LoginReqDto } from './dto/login.dto.req';
import { LoginResDto } from './dto/login.dto.res';
import { RefreshTokenReqDto } from './dto/refreshToken.dto.req';
import { RefreshTokenResDto } from './dto/refreshToken.dto.res';
import { RegisterReqDto } from './dto/register.dto.req';
import { RegisterResDto } from './dto/register.dto.res';
import { JwtPayloadType } from './types/jwt-payload.type';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';
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
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
  ) {}
  async verifyAccessToken(accessToken: string): Promise<JwtPayloadType> {
    let payload: JwtPayloadType;
    try {
      payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.getOrThrow('auth.accessSecret', {
          infer: true,
        }),
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    // Force logout if the session is in the blacklist
    const isSessionBlacklisted = await this.cacheManager.store.get<boolean>(
      createCacheKey(CacheKey.SESSION_BLACKLIST, payload.sessionId),
    );

    if (isSessionBlacklisted) {
      throw new UnauthorizedException();
    }

    return payload;
  }

  async register(dto: RegisterReqDto): Promise<RegisterResDto> {
    //check email is exist

    const user = await this.userService.getUserByEmail(dto.email);

    if (user) {
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

  async login(dto: LoginReqDto): Promise<LoginResDto> {
    const { email, password } = dto;
    const user = await this.userService.getUserByEmail(email);
    const isPasswordValid =
      user && (await verifyPassword(user.password, password));

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');
    const session = await this.prismaService.session.create({
      data: {
        hash,
        userId: user.id,
      },
    });

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

  async logout(userToken: JwtPayloadType): Promise<void> {
    //đưa session này vào blacklist với thời gian tồn tại bằng thời gian hiệu lực của token
    await this.cacheManager.store.set<boolean>(
      createCacheKey(CacheKey.SESSION_BLACKLIST, userToken.sessionId),
      true,
      userToken.exp * 1000 - Date.now(),
    );

    await this.prismaService.session.delete({
      where: {
        id: userToken.sessionId,
      },
    });
  }

  async refreshToken(dto: RefreshTokenReqDto): Promise<RefreshTokenResDto> {
    const { sessionId, hash } = await this.verifyRefresh(dto.refreshToken);
    const session = await this.prismaService.session.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (!session || session.hash !== hash) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.getUserById(session.userId);

    const newHash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await this.prismaService.session.update({
      where: {
        id: session.id,
      },
      data: {
        hash: newHash,
      },
    });

    return await this.createToken({
      id: user.id,
      sessionId: session.id,
      hash: newHash,
    });
  }

  private async verifyRefresh(token: string): Promise<JwtRefreshPayloadType> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('auth.refreshSecret', {
          infer: true,
        }),
      });
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
