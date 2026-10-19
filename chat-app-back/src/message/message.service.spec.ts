jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    model: jest.fn(),
    Schema: jest.fn().mockImplementation((...args: any[]) => {
      const schema = actual.Schema(...args);
      return schema;
    }),
  };
});

import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Types } from 'mongoose';

describe('MessageService', () => {
  let messageService: MessageService;
  let messageModel: {
    create: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    updateMany: jest.Mock;
  };
  let chatModel: {
    findById: jest.Mock;
    updateOne: jest.Mock;
  };

  const senderIdValue = '507f1f77bcf86cd799439011';
  const recipientIdValue = '507f1f77bcf86cd799439012';
  const senderId = new Types.ObjectId(senderIdValue);
  const otherParticipant = new Types.ObjectId(recipientIdValue);

  const mockParticipates = (participants: any[]) => {
    const arr = participants as any[];
    arr.includes = (id: any) => participants.some((p) => p.toString() === id.toString());
    return arr;
  };

  const mockMessage = {
    _id: new Types.ObjectId(),
    sender: senderId,
    chat: new Types.ObjectId(),
    content: 'Hello',
    status: 'sent' as const,
    read: false,
    deliveredAt: undefined,
    readAt: undefined,
    editedAt: undefined,
    deletedAt: undefined,
    isDeleted: false,
    createdAt: new Date(),
    toObject: jest.fn().mockReturnThis(),
  };

  const mockChat = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    participants: mockParticipates([senderId, otherParticipant]),
    isGroup: false,
    isChannel: false,
    lastMessage: null,
    updatedAt: new Date(),
    unreadCounts: new Map(),
    messages: [],
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    messageModel = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      updateMany: jest.fn(),
    };

    chatModel = {
      findById: jest.fn(),
      updateOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: getModelToken(Message.name), useValue: messageModel },
        { provide: getModelToken(Chat.name), useValue: chatModel },
      ],
    }).compile();

    messageService = moduleRef.get(MessageService);
  });

  describe('findChatForMessage', () => {
    it('returns chat when found', async () => {
      chatModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockChat) });

      const result = await messageService.findChatForMessage(mockChat._id.toString());

      expect(result).toEqual(mockChat);
    });

    it('throws NotFoundException when chat not found', async () => {
      chatModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(messageService.findChatForMessage('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveMessageToChat', () => {
    it('throws ForbiddenException when sender is not a participant', async () => {
      const chatWithoutSender = { ...mockChat, participants: mockParticipates([otherParticipant]) };
      const popSpy = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMessage) });
      chatModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(chatWithoutSender) });
      messageModel.findById = popSpy;

      await expect(messageService.saveMessageToChat(mockChat._id.toString(), senderId.toString(), 'Hello')).rejects.toThrow(ForbiddenException);
    });

    it('saves message and updates unread counts for other participants', async () => {
      const newMessage = { ...mockMessage, _id: new Types.ObjectId() };
      messageModel.create = jest.fn().mockResolvedValue(newMessage);
      chatModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockChat) });
      messageModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(newMessage),
      });

      await messageService.saveMessageToChat(mockChat._id.toString(), senderId.toString(), 'Hello');

      expect(messageModel.create).toHaveBeenCalled();
      expect(mockChat.save).toHaveBeenCalled();
      expect(mockChat.unreadCounts.get(otherParticipant.toString())).toBe(1);
    });

    it('for direct chat, sets receiver to the other participant', async () => {
      const newMessage = { ...mockMessage, _id: new Types.ObjectId() };
      messageModel.create = jest.fn().mockResolvedValue(newMessage);
      chatModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockChat) });
      messageModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(newMessage),
      });

      await messageService.saveMessageToChat(mockChat._id.toString(), senderId.toString(), 'Hello');

      expect(messageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: new Types.ObjectId(senderId),
          receiver: otherParticipant,
          chat: mockChat._id,
        }),
      );
    });
  });

  describe('markMessageRead', () => {
    it('updates message status to read', async () => {
      const messageToUpdate: any = { ...mockMessage, status: 'delivered', save: jest.fn().mockResolvedValue(undefined) };
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(messageToUpdate) });

      await messageService.markMessageRead(messageToUpdate._id.toString());

      expect(messageToUpdate.status).toBe('read');
      expect(messageToUpdate.read).toBe(true);
      expect(messageToUpdate.readAt).toBeDefined();
      expect(messageToUpdate.save).toHaveBeenCalled();
    });

    it('does nothing when message already read', async () => {
      const messageToUpdate: any = { ...mockMessage, status: 'read', read: true, save: jest.fn() };
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(messageToUpdate) });

      await messageService.markMessageRead(messageToUpdate._id.toString());

      expect(messageToUpdate.save).not.toHaveBeenCalled();
    });

    it('does nothing when message not found', async () => {
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(messageService.markMessageRead('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('markMessageDelivered', () => {
    it('updates status from sent to delivered', async () => {
      const messageToUpdate: any = { ...mockMessage, status: 'sent', deliveredAt: undefined, save: jest.fn().mockResolvedValue(undefined) };
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(messageToUpdate) });

      await messageService.markMessageDelivered(messageToUpdate._id.toString());

      expect(messageToUpdate.status).toBe('delivered');
      expect(messageToUpdate.deliveredAt).toBeDefined();
    });

    it('does nothing when status is not sent', async () => {
      const messageToUpdate: any = { ...mockMessage, status: 'read', deliveredAt: new Date(), save: jest.fn() };
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(messageToUpdate) });

      await messageService.markMessageDelivered(messageToUpdate._id.toString());

      expect(messageToUpdate.save).not.toHaveBeenCalled();
    });
  });

  describe('editMessage', () => {
    it('throws NotFoundException when message not found', async () => {
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(messageService.editMessage('nonexistent', senderId.toString(), 'edited')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not the sender', async () => {
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMessage) });

      await expect(messageService.editMessage(mockMessage._id.toString(), 'not-sender', 'edited')).rejects.toThrow(ForbiddenException);
    });

    it('updates content and sets editedAt', async () => {
      const messageToUpdate: any = { ...mockMessage, save: jest.fn().mockResolvedValue(undefined) };
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(messageToUpdate) });
      messageModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(messageToUpdate),
      });

      await messageService.editMessage(messageToUpdate._id.toString(), senderId.toString(), 'edited');

      expect(messageToUpdate.content).toBe('edited');
      expect(messageToUpdate.editedAt).toBeDefined();
    });
  });

  describe('deleteMessage', () => {
    it('throws NotFoundException when message not found', async () => {
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(messageService.deleteMessage('nonexistent', senderId.toString())).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not the sender', async () => {
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMessage) });

      await expect(messageService.deleteMessage(mockMessage._id.toString(), 'not-sender')).rejects.toThrow(ForbiddenException);
    });

    it('soft deletes the message', async () => {
      const messageToDelete: any = { ...mockMessage, save: jest.fn().mockResolvedValue(undefined) };
      messageModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(messageToDelete) });

      await messageService.deleteMessage(messageToDelete._id.toString(), senderId.toString());

      expect(messageToDelete.isDeleted).toBe(true);
      expect(messageToDelete.deletedAt).toBeDefined();
      expect(messageToDelete.content).toBe('این پیام حذف شد');
    });
  });

  describe('getMessagesByChat', () => {
    it('returns paginated messages', async () => {
      const messages = [mockMessage, { ...mockMessage, _id: new Types.ObjectId() }];
      messageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(messages),
      });
      messageModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(25) });
      messageModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }) });
      chatModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) });

      const result = await messageService.getMessagesByChat(mockChat._id.toString(), senderId.toString(), 1, 20);

      expect(result.messages).toHaveLength(2);
      expect(result.totalMessages).toBe(25);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('clamps page and limit to valid ranges', async () => {
      messageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      messageModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
      messageModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }) });
      chatModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }) });

      const result = await messageService.getMessagesByChat(mockChat._id.toString(), senderId.toString(), -1, 0);

      expect(messageModel.find).toHaveBeenCalledWith({ chat: new Types.ObjectId(mockChat._id.toString()) });
      expect(result.currentPage).toBe(1);
    });
  });

  describe('hydrateMessage', () => {
    it('returns null for null input', () => {
      expect(messageService.hydrateMessage(null)).toBeNull();
    });

    it('hydrates message with sender object', () => {
      const msg = {
        _id: new Types.ObjectId(),
        chat: new Types.ObjectId(),
        sender: { _id: senderId, firstName: 'Ali', lastName: 'Ahmadi', profilePicture: 'pic.jpg' },
        content: 'Hello',
        createdAt: new Date(),
        status: 'sent',
      };

      const result = messageService.hydrateMessage(msg);

      expect(result.senderId).toBe(senderId.toString());
      expect(result.sender).toEqual({
        _id: senderId,
        firstName: 'Ali',
        lastName: 'Ahmadi',
        profilePicture: 'pic.jpg',
      });
      expect(result.content).toBe('Hello');
    });

    it('hydrates message with string sender', () => {
      const msg = {
        _id: new Types.ObjectId(),
        chat: new Types.ObjectId(),
        sender: senderId.toString(),
        content: 'Hello',
        createdAt: new Date(),
      };

      const result = messageService.hydrateMessage(msg);

      expect(result.senderId).toBe(senderId.toString());
      expect(result.sender._id).toBeUndefined();
    });

    it('defaults status to sent when not provided', () => {
      const msg = {
        _id: new Types.ObjectId(),
        chat: new Types.ObjectId(),
        sender: { _id: senderId },
        content: 'Hello',
        createdAt: new Date(),
      };

      const result = messageService.hydrateMessage(msg);

      expect(result.status).toBe('sent');
    });
  });
});
