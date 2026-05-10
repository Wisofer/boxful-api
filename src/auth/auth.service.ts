import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { PublicUser } from '../users/types/public-user.types';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_SALT_ROUNDS = 11;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser }> {
    const email = dto.email.trim().toLowerCase();

    try {
      const hashedPassword = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );
      const user = await this.usersService.create({
        name: dto.name,
        email,
        hashedPassword,
      });

      return { user };
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        err.code === 11000
      ) {
        throw new ConflictException('Ya existe una cuenta con este email');
      }

      throw err;
    }
  }

  async login(dto: LoginDto): Promise<{
    access_token: string;
    user: PublicUser;
  }> {
    const email = dto.email.trim().toLowerCase();
    const userWithSecret =
      await this.usersService.findByEmailWithPassword(email);

    if (!userWithSecret) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const match = await bcrypt.compare(dto.password, userWithSecret.password);

    if (!match) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const user = this.usersService.toPublic(userWithSecret);
    let access_token: string;

    try {
      access_token = await this.jwtService.signAsync<{ sub: string }>({
        sub: user.id,
      });
    } catch {
      throw new InternalServerErrorException('No se pudo emitir el token');
    }

    return { access_token, user };
  }
}
