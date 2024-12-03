import { ApiPublic } from '@/decorators/http.decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login.dto.req';
import { LoginResDto } from './dto/login.dto.res';
import { RegisterReqDto } from './dto/register.dto.req';
import { RegisterResDto } from './dto/register.dto.res';

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
}
