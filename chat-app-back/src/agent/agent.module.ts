import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentTools } from './tools/agent.tools';
import { BotService } from './bot/bot.service';
import { LlmService } from './llm/llm.service';
import { MessageSchema } from 'src/message/entities/message.entity';
import { ChatSchema } from 'src/chat/entities/chat.entity';
import { UserSchema } from 'src/user/entities/user.entity';
import { ChatModule } from 'src/chat/chat.module';
import { MessageModule } from 'src/message/message.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    ConfigModule,
    ChatModule,
    UserModule,
    forwardRef(() => MessageModule),
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: 'Chat', schema: ChatSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [AgentController],
  providers: [AgentService, AgentTools, BotService, LlmService],
  exports: [AgentService, BotService],
})
export class AgentModule {}
