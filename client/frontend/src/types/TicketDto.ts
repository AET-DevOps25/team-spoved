import type { UserDto } from "./UserDto";

export type MediaType =
    | 'PHOTO'
    | 'VIDEO'
    | 'AUDIO';

export type Status =
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'FINISHED';

export interface TicketDto {
    ticketId: number;
    assignedTo: UserDto | null;
    createdBy: UserDto;
    title: string;
    description: string;
    status: Status;
    dueDate: string;
    location: string;
    mediaType: MediaType;
    mediaId: number | null;
}


export interface CreateTicketRequest {
    assignedTo: number | null;
    createdBy: number;
    title: string;
    description: string;
    dueDate: string;
    location: string;
    mediaType: MediaType;
    mediaId: number | null;
}

export interface UpdateTicketRequest {
    title: string;
    description: string;
    dueDate: string;
    location: string;
    mediaType: MediaType;
    mediaId: number | null;
}