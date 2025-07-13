import newDesign from "../assets/image_no_bg_left_screen.png"
import LogoutModal from "../components/LogoutModal"
import WorkerTicketCard from "../components/WorkerTicketCard"
import { useEffect, useState } from "react";
import type { TicketDto } from "../types/TicketDto";
import { getTickets } from "../api/ticketService";
import WorkerTicketDetailsModal from "../components/WorkerTicketDetailsModal";
import type { MediaDto } from "../types/MediaDto";
import { getMediaById } from "../api/mediaService";
import WorkerFilterBar from "../components/WorkerFilterBar";

export default function WorkerTicketView() {

    const [tickets, setTickets] = useState<TicketDto[]>([]);
    const [viewTicket, setViewTicket] = useState<TicketDto | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const [media, setMedia] = useState<MediaDto | null>(null);
    const [, setMediaLoading] = useState(false);

    const userId = localStorage.getItem('userId') || '';

    const [statusFilter, setStatusFilter] = useState('open');

    const [filteredTickets, setFilteredTickets] = useState<TicketDto[]>([]);

    /**
     * Fetches the tickets from the server.
     * @returns void
     */
    useEffect(() => {

        /**
         * Fetches the tickets for the current user from the server.
         * @returns void
         */
        const fetchTickets = async () => {
            setIsLoading(true);
            try {
                const tickets = await getTickets();
                const filteredTickets = tickets.filter((ticket) => ticket.assignedTo === parseInt(userId));
                setTickets(filteredTickets ?? []);
            } catch (error) {
                console.error('Error fetching tickets:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTickets();
    }, [userId]);


    /**
     * Handles the viewing of a ticket.
     * @param ticket - The ticket to be viewed.
     * @returns void
     */
    const handleViewTicket = async (ticket: TicketDto) => {
        setViewTicket(ticket);
        setMedia(null);

        if (ticket.mediaId) {
            setMediaLoading(true);
            try {
                const data = await getMediaById(ticket.mediaId);
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

    const taskCounts = {
		open: tickets.filter((t) => t.status === 'OPEN' && t.dueDate && new Date(t.dueDate) >= new Date()).length,
		in_progress: tickets.filter(
			(t) =>
				t.status === 'IN_PROGRESS' && t.dueDate && new Date(t.dueDate) >= new Date()
		).length,
		finished: tickets.filter((t) => t.status === 'FINISHED').length,
		overdue: tickets.filter((t) => (t.status === 'OPEN' || t.status === 'IN_PROGRESS' ) && t.dueDate && new Date(t.dueDate) < new Date()).length,
	};

    useEffect(() => {
        const filtered = tickets.filter((ticket) => {
          if (statusFilter === 'open') return ticket.status === 'OPEN' && ticket.dueDate && new Date(ticket.dueDate) >= new Date();
          if (statusFilter === 'in_progress') return ticket.status === 'IN_PROGRESS' && ticket.dueDate && new Date(ticket.dueDate) >= new Date();
          if (statusFilter === 'finished') return ticket.status === 'FINISHED';
          if (statusFilter === 'overdue') return (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && ticket.dueDate && new Date(ticket.dueDate) < new Date();
        });
        setFilteredTickets(filtered);
      }, [statusFilter, tickets]);

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

                {/* ------------------ Filter Bar ------------------ */}
                <div className="mb-6 mt-24">
                    <WorkerFilterBar
                        status={statusFilter}
                        setStatus={setStatusFilter}
                        taskCounts={taskCounts}
                    />
                </div>


                {/* ------------------ Loading Spinner / Tickets ------------------ */}
                {isLoading ? (
                    <div className="flex justify-center items-center min-h-[40vh]">
                        <div className="h-8 w-8 border-4 border-[#1A97FE] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : tickets.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 ">
                        {filteredTickets.map((ticket) => (
                            <WorkerTicketCard
                                key={ticket.ticketId}
                                ticket={ticket}
                                onView={handleViewTicket}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-6">
                        No tickets available.
                    </div>
                )}

                {/* ------------------ Worker Ticket Details Modal ------------------ */}
                {viewTicket && (
                    <WorkerTicketDetailsModal
                        ticket={viewTicket}
                        media={media}
                        onClose={handleCloseTicket}
                    />
                )}
            </div>
        </div>
    )
}

