import React, { useState, useMemo, useEffect } from 'react';
import type { TicketDto } from '../types/TicketDto';
import type { UserDto } from '../types/UserDto';

interface AssignModalProps {
	ticket: TicketDto;
	users: UserDto[];
	onAssign: (workerId: number) => void;
	onClose: () => void;
}

const AssignModal: React.FC<AssignModalProps> = ({
	ticket,
	users,
	onAssign,
	onClose,
}) => {
	// State variables
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
	const [showDropdown, setShowDropdown] = useState(false);

	// Assigned user
	const assignedUser = users.find((u) => u.userId === ticket.assignedTo);

	// Debounce search term
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 200);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	// Alphabetically sorted and filtered list of other users
	const filteredUsers = useMemo(() => {
		const list = users
			.filter((u) => u.userId !== ticket.assignedTo)
			.sort((a, b) => {
				const nameA = `${a.name}`.toLowerCase();
				const nameB = `${b.name}`.toLowerCase();
				return nameA.localeCompare(nameB);
			})
			.filter((u) =>
				`${u.name}`
					.toLowerCase()
					.includes(debouncedSearchTerm.toLowerCase())
			);

		return list;
	}, [users, ticket.assignedTo, debouncedSearchTerm]);

	const handleAssignClick = (id: number) => {
		onAssign(id);
		onClose();
	};

	const handleInputClick = () => {
		setShowDropdown(true);
		setSelectedUser(null);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setSelectedUser(null);
		setShowDropdown(true);
	};

	const handleUserSelect = (user: UserDto) => {
		setSelectedUser(user);
		setSearchTerm(user.name);
		setShowDropdown(false);
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!(event.target as Element).closest('.dropdown-container')) {
				setShowDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<>
			{/* ------------------ Overlay ------------------ */}
			<div
				className="fixed inset-0 bg-gray-500/75 transition-opacity"
				onClick={onClose}
			/>

			<div
				className="fixed inset-0 z-50 flex items-center justify-center p-4"
				onClick={onClose}
			>
				<div
					className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6"
					onClick={(e) => e.stopPropagation()}
				>
					<h3 className="text-lg font-semibold mb-6">
						Assign Maintenance Worker
					</h3>

					{/* ------------------ Assigned worker (if any) ------------------ */}
					{assignedUser && (
						<div className="mb-4">
							<h4 className="text-sm font-medium text-gray-700 mb-2">
								Assigned Maintenance Worker
							</h4>
							<div className="p-3 border border-green-300 rounded-md bg-green-50">
								{assignedUser.name}
							</div>
						</div>
					)}

					{/* ------------------ Search input with dropdown ------------------ */}
					<div className="mb-6 relative dropdown-container">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Name
						</label>
						<input
							type="text"
							value={selectedUser ? selectedUser.name : searchTerm}
							onClick={handleInputClick}
							onChange={handleInputChange}
							placeholder="Enter the name"
							className={`w-full rounded-md border border-gray-300 py-2 px-3 text-sm ${
								selectedUser ? "text-black" : "text-gray-400"
							} focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]`}
						/>
						{showDropdown && !selectedUser && (
							<ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md max-h-40 overflow-y-auto shadow-sm">
								{filteredUsers.length > 0 ? (
									filteredUsers.map((user) => (
										<li
											key={user.userId}
											onClick={() => handleUserSelect(user)}
											className="px-3 py-2 cursor-pointer hover:bg-blue-50"
										>
											{user.name}
										</li>
									))
								) : (
									<li className="px-3 py-2 text-gray-500">
										No maintenance worker found
									</li>
								)}
							</ul>
						)}
					</div>

					{/* Assign button - only show when user is selected */}
					{selectedUser && (
						<div className="mb-4">
							<button
								onClick={() => handleAssignClick(selectedUser.userId)}
								className="w-full rounded-md bg-[#1A97FE] py-2 text-white font-semibold hover:bg-[#1A97FE]"
							>
								Assign {selectedUser.name}
							</button>
						</div>
					)}

					{/* ------------------ Footer ------------------ */}
					<div className="flex justify-end">
						<button
							onClick={onClose}
							className="text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default AssignModal;