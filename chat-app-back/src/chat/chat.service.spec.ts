import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getModelToken } from '@nestjs/mongoose';
import { Chat } from './entities/chat.entity';
import { Message } from '../message/entities/message.entity';
import { User } from '../user/entities/user.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('ChatService', () => {
  let service: ChatService;
  let chatModel: any;
  let messageModel: any;

  const mockChat = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Group',
    isGroup: true,
    isChannel: false,
    owner: '507f1f77bcf86cd799439012',
    participants: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    admins: [],
    save: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    chatModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChat),
        populate: jest.fn().mockReturnThis(),
      }),
      deleteOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      }),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockChat]),
      }),
    };

    messageModel = {
      deleteMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(Chat.name),
          useValue: chatModel,
        },
        {
          provide: getModelToken(Message.name),
          useValue: messageModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('Admin Management', () => {
    it('should add an admin by owner', async () => {
      mockChat.admins = [];
      const res = await service.addAdmin(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012',
        { canChangeInfo: true },
        'مدیر اصلی',
      );
      expect(res.admins.length).toBe(1);
      expect(res.admins[0].customTitle).toBe('مدیر اصلی');
      expect(mockChat.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if requester is not owner and cannot manage admins', async () => {
      mockChat.admins = [];
      await expect(service.addAdmin('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439013', '507f1f77bcf86cd799439019')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should remove an admin by owner', async () => {
      mockChat.admins = [
        {
          userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
          customTitle: 'مدیر',
          permissions: {},
        },
      ] as any;

      const res = await service.removeAdmin('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439013', '507f1f77bcf86cd799439012');
      expect(res.admins.length).toBe(0);
      expect(mockChat.save).toHaveBeenCalled();
    });

    it('should not allow removing chat owner', async () => {
      await expect(service.removeAdmin('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439012')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Delete Chat', () => {
    it('should allow owner to delete group for both', async () => {
      await service.deleteChat('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', true);
      expect(messageModel.deleteMany).toHaveBeenCalled();
      expect(chatModel.deleteOne).toHaveBeenCalled();
    });

    it('should allow member to leave group (not delete for both)', async () => {
      await service.deleteChat('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439013', false);
      expect(chatModel.deleteOne).not.toHaveBeenCalled();
      expect(mockChat.save).toHaveBeenCalled();
    });
  });
});
