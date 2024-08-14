import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

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
  ): Promise<{ success: boolean }> {
    const isValid = await this.authService.verifyCode(verifyCodeDto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }
    return { success: true };
  }
}
