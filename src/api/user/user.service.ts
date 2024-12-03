import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { RegisterReqDto } from '../auth/dto/register.dto.req';
@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string): Promise<boolean> {
    const isExist = await this.prismaService.user.findFirst({
      where: { email },
    });

    return Boolean(isExist);
  }

  async create(dto: RegisterReqDto): Promise<string> {
    const user = await this.prismaService.user.create({
      data: dto,
    });

    return user.id;
  }
}
