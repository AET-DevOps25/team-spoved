
# System Overview to Architecture

## Technical Solution

The system can be divided in 4 working modules:
1. Client
2. Server
3. GenAI
4. Database

### 1. Client

This service is responsible for taking in user input as either voice or images and will forward it to the relevant conversion service. It provides the frontend of the project.

**Features:**
- Voice input
- Image input
- Ticket submission + status dashboard
- Authentication

**Tech Stack:** React, NodeJS, Typescript


### 2. Server

**Features:**
- CRUD for tickets (OpenAPI)
- Tracks ticket status (Open, In Progress, Resolved)
- Persistence  Layer through PostgreSQL

All of these services will be dockerized and deployed with Kubernetes. Local development will be done with ``Docker Compose``

**Tech stack**: Spring Boot


### 3. GenAI Service

Receives any text/caption input, process the input, analyze it and structures it into an output for a ticket.

**Feature:**
- Turning the voice description into a ticket
- Media analysis for completed tickets

**Tech Stack:** Python, LangChain, OpenAI API, Google Cloud Speech-to-Text


### 4. Database
 
It includes all the tables for the project.

**Tech Stack:** PostgresSQL


## Infrastructure

1. CI/CD through Github Actions
2. Monitoring with Grafana + Prometheus

## System Modelling
To better understand how the entities and service interactions are going to look like, we first derived an **Use Case Diagram**, with 8 common user flows. This diagram can be found below.

### Use Case Diagram

![Alt text](./resources/use_case_diagram.png)

### Class Diagram
From this, we identified the entities required for persisting the data generated during the user flows. We see *Worker*, *Supervisor*, *Ticket* and *Media*.

![Alt text](./resources/class_diagram.png)

### Component Diagram
Lastly, we specified the interfaces of the services required to fulfill the functional requirements identified in the user case diagram.

![Alt text](./resources/component%20diagram.png)

## Backlog

| Task ID | Task Description                              | Feature                             |
|---------|-----------------------------------------------|-------------------------------------|
| 1       | Design low-fidelity UI mockups                | Ticket submission dashboard, Auth UI |
| 2       | Initialize React project with Typescript      | Client frontend setup               |
| 3       | Create user authentication module (basic)     | User Authentication                 |
| 4       | Set up PostgreSQL schema for Users and Tickets| User & Ticket data persistence      |
| 5       | Set up Spring Boot server skeleton            | CRUD for tickets, API base          |



