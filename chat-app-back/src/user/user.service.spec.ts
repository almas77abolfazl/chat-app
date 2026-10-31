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

  describe('Avatars & Profile', () => {
    it('should return user avatars including profilePicture', async () => {
      jest.spyOn(userModel, 'findById').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          profilePicture: 'avatar1.jpg',
          avatars: ['avatar1.jpg', 'avatar2.jpg'],
        }),
      } as any);
      const avatars = await service.getUserAvatars('user-123');
      expect(avatars).toEqual(['avatar1.jpg', 'avatar2.jpg']);
    });

    it('should return user profile with avatars', async () => {
      jest.spyOn(userModel, 'findById').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'user-123',
          username: 'ali',
          firstName: 'Ali',
          lastName: 'Ahmadi',
          phoneNumber: '09120000001',
          bio: 'Hello',
          profilePicture: 'avatar1.jpg',
          avatars: ['avatar1.jpg'],
          status: 'online',
          isOnline: true,
          lastSeen: null,
          createdAt: new Date(),
        }),
      } as any);
      const profile = await service.getUserProfile('user-123', 'user-123');
      expect(profile.username).toBe('ali');
      expect(profile.phoneNumber).toBe('09120000001');
      expect(profile.avatars).toContain('avatar1.jpg');

      jest
        .spyOn(userModel, 'findById')
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({
            _id: 'user-123',
            username: 'ali',
            phoneNumber: '09120000001',
            avatars: [],
          }),
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({
            _id: 'stranger-456',
            contacts: [],
            phoneKnownContacts: [],
            phoneSharedWith: [],
          }),
        } as any);
      const hiddenProfile = await service.getUserProfile('user-123', 'stranger-456');
      expect(hiddenProfile.phoneNumber).toBeNull();
    });

    it('should delete avatar and fallback to next avatar', async () => {
      const mockUserWithAvatars = {
        _id: 'user-123',
        profilePicture: 'avatar1.jpg',
        avatars: ['avatar1.jpg', 'avatar2.jpg'],
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserWithAvatars),
      } as any);
      const remaining = await service.deleteAvatar('user-123', 'avatar1.jpg');
      expect(remaining).toEqual(['avatar2.jpg']);
      expect(mockUserWithAvatars.profilePicture).toBe('avatar2.jpg');
      expect(mockUserWithAvatars.save).toHaveBeenCalled();
    });
  });

  describe('UserService - Blocking', () => {
    it('should block a user', async () => {
      const mockUser = {
        _id: 'user-123',
        blockedUsers: [],
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const res = await service.blockUser('user-123', '507f1f77bcf86cd799439011');
      expect(res.success).toBe(true);
      expect(mockUser.blockedUsers.length).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should unblock a user', async () => {
      const mockUser = {
        _id: 'user-123',
        blockedUsers: ['507f1f77bcf86cd799439011'],
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const res = await service.unblockUser('user-123', '507f1f77bcf86cd799439011');
      expect(res.success).toBe(true);
      expect(mockUser.blockedUsers.length).toBe(0);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should check if user is blocked', async () => {
      const mockUserA = {
        _id: 'user-1',
        blockedUsers: ['user-2'],
      };
      const mockUserB = {
        _id: 'user-2',
        blockedUsers: [],
      };
      jest.spyOn(userModel, 'findById').mockImplementation(
        (id: any) =>
          ({
            select: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(id === 'user-1' ? mockUserA : mockUserB),
            }),
          }) as any,
      );

      const isBlocked = await service.isUserBlocked('user-2', 'user-1');
      expect(isBlocked).toBe(true);
    });
  });

  describe('Folders CRUD', () => {
    it('should get user folders', async () => {
      const mockUser = {
        _id: 'user-123',
        folders: [{ _id: 'f1', name: 'Work', icon: 'briefcase', includedChatIds: [], excludedChatIds: [], includedTypes: ['direct'] }],
      };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      } as any);

      const folders = await service.getFolders('user-123');
      expect(folders.length).toBe(1);
      expect(folders[0].name).toBe('Work');
    });

    it('should create a new folder', async () => {
      const mockUser = {
        _id: 'user-123',
        folders: [],
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const folders = await service.createFolder('user-123', {
        name: 'Friends',
        icon: 'users',
        includedTypes: ['groups'],
      });
      expect(folders.length).toBe(1);
      expect(folders[0].name).toBe('Friends');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update an existing folder', async () => {
      const folderId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: 'user-123',
        folders: [{ _id: { toString: () => folderId }, name: 'Old', icon: 'folder', includedChatIds: [], excludedChatIds: [], includedTypes: [] }],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const folders = await service.updateFolder('user-123', folderId, {
        name: 'New Name',
        icon: 'star',
      });
      expect(folders[0].name).toBe('New Name');
      expect(folders[0].icon).toBe('star');
      expect(mockUser.markModified).toHaveBeenCalledWith('folders');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should delete a folder', async () => {
      const folderId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: 'user-123',
        folders: [{ _id: { toString: () => folderId }, name: 'To Delete' }],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(userModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const folders = await service.deleteFolder('user-123', folderId);
      expect(folders.length).toBe(0);
      expect(mockUser.markModified).toHaveBeenCalledWith('folders');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
