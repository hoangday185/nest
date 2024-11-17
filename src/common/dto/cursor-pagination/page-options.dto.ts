import { DEFAULT_PAGE_LIMIT } from '@/constants/app.constants';
import {
  NumberFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class PageOptionsDto {
  @StringFieldOptional()
  afterCursor: string;

  @StringFieldOptional()
  beforeCursor: string;

  @NumberFieldOptional({
    minimum: 1,
    default: DEFAULT_PAGE_LIMIT,
    int: true,
  })
  readonly limit: number = DEFAULT_PAGE_LIMIT;
}
