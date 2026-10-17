import { Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageSchema } from './entities/message.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageGateway } from './message.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { ChatSchema } from 'src/chat/entities/chat.entity';
import { AgentModule } from 'src/agent/agent.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    AuthModule,
    AgentModule,
    ChatModule,
    UserModule,
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: 'Chat', schema: ChatSchema }]),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
  exports: [MessageService],
})
export class MessageModule {}
