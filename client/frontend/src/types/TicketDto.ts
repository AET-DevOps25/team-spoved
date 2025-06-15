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
    assignedTo: number | null;
    createdBy: number;
    title: string;
    description: string;
    status: Status;
    dueDate: string;
    location: string;
    mediaType: MediaType;
    mediaId: number | null;
}

export type CreateTicketRequest = Omit<TicketDto, 'ticketId' | 'status' >