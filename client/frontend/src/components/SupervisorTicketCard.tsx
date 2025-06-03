import {
	CalendarDaysIcon,
	MapPinIcon,
} from '@heroicons/react/20/solid';
import type { TicketDto } from '../types/TicketDto';

interface SupervisorTicketCardProps {
	ticket: TicketDto;
	onView: (ticket: TicketDto) => void;
}

const SupervisorTicketCard = ({
	ticket,
	onView,
}: SupervisorTicketCardProps) => {
	return (
		<div
			onClick={() => onView(ticket)}
			className="rounded-xl p-4 flex flex-col gap-6 cursor-pointer border border-[#E8E8E8] transition sm:p-6 bg-white"
		>
			{/* Header */}
			<div className="flex justify-between items-start">
				<h3 className="text-lg font-semibold text-[#1A1A1A]">
					{ticket.title}
				</h3>

			</div>

			{/* Due Date & Location */}
			<div className="flex items-start gap-6">
				<div className="flex items-start gap-2 w-1/3">
					<CalendarDaysIcon className="h-5 w-5 text-[#1A97FE]" />
					<div className="text-sm text-[#808080]">
						{new Date(ticket.dueDate).toLocaleDateString('de-DE', {
							day: '2-digit',
							month: 'short',
						})}
					</div>
				</div>

				<div className="flex items-start gap-2 w-1/3">
					<MapPinIcon className="h-5 w-5 text-[#1A97FE]" />
					<div className="text-sm text-[#808080] truncate max-w-[140px]">
						{ticket.location}
					</div>
				</div>

				<div className="w-1/3" />
			</div>
		</div>
	);
};

export default SupervisorTicketCard;