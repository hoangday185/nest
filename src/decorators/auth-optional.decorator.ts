import { IS_AUTH_OPTIONAL } from '@/constants/app.constants';
import { SetMetadata } from '@nestjs/common';

export const AuthOptionals = () => SetMetadata(IS_AUTH_OPTIONAL, true);
