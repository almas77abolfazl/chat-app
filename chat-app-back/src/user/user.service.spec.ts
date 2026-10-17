import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { getModelToken } from '@nestjs/mongoose';

describe('UserService - Online Status', () => {
  let service: UserService;
  let userModel: Model<any>;

  const mockUser = {
    _id: 'user-123',
    phoneNumber: '09120000001',
    firstName: 'Ali',
    lastName: 'Ahmadi',
    isOnline: false,
    lastSeen: null,
    save: jest.fn().mockResolvedValue({}),
  };

  const mockQuery = {
    exec: jest.fn().mockResolvedValue(mockUser),
    select: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn().mockReturnValue(mockQuery),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<any>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set user online status to true', async () => {
    jest.spyOn(userModel, 'findById').mockReturnValue(mockQuery as any);
    const result = await service.updateOnlineStatus('user-123', true);
    expect(result?.isOnline).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should set user online status to false and set lastSeen', async () => {
    jest.spyOn(userModel, 'findById').mockReturnValue(mockQuery as any);
    const result = await service.updateOnlineStatus('user-123', false);
    expect(result?.isOnline).toBe(false);
    expect(mockUser.lastSeen).toBeInstanceOf(Date);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should return null for non-existent user', async () => {
    jest.spyOn(userModel, 'findById').mockReturnValue({
      ...mockQuery,
      exec: jest.fn().mockResolvedValue(null),
    } as any);
    const result = await service.updateOnlineStatus('non-existent', true);
    expect(result).toBeNull();
  });

  it('should get user status', async () => {
    jest.spyOn(userModel, 'findById').mockReturnValue({
      ...mockQuery,
      exec: jest.fn().mockResolvedValue({
        _id: 'user-123',
        isOnline: true,
        lastSeen: new Date(),
      }),
    } as any);
    const result = await service.getUserStatus('user-123');
    expect(result?.userId).toBe('user-123');
    expect(result?.isOnline).toBe(true);
    expect(result?.lastSeen).toBeInstanceOf(Date);
  });

  it('should return null for non-existent user status', async () => {
    jest.spyOn(userModel, 'findById').mockReturnValue({
      ...mockQuery,
      exec: jest.fn().mockResolvedValue(null),
    } as any);
    const result = await service.getUserStatus('non-existent');
    expect(result).toBeNull();
  });
});
