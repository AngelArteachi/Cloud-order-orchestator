import { PrismaClient, User } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/prisma';
import { RegisterInput } from '../types/user.types';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: RegisterInput): Promise<User>;
}

export class UserRepository implements IUserRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async create(data: RegisterInput): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || 'USER',
      },
    });
  }
}
