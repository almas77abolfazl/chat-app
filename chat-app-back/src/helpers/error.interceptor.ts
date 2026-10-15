import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof HttpException) {
          return throwError(() => error);
        }
        const status = error?.name === 'CastError' || error?.name === 'ValidationError' ? 400 : 500;
        return throwError(() => new HttpException({ message: error?.message ?? 'Internal server error' }, status));
      }),
    );
  }
}

export function handleException(error: any): never {
  throw error;
}
