import { Module, forwardRef } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionController } from './reaction.controller';
import { ReactionSchema } from './reaction.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from '../entities/message.entity';
import { MessageModule } from '../message.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Reaction', schema: ReactionSchema }]),
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    forwardRef(() => MessageModule),
  ],
  controllers: [ReactionController],
  providers: [ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
