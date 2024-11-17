import { IS_PUBLIC } from '@/constants/app.constants';
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata(IS_PUBLIC, true);
