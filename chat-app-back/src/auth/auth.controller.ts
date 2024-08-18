import { Body, Controller, Post, Req } from '@nestjs/common';
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
  ): Promise<{ access_token: string; userId: string; hasName: boolean }> {
    const deviceName = request['useragent'].deviceNameAndIp;
    return await this.authService.verifyCode(verifyCodeDto, deviceName);
  }
}
