import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import RegisterView from '../../views/RegisterView';
import { vi } from 'vitest';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('RegisterView Component Tests', () => {
  let mockAxios: MockAdapter;
  const user = userEvent.setup();

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should successfully register a new user', async () => {
    mockAxios.onPost('http://localhost:8030/auth/register')
      .reply(201, 'User registered successfully');

    renderWithRouter(<RegisterView />);

    const nameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const roleSelect = screen.getByRole('combobox');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await user.type(nameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.selectOptions(roleSelect, 'WORKER');
    await user.click(registerButton);

    await waitFor(() => {
      expect(mockAxios.history.post).toHaveLength(1);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        name: 'newuser',
        password: 'password123',
        role: 'WORKER'
      });
    });
  });

  it('should handle registration failure with existing user', async () => {
    mockAxios.onPost('http://localhost:8030/auth/register')
      .reply(409, { message: 'User already exists' });

    renderWithRouter(<RegisterView />);

    const nameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const roleSelect = screen.getByRole('combobox');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await user.type(nameInput, 'existinguser');
    await user.type(passwordInput, 'password123');
    await user.selectOptions(roleSelect, 'WORKER');
    await user.click(registerButton);

    await waitFor(() => {
      // Check for error message in the UI (this will depend on your RegisterView implementation)
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  it('should handle auth service down during registration', async () => {
    mockAxios.onPost('http://localhost:8030/auth/register')
      .networkError();

    renderWithRouter(<RegisterView />);

    const nameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const roleSelect = screen.getByRole('combobox');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await user.type(nameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.selectOptions(roleSelect, 'WORKER');
    await user.click(registerButton);

    await waitFor(() => {
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });
}); 