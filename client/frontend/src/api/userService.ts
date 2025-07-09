import axios from 'axios';
import type { UserDto, LoginUserRequest, RegisterUserRequest } from '../types/UserDto';
import type { Jwt } from '../types/Jwt';
import { getAuthHeaders } from './utils';

// User endpoints
const BASE_URL = import.meta.env.VITE_USER_API_URL + '/users';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL + '/auth';

export const getUsers = async (): Promise<UserDto[]> => {
    const response = await axios.get(BASE_URL, {headers: getAuthHeaders()});
    return response.data;
};

export const getUserById = async (userId: number): Promise<UserDto> => {
    const response = await axios.get(`${BASE_URL}/${userId}`, {headers: getAuthHeaders()});
    return response.data;
};

export const getFilteredUsers = async (role?: string, name?: string, id?: number): Promise<UserDto[]> => {
const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (name) params.append('name', name);
    if (id !== undefined) params.append('id', id.toString());
    const response = await axios.get(`${BASE_URL}?${params.toString()}`, {headers: getAuthHeaders()});
    
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((user: UserDto) => ({
        userId: user.userId,
        name: user.name,
        role: user.role,
        password: ""
    }));
};

export const loginUser = async (credentials: LoginUserRequest): Promise<Jwt> => {
  try {
    const response = await axios.post(
      `${AUTH_BASE_URL}/login`,
      credentials,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error('Login failed');
  }
};

export const registerUser = async (credentials : RegisterUserRequest): Promise<string> => {
    try {
        const response = await axios.post(
            `${AUTH_BASE_URL}/register`,
            credentials,
            { headers : {"Content-Type" : "application/json"}}
        )
        return response.data;
    } catch (error) {
        console.error("Registration failed", error);
        throw new Error("Registration failed");
    }
}