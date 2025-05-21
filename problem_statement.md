# Ticketing System with GenAI

## Problem description

In fast-paced service environments such as fast-food restaurants, malls, and airports, staff should be able to report maintenance issues or service needs quickly and intuitively — ideally through natural interactions like speaking or snapping a photo, without interrupting their workflow.

Currently, creating service tickets often requires manual text entry through rigid systems. This is time-consuming, error-prone, and frequently neglected by staff who are occupied with more immediate tasks. As a result, many issues go unreported or are delayed, leading to operational inefficiencies and poor customer experience.

> Is it possible to reduce the effort required in creating tickets by creating a processing system that accepts multimodal data, such as video, images or audio, and autonomously creates structured tickets?

## Solution proposal

We propose a modular AI-driven system that enables an effortless multimodal ticket creation. With our ticketing system, users can report maintenance issues via uploading images or via a voice chat system. The system will describe/transcribe, interpret, and generate structured service tickets automatically using GenAI.

### Main functionality

- Fast, automated ticketing management system
- Supports multimodal inputs (image, video, audio, and text)
- Real-time transcription and issue description from voice inputs
- API integration with existing large language models (LLMs) and vision-language models (VLMs)

### Users

- Employees and employers of companies of various sizes that also provide maintenance services


### Role of GenAI

- Analyze the input to generate a meaningful description of the issue
- Extraction of important information that should be stored in the ticket
- Prioritizing and categorizing the tasks that need to be resolved


### Scenarios 

Janitor noticed the stopped escalator of a mall:
- The janitor logs into our app, chooses the option to record a video. Then he records a 10-second video of a stopped escalator and writes, "This escalator has been down since this morning." After the recording has stopped, the janitor sends the information to the system. The system processes the audio and video and identifies the issue. After it finishes, it creates a ticket with the corresponding priority.


Coffee on the floor at the airport:
- In an airport, someone split coffee on the floor. As soon as an employee observes, the employee logs into our application. He/She selects the voice chat system and describes the issue to it. The system transcribes the audio, creates a reasoning and a confidence level and based on that it generates a ticket to the cleaning services.