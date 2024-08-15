import { User } from 'src/user/entities/user.entity';

export type RequestWithUser = Request & { user: User };
