import axios from 'axios';
import type { TicketDto, CreateTicketRequest } from '../types/TicketDto';
import { getAuthHeaders } from './utils';

const BASE_URL = import.meta.env.VITE_SERVER_API_URL + '/tickets';

export const createTicket = async (ticket: CreateTicketRequest): Promise<TicketDto> => {
  const response = await axios.post(BASE_URL, ticket, { headers: getAuthHeaders() });
  return response.data;
};

export const getTicketById = async (id: number): Promise<TicketDto> => {
  const response = await axios.get(`${BASE_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};

export const getTickets = async (): Promise<TicketDto[]> => {
  const response = await axios.get(BASE_URL, { headers: getAuthHeaders() });
  return response.data;
};

// Add support for filtered ticket queries
export const getFilteredTickets = async (filters: {
  assignedToId?: number;
  createdById?: number;
  status?: string;
  dueDate?: string;
  location?: string;
  mediaType?: string;
} = {}): Promise<TicketDto[]> => {
  const params = new URLSearchParams();
  if (filters.assignedToId !== undefined) params.append('assignedToId', filters.assignedToId.toString());
  if (filters.createdById !== undefined) params.append('createdById', filters.createdById.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.dueDate) params.append('dueDate', filters.dueDate);
  if (filters.location) params.append('location', filters.location);
  if (filters.mediaType) params.append('mediaType', filters.mediaType);
  const response = await axios.get(`${BASE_URL}?${params.toString()}`, { headers: getAuthHeaders() });
  return response.data;
};

export const assignWorker = async (ticketId: number, userId: number) => {
  return axios.put(`${BASE_URL}/${ticketId}/assign?userId=${userId}`, {}, { headers: getAuthHeaders() });
};

export const updateTicketStatus = async (ticketId: number, status: string) => {
  return axios.put(`${BASE_URL}/${ticketId}/status?status=${status}`, {}, { headers: getAuthHeaders() });
};