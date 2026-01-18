import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        if (createUserDto.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: createUserDto.email },
            });

            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        const existingPhone = await this.prisma.user.findUnique({
            where: { phoneNumber: createUserDto.phoneNumber },
        });

        if (existingPhone) {
            throw new ConflictException('Phone number already exists');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(createUserDto.password, salt);

        // Remove password from dto and use hash
        const { password, ...userData } = createUserDto;

        return this.prisma.user.create({
            data: {
                ...userData,
                passwordHash,
            },
        });
    }

    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany();
    }

    async findOne(id: number): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { phoneNumber },
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        await this.findOne(id); // Check existence

        let dataToUpdate: any = { ...updateUserDto };

        if (updateUserDto.password) {
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(updateUserDto.password, salt);
            delete dataToUpdate.password;
            dataToUpdate.passwordHash = passwordHash;
        }

        return this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    async remove(id: number): Promise<void> {
        await this.findOne(id); // Check existence
        await this.prisma.user.delete({
            where: { id },
        });
    }
}
