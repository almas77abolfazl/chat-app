import { HttpExceptionFilter } from './http-exception.filter';
import { BadRequestException, NotFoundException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

describe('HttpExceptionFilter (Issue #94)', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({
      headers: { 'accept-language': 'fa' },
    });

    mockHost = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    };
  });

  it('formats structured exception with errorCode and localized message (Persian)', () => {
    const exception = new BadRequestException('نمی‌توانید گفتگوی پیام‌های ذخیره‌شده را حذف کنید');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.CHAT_SAVED_MESSAGES_CANNOT_BE_DELETED,
        message: 'نمی‌توانید گفتگوی پیام‌های ذخیره‌شده را حذف کنید',
      }),
    );
  });

  it('formats structured exception with English fallback when Accept-Language is en', () => {
    mockGetRequest.mockReturnValue({
      headers: { 'accept-language': 'en-US,en;q=0.9' },
    });

    const exception = new NotFoundException('Chat not found');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.CHAT_NOT_FOUND,
        message: 'Chat not found',
      }),
    );
  });

  it('handles custom errorCode in exception response body', () => {
    const exception = new BadRequestException({
      errorCode: ErrorCode.USER_PHONE_NOT_REGISTERED,
      args: { phone: '09120000000' },
    });

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.USER_PHONE_NOT_REGISTERED,
        message: 'کاربری با این شماره تلفن در برنامه ثبت‌نام نکرده است',
        args: { phone: '09120000000' },
      }),
    );
  });
});
