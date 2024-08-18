import { BadRequestException, Injectable } from '@nestjs/common';
import { handleException } from 'src/helpers/error.interceptor';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './interfaces/jwt-payload,interface';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { VerifyCodeDto } from './dto/verify-code.dto';
import * as crypto from 'crypto';
import { IUser } from 'src/user/interfaces/user.interface';
import { RequestWithUser } from './interfaces/request-with-user.model';

@Injectable()
export class AuthService {
  private readonly verificationCode = '123456';

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async sendVerificationCode(phoneNumber: string): Promise<{ code: string }> {
    try {
      this.userService.createUser(phoneNumber);
      console.log(
        `Sending verification code ${this.verificationCode} to ${phoneNumber}`,
      );
      return { code: this.verificationCode };
    } catch (error) {
      handleException(error);
    }
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
    try {
      if (verifyCodeDto.code === this.verificationCode) {
        const accessToken = this.jwtService.sign(verifyCodeDto);
        const refreshToken = this.generateRefreshToken();
        const user = await this.userService.findUserByPhoneNumber(
          verifyCodeDto.phoneNumber,
        );
        await this.saveSessionToDatabase(user, refreshToken, deviceName);
        return {
          access_token: accessToken,
          userId: user._id as string,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
      new BadRequestException('Invalid verification code');
    } catch (error) {
      handleException(error);
    }
  }

  async validateUserByPhoneNumber(phoneNumber: string): Promise<any> {
    try {
      const user = await this.userService.findUserByPhoneNumber(phoneNumber);
      if (
        user
        // && (await this.passwordIsMatch(password, user.password))
      ) {
        // const { password, ...result } = user;
        return user;
      }
      return null;
    } catch (error) {
      handleException(error);
    }
  }

  public async validateUserByJwt(payload: JwtPayload): Promise<User> {
    try {
      return await this.userService.findUserByPhoneNumber(payload.phoneNumber);
    } catch (error) {
      handleException(error);
    }
  }

  public async logout(request: RequestWithUser, userId: string) {
    try {
      const deviceName = request['useragent'].deviceNameAndIp;
      const user = await this.userService.findById(userId);
      user.sessions = user.sessions.filter(
        (x) => x['deviceName'] != deviceName,
      );
      await this.userService.update(user._id as string, user);
      return { message: 'ok' };
    } catch (error) {
      handleException(error);
    }
  }

  private generateRefreshToken(): string {
    try {
      const token = crypto.randomBytes(64).toString('hex');
      return token;
    } catch (error) {
      handleException(error);
    }
  }

  private async saveSessionToDatabase(
    user: IUser,
    refreshToken: string,
    deviceName: string,
  ): Promise<void> {
    try {
      const expiresAt = this.generateRefreshTokenExpiryTime();
      if (!user.sessions) user.sessions = [];
      user.sessions.push({ token: refreshToken, expiresAt, deviceName });
      await this.userService.update(user._id as string, user);
    } catch (error) {
      handleException(error);
    }
  }

  private generateRefreshTokenExpiryTime(): number {
    const daysUntilExpire = 10;
    const secondsUntilExpire = daysUntilExpire * 24 * 60 * 60;
    return Date.now() / 1000 + secondsUntilExpire;
  }
}
