import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class SizeLimitInterceptor implements NestInterceptor {
  private readonly sizeLimit

  constructor(sizeLimit: number) {
    this.sizeLimit = sizeLimit
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest()
    const size = request.socket.bytesRead

    if (size > this.sizeLimit) {
      throw new PayloadTooLargeException()
    }

    return next.handle()
  }
}
