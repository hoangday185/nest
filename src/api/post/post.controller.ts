import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiPublic } from './../../decorators/http.decorators';
import { CreatePostReqDto } from './dto/createPost.req.dto';
import { PostResDto } from './dto/post.res.dto';
import { PostService } from './post.service';

@ApiTags('posts')
@Controller({
  path: 'posts',
  version: '1',
})
export class PostController {
  constructor(private readonly postService: PostService) {}
  async getListPost() {}

  @ApiPublic({
    type: PostResDto,
  })
  @Post()
  async createPost(@Body() body: CreatePostReqDto) {
    return await this.postService.createPost(body);
  }
}
