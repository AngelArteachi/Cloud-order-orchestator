import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { generateToken } from '../../src/utils/jwt';
import { hashPassword } from '../../src/utils/password';

// Ensure secret is set for testing
process.env.JWT_SECRET = 'super_secret_jwt_key_change_in_production_32chars';

describe('Auth Routes Integration Tests (Supertest)', () => {
  const mockDate = new Date();
  const rawPassword = 'Password123!';

  const mockUser = {
    id: 'user-uuid-999',
    email: 'integration.user@example.com',
    password: '', // will be set in tests
    name: 'Integration Test User',
    role: 'USER' as const,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeAll(async () => {
    mockUser.password = await hashPassword(rawPassword);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 OK and health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'UP',
        service: 'user-auth-service',
      });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully (201 Created)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integration.user@example.com',
          password: 'Password123!',
          name: 'Integration Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe('integration.user@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 Bad Request when validation fails (missing fields)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          // missing password and name
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Validation failed');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return 409 Conflict when user email is already registered', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integration.user@example.com',
          password: 'Password123!',
          name: 'Integration Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials (200 OK)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration.user@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Logged in successfully');
      expect(response.body.data.user.email).toBe('integration.user@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 Bad Request when login request body is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
    });

    it('should return 401 Unauthorized when email is not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 Unauthorized when password is incorrect', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration.user@example.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when valid Bearer token is provided (200 OK)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const validToken = generateToken({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.id).toBe(mockUser.id);
      expect(response.body.data.user.email).toBe(mockUser.email);
    });

    it('should return 401 Unauthorized when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Authentication token is missing or invalid');
    });

    it('should return 401 Unauthorized when Bearer token is invalid or expired', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_malformed_token_string');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid or expired authentication token');
    });

    it('should return 404 Not Found if user in token no longer exists in DB', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const validToken = generateToken({
        userId: 'deleted-user-id',
        email: 'deleted@example.com',
        role: 'USER',
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Handling 404 Routes', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app).get('/api/auth/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'fail',
        message: 'Route not found',
      });
    });
  });
});
