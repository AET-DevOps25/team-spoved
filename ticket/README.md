# Maintenance Ticketing System

A backend system for tracking maintenance tasks in service locations (airports, restaurants, malls, etc.).

## Features

- Create and manage maintenance tickets for various service locations
- Track ticket status (OPEN, IN_PROGRESS, SOLVED, CLOSED)
- User management with different roles (TECHNICIAN, SUPERVISOR, ADMIN)
- Room and location tracking with section information

## API Endpoints

### Tickets

- `GET /tickets` - Get all tickets
- `GET /tickets/{ticketId}` - Get a specific ticket by ID
- `GET /tickets/status/{status}` - Get tickets by status
- `GET /tickets/user/{userId}` - Get tickets associated with a user
- `POST /tickets` - Create a new ticket
- `PUT /tickets/{ticketId}/status` - Update ticket status

### Rooms

- `GET /rooms` - Get all rooms
- `GET /rooms/{roomId}` - Get a specific room by ID

### Users

- `GET /users` - Get all users
- `GET /users/{userId}` - Get a specific user by ID

## Models

### User
User model with name, ID, role and timestamps.

### Room
Room model with ID, section, name and floor.

### Ticket
Ticket model with ID, creator, timestamps, assignees, room details, description and status.