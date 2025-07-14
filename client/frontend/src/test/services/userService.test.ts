import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { loginUser, registerUser } from '../../api/userService';
import type { LoginUserRequestTest, RegisterUserRequest } from '../../types/UserDto';

describe('UserService Tests', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jest.clearAllMocks();
    (window.sessionStorage.getItem as jest.Mock).mockClear();
    (window.sessionStorage.setItem as jest.Mock).mockClear();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Login Scenarios', () => {
    const validCredentials: LoginUserRequestTest = {
      name: 'testuser',
      password: 'password123'
    };

    const invalidCredentials: LoginUserRequestTest = {
      name: 'testuser',
      password: 'wrongpassword'
    };

    const nonExistentUser: LoginUserRequestTest = {
      name: 'nonexistent',
      password: 'password123'
    };

    it('should successfully login with existing user and correct credentials', async () => {
      const mockJwt = { token: 'mock.jwt.token' };
      
      mockAxios.onPost('http://localhost:8030/auth/login')
        .reply(200, mockJwt);

      const result = await loginUser(validCredentials);

      expect(result).toEqual(mockJwt);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe('http://localhost:8030/auth/login');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(validCredentials);
    });

    it('should fail login without existing user', async () => {
      mockAxios.onPost('http://localhost:8030/auth/login')
        .reply(404, { message: 'User not found' });

      await expect(loginUser(nonExistentUser)).rejects.toThrow('Login failed');
    });

    it('should fail login with existing user and incorrect credentials', async () => {
      mockAxios.onPost('http://localhost:8030/auth/login')
        .reply(401, { message: 'Invalid credentials' });

      await expect(loginUser(invalidCredentials)).rejects.toThrow('Login failed');
    });

    it('should handle auth service down', async () => {
      mockAxios.onPost('http://localhost:8030/auth/login')
        .networkError();

      await expect(loginUser(validCredentials)).rejects.toThrow('Login failed');
    });
  });

  describe('Register Scenarios', () => {
    const newUser: RegisterUserRequest = {
      name: 'newuser',
      password: 'password123',
      role: 'WORKER'
    };

    const existingUser: RegisterUserRequest = {
      name: 'existinguser',
      password: 'password123',
      role: 'WORKER'
    };

    it('should successfully register a new user', async () => {
      const mockResponse = 'User registered successfully';
      
      mockAxios.onPost('http://localhost:8030/auth/register')
        .reply(201, mockResponse);

      const result = await registerUser(newUser);

      expect(result).toBe(mockResponse);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe('http://localhost:8030/auth/register');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(newUser);
    });

    it('should fail to register with existing user', async () => {
      mockAxios.onPost('http://localhost:8030/auth/register')
        .reply(409, { message: 'User already exists' });

      await expect(registerUser(existingUser)).rejects.toThrow('Registration failed');
    });

    it('should handle auth service down during registration', async () => {
      mockAxios.onPost('http://localhost:8030/auth/register')
        .networkError();

      await expect(registerUser(newUser)).rejects.toThrow('Registration failed');
    });
  });
});
