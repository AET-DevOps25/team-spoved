import axios from 'axios';
import type { UserDto } from '../types/UserDto';

// User endpoints
const BASE_URL = import.meta.env.VITE_SERVER_API_URL + '/users';

export const getUsers = async (): Promise<UserDto[]> => {
    const response = await axios.get(BASE_URL);
    return response.data;
};

export const getUserById = async (userId: number): Promise<UserDto> => {
    const response = await axios.get(`${BASE_URL}/${userId}`);
    return response.data;
};

export const getAllUsers = async (supervisor?: string, name?: string): Promise<UserDto[]> => {
    const params = new URLSearchParams();
    if (supervisor) params.append('supervisor', supervisor);
    if (name) params.append('name', name);
  
    const response = await axios.get(`${BASE_URL}/filtered?${params.toString()}`);
    return response.data;
  };