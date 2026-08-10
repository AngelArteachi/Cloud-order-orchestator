import { AuthService } from '../../src/services/auth.service';
import { IUserRepository } from '../../src/repositories/user.repository';
import { User } from '@prisma/client';
import { AppError } from '../../src/middlewares/error.middleware';
import { generateToken, verifyToken } from '../../src/utils/jwt';
import { comparePassword, hashPassword } from '../../src/utils/password';

// Set dummy JWT secret for testing
process.env.JWT_SECRET = 'test_secret_key_minimum_16_characters_long';

describe('Auth Utilities', () => {
  it('should hash password and verify correctly', async () => {
    const plainPassword = 'Password123!';
    const hashed = await hashPassword(plainPassword);

    expect(hashed).not.toEqual(plainPassword);
    const isValid = await comparePassword(plainPassword, hashed);
    expect(isValid).toBe(true);

    const isInvalid = await comparePassword('WrongPassword', hashed);
    expect(isInvalid).toBe(false);
  });

  it('should generate and verify JWT tokens', () => {
    const payload = { userId: 'user-123', email: 'test@example.com', role: 'USER' as const };
    const token = generateToken(payload);

    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });
});

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'john@example.com',
    password: '$2a$10$hashedpasswordstringsample',
    name: 'John Doe',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    authService = new AuthService(mockUserRepository);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result.user.email).toBe('john@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw Conflict error if user email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'john@example.com',
          password: 'password123',
          name: 'John Doe',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await hashPassword(plainPassword);
      const userWithHashedPass = { ...mockUser, password: hashedPassword };

      mockUserRepository.findByEmail.mockResolvedValue(userWithHashedPass);

      const result = await authService.login({
        email: 'john@example.com',
        password: plainPassword,
      });

      expect(result.user.id).toBe(mockUser.id);
      expect(result.token).toBeDefined();
    });

    it('should throw 401 error if user email is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw 401 error if password is incorrect', async () => {
      const hashedPassword = await hashPassword('correctPassword');
      const userWithHashedPass = { ...mockUser, password: hashedPassword };

      mockUserRepository.findByEmail.mockResolvedValue(userWithHashedPass);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'wrongPassword',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile by ID', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const profile = await authService.getUserProfile('user-uuid-1');
      expect(profile.id).toBe('user-uuid-1');
      expect(profile.email).toBe('john@example.com');
    });

    it('should throw 404 error if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.getUserProfile('unknown-id')).rejects.toThrow(AppError);
    });
  });
});
