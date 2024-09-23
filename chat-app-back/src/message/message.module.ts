import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageSchema } from './entities/message.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageGateway } from './message.getaway';
import { AuthModule } from 'src/auth/auth.module';
import { ChatSchema } from 'src/chat/entities/chat.entity';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: 'Chat', schema: ChatSchema }]),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
})
export class MessageModule {}
