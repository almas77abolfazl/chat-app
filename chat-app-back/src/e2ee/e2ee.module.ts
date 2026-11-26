import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { E2eeController } from './e2ee.controller';
import { E2eeService } from './e2ee.service';
import { User, UserSchema } from '../user/entities/user.entity';
import { Chat, ChatSchema } from '../chat/entities/chat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  controllers: [E2eeController],
  providers: [E2eeService],
  exports: [E2eeService],
})
export class E2eeModule {}
