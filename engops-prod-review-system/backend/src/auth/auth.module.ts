import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './jwt.guard';
@Module({
  imports: [UsersModule, JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (c: ConfigService) => ({ secret: c.getOrThrow('JWT_SECRET'), signOptions: { expiresIn: '8h' } }) })],
  controllers: [AuthController], providers: [AuthService, JwtAuthGuard], exports: [JwtAuthGuard, AuthService]
})
export class AuthModule {}
