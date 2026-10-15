import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from 'src/user/entities/user.entity';
import { IUser } from 'src/user/interfaces/user.interface';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private bot: IUser | null = null;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async getBot(): Promise<IUser> {
    if (this.bot) return this.bot;

    const phoneNumber = this.configService.get<string>('agentBotPhoneNumber') as string;

    let bot = await this.userModel.findOne({ phoneNumber }).exec();
    if (!bot) {
      bot = await this.userModel.create({
        phoneNumber,
        username: 'assistant',
        firstName: 'دستیار',
        lastName: 'هوشمند',
        bio: 'دستیار هوشمند چت‌اپ',
      });
      this.logger.log('Assistant bot user created');
    }

    this.bot = bot;
    return bot;
  }
}
