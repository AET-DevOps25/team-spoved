// This view is the top-level view that renders
// the application from the supervisor's POV.
import { useEffect, useState } from 'react';
import type { CreateTicketRequest, TicketDto } from '../types/TicketDto';
import { getTickets, createTicket } from '../api/ticketService';

import SupervisorTicketCard from '../components/SupervisorTicketCard';
import CreateTicketModal from '../components/CreateTicketModal';
import SupervisorTicketDetailsModal from '../components/SupervisorTicketDetailsModal';

function SupervisorTicketsView() {
	const [tickets, setTickets] = useState<TicketDto[]>([]);
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const [viewTicket, setViewTicket] = useState<TicketDto | null>(null);

	const [toastMessage, setToastMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);

	useEffect(() => {
		fetchTickets();
	}, []);

	const fetchTickets = async () => {
		setLoading(true);
		try {
			const data = await getTickets();
			setTickets(data);
		} catch (error) {
			console.error('Error fetching tasks:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateTask = async (
		newTicket: CreateTicketRequest
	) => {
		try {
			await createTicket(newTicket);
			setToastMessage('Task created successfully!');
			setToastVisible(true);
			setTimeout(() => setToastVisible(false), 3000);
			fetchTickets();
		} catch (error) {
			console.error('Error creating task:', error);
		}
	};

	return (
		<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<button
				onClick={() => setOpenCreateModal(true)}
				className="w-full mb-4 rounded-md bg-[#1A97FE] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1A97FE] mt-20"
			>
				+ Create New Ticket
			</button>

			{loading ? (
				<div className="flex justify-center items-center min-h-[40vh]">
					<div className="h-8 w-8 border-4 border-[#1A97FE] border-t-transparent rounded-full animate-spin"></div>
				</div>
			) : (
				<>
					{tickets.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
							{/* ------------------ Ticket Cards ------------------ */}
							{tickets.map((ticket) => (
								<SupervisorTicketCard
									key={ticket.ticketId}
									ticket={ticket}
									onView={setViewTicket}
								/>
							))}
						</div>
					) : (
						<div className="text-center text-gray-500 mt-6">
							No tickets available.
						</div>
					)}
				</>
			)}

			{openCreateModal && (
				<CreateTicketModal
					onCreate={handleCreateTask}
					onClose={() => setOpenCreateModal(false)}
				/>
			)}

			{viewTicket && (
				<SupervisorTicketDetailsModal
					ticket={viewTicket}
					onClose={() => setViewTicket(null)}
				/>
			)}

			{/* Toast */}
			{toastVisible && (
				<div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-md">
					{toastMessage}
				</div>
			)}
		</div>
	);
}

export default SupervisorTicketsView;