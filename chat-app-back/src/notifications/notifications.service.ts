import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as webPush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from './entities/push-subscription.entity';
import { User, UserDocument } from '../user/entities/user.entity';

export interface WebPushSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  chatId?: string;
  icon?: string;
  tag?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;

  constructor(
    @InjectModel(PushSubscription.name) private pushSubModel: Model<PushSubscriptionDocument>,
    @Optional() private readonly configService?: ConfigService,
    @Optional() @InjectModel(User.name) private readonly userModel?: Model<UserDocument>,
  ) {
    const envPublic = this.configService?.get<string>('VAPID_PUBLIC_KEY');
    const envPrivate = this.configService?.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService?.get<string>('VAPID_SUBJECT') || 'mailto:admin@chat-app.local';

    if (envPublic && envPrivate) {
      this.vapidPublicKey = envPublic;
      this.vapidPrivateKey = envPrivate;
    } else {
      const generated = webPush.generateVAPIDKeys();
      this.vapidPublicKey = generated.publicKey;
      this.vapidPrivateKey = generated.privateKey;
      this.logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set in env; using runtime-generated VAPID keys.');
    }

    webPush.setVapidDetails(subject, this.vapidPublicKey, this.vapidPrivateKey);
  }

  getPublicKey(): string {
    return this.vapidPublicKey;
  }

  async subscribe(userId: string, dto: WebPushSubscriptionDto, userAgent?: string): Promise<{ success: boolean }> {
    const userObjId = new Types.ObjectId(userId);
    await this.pushSubModel
      .findOneAndUpdate(
        { userId: userObjId, endpoint: dto.endpoint },
        {
          $set: {
            userId: userObjId,
            endpoint: dto.endpoint,
            keys: dto.keys,
            userAgent,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
    return { success: true };
  }

  async unsubscribe(userId: string, endpoint: string): Promise<{ success: boolean }> {
    const userObjId = new Types.ObjectId(userId);
    await this.pushSubModel.deleteOne({ userId: userObjId, endpoint }).exec();
    return { success: true };
  }

  async sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    if (this.userModel) {
      const user = await this.userModel.findById(userId).select('notificationsEnabled').exec();
      if (user && (user as any).notificationsEnabled === false) {
        return;
      }
    }

    const subscriptions = await this.pushSubModel.find({ userId: new Types.ObjectId(userId) }).exec();
    if (!subscriptions || subscriptions.length === 0) return;

    const jsonPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      chatId: payload.chatId || '',
      icon: payload.icon || '/favicon.ico',
      tag: payload.tag || (payload.chatId ? `chat-${payload.chatId}` : 'chat-message'),
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            jsonPayload,
          );
        } catch (err: any) {
          const status = err?.statusCode;
          if (status === 404 || status === 410) {
            await this.pushSubModel.deleteOne({ _id: sub._id }).exec();
          } else {
            this.logger.warn(`Failed to deliver web push to ${sub.endpoint}: ${err?.message || err}`);
          }
        }
      }),
    );
  }
}
