import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { RegisterReqDto } from '../auth/dto/register.dto.req';
import { User } from './entities/user';
@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserByEmail(
    email: string,
  ): Promise<Omit<User, 'name' | 'createAt' | 'updateAt'> | null> {
    const user = await this.prismaService.user.findFirst({
      where: { email },
      select: {
        email: true,
        password: true,
        id: true,
      },
    });

    return user;
  }

  async create(dto: RegisterReqDto): Promise<string> {
    const user = await this.prismaService.user.create({
      data: dto,
    });

    return user.id;
  }
}
