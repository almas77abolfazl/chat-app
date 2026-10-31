import { Test, TestingModule } from '@nestjs/testing';
import { ReactionController } from './reaction.controller';
import { ReactionService } from './reaction.service';
import { MessageGateway } from '../message.gateway';

describe('ReactionController', () => {
  let controller: ReactionController;
  let reactionService: jest.Mocked<Partial<ReactionService>>;
  let messageGateway: jest.Mocked<Partial<MessageGateway>>;

  beforeEach(async () => {
    reactionService = {
      getReactionCounts: jest.fn(),
      addReaction: jest.fn(),
      removeReaction: jest.fn(),
    };

    messageGateway = {
      broadcastReactionUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionController],
      providers: [
        { provide: ReactionService, useValue: reactionService },
        { provide: MessageGateway, useValue: messageGateway },
      ],
    }).compile();

    controller = module.get<ReactionController>(ReactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should add reaction, broadcast via gateway, and return updated counts', async () => {
    const mockRequest = { user: { _id: 'user123' } } as any;
    (reactionService.getReactionCounts as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([{ emoji: '❤️', count: 1, users: ['user123'] }]);

    const result = await controller.addReaction('msg1', { emoji: '❤️' }, mockRequest);

    expect(reactionService.addReaction).toHaveBeenCalledWith('msg1', 'user123', '❤️');
    expect(messageGateway.broadcastReactionUpdate).toHaveBeenCalledWith('msg1', [{ emoji: '❤️', count: 1, users: ['user123'] }]);
    expect(result).toEqual([{ emoji: '❤️', count: 1, users: ['user123'] }]);
  });

  it('should toggle off existing identical reaction, broadcast via gateway, and return updated counts', async () => {
    const mockRequest = { user: { _id: 'user123' } } as any;
    (reactionService.getReactionCounts as jest.Mock).mockResolvedValueOnce([{ emoji: '❤️', count: 1, users: ['user123'] }]).mockResolvedValueOnce([]);

    const result = await controller.addReaction('msg1', { emoji: '❤️' }, mockRequest);

    expect(reactionService.removeReaction).toHaveBeenCalledWith('msg1', 'user123');
    expect(messageGateway.broadcastReactionUpdate).toHaveBeenCalledWith('msg1', []);
    expect(result).toEqual([]);
  });

  it('should remove reaction via DELETE endpoint and broadcast via gateway', async () => {
    const mockRequest = { user: { _id: 'user123' } } as any;
    (reactionService.getReactionCounts as jest.Mock).mockResolvedValueOnce([]);

    const result = await controller.removeReaction('msg1', mockRequest);

    expect(reactionService.removeReaction).toHaveBeenCalledWith('msg1', 'user123');
    expect(messageGateway.broadcastReactionUpdate).toHaveBeenCalledWith('msg1', []);
    expect(result).toEqual([]);
  });
});
