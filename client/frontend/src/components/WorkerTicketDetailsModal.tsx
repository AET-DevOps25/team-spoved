// components/WorkerTicketDetailsModal.tsx
// React
import React from "react";
// Dtos
import type { TicketDto } from "../types/TicketDto";
import type { MediaDto } from "../types/MediaDto";

/**
 * WorkerTicketDetailsModal component displays the details of a single ticket
 * @param ticket - The ticket to display
 * @param media - The media to display
 * @param onClose - The function to call when the ticket is closed
 * @returns The WorkerTicketDetailsModal component
 */
interface WorkerTicketDetailsModalProps {
  ticket: TicketDto;
  media: MediaDto | null;
  onClose: () => void;
}

/**
 * WorkerTicketDetailsModal component displays the details of a single ticket
 * @param ticket - The ticket to display
 * @param media - The media to display
 * @param onClose - The function to call when the ticket is closed
 * @returns The WorkerTicketDetailsModal component
 */
const WorkerTicketDetailsModal: React.FC<WorkerTicketDetailsModalProps> = ({ ticket, media, onClose }) => {


  // ------------------------ JSX: Ticket Details Modal Layout ------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">

      <div className="bg-white bg-opacity-100 backdrop-blur rounded-lg shadow-2xl max-w-2xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          &times;
        </button>

        <div className="flex items-center gap-6 mb-6">
          {/* ------------------ Title and description ------------------ */}
          <div>
            <h2 className="text-2xl font-bold">{ticket.title}</h2>
            <p className="text-xl text-gray-600">{ticket.description}</p>
          </div>
        </div>

        {/* ------------------  Detailed Ticket Information ------------------ */}
        <div className="space-y-2 text-xl text-gray-700">
          <p><strong>Status:</strong> {
            ticket.status === "OPEN" ? "Open" :
              ticket.status === "FINISHED" ? "Finished" :
                ticket.status === "IN_PROGRESS" ? "In Progress" :
                  "Unknown"
          }</p>
          <p><strong>Due Date:</strong> {new Date(ticket.dueDate).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p><strong>Location:</strong> {ticket.location}</p>
          {/*<p><strong>Media Type:</strong> {ticket.mediaType?.charAt(0).toUpperCase() + ticket.mediaType?.slice(1)}</p>*/}

          {/* ------------------ Media ------------------ */}
          {media && (
            <div className="mt-4">
              {/* ------------------ Video ------------------ */}
              {media.mediaType === "VIDEO" && (
                <video
                  src={`data:${media.blobType};base64,${media.content}`}
                  controls
                  autoPlay
                  className="w-full max-w-md h-64 rounded-md object-cover"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {/* ------------------ Photo ------------------ */}
              {media.mediaType === "PHOTO" && (
                <img
                  src={`data:${media.blobType};base64,${media.content}`}
                  alt="Ticket media"
                  className="w-full max-w-md h-64 rounded-md object-cover"
                />
              )}

              {/* ------------------ Audio ------------------ */}
              {media.mediaType === "AUDIO" && (
                <audio
                  src={`data:${media.blobType};base64,${media.content}`}
                  controls
                  className="w-full max-w-md"
                >
                  Your browser does not support the audio tag.
                </audio>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerTicketDetailsModal;