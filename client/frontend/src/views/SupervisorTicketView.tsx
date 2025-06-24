// This view is the top-level view that renders
// the application from the supervisor's POV.
import { useEffect, useState } from "react";
import type { CreateTicketRequest, TicketDto } from "../types/TicketDto";
import { getTickets, createTicket, assignWorker } from "../api/ticketService";

import SupervisorTicketCard from "../components/SupervisorTicketCard";
import CreateTicketModal from "../components/CreateTicketModal";
import SupervisorTicketDetailsModal from "../components/SupervisorTicketDetailsModal";

import newDesign from "../assets/image_no_bg_left_screen.png";
import AssignModal from "../components/AssignModal";
import { getFilteredUsers } from "../api/userService";
import type { UserDto } from "../types/UserDto";
import LogoutModal from "../components/LogoutModal";
import { getMediaById } from "../api/mediaService";
import type { MediaDto } from "../types/MediaDto";

function SupervisorTicketsView() {
  // State variables
  const [tickets, setTickets] = useState<TicketDto[]>([]);

  // Modal variables
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [viewTicket, setViewTicket] = useState<TicketDto | null>(null);

  // Toast variables
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Loading variables
  const [loading, setLoading] = useState(false);

  // Assign variables
  const [selectedTicket, setSelectedTicket] = useState<TicketDto | null>(null);

  // Users variables
  const [users, setUsers] = useState<UserDto[]>([]);

  // Media variables
  const [media, setMedia] = useState<MediaDto | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  /**
   * Fetches the tickets and the users from the server when the component mounts.
   */
  useEffect(() => {
    fetchTickets();
    fetchUsersToBeAssigned();
  }, []);

  /**
   * Fetches the users (workers) from the server.
   * @returns void
   */
  const fetchUsersToBeAssigned = async () => {
    try {
      const data = await getFilteredUsers('WORKER');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  /**
   * Fetches the tickets from the server.
   * @returns void
   */
  const fetchTickets = async () => {
    // Show a loading spinner
    setLoading(true);

    try {
      // Fetch the tickets from the server
      const data = await getTickets();

      // Set the tickets to the state
      setTickets(data);
    } catch (error) {
      // Show an error message
      console.error("Error fetching tickets:", error);
    } finally {
      // Hide the loading spinner
      setLoading(false);
    }
  };

  /**
   * Handles the creation of a new ticket.
   * @param newTicket - The new ticket to be created.
   * @returns void
   */
  const handleCreateTicket = async (newTicket: CreateTicketRequest) => {
    try {
      // Create the new ticket by sending a POST request to the server
      await createTicket(newTicket);

      // Show a toast message to the user
      setToastMessage("Ticket created successfully!");
      setToastVisible(true);

      // Hide the toast message after 3 seconds
      setTimeout(() => setToastVisible(false), 3000);

      // Fetch the tickets again to display the newly created ticket
      fetchTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  /**
   * Handles the assignment of a maintenance worker to a ticket.
   * @param workerId - The ID of the maintenance worker to assign.
   * @returns void
   */
  const handleAssignWorker = async (workerId: number) => {
    if (!selectedTicket) return;

    try {
      // Assign the worker to the ticket
      await assignWorker(selectedTicket.ticketId, workerId);

      // Show a toast message to the user
      setToastMessage("Maintenance worker assigned successfully!");
      setToastVisible(true);

      // Hide the toast message after 3 seconds
      setTimeout(() => setToastVisible(false), 3000);

      // Fetch the tickets again to display the newly assigned ticket
      fetchTickets();

      // Clear the selected ticket
      setSelectedTicket(null);
    } catch (error) {
      console.error(
        'Error assigning maintenance worker:',
        error
      );
    }
  };

  /**
   * Handles the viewing of a ticket.
   * @param ticket - The ticket to be viewed.
   * @returns void
   */
  const handleViewTicket = async(ticket: TicketDto) => {
    setViewTicket(ticket);
    setMedia(null);

    if (ticket.mediaId) {
      setMediaLoading(true);
      try {
        const data =  await getMediaById(ticket.mediaId);
        setMedia(data);
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setMediaLoading(false);
      }
    }
  }

  /**
   * Handles the closing of a ticket.
   * @returns void
   */
  const handleCloseTicket = () => {
    setViewTicket(null);
    setMedia(null);
  }

  return (
    <div className="flex h-screen gap-0">
      {/* ------------------ Left Image Panel ------------------ */}
      <div className="w-1/2 relative">
        <img
          src={newDesign}
          alt="Globe Design"
          className="w-full h-full object-cover"
        />

        {/* ------------------ Overlay Title Positioned on Globe ------------------ */}
        <div className="absolute top-[20%] right-[48%] transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-7xl font-bold text-black drop-shadow-md">
            SPOVED
          </h1>
        </div>
      </div>

      {/* ------------------ Right Content Panel ------------------ */}
      <div className="w-1/2 flex flex-col justify-start px-8 py-6 overflow-y-auto relative  border-r-0">

        {/* ------------------ Logout Modal ------------------ */}
        <div className="absolute top-6 left-6 z-50">
          <LogoutModal />
        </div>


        {/* ------------------ Create Ticket Button ------------------ */}
        <button
          onClick={() => setOpenCreateModal(true)}
          className="w-full mb-6 rounded-md bg-[#1A97FE] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1A97FE] mt-24"
        >
          + Create New Ticket
        </button>

        {/* ------------------ Loading Spinner / Tickets ------------------ */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[40vh]">
            <div className="h-8 w-8 border-4 border-[#1A97FE] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tickets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            {tickets.map((ticket) => (
              <SupervisorTicketCard
                key={ticket.ticketId}
                ticket={ticket}
                users={users}
                onView={handleViewTicket}
                onAssign={setSelectedTicket}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-6">
            No tickets available.
          </div>
        )}

        {/* ------------------ Create Modal ------------------ */}
        {openCreateModal && (
          <CreateTicketModal
            onCreate={handleCreateTicket}
            onClose={() => setOpenCreateModal(false)}
          />
        )}

        {/* ------------------ Ticket Detail Modal ------------------ */}
        {viewTicket && (
          <SupervisorTicketDetailsModal
            ticket={viewTicket}
            media={media}
            onClose={handleCloseTicket}
          />
        )}

        {/* ------------------ Assign Modal ------------------ */}
        {selectedTicket && (
          <AssignModal
            ticket={selectedTicket}
            users={users}
            onAssign={handleAssignWorker}
            onClose={() => setSelectedTicket(null)}
          />
        )}

        {/* ------------------ Toast Notification ------------------ */}
        {toastVisible && (
          <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-md">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default SupervisorTicketsView;
