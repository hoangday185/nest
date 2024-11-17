import { HttpStatus, Type } from '@nestjs/common';

type ApiResponseType = number;
type ApiAuthType = 'basic' | 'api-key' | 'jwt';
type PaginationType = 'offset' | 'cursor';

interface IApiOptions<T extends Type<any>> {
  type?: T;
  summary?: string;
  description?: string;
  errorResponse?: ApiResponseType[];
  statusCode?: HttpStatus;
  isPaginated?: boolean;
  paginationType?: PaginationType;
}

type IApiPublicOptions = IApiOptions<Type<any>>;

interface IApiAuthOptions extends IApiOptions<Type<any>> {
  auths?: ApiAuthType[];
}
