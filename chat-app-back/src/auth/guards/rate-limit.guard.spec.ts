import { RateLimitGuard } from './rate-limit.guard';
import { ExecutionContext } from '@nestjs/common';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  beforeEach(() => {
    guard = new RateLimitGuard();
    // Reset the internal map for clean tests
    (guard as any).attempts.clear();
  });

  it('should allow requests within the limit', () => {
    const context = createMockContext({ phoneNumber: '09123456789' });
    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block requests after exceeding the limit', () => {
    const context = createMockContext({ phoneNumber: '09123456789' });
    guard.canActivate(context);
    guard.canActivate(context);
    guard.canActivate(context);
    expect(() => guard.canActivate(context)).toThrow();
  });

  it('should allow different phone numbers independently', () => {
    const context1 = createMockContext({ phoneNumber: '09123456789' });
    const context2 = createMockContext({ phoneNumber: '09987654321' });

    expect(guard.canActivate(context1)).toBe(true);
    expect(guard.canActivate(context1)).toBe(true);
    expect(guard.canActivate(context1)).toBe(true);
    expect(guard.canActivate(context2)).toBe(true);
    expect(() => guard.canActivate(context1)).toThrow();
    expect(guard.canActivate(context2)).toBe(true);
  });

  it('should reset the window after 1 minute', () => {
    const context = createMockContext({ phoneNumber: '09123456789' });

    guard.canActivate(context);
    guard.canActivate(context);
    guard.canActivate(context);

    // Simulate time passing (1 minute + 1 second)
    const originalNow = Date.now;
    const mockNow = jest.fn(() => originalNow() + 61000);
    jest.spyOn(Date, 'now').mockImplementation(mockNow);

    expect(guard.canActivate(context)).toBe(true);

    jest.restoreAllMocks();
  });
});

function createMockContext(body: any) {
  const request = {
    body,
    ip: '127.0.0.1',
  } as any;

  const switchToHttp = () => ({
    getRequest: () => request,
  });

  return {
    switchToHttp,
  } as unknown as ExecutionContext;
}
