import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReviewFormsModule } from './review-forms/review-forms.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({ inject: [ConfigService], useFactory: (c: ConfigService) => ({ uri: c.getOrThrow('MONGODB_URI') }) }),
    AuthModule, UsersModule, ReviewFormsModule, SubmissionsModule,
  ],
})
export class AppModule {}
