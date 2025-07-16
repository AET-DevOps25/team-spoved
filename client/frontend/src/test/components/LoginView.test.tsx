import { vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import LoginView from '../../views/LoginView';

// Mock jwt-decode BEFORE the component under test is imported
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ role: 'WORKER', exp: Date.now() / 1000 + 3600 }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LoginView Component Tests', () => {
  let mockAxios: MockAdapter;
  const user = userEvent.setup();

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should render login form correctly', () => {
    renderWithRouter(<LoginView />);

    expect(screen.getByText('SPOVED')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Login'})).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('should show error when trying to login without username and password', async () => {
    renderWithRouter(<LoginView />);

    const loginButton = screen.getByRole('button', { name: 'Login' });
    expect(loginButton).toBeDisabled();
  });

  it('should show error when fields are empty and user clicks login', async () => {
    renderWithRouter(<LoginView />);

    const loginButton = screen.getByRole('button', { name: 'Login' });
    
    // Enable button by adding some text then removing it
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    await user.type(usernameInput, 'test');
    await user.type(passwordInput, 'test');
    await user.clear(usernameInput);
    await user.clear(passwordInput);
    
    expect(loginButton).toBeDisabled();
  });

  it('should handle successful login with existing user and correct credentials', async () => {
    const mockJwt = { token: 'mock.jwt.token' };
    const mockUser = { userId: 1, name: 'testuser', role: 'WORKER', password: '' };

    mockAxios.onPost('http://localhost:8030/auth/login')
      .reply(200, mockJwt);
    
    mockAxios.onGet('http://localhost:8082/users?role=WORKER&name=testuser')
      .reply(200, [mockUser]);

    renderWithRouter(<LoginView />);

    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: 'Login' });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('jwt', 'mock.jwt.token');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('name', 'testuser');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', '1');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('role', 'WORKER');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('name', 'testuser');
    });
  });

  it('should handle login failure with incorrect credentials', async () => {
    mockAxios.onPost('http://localhost:8030/auth/login')
      .reply(401, { message: 'Invalid credentials' });

    renderWithRouter(<LoginView />);

    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: 'Login' });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should handle auth service down', async () => {
    mockAxios.onPost('http://localhost:8030/auth/login')
      .networkError();

    renderWithRouter(<LoginView />);

    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: 'Login' });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
    });
  });
});