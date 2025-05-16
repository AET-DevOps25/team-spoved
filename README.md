# AI-powered Ticketing Service
This is project done in the context of the lecture "DevOps: Engineering for Deployment and Operations".
It aims to apply DevOps practices, along with Software Engineering practices in a secure learning environment.

## Project Overview

This project includes:
- **Client**: ReactJS with TypeScript, NodeJs, and reusable UI components.
- **Server**: Spring Boot Java application with RESTful APIs.
- **DevOps**: Dockerized services, CI/CD pipelines, and production-ready deployment configurations.

A more detailed overview of the problem we're trying to solve can be found in the [problem statement](problem_statement.md). For an architectural
overview, refer to the [system description](system_description.md).

![systemdesign](sysdesign.jpg)

## Prerequisites

- Node.js (v22 or later)
- Java JDK 21+
- Gradle
- Docker and Docker Compose
- Git

## Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/AET-DevOps25/team-spoved
cd team-spoved
```

### Client Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Server Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Build the project:
   ```bash
   ./gradlew build
   ```

## Running the Application

### Start the Client

```bash
cd client
npm run dev
```
The client will be available at [http://localhost:3000](http://localhost:3000).

### Start the Server

```bash
cd server
./gradlew bootRun
```
The server API will be available at [http://localhost:8080](http://localhost:8080).

## Development Workflow

### Client Development

- Built with ReactJS and TypeScript for a modern, reactive UI.
- Components and routes are organized in the `src` directory.

### Server Development

- Built with Spring Boot for scalable and maintainable server services.
- Gradle is used for dependency management and building.
- Source code is in the `src/main/java` directory.
- Tests are in the `src/test/java` directory.

## Building for Production

### Client Build

```bash
cd client
npm run build
```

### Server Build

```bash
cd server
./gradlew clean build
```


## Project Structure

```
├── client/                  # ReactJS client
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   └── package.json         # Client dependencies
│
└── server/                  # Spring Boot server
    ├── src/                 # Source code
    ├── build.gradle         # Gradle build file
    └── Dockerfile           # Server Dockerfile
```

## License

This project is licensed under the MIT License.