import { Test, TestingModule } from '@nestjs/testing';
import { StoryService } from './story.service';
import { getModelToken } from '@nestjs/mongoose';
import { Story } from './entities/story.entity';
import { User } from '../user/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

describe('StoryService', () => {
  let service: StoryService;
  let storyModel: any;

  const mockStory = {
    _id: '507f1f77bcf86cd799439021',
    user: '507f1f77bcf86cd799439011',
    mediaUrl: '/uploads/stories/test.jpg',
    mediaType: 'image',
    caption: 'My First Story',
    views: [],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    save: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    function MockStoryConstructor(dto: any) {
      Object.assign(this, dto);
      this._id = '507f1f77bcf86cd799439021';
      this.save = jest.fn().mockResolvedValue(this);
    }
    MockStoryConstructor.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockStory]),
        }),
      }),
    });
    MockStoryConstructor.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStory),
      }),
      exec: jest.fn().mockResolvedValue(mockStory),
    });
    MockStoryConstructor.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });

    storyModel = MockStoryConstructor;

    const mockUserModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            contacts: ['507f1f77bcf86cd799439012'],
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryService,
        {
          provide: getModelToken(Story.name),
          useValue: storyModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<StoryService>(StoryService);
  });

  it('should create a story', async () => {
    const res = await service.createStory('507f1f77bcf86cd799439011', {
      mediaUrl: 'https://example.com/photo.jpg',
      caption: 'Awesome day!',
    });
    expect(res).toBeDefined();
    expect(res.caption).toBe('Awesome day!');
  });

  it('should record a view on a story', async () => {
    mockStory.views = [];
    const res = await service.viewStory('507f1f77bcf86cd799439021', '507f1f77bcf86cd799439012');
    expect(res.success).toBe(true);
    expect(mockStory.views.length).toBe(1);
  });

  it('should not record view if author views their own story', async () => {
    mockStory.views = [];
    const res = await service.viewStory('507f1f77bcf86cd799439021', '507f1f77bcf86cd799439011');
    expect(res.success).toBe(true);
    expect(mockStory.views.length).toBe(0);
  });

  it('should delete own story', async () => {
    const res = await service.deleteStory('507f1f77bcf86cd799439021', '507f1f77bcf86cd799439011');
    expect(res.success).toBe(true);
    expect(storyModel.deleteOne).toHaveBeenCalled();
  });

  it('should get active stories for contacts only', async () => {
    const stories = await service.getActiveStories('507f1f77bcf86cd799439011');
    expect(stories).toBeDefined();
    expect(Array.isArray(stories)).toBe(true);
  });

  it('should throw ForbiddenException when deleting another user story', async () => {
    await expect(service.deleteStory('507f1f77bcf86cd799439021', '507f1f77bcf86cd799439099')).rejects.toThrow(ForbiddenException);
  });
});
