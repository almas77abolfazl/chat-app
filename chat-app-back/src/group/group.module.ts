import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupSchema } from './entities/group.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Group', schema: GroupSchema }])],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
