import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelSchema } from './entities/channel.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Channel', schema: ChannelSchema }])],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
