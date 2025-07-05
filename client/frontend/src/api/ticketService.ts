import axios from 'axios';
import type { TicketDto, CreateTicketRequest, UpdateTicketRequest } from '../types/TicketDto';
import { getAuthHeaders } from './utils';

const BASE_URL = import.meta.env.VITE_TICKET_API_URL + '/tickets';

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
  assignedTo?: number;
  createdBy?: number;
  status?: string;
  dueDate?: string;
  location?: string;
  mediaType?: string;
} = {}): Promise<TicketDto[]> => {
  const params = new URLSearchParams();
  if (filters.assignedTo !== undefined) params.append('assignedTo', filters.assignedTo.toString());
  if (filters.createdBy !== undefined) params.append('createdBy', filters.createdBy.toString());
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

export const updateTicket = async (ticketId: number, ticket: UpdateTicketRequest) => {
  return axios.put(`${BASE_URL}/${ticketId}/update`, ticket, { headers: getAuthHeaders() });
};