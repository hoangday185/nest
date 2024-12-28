import { PostResDto } from '@/api/post/dto/post.res.dto';
import { ClassField, StringField } from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  name: string;

  @StringField()
  @Expose()
  email: string;

  @ClassField(() => PostResDto)
  @Expose()
  posts?: PostResDto[];

  @ClassField(() => Date)
  @Expose()
  createdAt: Date;

  @ClassField(() => Date)
  @Expose()
  updatedAt: Date;
}
