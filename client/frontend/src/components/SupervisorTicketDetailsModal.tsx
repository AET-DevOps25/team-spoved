// components/SupervisorTicketDetailsModal.tsx
// React
import React, { useState } from "react";
// Dtos
import type { TicketDto } from "../types/TicketDto";
import type { MediaDto } from "../types/MediaDto";
import { updateTicket } from "../api/ticketService";

/**
 * SupervisorTicketDetailsModal component displays the details of a single ticket
 * @param ticket - The ticket to display
 * @param onClose - The function to call when the ticket is closed
 * @returns The SupervisorTicketDetailsModal component
 */
interface SupervisorTicketDetailsModalProps {
  ticket: TicketDto;
  media: MediaDto | null;
  onClose: () => void;
}

/**
 * SupervisorTicketDetailsModal component displays the details of a single ticket
 * @param ticket - The ticket to display
 * @param media - The media to display
 * @param onClose - The function to call when the ticket is closed
 * @returns The SupervisorTicketDetailsModal component
 */
const SupervisorTicketDetailsModal: React.FC<SupervisorTicketDetailsModalProps> = ({ ticket, media, onClose }) => {

  const [isEditing, setIsEditing] = useState(false);
  const [dateError, setDateError] = useState(false);

  const [ticketTitle, setTicketTitle] = useState(ticket.title);
  const [ticketDescription, setTicketDescription] = useState(ticket.description);
  const [ticketDueDate, setTicketDueDate] = useState(ticket.dueDate);
  const [ticketLocation, setTicketLocation] = useState(ticket.location);

  const handleEditTicket = async () => {
    // Check if due date is in the past
    const today = new Date();
    const dueDate = new Date(ticketDueDate);
    
    // Set time to start of day for comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      setDateError(true);
      return; // Don't proceed with save
    }
    
    setDateError(false); // Clear any previous error
    
    // Proceed with save
    await updateTicket(ticket.ticketId, {
      title: ticketTitle,
      description: ticketDescription,
      dueDate: ticketDueDate,
      location: ticketLocation,
      mediaType: ticket.mediaType,
      mediaId: ticket.mediaId
    });
    setIsEditing(false);
    window.location.reload(); // Move reload here after successful save
  };

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

        <div className="mb-6">
          {/* ------------------ Title and description ------------------ */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xl font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input 
                  type="text" 
                  value={ticketTitle} 
                  onChange={(e) => setTicketTitle(e.target.value)} 
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-md shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE]" 
                />
              </div>
              <div>
                <label className="block text-xl font-medium text-gray-700 mb-2">
                  Description
                </label>  
                <input 
                  type="text" 
                  value={ticketDescription} 
                  onChange={(e) => setTicketDescription(e.target.value)} 
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-md shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE]" 
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold">{ticket.title}</h2>
              <p className="text-xl text-gray-600">{ticket.description}</p>
            </div>
          )}
        </div>

        {/* ------------------  Detailed Ticket Information ------------------ */}
        <div className="space-y-4 text-xl text-gray-700">
          {isEditing ? (
            <div>
              <label className="block text-md font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input 
                type="date" 
                value={ticketDueDate} 
                onChange={(e) => {
                  setTicketDueDate(e.target.value);
                  setDateError(false); // Clear error when user starts typing
                }} 
                className={`w-full rounded-md border py-2 px-3 text-md shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE] ${
                  dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {dateError && (
                <p className="text-red-500 text-sm mt-1">
                  Due date cannot be in the past
                </p>
              )}
            </div>
          ) : (
            <p><strong>Due Date:</strong> {new Date(ticket.dueDate).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          )}
          {isEditing ? (
            <div>
              <label className="block text-md font-medium text-gray-700 mb-2">
                Location
              </label>
              <input 
                type="text" 
                value={ticketLocation} 
                onChange={(e) => setTicketLocation(e.target.value)} 
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-md shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE]" 
              />
            </div>
          ) : (
            <p><strong>Location:</strong> {ticket.location}</p>
          )}
          <p><strong>Status:</strong> {
            ticket.status === "OPEN" ? "Open" :
              ticket.status === "FINISHED" ? "Finished" :
                ticket.status === "IN_PROGRESS" ? "In Progress" :
                  "Unknown"
          }</p>

          {/* ------------------ Media ------------------ */}
          {media && (
            <div className="mt-4">
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
              {media.mediaType === "PHOTO" && (
                <img
                  src={`data:${media.blobType};base64,${media.content}`}
                  alt="Ticket media"
                  className="w-full max-w-md h-64 rounded-md object-cover"
                />
              )}
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

          <div className="flex justify-end mt-2 gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={ticket.status === 'FINISHED' || isEditing}
              className="bg-[#1A97FE] text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit Ticket
            </button>

            {isEditing && (
            <button
              onClick={handleEditTicket}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorTicketDetailsModal;