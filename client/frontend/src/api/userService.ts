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

export const getFilteredUsers = async (role?: string, name?: string, id?: number): Promise<UserDto[]> => {
const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (name) params.append('name', name);
    if (id !== undefined) params.append('id', id.toString());
    const response = await axios.get(`${BASE_URL}?${params.toString()}`);
    
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((user: any) => ({
        userId: user.userId,
        name: user.name,
        role: user.role
    }));
};