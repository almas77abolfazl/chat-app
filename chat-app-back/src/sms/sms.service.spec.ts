jest.mock('@nestjs/axios', () => ({
  HttpService: jest.fn().mockImplementation(() => ({
    post: jest.fn(),
  })),
}));

import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { SmsService } from './sms.service';

function createSmsService(smsConfig: Record<string, any>) {
  const configService: ConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      return smsConfig[key] ?? defaultValue;
    }),
  } as any;

  const httpService: HttpService = {
    post: jest.fn(),
  } as any;

  const service = new SmsService(configService, httpService);
  return { service, configService, httpService };
}

describe('SmsService', () => {
  it('should be defined', () => {
    const { service } = createSmsService({
      SMS_API_KEY: 'test-key',
      SMS_BASE_URL: 'https://api.test.com/v1',
      SMS_SENDER: 'TestSender',
      SMS_ENABLED: false,
    });
    expect(service).toBeDefined();
  });

  it('should log code in test mode when SMS is disabled', async () => {
    const { service } = createSmsService({
      SMS_API_KEY: 'test-key',
      SMS_BASE_URL: 'https://api.test.com/v1',
      SMS_SENDER: 'TestSender',
      SMS_ENABLED: false,
    });

    const logSpy = jest.spyOn(service.logger, 'log');
    const result = await service.sendVerificationCode('09123456789', '123456');

    expect(result.success).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[TEST MODE]'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('123456'));
  });

  it('should call SMS gateway when enabled', async () => {
    const { service, httpService } = createSmsService({
      SMS_API_KEY: 'real-key',
      SMS_BASE_URL: 'https://api.real.com/v1',
      SMS_SENDER: 'RealSender',
      SMS_ENABLED: 'true',
    });

    jest.spyOn(httpService, 'post').mockReturnValue(
      of({
        data: { messageId: 'msg-123' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} },
      } as any),
    );

    const logSpy = jest.spyOn(service.logger, 'log');

    const result = await service.sendVerificationCode('09123456789', '123456');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-123');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.real.com/v1/send',
      expect.objectContaining({
        to: '09123456789',
        from: 'RealSender',
        message: expect.stringContaining('123456'),
      }),
      expect.anything(),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('msg-123'));
  });

  it('should handle SMS gateway error gracefully', async () => {
    const { service, httpService } = createSmsService({
      SMS_API_KEY: 'real-key',
      SMS_BASE_URL: 'https://api.real.com/v1',
      SMS_SENDER: 'RealSender',
      SMS_ENABLED: 'true',
    });

    jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => new Error('Network error')));

    const errorSpy = jest.spyOn(service.logger, 'error');

    const result = await service.sendVerificationCode('09123456789', '123456');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send SMS'));
  });
});
