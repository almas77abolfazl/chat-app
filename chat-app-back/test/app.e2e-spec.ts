import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from './../src/app.module';
import { AuthService } from './../src/auth/auth.service';

describe('App E2E (auth + chat flow)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let chatId: string;
  let port: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('v1');
    await app.listen(0);

    port = (app.getHttpServer().address() as any).port;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth flow', () => {
    it('should send verification code', async () => {
      const res = await request(app.getHttpServer()).post('/v1/auth/send-code').send({ phoneNumber: '09123456789' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ sent: true });
    });

    it('should verify code and receive access token', async () => {
      const authService = app.get(AuthService);
      const stored = (authService as any).verificationCodes.get('09123456789');
      expect(stored).toBeDefined();
      const code = stored.code;

      const res = await request(app.getHttpServer()).post('/v1/auth/verify-code').send({ phoneNumber: '09123456789', code });

      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.userId).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      authToken = res.body.access_token;
      userId = res.body.userId;
    });

    it('should reject invalid verification code', async () => {
      const res = await request(app.getHttpServer()).post('/v1/auth/verify-code').send({ phoneNumber: '09999999999', code: '000000' });

      expect(res.status).toBe(400);
    });

    it('should get chat list (authenticated)', async () => {
      const res = await request(app.getHttpServer()).get('/v1/chat/list').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Chat flow', () => {
    it('should create a direct chat', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'direct', peerId: userId });

      expect(res.status).toBe(201);
      chatId = res.body._id || res.body.chatId;
      expect(chatId).toBeDefined();
    });

    it('should send and receive messages via WebSocket', async () => {
      const socket: Socket = io(`http://127.0.0.1:${port}`, {
        query: { token: authToken },
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('WebSocket connect timeout')), 10000);
        socket.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.on('connect_error', (err) => reject(err));
      });

      const received = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Message timeout')), 10000);
        socket.on('messageSent', (data: any) => {
          clearTimeout(timeout);
          resolve(data);
        });
        socket.emit('sendMessage', { chatId, content: 'Hello from E2E' });
      });

      expect(received).toBeDefined();
      expect(received.message).toBeDefined();
      expect(received.message.content).toBe('Hello from E2E');

      socket.disconnect();
    });

    it('should fetch messages from the chat', async () => {
      const res = await request(app.getHttpServer()).get(`/v1/message?chatId=${chatId}&page=1&limit=20`).set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.messages).toBeDefined();
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBeGreaterThan(0);
    });

    it('should leave chat', async () => {
      const res = await request(app.getHttpServer()).post(`/v1/chat/${chatId}/leave`).set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
