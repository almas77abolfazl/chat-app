import { IUser } from 'src/user/interfaces/user.interface';

export type RequestWithUser = Request & { user: IUser };
