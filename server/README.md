# Maintenance Ticketing System

A backend system for tracking maintenance tasks in service locations (airports, restaurants, malls, etc.).

## Features

- Create and manage maintenance tickets for various service locations
- Track ticket status (OPEN, IN_PROGRESS, SOLVED, CLOSED)
- User management with different roles (TECHNICIAN, SUPERVISOR, ADMIN)
- Room and location tracking with section information

## API Endpoints

### Tickets

- `GET /api/v1/tickets` - Get all tickets
- `GET /api/v1/tickets/{ticketId}` - Get a specific ticket by ID
- `GET /api/v1/tickets/status/{status}` - Get tickets by status
- `GET /api/v1/tickets/user/{userId}` - Get tickets associated with a user
- `POST /api/v1/tickets` - Create a new ticket
- `PUT /api/v1/tickets/{ticketId}/status` - Update ticket status

### Rooms

- `GET /api/v1/rooms` - Get all rooms
- `GET /api/v1/rooms/{roomId}` - Get a specific room by ID

### Users

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/{userId}` - Get a specific user by ID

## Models

### User
User model with name, ID, role and timestamps.

### Room
Room model with ID, section, name and floor.

### Ticket
Ticket model with ID, creator, timestamps, assignees, room details, description and status.