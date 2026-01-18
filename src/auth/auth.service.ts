import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async register(registerDto: RegisterDto): Promise<User> {
        return this.usersService.create(registerDto);
    }

    async validateUser(phoneNumber: string, pass: string): Promise<any> {
        const user = await this.usersService.findByPhoneNumber(phoneNumber);
        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.phoneNumber, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, phoneNumber: user.phoneNumber, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
}
