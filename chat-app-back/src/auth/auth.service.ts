import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly verificationCode = '123456';
  async sendVerificationCode(phoneNumber: string): Promise<{ code: string }> {
    console.log(
      `Sending verification code ${this.verificationCode} to ${phoneNumber}`,
    );
    return { code: this.verificationCode };
  }

  async verifyCode(code: string): Promise<boolean> {
    return code === this.verificationCode;
  }
}
