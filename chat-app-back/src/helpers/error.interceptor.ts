import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpException } from '@nestjs/common';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof HttpException) {
          const response = error.getResponse();
          const message =
            typeof response === 'object' ? (response as any).message : response;
          return throwError(() => ({
            statusCode: error.getStatus(),
            message: message,
            error: error.message,
          }));
        } else {
          return throwError(() => ({
            statusCode: 500,
            message: 'Internal server error',
            error: error.message,
          }));
        }
      }),
    );
  }
}

export function handleException(error: any): never {
  if (error instanceof HttpException) {
    throw error;
  } else {
    throw new HttpException({ message: error.message }, 500);
  }
}
