import { useState, type ChangeEvent } from 'react';
import type { MediaType } from '../types/TicketDto';

interface CreateTicketModalProps {
	onCreate: (ticket: {
		assignedTo: number | null;
		createdBy: number;
		title: string;
		description: string;
		dueDate: string;
		location: string;
		mediaType: MediaType;
		mediaId: number | null;
	}) => void;
	onClose: () => void;
}

const CreateTicketModal = ({ onCreate, onClose }: CreateTicketModalProps) => {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [location, setLocation] = useState('');
	const [mediaType, setMediaType] = useState<MediaType>('PHOTO');
	const userId = localStorage.getItem('userId') || '';
	const [selectedMediaType, setSelectedMediaType] = useState<string>('');


	const handleSubmit = () => {
		onCreate({
			assignedTo: null,
			createdBy: parseInt(userId),
			title,
			description,
			dueDate,
			location,
			mediaType,
			mediaId: null,
		});
		onClose();
	};

	return (
		<>
			{/* ------------------ Background Overlay ------------------ */}
			<div
				className="fixed inset-0 bg-gray-500/75 transition-opacity"
				aria-hidden="true"
			></div>

			{/* ------------------ Modal Container ------------------ */}
			<div className="fixed inset-0 z-10 w-full overflow-y-auto mt-20">
				<div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
					<div className="relative w-full max-w-sm sm:max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
						<div className="bg-white px-4 py-6 sm:px-6">
							<h3 className="text-lg font-semibold leading-6 text-gray-900 mb-6">
								Create new ticket
							</h3>

							<div className="space-y-4">
								{/* ------------------ Title ------------------ */}
								<div>
									<label className="block text-sm font-medium text-gray-700">
										Title
									</label>
									<input
										type="text"
										value={title}
										onChange={(e) =>
											setTitle(e.target.value)
										}
										className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE]"
									/>
								</div>

								{/* ------------------ Description ------------------ */}
								<div>
									<label className="block text-sm font-medium text-gray-700">
										Description
									</label>
									<textarea
										rows={3}
										value={description}
										onChange={(e) =>
											setDescription(e.target.value)
										}
										className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE]"
									/>
								</div>

								{/* ------------------ Due Date ------------------ */}
								<div>
									<label className="block text-sm font-medium text-gray-700">
										Due Date
									</label>
									<input
										type="date"
										value={dueDate}
										onChange={(e) =>
											setDueDate(e.target.value)
										}
										className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE]"
									/>
								</div>

								{/* ------------------ Location ------------------ */}
								<div>
									<label className="block text-sm font-medium text-gray-700">
										Location
									</label>
									<input
										type="text"
										value={location}
										onChange={(e) =>
											setLocation(e.target.value)
										}
										className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm shadow-sm focus:ring-[#1A97FE] focus:border-[#1A97FE]"
									/>
								</div>

								{/* ------------------ Media Type Selector ------------------ */}
								<div className="mb-6">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Media Type
									</label>
									<select
										className={`w-full rounded-md border border-gray-300 py-2 px-3 text-md ${
											selectedMediaType ? 'text-black' : 'text-gray-400'
										} focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]`}
										value={selectedMediaType}
										onChange={(e: ChangeEvent<HTMLSelectElement>) => {
											setSelectedMediaType(e.target.value);
											setMediaType(e.target.value as MediaType);
										}}
									>
										<option value="" disabled>
											Media Type select...
										</option>
										<option value="PHOTO">Photo</option>
										<option value="VIDEO">Video</option>
										<option value="AUDIO">Audio</option>
									</select>
				</div>
                            </div> 


							{/* ------------------ Footer Buttons ------------------ */}
							<div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
								<button
									onClick={onClose}
									className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 w-full sm:w-auto"
								>
									Cancel
								</button>
								<button
									onClick={handleSubmit}
									className="rounded-md bg-[#1A97FE] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1A97FE] w-full sm:w-auto"
								>
									Create
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default CreateTicketModal;