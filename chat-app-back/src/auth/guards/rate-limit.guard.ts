import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  firstRequestTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly maxRequests = 3;
  private readonly windowMs = 60 * 1000;
  private readonly attempts = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const phoneNumber = request.body?.phoneNumber || request.ip || 'unknown';
    const key = `send-code:${phoneNumber}`;
    const now = Date.now();

    const entry = this.attempts.get(key);

    if (!entry || now - entry.firstRequestTime > this.windowMs) {
      this.attempts.set(key, { count: 1, firstRequestTime: now });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      throw new HttpException('Too many requests. Please try again after 1 minute.', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count++;
    return true;
  }
}
