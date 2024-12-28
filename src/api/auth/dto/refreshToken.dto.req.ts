import { StringField } from '@/decorators/field.decorators';

export class RefreshTokenReqDto {
  @StringField()
  refreshToken: string;
}
