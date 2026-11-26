import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { PushSubscription } from './entities/push-subscription.entity';
import { User } from '../user/entities/user.entity';
import * as webPush from 'web-push';

jest.mock('web-push', () => ({
  generateVAPIDKeys: jest.fn(() => ({
    publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
    privateKey: 'mock-private-key',
  })),
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({}),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let pushSubModel: any;
  let userModel: any;

  const userId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    pushSubModel = {
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      deleteOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: 'sub1',
            endpoint: 'https://push.example/1',
            keys: { p256dh: 'k1', auth: 'a1' },
          },
        ]),
      }),
    };
    userModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ notificationsEnabled: true }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(PushSubscription.name), useValue: pushSubModel },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should return a VAPID public key', () => {
    expect(service.getPublicKey()).toBeTruthy();
  });

  it('should subscribe and unsubscribe endpoints', async () => {
    await service.subscribe(userId, { endpoint: 'https://push.example/1', keys: { p256dh: 'p', auth: 'a' } }, 'UA');
    expect(pushSubModel.findOneAndUpdate).toHaveBeenCalled();

    await service.unsubscribe(userId, 'https://push.example/1');
    expect(pushSubModel.deleteOne).toHaveBeenCalled();
  });

  it('should send push notification and clean up 410 expired subscriptions', async () => {
    (webPush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 410 });
    await service.sendPushToUser(userId, { title: 'Alice', body: 'Hello!', chatId: 'chat1' });
    expect(webPush.sendNotification).toHaveBeenCalled();
    expect(pushSubModel.deleteOne).toHaveBeenCalledWith({ _id: 'sub1' });
  });
});
