import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
