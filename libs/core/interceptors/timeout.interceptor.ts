import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common'
import { Observable, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

const DEFAULT_TIMEOUT = 60 * 60 * 1000

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeout = DEFAULT_TIMEOUT) {
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeout),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException()
        }
        throw err
      }),
    )
  }
}
