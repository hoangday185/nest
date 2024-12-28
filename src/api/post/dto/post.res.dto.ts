import { UserResDto } from '@/api/user/dto/user.res.dto';
import { User } from '@/api/user/entities/user';

import {
  ClassField,
  DateField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PostResDto {
  @Expose()
  id: string;

  @StringField()
  @Expose()
  title: string;

  @StringFieldOptional()
  @Expose()
  content?: string;

  @ClassField(() => UserResDto)
  @Expose()
  user: User;

  @StringField()
  @Expose()
  createdBy: string;

  @DateField()
  @Expose()
  createdAt: Date;
}
