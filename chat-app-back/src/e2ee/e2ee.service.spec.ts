import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { E2eeService } from './e2ee.service';
import { User } from '../user/entities/user.entity';
import { Chat } from '../chat/entities/chat.entity';

describe('E2eeService', () => {
  let service: E2eeService;
  let userModel: any;
  let chatModel: any;

  const userA = '507f1f77bcf86cd799439011';
  const userB = '507f1f77bcf86cd799439012';

  beforeEach(async () => {
    userModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: userB,
            firstName: 'Sara',
            lastName: 'Test',
            e2eePublicKey: '{"kty":"EC"}',
          }),
        }),
      }),
    };

    chatModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      create: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        isSecret: true,
        selfDestructSeconds: 30,
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439099',
          isSecret: true,
          selfDestructSeconds: 0,
          participants: [userA, userB],
          save: jest.fn().mockResolvedValue({}),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        E2eeService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Chat.name), useValue: chatModel },
      ],
    }).compile();

    service = module.get<E2eeService>(E2eeService);
  });

  it('should publish and retrieve user public key', async () => {
    await service.publishPublicKey(userA, '{"kty":"EC"}');
    expect(userModel.findByIdAndUpdate).toHaveBeenCalled();

    const res = await service.getPublicKey(userB);
    expect(res.publicKey).toBe('{"kty":"EC"}');
  });

  it('should create a secret chat and update self-destruct timer', async () => {
    const chat = await service.createOrGetSecretChat(userA, userB, 30);
    expect(chat.isSecret).toBe(true);
    expect(chat.selfDestructSeconds).toBe(30);

    const updated = await service.updateSelfDestructTimer(chat.chatId, userA, 60);
    expect(updated.selfDestructSeconds).toBe(60);
  });

  it('should reject creating secret chat with self', async () => {
    await expect(service.createOrGetSecretChat(userA, userA)).rejects.toThrow(BadRequestException);
  });
});
