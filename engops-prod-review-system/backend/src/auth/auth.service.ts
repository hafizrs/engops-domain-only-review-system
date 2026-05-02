import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DevLoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private allowedDomain() {
    return (this.config.get('ALLOWED_EMAIL_DOMAIN') || 'selisegroup.com').toLowerCase();
  }

  private normalizeEmail(email: string) {
    return (email || '').trim().toLowerCase();
  }

  private validateDomain(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const domain = this.allowedDomain();

    if (!normalizedEmail.endsWith('@' + domain)) {
      throw new ForbiddenException(`Only @${domain} email is allowed`);
    }

    return normalizedEmail;
  }

  private token(user: any) {
    return {
      accessToken: this.jwt.sign({
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      }),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async emailDomainLogin(dto: DevLoginDto) {
    const email = this.validateDomain(dto.email);
    const name = (dto.name || email.split('@')[0]).trim();

    // First created admin can be admin by request from UI.
    // Normal reviewer/manager users should use role = manager.
    const requestedRole = dto.role || 'manager';
    const existingUser = await this.users.findByEmail(email);
    const role = existingUser?.role || requestedRole;

    const user = await this.users.upsertFromEmail(email, name, role);
    return this.token(user);
  }
}
