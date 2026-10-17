import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './interfaces/jwt-payload,interface';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { VerifyCodeDto } from './dto/verify-code.dto';
import * as crypto from 'crypto';
import { IUser } from 'src/user/interfaces/user.interface';
import { SmsService } from 'src/sms/sms.service';

interface IVerificationEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly verificationCodeTtlSeconds = 2 * 60;
  private readonly verificationCodes = new Map<string, IVerificationEntry>();

  constructor(
    public userService: UserService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async sendVerificationCode(phoneNumber: string): Promise<{ sent: true }> {
    await this.userService.createUser(phoneNumber);

    const code = this.generateVerificationCode();
    this.verificationCodes.set(phoneNumber, {
      code,
      expiresAt: Date.now() / 1000 + this.verificationCodeTtlSeconds,
    });
    await this.smsService.sendVerificationCode(phoneNumber, code);

    return { sent: true };
  }

  async verifyCode(
    verifyCodeDto: VerifyCodeDto,
    deviceName: string,
  ): Promise<{
    access_token: string;
    userId: string;
    firstName: string;
    lastName: string;
  }> {
    this.assertVerificationCode(verifyCodeDto.phoneNumber, verifyCodeDto.code);

    const user = await this.userService.findUserByPhoneNumber(verifyCodeDto.phoneNumber);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const accessToken = this.jwtService.sign({
      phoneNumber: user.phoneNumber,
      sub: user._id as string,
    });
    const refreshToken = this.generateRefreshToken();
    await this.saveSessionToDatabase(user, refreshToken, deviceName);
    this.verificationCodes.delete(verifyCodeDto.phoneNumber);

    return {
      access_token: accessToken,
      userId: user._id as string,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async validateUserByPhoneNumber(phoneNumber: string): Promise<any> {
    const user = await this.userService.findUserByPhoneNumber(phoneNumber);
    return user ?? null;
  }

  public async validateUserByJwt(payload: JwtPayload): Promise<User> {
    return await this.userService.findUserByPhoneNumber(payload.phoneNumber);
  }

  public async logout(userId: string) {
    const user = await this.userService.findById(userId);
    user.sessions = [];
    await this.userService.update(user._id as string, user);
    return { message: 'ok' };
  }

  decodeToken(token: string) {
    return this.jwtService.verify(token as string);
  }

  private assertVerificationCode(phoneNumber: string, code: string): void {
    const entry = this.verificationCodes.get(phoneNumber);
    if (!entry || entry.expiresAt < Date.now() / 1000) {
      this.verificationCodes.delete(phoneNumber);
      throw new BadRequestException('Verification code expired');
    }
    if (entry.code !== code) {
      throw new BadRequestException('Invalid verification code');
    }
  }

  private generateVerificationCode(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private async saveSessionToDatabase(user: IUser, refreshToken: string, deviceName: string): Promise<void> {
    const expiresAt = this.generateRefreshTokenExpiryTime();
    if (!user.sessions) user.sessions = [];
    user.sessions.push({ token: refreshToken, expiresAt, deviceName });
    await this.userService.update(user._id as string, user);
  }

  private generateRefreshTokenExpiryTime(): number {
    const daysUntilExpire = 10;
    const secondsUntilExpire = daysUntilExpire * 24 * 60 * 60;
    return Date.now() / 1000 + secondsUntilExpire;
  }
}
