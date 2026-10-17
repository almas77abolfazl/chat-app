jest.mock('@nestjs/axios', () => ({
  HttpService: jest.fn().mockImplementation(() => ({
    post: jest.fn(),
  })),
}));

import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { SmsService } from 'src/sms/sms.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: {
    createUser: jest.Mock;
    findUserByPhoneNumber: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  let user: any;

  const baseUser = {
    _id: 'user-1',
    phoneNumber: '09120000001',
    firstName: 'Ali',
    lastName: 'Ahmadi',
  };

  beforeEach(async () => {
    user = { ...baseUser, sessions: [] };
    userService = {
      createUser: jest.fn().mockResolvedValue(user),
      findUserByPhoneNumber: jest.fn().mockResolvedValue(user),
      findById: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(user),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: SmsService, useValue: { sendVerificationCode: jest.fn().mockResolvedValue({ success: true }) } },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe('sendVerificationCode', () => {
    it('creates the user and does not leak the code in the response', async () => {
      const result = await authService.sendVerificationCode('09120000001');

      expect(userService.createUser).toHaveBeenCalledWith('09120000001');
      expect(result).toEqual({ sent: true });
      expect(JSON.stringify(result)).not.toContain('code');
    });

    it('generates a 6 digit code', async () => {
      await authService.sendVerificationCode('09120000001');
      const stored = (authService as any).verificationCodes.get('09120000001');
      expect(stored.code).toMatch(/^\d{6}$/);
      expect(stored.expiresAt).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('verifyCode', () => {
    const readStoredCode = (phone: string) => (authService as any).verificationCodes.get(phone).code;

    it('rejects a wrong code with 400', async () => {
      await authService.sendVerificationCode('09120000001');

      await expect(authService.verifyCode({ phoneNumber: '09120000001', code: '000000' } as any, 'device')).rejects.toThrow(BadRequestException);
    });

    it('rejects an unknown code with 400', async () => {
      await expect(authService.verifyCode({ phoneNumber: '09120000000', code: '123456' } as any, 'device')).rejects.toThrow(BadRequestException);
    });

    it('signs a token that only carries phoneNumber and sub', async () => {
      await authService.sendVerificationCode('09120000001');
      const code = readStoredCode('09120000001');

      const result = await authService.verifyCode({ phoneNumber: '09120000001', code } as any, 'device');

      expect(jwtService.sign).toHaveBeenCalledWith({
        phoneNumber: user.phoneNumber,
        sub: user._id,
      });
      expect(result.access_token).toBe('signed-token');
      expect(result.userId).toBe(user._id);
    });

    it('saves the refresh session for the device', async () => {
      await authService.sendVerificationCode('09120000001');
      const code = readStoredCode('09120000001');

      await authService.verifyCode({ phoneNumber: '09120000001', code } as any, 'my-device');

      expect(userService.update).toHaveBeenCalledWith(
        user._id,
        expect.objectContaining({
          sessions: [expect.objectContaining({ deviceName: 'my-device' })],
        }),
      );
    });

    it('invalidates the code after successful verification', async () => {
      await authService.sendVerificationCode('09120000001');
      const code = readStoredCode('09120000001');

      await authService.verifyCode({ phoneNumber: '09120000001', code } as any, 'device');

      expect((authService as any).verificationCodes.has('09120000001')).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears all sessions of the authenticated user', async () => {
      user.sessions = [{ token: 't', expiresAt: 0, deviceName: 'd' }];
      const result = await authService.logout(user._id);

      expect(userService.update).toHaveBeenCalledWith(user._id, user);
      expect(user.sessions).toEqual([]);
      expect(result).toEqual({ message: 'ok' });
    });
  });
});
