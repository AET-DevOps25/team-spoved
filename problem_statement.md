# This is an example problem statement

## Problem description
In high-paced service environments such as fast-food restaurants, malls, and airports, staff should be able to report maintenance issues or service needs quickly and intuitively — ideally through natural interactions like speaking or snapping a photo, without interrupting their workflow.

Currently, creating service tickets often requires manual text entry through rigid systems. This is time-consuming, error-prone, and frequently neglected by staff who are occupied with more immediate tasks. As a result, many issues go unreported or are delayed, leading to operational inefficiencies and poor customer experience.

> Is it possible to reduce the effort required in creating tickets by creating a processing system that accepts multimodal data, such as video, images or audio, and autonoumosly creates structured tickets?

## Solution proposal
We propose a modular AI-driven system that enables hands-free, multimodal ticket creation. Using speech-to-text and image-to-text machine learning models, employees can simply describe or photograph a problem. The system will transcribe, interpret, and generate structured service tickets — categorized and prioritized automatically using GenAI.

The system is can be divided in 4 working modules:
1. User interface
2. X-to-Text service
3. GenAI ticket generation service
4. Ticket management service

### 1. User interface
This service is responsible for taking in user input as either voice or images and will forward it
to the relevant conversion service (2).


Features
> Voice input 
> Image input
> Ticket submission + status dashboard
> Authentication

Stack: ReactJS, Selenium, NodeJS

### 2. X-to-Text interface
Converts the input received from the UI to text
- Speech -> text (Whisper API, DeepSpeech, ...)
- Image -> caption (Azure Vision, BLIP, CLIP, ...)

Stack: Python, PyTorch, OpenCV

### 3. GenAI "Service
Receives any text/caption input and structures it into a ticket.

Stack: Python, LangChain, OpenAI API

Example prompt: "Turn this input into a structured service ticket with title, description, category and priority"

### 4. Ticket Management
Functionality
- CRUD for tickets (OpenAPI)
- Tracks ticket status (Open, In Progress, Resolved)
- Persistance Layer through PostgreSQL

All of these services will be dockerized and deployed with Kubernetes. Local development will be 
done with ``docker compose``

## Infrastructure
1. CI/CD through Github Actions
2. Monitoring with Grafana + Prometheus
3. Message Broker with RabbitMQ

