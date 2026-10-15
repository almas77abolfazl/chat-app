import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    if (client.data?.user) return true;

    const token = client.handshake.query?.token as string | undefined;
    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const decoded = this.authService.decodeToken(token);
      const user = await this.authService.validateUserByJwt(decoded);
      if (!user) {
        throw new WsException('Unauthorized');
      }
      client.data.user = user;
      return true;
    } catch (error) {
      if (error instanceof WsException) throw error;
      throw new WsException('Unauthorized');
    }
  }
}
