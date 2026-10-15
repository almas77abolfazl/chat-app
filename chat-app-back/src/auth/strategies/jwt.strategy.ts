import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload,interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwtSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUserByJwt(payload);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
