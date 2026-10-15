import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessageModule } from './message/message.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { GroupModule } from './group/group.module';
import { ChannelModule } from './channel/channel.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorInterceptor } from './helpers/error.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchModule } from './search/search.module';
import { AgentModule } from './agent/agent.module';
import llmConfig from './config/llm.config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig, jwtConfig, appConfig, llmConfig],
      isGlobal: true,
    }),
    AuthModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // روت برای دسترسی به فایل‌ها
    }),
    MessageModule,
    UserModule,
    ChatModule,
    GroupModule,
    ChannelModule,
    SearchModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule {}
