# Spoved App Helm Chart

This Helm chart deploys the Spoved App application consisting of a server and client component.

## Prerequisites

- Kubernetes 1.16+
- Helm 3.0+
- Ingress Controller (like nginx-ingress or traefik)

## Installing the Chart

To install the chart with the release name `spoved`:

```bash
helm install spoved ./helm/spoved-app -n spoved
```

## Uninstalling the Chart

To uninstall/delete the `spoved` release:

```bash
helm uninstall spoved -n spoved
```

## Parameters

### Global Parameters

| Name                   | Description                                | Value           |
|------------------------|--------------------------------------------|-----------------|
| `namespace.create`     | Create the namespace                       | `false`         |
| `namespace.name`       | Namespace to use for the application       | `spoved`        |

### Client Parameters

| Name                       | Description                                | Value                                          |
|----------------------------|--------------------------------------------|------------------------------------------------|
| `client.image.repository`  | Client image repository                    | `ghcr.io/aet-devops25/team-spoved/client`      |
| `client.image.tag`         | Client image tag                           | `latest`                                       |
| `client.image.pullPolicy`  | Client image pull policy                   | `Always`                                       |
| `client.service.type`      | Client service type                        | `NodePort`                                     |
| `client.service.port`      | Client service port                        | `3000`                                         |
| `client.service.targetPort`| Client container port                      | `3000`                                         |
| `client.service.nodePort`  | Client node port                           | `3000`                                        |
| `client.replicaCount`      | Number of client replicas                  | `1`                                            |
| `client.apiUrl`            | API URL for the client to connect to       | `http://localhost:3000`                       |

### Auth Service Parameters

| Name                        | Description                                 | Value                                         |
|-----------------------------|---------------------------------------------|-----------------------------------------------|
| `auth.image.repository`     | Auth image repository                       | `ghcr.io/aet-devops25/team-spoved/auth`       |
| `auth.image.tag`            | Auth image tag                              | `dev`                                         |
| `auth.image.pullPolicy`     | Auth image pull policy                      | `Always`                                      |
| `auth.service.type`         | Auth service type                           | `ClusterIP`                                   |
| `auth.service.port`         | Auth service port                           | `8081`                                        |
| `auth.service.targetPort`   | Auth container port                         | `8081`                                        |
| `auth.replicaCount`         | Number of auth replicas                     | `1`                                           |
| `auth.env`                  | Auth environment variables                  | See `values.yaml` for defaults                |

### User Service Parameters

| Name                        | Description                                 | Value                                         |
|-----------------------------|---------------------------------------------|-----------------------------------------------|
| `user.image.repository`     | User image repository                       | `ghcr.io/aet-devops25/team-spoved/user`       |
| `user.image.tag`            | User image tag                              | `dev`                                         |
| `user.image.pullPolicy`     | User image pull policy                      | `Always`                                      |
| `user.service.type`         | User service type                           | `ClusterIP`                                   |
| `user.service.port`         | User service port                           | `8082`                                        |
| `user.service.targetPort`   | User container port                         | `8082`                                        |
| `user.replicaCount`         | Number of user replicas                     | `1`                                           |
| `user.env`                  | User environment variables                  | See `values.yaml` for defaults                |

### Ticket Service Parameters

| Name                        | Description                                 | Value                                         |
|-----------------------------|---------------------------------------------|-----------------------------------------------|
| `ticket.image.repository`   | Ticket image repository                     | `ghcr.io/aet-devops25/team-spoved/ticket`     |
| `ticket.image.tag`          | Ticket image tag                            | `dev`                                         |
| `ticket.image.pullPolicy`   | Ticket image pull policy                    | `Always`                                      |
| `ticket.service.type`       | Ticket service type                         | `ClusterIP`                                   |
| `ticket.service.port`       | Ticket service port                         | `8083`                                        |
| `ticket.service.targetPort` | Ticket container port                       | `8083`                                        |
| `ticket.replicaCount`       | Number of ticket replicas                   | `1`                                           |
| `ticket.env`                | Ticket environment variables                | See `values.yaml` for defaults                |

### Media Service Parameters

| Name                        | Description                                 | Value                                         |
|-----------------------------|---------------------------------------------|-----------------------------------------------|
| `media.image.repository`    | Media image repository                      | `ghcr.io/aet-devops25/team-spoved/media`      |
| `media.image.tag`           | Media image tag                             | `dev`                                         |
| `media.image.pullPolicy`    | Media image pull policy                     | `Always`                                      |
| `media.service.type`        | Media service type                          | `ClusterIP`                                   |
| `media.service.port`        | Media service port                          | `8084`                                        |
| `media.service.targetPort`  | Media container port                        | `8084`                                        |
| `media.replicaCount`        | Number of media replicas                    | `1`                                           |
| `media.env`                 | Media environment variables                 | See `values.yaml` for defaults                |

### GenAI Service Parameters

| Name                        | Description                                 | Value                                         |
|-----------------------------|---------------------------------------------|-----------------------------------------------|
| `genai.image.repository`    | GenAI image repository                      | `ghcr.io/aet-devops25/team-spoved/genai`      |
| `genai.image.tag`           | GenAI image tag                             | `dev`                                         |
| `genai.image.pullPolicy`    | GenAI image pull policy                     | `Always`                                      |
| `genai.service.type`        | GenAI service type                          | `ClusterIP`                                   |
| `genai.service.port`        | GenAI service port                          | `8085`                                        |
| `genai.service.targetPort`  | GenAI container port                        | `8085`                                        |
| `genai.replicaCount`        | Number of genai replicas                    | `1`                                           |
| `genai.env`                 | GenAI environment variables                 | See `values.yaml` for defaults                |