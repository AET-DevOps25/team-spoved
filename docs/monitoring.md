# Monitoring Metrics Overview

This document details the Prometheus metrics collected by each core service in the Spoved platform.

---

## User Service

| Metric Name                       | Type    | Description                                      |
|------------------------------------|---------|--------------------------------------------------|
| user_create_requests_total         | Counter | Number of user creation requests                  |
| user_get_by_id_requests_total      | Counter | Number of requests to get user by ID              |
| user_get_all_requests_total        | Counter | Number of requests to get all users               |
| user_update_requests_total         | Counter | Number of user update requests                    |
| user_delete_requests_total         | Counter | Number of user delete requests                    |
| user_request_errors_total          | Counter | Number of failed user requests/errors             |

---

## Media Service

| Metric Name                          | Type    | Description                                         |
|---------------------------------------|---------|-----------------------------------------------------|
| media_create_requests_total           | Counter | Number of media creation requests                    |
| media_get_by_id_requests_total        | Counter | Number of requests to get media by ID                |
| media_get_all_requests_total          | Counter | Number of requests to get all media                  |
| media_update_analyzed_requests_total  | Counter | Number of requests to update analyzed status         |
| media_update_result_requests_total    | Counter | Number of requests to update analysis result         |
| media_update_reason_requests_total    | Counter | Number of requests to update analysis reason         |
| media_request_errors_total            | Counter | Number of failed media requests/errors               |

---

## Auth Service

| Metric Name                                 | Type    | Description                                      |
|----------------------------------------------|---------|--------------------------------------------------|
| auth_service.login.requests.total            | Counter | Total number of user login requests              |
| auth_service.login.errors.total              | Counter | Total number of user login errors                |
| auth_service.login.requests.duration         | Timer   | Time taken to login user                        |
| auth_service.registration.requests.total     | Counter | Total number of user registration requests       |
| auth_service.registration.errors.total       | Counter | Total number of user registration errors         |
| auth_service.login.registration.duration     | Timer   | Time taken to registration user                 |

---

## Ticket Service

| Metric Name                              | Type    | Description                                         |
|-------------------------------------------|---------|-----------------------------------------------------|
| ticket_service.tickets.requests.total     | Counter | Total number of ticket requests                      |
| ticket_service.tickets.found              | Counter | Total number of tickets found                        |
| ticket_service.tickets.errors.total       | Counter | Number of errors when fetching tickets               |
| ticket_service.tickets.requests.duration  | Timer   | Time taken to fetch tickets                          |
| ticket_service.assignment.requests.total  | Counter | Total number of ticket assignment requests           |
| ticket_service.assignment.errors.total    | Counter | Total number of ticket assignment errors             |
| ticket_service.assignment.requests.duration| Timer  | Time taken to assign tickets                         |
| ticket_service.creation.requests.total    | Counter | Total number of ticket creation requests             |
| ticket_service.creation.errors.total      | Counter | Total number of ticket creation errors               |
| ticket_service.creation.requests.duration | Timer   | Time taken to create tickets                         |

---

## GenAI Service

| Metric Name                          | Type    | Description                                         |
|---------------------------------------|---------|-----------------------------------------------------|
| genai_speech_to_text_requests_total   | Counter | Number of speech-to-text requests                    |
| genai_text_to_speech_requests_total   | Counter | Number of text-to-speech requests                    |
| genai_query_ai_requests_total         | Counter | Number of AI query requests                          |
| genai_request_errors_total            | Counter | Number of failed GenAI requests/errors               |
| genai_speech_to_text_duration_seconds | Timer   | Duration of speech-to-text requests (seconds)        |
| genai_text_to_speech_duration_seconds | Timer   | Duration of text-to-speech requests (seconds)        |
| genai_query_ai_duration_seconds       | Timer   | Duration of AI query requests (seconds)              |

---

> **Note:** All services expose their metrics at `/actuator/prometheus` (Java) or `/metrics` (Python/GenAI) for Prometheus scraping.
