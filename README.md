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

## Local Setup Instructions - No Docker

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

### DB setup
```bash
postgres createuser myuser --superuser
postgres createdb mydatabase -O myuser
PGPASSWORD=mypassword psql -h localhost -U myuser -d mydatabase -f init.sql
```

## Local Setup Instructions - Docker

Use the Docker-Compose file to spin up the
- Client app
- Backend
- Postgres
containers

```docker compose build```

## Development Workflow

### Client Development

- Built with ReactJS and TypeScript for a modern, reactive UI.
- Components and routes are organized in the `src` directory.

### Server Development

- Built with Spring Boot for scalable and maintainable server services.
- Gradle is used for dependency management and building.
- Source code is in the `src/main/java` directory.
- Tests are in the `src/test/java` directory.

### Publishing the code
All tests are ran automatically through the CI pipeline found under ```.github/workflow``` on the ```dev``` branch. If all tests pass,
the build will be published as a package in Github. Then the CD pipeline found under the same directory will
publish it to the AES Cluster.

## Building for Production - No Docker

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

## Building for Production - Docker
Just run
```bash
docker compose up
```

## Deploying in the AES Cluster (Rancher) - First time
To deploy in the AES cluster, it is necessary to obtain the a kubeconfig file with the information on
- Clusters
- Users
- Namespaces
- Authentication

Head to [AES Rancher](https://rancher.ase.cit.tum.de/) and log-in with your TUM-ID. Download the ```student.yaml``` file
and store it as a config in ```~/.kube/```.


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