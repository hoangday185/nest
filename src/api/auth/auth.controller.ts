import { CurrentUser } from '@/decorators/current-user.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiPublic } from './../../decorators/http.decorators';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login.dto.req';
import { LoginResDto } from './dto/login.dto.res';
import { RefreshTokenReqDto } from './dto/refreshToken.dto.req';
import { RefreshTokenResDto } from './dto/refreshToken.dto.res';
import { RegisterReqDto } from './dto/register.dto.req';
import { RegisterResDto } from './dto/register.dto.res';
import { JwtPayloadType } from './types/jwt-payload.type';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiPublic({
    type: LoginResDto,
  })
  @Post('login')
  async login(@Body() dto: LoginReqDto): Promise<LoginResDto> {
    return await this.authService.login(dto);
  }

  @ApiPublic({
    type: RegisterResDto,
  })
  @Post('register')
  async register(@Body() dto: RegisterReqDto): Promise<RegisterResDto> {
    return await this.authService.register(dto);
  }

  @Post('logout')
  async logout(@CurrentUser() userToken: JwtPayloadType): Promise<void> {
    return await this.authService.logout(userToken);
  }

  @ApiPublic({
    type: RefreshTokenResDto,
  })
  @Post('refresh-token')
  async refreshToken(
    @Body() body: RefreshTokenReqDto,
  ): Promise<RefreshTokenResDto> {
    return await this.authService.refreshToken(body);
  }
}
