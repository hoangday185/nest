import { ErrorDetailDto } from '@/common/dto/error-detail.dto';
import { ErrorDto } from '@/common/dto/error.dto';
import { AllConfigType } from '@/config/config.type';
import { ErrorCode } from '@/constants/error-code.constants';
import { ValidationException } from '@/exceptions/validation.exception';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import { Response } from 'express';
import { STATUS_CODES } from 'http';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private debug: boolean = false;
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // const request = ctx.getRequest<Request>();
    this.debug = this.configService.getOrThrow('app.debug', { infer: true });
    let error: ErrorDto;

    if (exception instanceof UnprocessableEntityException) {
      //trong function handle error thì sẽ logger exception
      //bên ngoài thì sẽ log error
      error = this.handleUnprocessableEntityException(exception);
    } else if (exception instanceof ValidationException) {
      error = this.handleValidationException(exception);
    } else if (exception instanceof HttpException) {
      error = this.handleHTTPException(exception);
    } else {
      error = this.handleError(exception);
    }
    if (this.debug) {
      error.stack = exception.stack || '';
      error.trace = exception;

      this.logger.debug(error);
    }

    response.status(error.statusCode).json(error);
  }

  private handleHTTPException(exception: HttpException): ErrorDto {
    const statusCode = exception.getStatus();
    const errorRes = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      message: exception.message,
    };

    this.logger.debug(exception);
    return errorRes;
  }

  private handleUnprocessableEntityException(
    exception: UnprocessableEntityException,
  ): ErrorDto {
    const r = exception.getResponse() as { message: ValidationError[] };
    const statusCode = exception.getStatus();
    const errorRes = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      message: 'Validation errrors',
      details: this.extractValidationErrorDetail(r.message),
    };

    this.logger.debug(exception);

    return errorRes;
  }

  private handleValidationException(exception: ValidationException): ErrorDto {
    const r = exception.getResponse() as {
      errorCode: ErrorCode;
      message: string;
    };

    const statusCode = exception.getStatus();

    const errorRes = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      errorCode:
        Object.keys(ErrorCode)[Object.values(ErrorCode).indexOf(r.errorCode)],
      message: r.message,
    };

    this.logger.debug(exception);

    return errorRes;
  }

  private extractValidationErrorDetail(
    error: ValidationError[],
  ): ErrorDetailDto[] {
    const extractError = (
      error: ValidationError,
      parentProperty: string = '',
    ): ErrorDetailDto[] => {
      const propertyPath = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      const currentErrors = Object.entries(error.constraints || {}).map(
        ([code, message]) => ({
          property: propertyPath,
          code,
          message,
        }),
      ) satisfies ErrorDetailDto[];

      const childrenErrors = error.children.flatMap(
        (childError) => extractError(childError, propertyPath) || [],
      ) satisfies ErrorDetailDto[];

      return [...currentErrors, ...childrenErrors];
    };

    return error.flatMap((error) => extractError(error));
  }

  private handleError(error: Error): ErrorDto {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorRes = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      message: error?.message || 'An unexpected error occurred',
    };

    this.logger.error(error);

    return errorRes;
  }
}
