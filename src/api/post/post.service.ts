import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreatePostReqDto } from './dto/createPost.req.dto';

@Injectable()
export class PostService {
  constructor(private readonly prismaSerivce: PrismaService) {}

  async createPost(dto: CreatePostReqDto) {}
}
