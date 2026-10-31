import { ErrorCode } from './error-codes';

export const ERROR_MESSAGES: Record<ErrorCode, { en: string; fa: string }> = {
  // Auth
  [ErrorCode.AUTH_USER_NOT_FOUND]: {
    en: 'User not found',
    fa: 'کاربر یافت نشد',
  },
  [ErrorCode.AUTH_REFRESH_TOKEN_REQUIRED]: {
    en: 'Refresh token is required',
    fa: 'توکن تجدید الزامی است',
  },
  [ErrorCode.AUTH_INVALID_REFRESH_TOKEN]: {
    en: 'Invalid refresh token',
    fa: 'توکن تجدید نامعتبر است',
  },
  [ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: {
    en: 'Refresh token expired',
    fa: 'توکن تجدید منقضی شده است',
  },
  [ErrorCode.AUTH_CODE_EXPIRED]: {
    en: 'Verification code expired',
    fa: 'کد تایید منقضی شده است',
  },
  [ErrorCode.AUTH_INVALID_CODE]: {
    en: 'Invalid verification code',
    fa: 'کد تایید نامعتبر است',
  },
  [ErrorCode.AUTH_RATE_LIMIT_EXCEEDED]: {
    en: 'Too many requests. Please try again after 1 minute.',
    fa: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً پس از ۱ دقیقه مجدداً تلاش کنید.',
  },
  [ErrorCode.AUTH_UNAUTHORIZED]: {
    en: 'Unauthorized',
    fa: 'عدم احراز هویت',
  },
  [ErrorCode.AUTH_MISSING_TOKEN]: {
    en: 'Missing authentication token',
    fa: 'توکن احراز هویت یافت نشد',
  },

  // Chat
  [ErrorCode.CHAT_NOT_FOUND]: {
    en: 'Chat not found',
    fa: 'گفتگو یافت نشد',
  },
  [ErrorCode.CHAT_NOT_MEMBER]: {
    en: 'You are not a member of this chat',
    fa: 'شما عضو این گفتگو نیستید',
  },
  [ErrorCode.CHAT_NOT_PARTICIPANT]: {
    en: 'You are not a participant of this chat',
    fa: 'شما در این گفتگو حضور ندارید',
  },
  [ErrorCode.CHAT_GROUP_NAME_REQUIRED]: {
    en: 'Group name is required',
    fa: 'نام گروه الزامی است',
  },
  [ErrorCode.CHAT_GROUP_MIN_MEMBERS]: {
    en: 'A group needs at least 2 members',
    fa: 'گروه باید حداقل دارای ۲ عضو باشد',
  },
  [ErrorCode.CHAT_CHANNEL_NAME_REQUIRED]: {
    en: 'Channel name is required',
    fa: 'نام کانال الزامی است',
  },
  [ErrorCode.CHAT_NOT_A_GROUP]: {
    en: 'Chat is not a group',
    fa: 'این گفتگو یک گروه نیست',
  },
  [ErrorCode.CHAT_NOT_A_CHANNEL]: {
    en: 'Chat is not a channel',
    fa: 'این گفتگو یک کانال نیست',
  },
  [ErrorCode.CHAT_ONLY_ADMIN_ADD_MEMBERS]: {
    en: 'Only the group admin can add members',
    fa: 'تنها مدیر گروه می‌تواند اعضا را اضافه کند',
  },
  [ErrorCode.CHAT_ONLY_OWNER_PIN]: {
    en: 'Only channel owner can pin messages',
    fa: 'تنها مالک کانال می‌تواند پیام‌ها را سنجاق کند',
  },
  [ErrorCode.CHAT_ONLY_OWNER_UNPIN]: {
    en: 'Only channel owner can unpin messages',
    fa: 'تنها مالک کانال می‌تواند پیام‌ها را از حالت سنجاق خارج کند',
  },
  [ErrorCode.CHAT_CANNOT_AVATAR_DIRECT]: {
    en: 'Cannot set avatar on a direct chat',
    fa: 'امکان تنظیم تصویر برای گفتگوی خصوصی وجود ندارد',
  },
  [ErrorCode.CHAT_ONLY_OWNER_AVATAR]: {
    en: 'Only the chat owner can update avatar',
    fa: 'تنها سازنده گفتگو می‌تواند تصویر آن را تغییر دهد',
  },
  [ErrorCode.CHAT_ADMINS_ONLY_GROUPS_CHANNELS]: {
    en: 'Admins can only be added to groups or channels',
    fa: 'مدیران تنها برای گروه‌ها و کانال‌ها قابل تنظیم هستند',
  },
  [ErrorCode.CHAT_ONLY_ADMIN_MANAGE_ADMINS]: {
    en: 'Only owner or admins with canManageAdmins can appoint or dismiss admins',
    fa: 'تنها مالک یا مدیران دارای دسترسی مدیریت می‌توانند مدیران را تغییر دهند',
  },
  [ErrorCode.CHAT_USER_MUST_BE_MEMBER]: {
    en: 'User must be a member of the chat before becoming an admin',
    fa: 'کاربر ابتدا باید عضو چت باشد تا بتواند مدیر شود',
  },
  [ErrorCode.CHAT_CANNOT_REMOVE_OWNER]: {
    en: 'Cannot remove the chat owner',
    fa: 'نمی‌توان مالک چت را حذف کرد',
  },
  [ErrorCode.CHAT_SAVED_MESSAGES_CANNOT_BE_DELETED]: {
    en: 'Cannot delete saved messages chat',
    fa: 'نمی‌توانید گفتگوی پیام‌های ذخیره‌شده را حذف کنید',
  },
  [ErrorCode.CHAT_DIRECT_PEER_REQUIRED]: {
    en: 'peerId is required for a direct chat',
    fa: 'شناسه مخاطب برای گفتگوی دونفره الزامی است',
  },
  [ErrorCode.CHAT_UNKNOWN_TYPE]: {
    en: 'Unknown chat type',
    fa: 'نوع گفتگوی نامعتبر',
  },
  [ErrorCode.CHAT_NO_FILE_UPLOADED]: {
    en: 'No file uploaded!',
    fa: 'هیچ فایلی بارگذاری نشد!',
  },

  // Channel & Group
  [ErrorCode.CHANNEL_NOT_FOUND]: {
    en: 'Channel not found',
    fa: 'کانال یافت نشد',
  },
  [ErrorCode.CHANNEL_ALREADY_SUBSCRIBED]: {
    en: 'Already subscribed to this channel',
    fa: 'قبلاً در این کانال عضو شده‌اید',
  },
  [ErrorCode.CHANNEL_OWNER_CANNOT_LEAVE]: {
    en: 'Channel owner cannot leave',
    fa: 'مالک کانال نمی‌تواند کانال را ترک کند',
  },
  [ErrorCode.CHANNEL_ONLY_ADMIN_POST]: {
    en: 'Only channel admins can post in this channel',
    fa: 'تنها مدیران کانال اجازه ارسال پیام دارند',
  },
  [ErrorCode.GROUP_NOT_FOUND]: {
    en: 'Group not found',
    fa: 'گروه یافت نشد',
  },
  [ErrorCode.GROUP_ADMIN_CANNOT_LEAVE]: {
    en: 'Admin cannot leave the group',
    fa: 'مدیر نمی‌تواند گروه را ترک کند',
  },
  [ErrorCode.GROUP_ONLY_ADMIN_REMOVE]: {
    en: 'Only group admin can remove members',
    fa: 'تنها مدیر گروه می‌تواند اعضا را حذف کند',
  },
  [ErrorCode.GROUP_ONLY_ADMIN_ADD]: {
    en: 'Only group admin can add members',
    fa: 'تنها مدیر گروه می‌تواند اعضا را اضافه کند',
  },

  // Message
  [ErrorCode.MESSAGE_NOT_FOUND]: {
    en: 'Message not found',
    fa: 'پیام یافت نشد',
  },
  [ErrorCode.MESSAGE_ONLY_EDIT_OWN]: {
    en: 'You can only edit your own messages',
    fa: 'شما فقط پیام‌های خود را می‌توانید ویرایش کنید',
  },
  [ErrorCode.MESSAGE_CANNOT_EDIT_DELETED]: {
    en: 'Cannot edit a deleted message',
    fa: 'امکان ویرایش پیام حذف شده وجود ندارد',
  },
  [ErrorCode.MESSAGE_NO_PERMISSION_DELETE]: {
    en: 'You do not have permission to delete this message',
    fa: 'شما دسترسی لازم برای حذف این پیام را ندارید',
  },
  [ErrorCode.MESSAGE_TARGET_NOT_PARTICIPANT]: {
    en: 'You are not a participant of the target chat',
    fa: 'شما در گفتگوی مقصد حضور ندارید',
  },
  [ErrorCode.MESSAGE_USERS_BLOCKED]: {
    en: 'Cannot send message: one of the users has blocked the other',
    fa: 'امکان ارسال پیام وجود ندارد: ارتباط توسط یکی از طرفین مسدود شده است',
  },
  [ErrorCode.MESSAGE_IDS_REQUIRED]: {
    en: 'messageIds array is required',
    fa: 'شناسه پیام‌ها الزامی است',
  },
  [ErrorCode.MESSAGE_TARGET_CHAT_REQUIRED]: {
    en: 'targetChatId is required',
    fa: 'شناسه گفتگوی مقصد الزامی است',
  },
  [ErrorCode.MESSAGE_FILE_REQUIRED]: {
    en: 'No file uploaded!',
    fa: 'فایلی آپلود نشده است',
  },
  [ErrorCode.MESSAGE_URL_REQUIRED]: {
    en: 'url query parameter is required',
    fa: 'پارامتر آدرس الزامی است',
  },
  [ErrorCode.MESSAGE_CHAT_ID_REQUIRED]: {
    en: 'chatId is required',
    fa: 'شناسه گفتگو الزامی است',
  },

  // User
  [ErrorCode.USER_NOT_FOUND]: {
    en: 'User not found',
    fa: 'کاربر یافت نشد',
  },
  [ErrorCode.USER_PHONE_NOT_REGISTERED]: {
    en: 'No user registered with this phone number',
    fa: 'کاربری با این شماره تلفن در برنامه ثبت‌نام نکرده است',
  },
  [ErrorCode.USER_CANNOT_ADD_SELF_CONTACT]: {
    en: 'You cannot add yourself as a contact',
    fa: 'نمی‌توانید خودتان را به عنوان مخاطب اضافه کنید',
  },
  [ErrorCode.USER_FOLDER_NOT_FOUND]: {
    en: 'Folder not found',
    fa: 'پوشه یافت نشد',
  },

  // Story
  [ErrorCode.STORY_NOT_FOUND]: {
    en: 'Story not found',
    fa: 'استوری یافت نشد',
  },
  [ErrorCode.STORY_MEDIA_REQUIRED]: {
    en: 'mediaUrl or uploaded file is required for stories',
    fa: 'آدرس رسانه یا فایل بارگذاری شده برای استوری الزامی است',
  },
  [ErrorCode.STORY_ONLY_AUTHOR_DELETE]: {
    en: 'Only the author can delete this story',
    fa: 'تنها نویسنده می‌تواند این استوری را حذف کند',
  },
  [ErrorCode.STORY_ONLY_AUTHOR_VIEWERS]: {
    en: 'Only the author can view story viewers',
    fa: 'تنها نویسنده می‌تواند بازدیدکنندگان استوری را مشاهده کند',
  },

  // Common
  [ErrorCode.COMMON_INTERNAL_ERROR]: {
    en: 'Internal server error',
    fa: 'خطای داخلی سرور',
  },
  [ErrorCode.COMMON_VALIDATION_FAILED]: {
    en: 'Validation failed',
    fa: 'اعتبارسنجی ناموفق بود',
  },
  [ErrorCode.COMMON_BAD_REQUEST]: {
    en: 'Bad request',
    fa: 'درخواست نامعتبر',
  },
  [ErrorCode.COMMON_FORBIDDEN]: {
    en: 'Forbidden',
    fa: 'دسترسی غیرمجاز',
  },
  [ErrorCode.COMMON_NOT_FOUND]: {
    en: 'Not found',
    fa: 'یافت نشد',
  },
};
