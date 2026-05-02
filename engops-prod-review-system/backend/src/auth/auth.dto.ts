import { IsEmail, IsOptional, IsString } from 'class-validator';
export class DevLoginDto { @IsEmail() email: string; @IsString() name: string; @IsOptional() @IsString() role?: 'admin' | 'manager'; }
export class MicrosoftLoginDto { @IsString() accessToken: string; }
