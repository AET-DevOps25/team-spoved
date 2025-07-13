import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { 
  createTicket, 
  getTickets, 
  getFilteredTickets, 
  assignWorker, 
} from '../../api/ticketService';
import type { TicketDto, CreateTicketRequest } from '../../types/TicketDto';


describe('TicketService Tests', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jest.clearAllMocks();
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue('mock.jwt.token');
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Ticket Visualization (Worker)', () => {
    const mockWorkerTickets: TicketDto[] = [
      {
        ticketId: 1,
        assignedTo: 1,
        createdBy: 2,
        title: 'Worker Task 1',
        description: 'Description for worker task 1',
        status: 'IN_PROGRESS',
        dueDate: '2024-02-01',
        location: 'Location A',
        mediaType: 'PHOTO',
        mediaId: 1
      },
      {
        ticketId: 2,
        assignedTo: 1,
        createdBy: 2,
        title: 'Worker Task 2',
        description: 'Description for worker task 2',
        status: 'OPEN',
        dueDate: '2024-02-02',
        location: 'Location B',
        mediaType: 'VIDEO',
        mediaId: 2
      }
    ];

    it('should handle when there are no assigned tickets for worker', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets?assignedTo=1')
        .reply(200, []);

      const result = await getFilteredTickets({ assignedTo: 1 });

      expect(result).toEqual([]);
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should handle when there are some assigned tickets for worker', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets?assignedTo=1')
        .reply(200, mockWorkerTickets);

      const result = await getFilteredTickets({ assignedTo: 1 });

      expect(result).toEqual(mockWorkerTickets);
      expect(result).toHaveLength(2);
      expect(result.every(ticket => ticket.assignedTo === 1)).toBe(true);
    });

    it('should handle ticket service down for worker', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets?assignedTo=1')
        .networkError();

      await expect(getFilteredTickets({ assignedTo: 1 })).rejects.toThrow();
    });
  });

  describe('Ticket Visualization (Supervisor)', () => {
    const mockOpenTickets: TicketDto[] = [
      {
        ticketId: 1,
        assignedTo: null,
        createdBy: 2,
        title: 'Open Task 1',
        description: 'Description for open task 1',
        status: 'OPEN',
        dueDate: '2024-02-01',
        location: 'Location A',
        mediaType: 'PHOTO',
        mediaId: 1
      }
    ];

    const mockToReviewTickets: TicketDto[] = [
      {
        ticketId: 2,
        assignedTo: 1,
        createdBy: 2,
        title: 'Finished Task',
        description: 'Description for finished task',
        status: 'FINISHED',
        dueDate: '2024-02-01',
        location: 'Location B',
        mediaType: 'VIDEO',
        mediaId: 2
      }
    ];

    it('should handle when there are no open tickets for supervisor', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets?status=OPEN')
        .reply(200, []);

      const result = await getFilteredTickets({ status: 'OPEN' });

      expect(result).toEqual([]);
    });

    it('should handle when there are some open tickets for supervisor', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets?status=OPEN')
        .reply(200, mockOpenTickets);

      const result = await getFilteredTickets({ status: 'OPEN' });

      expect(result).toEqual(mockOpenTickets);
      expect(result.every(ticket => ticket.status === 'OPEN')).toBe(true);
    });

    it('should handle when there are no to-review tickets for supervisor', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets?status=FINISHED')
        .reply(200, []);

      const result = await getFilteredTickets({ status: 'FINISHED' });

      expect(result).toEqual([]);
    });

    it('should handle when there are some to-review tickets for supervisor', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets?status=FINISHED')
        .reply(200, mockToReviewTickets);

      const result = await getFilteredTickets({ status: 'FINISHED' });

      expect(result).toEqual(mockToReviewTickets);
      expect(result.every(ticket => ticket.status === 'FINISHED')).toBe(true);
    });

    it('should handle ticket service down for supervisor', async () => {
      mockAxios.onGet('http://localhost:8081/api/v1/tickets')
        .networkError();

      await expect(getTickets()).rejects.toThrow();
    });
  });

  describe('Ticket Creation', () => {
    const mockTicketRequest: CreateTicketRequest = {
      assignedTo: 1,
      createdBy: 2,
      title: 'New Ticket',
      description: 'Description for new ticket',
      dueDate: '2024-02-01',
      location: 'Location A',
      mediaType: 'PHOTO',
      mediaId: 1
    };

    const mockCreatedTicket: TicketDto = {
      ticketId: 1,
      ...mockTicketRequest,
      status: 'OPEN'
    };

    it('should successfully create a new ticket', async () => {
      mockAxios.onPost('http://localhost:8081/api/v1/tickets')
        .reply(201, mockCreatedTicket);

      const result = await createTicket(mockTicketRequest);

      expect(result).toEqual(mockCreatedTicket);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(mockTicketRequest);
    });

    it('should handle ticket creation failure', async () => {
      mockAxios.onPost('http://localhost:8081/api/v1/tickets')
        .reply(400, { message: 'Invalid ticket data' });

      await expect(createTicket(mockTicketRequest)).rejects.toThrow();
    });

    it('should handle ticket service down during creation', async () => {
      mockAxios.onPost('http://localhost:8081/api/v1/tickets')
        .networkError();

      await expect(createTicket(mockTicketRequest)).rejects.toThrow();
    });
  });

  describe('Ticket Assignment', () => {
    it('should successfully assign worker to ticket', async () => {
      mockAxios.onPut('http://localhost:8081/api/v1/tickets/1/assign?userId=1')
        .reply(200, { message: 'Worker assigned successfully' });

      const result = await assignWorker(1, 1);

      expect(result.status).toBe(200);
      expect(mockAxios.history.put).toHaveLength(1);
      expect(mockAxios.history.put[0].url).toBe('http://localhost:8081/api/v1/tickets/1/assign?userId=1');
    });

    it('should handle assignment failure', async () => {
      mockAxios.onPut('http://localhost:8081/api/v1/tickets/1/assign?userId=1')
        .reply(404, { message: 'Ticket or user not found' });

      await expect(assignWorker(1, 1)).rejects.toThrow();
    });

    it('should handle ticket service down during assignment', async () => {
      mockAxios.onPut('http://localhost:8081/api/v1/tickets/1/assign?userId=1')
        .networkError();

      await expect(assignWorker(1, 1)).rejects.toThrow();
    });
  });
}); 