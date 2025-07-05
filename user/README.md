# Maintenance Ticketing System

A backend system for tracking maintenance tasks in service locations (airports, restaurants, malls, etc.).

## Features

- Create users
- Get user by id
- User management with different roles (TECHNICIAN, SUPERVISOR, ADMIN)

## API Endpoints

### Users

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/{userId}` - Get a specific user by ID

### User
User model with name, ID, role and timestamps.

### Room
Room model with ID, section, name and floor.
