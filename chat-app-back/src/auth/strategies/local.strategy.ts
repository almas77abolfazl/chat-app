import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { handleException } from 'src/helpers/error.interceptor';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'phoneNumber' });
  }

  async validate(phoneNumber: string): Promise<any> {
    try {
      const user =
        await this.authService.validateUserByPhoneNumber(phoneNumber);
      if (!user) throw new BadRequestException();
      return user;
    } catch (error) {
      handleException(error);
    }
  }
}
