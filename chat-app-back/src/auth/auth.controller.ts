import { Body, Controller, Post, Req, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RequestWithUser } from './interfaces/request-with-user.model';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  async sendCode(@Body() sendCodeDto: SendCodeDto): Promise<{ code: string }> {
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
  async logout(@Req() request: RequestWithUser, @Headers('_id') userId: string) {
    try {
      return this.authService.logout(request, userId);
    } catch (error) {
      return error;
    }
  }
}
