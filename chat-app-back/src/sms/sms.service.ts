import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

interface SmsConfig {
  apiKey: string;
  baseUrl: string;
  sender: string;
  enabled: boolean;
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  public readonly logger = new Logger(SmsService.name);
  private readonly config: SmsConfig;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.config = {
      apiKey: this.configService.get<string>('SMS_API_KEY') ?? '',
      baseUrl: this.configService.get<string>('SMS_BASE_URL') ?? '',
      sender: this.configService.get<string>('SMS_SENDER') ?? '',
      enabled: this.configService.get<string>('SMS_ENABLED') === 'true',
    };
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<SmsResult> {
    if (!this.config.enabled || !this.config.apiKey || !this.config.baseUrl) {
      this.logger.log(`[TEST MODE] SMS to ${phoneNumber}: code ${code}`);
      return { success: true };
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/send`,
          {
            to: phoneNumber,
            from: this.config.sender,
            message: `Your verification code is ${code}`,
          },
          {
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`SMS sent to ${phoneNumber}, messageId: ${response.data?.messageId}`);
      return {
        success: true,
        messageId: response.data?.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}: ${error?.message}`);
      return {
        success: false,
        error: error?.message ?? 'Unknown error',
      };
    }
  }
}
