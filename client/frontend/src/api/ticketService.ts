import axios from 'axios';
import type { TicketDto, CreateTicketRequest } from '../types/TicketDto';

const BASE_URL = import.meta.env.VITE_SERVER_API_URL + '/tickets';

export const createTicket = async (ticket: CreateTicketRequest): Promise<TicketDto> => {
  const response = await axios.post(BASE_URL, ticket);
  return response.data;
};

export const getTicketById = async (id: number): Promise<TicketDto> => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const getTickets = async (): Promise<TicketDto[]> => {
  const response = await axios.get(BASE_URL);
  return response.data;
};
export const assignWorker = async (ticketId: number, userId: number) => {
  return axios.put(`${BASE_URL}/${ticketId}/assign?userId=${userId}`)
}
