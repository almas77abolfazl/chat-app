import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, StructuredErrorResponse } from '../constants/error-codes';
import { ERROR_MESSAGES } from '../constants/error-messages';

// Map legacy or raw string messages to error codes
const STRING_TO_ERROR_CODE_MAP: Record<string, ErrorCode> = {
  // Auth
  'User not found': ErrorCode.USER_NOT_FOUND,
  'Refresh token is required': ErrorCode.AUTH_REFRESH_TOKEN_REQUIRED,
  'Invalid refresh token': ErrorCode.AUTH_INVALID_REFRESH_TOKEN,
  'Refresh token expired': ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED,
  'Verification code expired': ErrorCode.AUTH_CODE_EXPIRED,
  'Invalid verification code': ErrorCode.AUTH_INVALID_CODE,
  Unauthorized: ErrorCode.AUTH_UNAUTHORIZED,
  'Missing authentication token': ErrorCode.AUTH_MISSING_TOKEN,

  // Chat
  'Chat not found': ErrorCode.CHAT_NOT_FOUND,
  'You are not a member of this chat': ErrorCode.CHAT_NOT_MEMBER,
  'Group name is required': ErrorCode.CHAT_GROUP_NAME_REQUIRED,
  'A group needs at least 2 members': ErrorCode.CHAT_GROUP_MIN_MEMBERS,
  'Channel name is required': ErrorCode.CHAT_CHANNEL_NAME_REQUIRED,
  'Chat is not a group': ErrorCode.CHAT_NOT_A_GROUP,
  'Chat is not a channel': ErrorCode.CHAT_NOT_A_CHANNEL,
  'Only the group admin can add members': ErrorCode.CHAT_ONLY_ADMIN_ADD_MEMBERS,
  'Only channel owner can pin messages': ErrorCode.CHAT_ONLY_OWNER_PIN,
  'Only channel owner can unpin messages': ErrorCode.CHAT_ONLY_OWNER_UNPIN,
  'Cannot set avatar on a direct chat': ErrorCode.CHAT_CANNOT_AVATAR_DIRECT,
  'Only the chat owner can update avatar': ErrorCode.CHAT_ONLY_OWNER_AVATAR,
  'Admins can only be added to groups or channels': ErrorCode.CHAT_ADMINS_ONLY_GROUPS_CHANNELS,
  'Only owner or admins with canManageAdmins can appoint admins': ErrorCode.CHAT_ONLY_ADMIN_MANAGE_ADMINS,
  'Only owner or admins with canManageAdmins can dismiss admins': ErrorCode.CHAT_ONLY_ADMIN_MANAGE_ADMINS,
  'User must be a member of the chat before becoming an admin': ErrorCode.CHAT_USER_MUST_BE_MEMBER,
  'Cannot remove the chat owner': ErrorCode.CHAT_CANNOT_REMOVE_OWNER,
  'نمی‌توانید گفتگوی پیام‌های ذخیره‌شده را حذف کنید': ErrorCode.CHAT_SAVED_MESSAGES_CANNOT_BE_DELETED,
  'Cannot delete saved messages chat': ErrorCode.CHAT_SAVED_MESSAGES_CANNOT_BE_DELETED,
  'You are not a participant of this chat': ErrorCode.CHAT_NOT_PARTICIPANT,
  'peerId is required for a direct chat': ErrorCode.CHAT_DIRECT_PEER_REQUIRED,
  'No file uploaded!': ErrorCode.CHAT_NO_FILE_UPLOADED,

  // Channel & Group
  'Channel not found': ErrorCode.CHANNEL_NOT_FOUND,
  'Already subscribed to this channel': ErrorCode.CHANNEL_ALREADY_SUBSCRIBED,
  'Channel owner cannot leave': ErrorCode.CHANNEL_OWNER_CANNOT_LEAVE,
  'Only channel admins can post in this channel': ErrorCode.CHANNEL_ONLY_ADMIN_POST,
  'Group not found': ErrorCode.GROUP_NOT_FOUND,
  'Admin cannot leave the group': ErrorCode.GROUP_ADMIN_CANNOT_LEAVE,
  'Only group admin can remove members': ErrorCode.GROUP_ONLY_ADMIN_REMOVE,
  'Only group admin can add members': ErrorCode.GROUP_ONLY_ADMIN_ADD,

  // Message
  'Message not found': ErrorCode.MESSAGE_NOT_FOUND,
  'You can only edit your own messages': ErrorCode.MESSAGE_ONLY_EDIT_OWN,
  'Cannot edit a deleted message': ErrorCode.MESSAGE_CANNOT_EDIT_DELETED,
  'You do not have permission to delete this message': ErrorCode.MESSAGE_NO_PERMISSION_DELETE,
  'You are not a participant of the target chat': ErrorCode.MESSAGE_TARGET_NOT_PARTICIPANT,
  'Cannot send message: one of the users has blocked the other': ErrorCode.MESSAGE_USERS_BLOCKED,
  'url query parameter is required': ErrorCode.MESSAGE_URL_REQUIRED,
  'messageIds array is required': ErrorCode.MESSAGE_IDS_REQUIRED,
  'targetChatId is required': ErrorCode.MESSAGE_TARGET_CHAT_REQUIRED,
  'chatId is required': ErrorCode.MESSAGE_CHAT_ID_REQUIRED,

  // User
  'کاربری با این شماره تلفن در برنامه ثبت‌نام نکرده است': ErrorCode.USER_PHONE_NOT_REGISTERED,
  'نمی‌توانید خودتان را به عنوان مخاطب اضافه کنید': ErrorCode.USER_CANNOT_ADD_SELF_CONTACT,
  'Folder not found': ErrorCode.USER_FOLDER_NOT_FOUND,

  // Story
  'Story not found': ErrorCode.STORY_NOT_FOUND,
  'mediaUrl or uploaded file is required for stories': ErrorCode.STORY_MEDIA_REQUIRED,
  'Only the author can delete this story': ErrorCode.STORY_ONLY_AUTHOR_DELETE,
  'Only the author can view story viewers': ErrorCode.STORY_ONLY_AUTHOR_VIEWERS,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine target locale from header
    const acceptLang = (request.headers['accept-language'] || '').toLowerCase();
    const lang: 'fa' | 'en' = acceptLang.startsWith('en') ? 'en' : 'fa';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: ErrorCode | string = ErrorCode.COMMON_INTERNAL_ERROR;
    let message = 'Internal server error';
    let args: Record<string, any> = {};
    let errors: any[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorCode = STRING_TO_ERROR_CODE_MAP[res] || this.defaultErrorCodeForStatus(status);
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        if (body.errorCode) {
          errorCode = body.errorCode;
        } else if (typeof body.message === 'string') {
          errorCode = STRING_TO_ERROR_CODE_MAP[body.message] || this.defaultErrorCodeForStatus(status);
        } else if (Array.isArray(body.message)) {
          // Class validator error
          errorCode = ErrorCode.COMMON_VALIDATION_FAILED;
          errors = body.message;
        } else {
          errorCode = this.defaultErrorCodeForStatus(status);
        }

        if (Array.isArray(body.message)) {
          message = body.message.join(', ');
        } else if (typeof body.message === 'string') {
          message = body.message;
        }

        if (body.args && typeof body.args === 'object') {
          args = body.args;
        }
      }
    } else {
      const err = exception as any;
      if (err?.name === 'CastError' || err?.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.COMMON_VALIDATION_FAILED;
        message = err?.message || 'Validation failed';
      } else {
        this.logger.error(`Unhandled error: ${err?.message}`, err?.stack);
      }
    }

    // Localize message if known in ERROR_MESSAGES
    if (errorCode in ERROR_MESSAGES) {
      const dict = ERROR_MESSAGES[errorCode as ErrorCode];
      message = dict[lang] || message;
    }

    const errorPayload: StructuredErrorResponse = {
      statusCode: status,
      errorCode,
      message,
      args,
    };

    if (errors && errors.length > 0) {
      errorPayload.errors = errors;
    }

    response.status(status).json(errorPayload);
  }

  private defaultErrorCodeForStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.COMMON_BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.COMMON_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.COMMON_NOT_FOUND;
      default:
        return ErrorCode.COMMON_INTERNAL_ERROR;
    }
  }
}
