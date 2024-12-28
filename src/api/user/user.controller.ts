import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller({
  version: '1',
  path: 'users',
})
export class UserController {
  @Get('/me')
  async getMe() {
    return 'ahihi';
  }
}
