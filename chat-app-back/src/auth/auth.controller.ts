import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RequestWithUser } from './interfaces/request-with-user.model';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @UseGuards(RateLimitGuard)
  async sendCode(@Body() sendCodeDto: SendCodeDto): Promise<{ sent: true }> {
    return this.authService.sendVerificationCode(sendCodeDto.phoneNumber);
  }

  @Post('verify-code')
  async verifyCode(
    @Body() verifyCodeDto: VerifyCodeDto,
    @Req() request: RequestWithUser,
  ): Promise<{
    access_token: string;
    userId: string;
    firstName: string;
    lastName: string;
  }> {
    const deviceName = request['useragent'].deviceNameAndIp;
    return await this.authService.verifyCode(verifyCodeDto, deviceName);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: RequestWithUser) {
    return this.authService.logout(request.user._id as string);
  }
}
