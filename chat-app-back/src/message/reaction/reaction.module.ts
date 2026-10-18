import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionSchema } from './reaction.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from '../entities/message.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Reaction', schema: ReactionSchema }]),
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
  ],
  providers: [ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
