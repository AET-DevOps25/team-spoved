# Database Structure

This PostgreSQL database is designed for a ticketing system with media attachments and user role management.

## Schema Overview

The database uses a custom schema `db` with the following structure:

## Tables

### `db.users`
User management with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | SERIAL | PRIMARY KEY | Auto-incrementing user identifier |
| `name` | VARCHAR(50) | NOT NULL | User's display name |
| `role` | VARCHAR | NOT NULL | User role (originally ENUM: 'SUPERVISOR', 'WORKER') |
| `password_hash` | VARCHAR(100) | NOT NULL | Hashed password for authentication |

### `db.media`
Storage for multimedia content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `media_id` | SERIAL | PRIMARY KEY | Auto-incrementing media identifier |
| `media_type` | VARCHAR | NOT NULL | Type of media (originally ENUM: 'PHOTO', 'VIDEO', 'AUDIO') |
| `content` | BYTEA | NOT NULL | Binary media content |
| `blob_type` | VARCHAR(100) | NOT NULL | MIME type or file format |

### `db.tickets`
Main ticketing system with assignments and status tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `ticket_id` | SERIAL | PRIMARY KEY | Auto-incrementing ticket identifier |
| `assigned_to` | INTEGER | Foreign key to `users(user_id)` ON DELETE RESTRICT | User assigned to handle the ticket |
| `created_by` | INTEGER | Foreign key to `users(user_id)` ON DELETE RESTRICT, NOT NULL | User who created the ticket |
| `title` | VARCHAR(999) | NOT NULL, DEFAULT 'New Ticket' | Ticket title |
| `description` | VARCHAR(999) | NOT NULL, DEFAULT 'Description of the ticket' | Detailed description |
| `status` | VARCHAR | NOT NULL, DEFAULT 'OPEN' | Current status (originally ENUM: 'FINISHED', 'IN_PROGRESS', 'OPEN') |
| `due_date` | DATE | NOT NULL, CHECK (due_date >= CURRENT_DATE) | Deadline for ticket completion |
| `location` | VARCHAR(999) | NOT NULL | Physical or logical location |
| `media_type` | VARCHAR | NOT NULL, DEFAULT 'PHOTO' | Expected media type for this ticket |
| `media_id` | INTEGER | Foreign key to `media(media_id)` ON DELETE RESTRICT | Associated media file |

### `db.video_photo`
Analysis results for visual media (photos and videos).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `media_id` | INTEGER | PRIMARY KEY, Foreign key to `media(media_id)` ON DELETE RESTRICT | Reference to analyzed media |
| `analyzed` | BOOLEAN | DEFAULT false | Whether AI analysis has been completed |
| `result` | VARCHAR(999) | DEFAULT 'No result available' | Analysis results |
| `reason` | VARCHAR(999) | DEFAULT 'No reasoning available' | Explanation of analysis |

## Enums

Originally defined as PostgreSQL ENUMs but converted to VARCHAR for flexibility:

- **Role**: `'SUPERVISOR'`, `'WORKER'`
- **Status**: `'FINISHED'`, `'IN_PROGRESS'`, `'OPEN'`
- **Media Type**: `'PHOTO'`, `'VIDEO'`, `'AUDIO'`

## Foreign Key Relationships

```
users (1) ←→ (N) tickets [assigned_to]
users (1) ←→ (N) tickets [created_by]
media (1) ←→ (0..1) tickets [media_id]
media (1) ←→ (0..1) video_photo [media_id]
```

## Key Constraints

- **Users cannot be deleted** if they have assigned or created tickets
- **Media cannot be deleted** if referenced by tickets or analysis records
- **Due dates** must be in the future or today
- **Cascading deletes** are prevented to maintain data integrity

## Database Configuration

- **Name of the database**: `db`
- **User**: `spoved`
- **Port**: `5432` (standard PostgreSQL)

## Testing

The database includes pgTAP tests in [`database/tests/schema_test.sql`](database/tests/schema_test.sql) that verify:
- Valid user insertion
- Enum validation (legacy)
- Foreign key constraint enforcement
- Referential integrity on deletions

## Usage with Docker

```bash
# From the root of the repository run
docker compose up --build -d database
```

The initialization script [`init.sql`](database/init.sql) creates the schema, tables, and sample entries.