import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DevLoginDto } from './auth.dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Domain-only login. No Azure SSO. No OTP.
  // Any email ending with ALLOWED_EMAIL_DOMAIN will be accepted and auto-stored in MongoDB.
  @Post('email-login')
  emailLogin(@Body() dto: DevLoginDto) {
    return this.auth.emailDomainLogin(dto);
  }

  // Backward-compatible route, used by old frontend builds.
  @Post('dev-login')
  devLogin(@Body() dto: DevLoginDto) {
    return this.auth.emailDomainLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return {
      id: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
  }
}
