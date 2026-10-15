import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'phoneNumber' });
  }

  async validate(phoneNumber: string): Promise<any> {
    const user = await this.authService.validateUserByPhoneNumber(phoneNumber);
    if (!user) throw new BadRequestException();
    return user;
  }
}
