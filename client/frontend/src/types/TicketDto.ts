export type MediaType =
    | 'photo'
    | 'video'
    | 'audio';

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
}

export type CreateTicketRequest = Omit<TicketDto, 'ticketId' | 'status' >