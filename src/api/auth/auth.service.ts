import { AllConfigType } from '@/config/config.type';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from './types/jwt-payload.type';

Injectable();
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
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
}
