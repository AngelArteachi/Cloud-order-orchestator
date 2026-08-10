import { IUserRepository, UserRepository } from '../repositories/user.repository';
import { AuthResponse, LoginInput, RegisterInput, UserResponse, UserRole } from '../types/user.types';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/error.middleware';

export class AuthService {
  constructor(private userRepository: IUserRepository = new UserRepository()) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(input.email.toLowerCase());
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.userRepository.create({
      ...input,
      email: input.email.toLowerCase(),
      password: hashedPassword,
    });

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return { user: userResponse, token };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return { user: userResponse, token };
  }

  async getUserProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
