import { BooleanField, StringField } from '@/decorators/field.decorators';

export class CreatePostReqDto {
  @StringField()
  title: string;

  @StringField()
  content: string;

  @BooleanField()
  published: boolean;
}
