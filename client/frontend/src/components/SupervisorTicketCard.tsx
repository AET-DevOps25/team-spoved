import {
	CalendarDaysIcon,
	MapPinIcon,
	UserPlusIcon,
} from '@heroicons/react/20/solid';
import type { TicketDto } from '../types/TicketDto';
import type { UserDto } from '../types/UserDto';

interface SupervisorTicketCardProps {
	ticket: TicketDto;
	users: UserDto[];
	onView: (ticket: TicketDto) => void;
	onAssign: (ticket: TicketDto) => void;
}

const SupervisorTicketCard = ({
	ticket,
	users,
	onView,
	onAssign,
}: SupervisorTicketCardProps) => {

	const isAlreadyAssigned = ticket.assignedTo !== null;
	
	const assignedUser = users.find((user) => user.userId === ticket.assignedTo);

	const getInitials = (user: UserDto) =>{
		if (!user) return '';
		const firstName = user.name?.split(' ')[0];
		const lastName = user.name?.split(' ')[1];
		console.log(firstName, lastName);
		return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
	}

	const handleAssignClick = (e: React.MouseEvent) => {
		console.log(ticket);
		e.stopPropagation();
		if (onAssign) {
			onAssign(ticket);
		}
	};

	return (
		<div
			onClick={() => onView(ticket)}
			className="rounded-xl p-4 flex flex-col gap-6 cursor-pointer border border-[#E8E8E8] transition sm:p-6 bg-white"
		>
			{/* ------------------ Header ------------------ */}
			<div className="flex justify-between items-start">
				<h3 className="text-lg font-semibold text-[#1A1A1A]">
					{ticket.title}
				</h3>

				{ticket.status !== "FINISHED" && (
					<button
						className={`flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
							isAlreadyAssigned
								? 'bg-green-100 text-green-800 ring-1 ring-green-500'
								: 'bg-[#EAF2FE] text-[#1A97FE] ring-1 ring-[#1A97FE] hover:bg-[#D4E8FD]'
						}`}
						onClick={handleAssignClick}
					>
						{isAlreadyAssigned && assignedUser ? (
							<div className="h-4 w-4 rounded-full text-green-500 text-xs font-bold flex items-center justify-center">
								{getInitials(assignedUser)}
							</div>
						) : (
							<UserPlusIcon className="h-4 w-4" />
						)}
					</button>
				)}

			</div>

			{/* ------------------ Due Date & Location ------------------ */}
			<div className="flex items-start gap-6">
				<div className="flex items-start gap-2">
					<CalendarDaysIcon className="h-5 w-5 text-[#1A97FE]" />
					<div className="text-sm text-[#808080]">
						{new Date(ticket.dueDate).toLocaleDateString('de-DE', {
							day: '2-digit',
							month: 'short',
						})}
					</div>
				</div>

				<div className="flex items-start gap-2">
					<MapPinIcon className="h-5 w-5 text-[#1A97FE]" />
					<div className="text-sm text-[#808080] truncate max-w-[140px]">
						{ticket.location}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SupervisorTicketCard;