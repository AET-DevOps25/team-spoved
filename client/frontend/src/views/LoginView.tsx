import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserDto } from '../types/UserDto';
import { getAllUsers } from '../api/userService';

const LoginView = () => {
	const [selectedRole, setSelectedRole] = useState<string>('');
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)
	const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);
	
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

	const [users, setUsers] = useState<UserDto[]>([]);

	const navigate = useNavigate();

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 200);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	useEffect(() => {
		if (!selectedRole) {
			setUsers([]);
			return;
		}
		getAllUsers(selectedRole, debouncedSearchTerm)
			.then(setUsers)
			.catch((err: Error) => console.error('Error fetching users:', err));

		console.log("Users: " + users);
	}, [selectedRole, debouncedSearchTerm]);

	useEffect(() => {
		setFilteredUsers(users);
	}, [users]);



	const handleLogin = async () => {
		if( !selectedRole || !selectedUser ) {
			return;
		}
		
		console.log("Selected User: " + selectedUser);

		// Clean the local storage
		localStorage.removeItem('role');
		localStorage.removeItem('name');
		localStorage.removeItem('userId');

		// Set the role, name and user id
		localStorage.setItem('role', selectedRole);
		localStorage.setItem('name', selectedUser?.name || '');

		const user = await getAllUsers(selectedRole, debouncedSearchTerm);
		const userId = user.find(u => u.name === selectedUser?.name)?.userId || 0;

		localStorage.setItem('userId', userId.toString());

		console.log("Selected Role: " + selectedRole);
		console.log("Selected User: " + selectedUser?.name);
		console.log("Selected ID:" + selectedUser?.userId)

		if (selectedRole === 'WORKER') {
			navigate('/worker');
		} else {
			navigate('/supervisor');
		}
	};

	return (
		<div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
			{/* Logos */}
            <div className="flex items-center justify-center w-full py-6 mb-8 mt-10">
                <h1 className="text-5xl font-bold leading-[3.5rem] text-gray-800">SPOVED</h1>
            </div>

			{/* Login Panel */}
			<div className="bg-white p-6 rounded-md shadow-md mb-8">
				<h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

				{/* 1. Role Selector */}
				<div className="mb-6">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Role
					</label>
					<select
						className={`w-full rounded-md border border-gray-300 py-2 px-3 text-md ${
							selectedRole ? 'text-black' : 'text-gray-400'
						} focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]`}
						value={selectedRole}
						onChange={(e: ChangeEvent<HTMLSelectElement>) => {
							setSelectedRole(e.target.value);
							setSearchTerm('');
						}}
					>
						<option value="" disabled>
							Role select...
						</option>
						<option value="WORKER">Worker</option>
						<option value="SUPERVISOR">Supervisor</option>
					</select>
				</div>

				{/* Name Search */}
				{selectedRole && (
					<div className="mb-6 relative">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Name
						</label>
						<input
							type="text"
							value={
								selectedUser
									? `${selectedUser.name}`
									: searchTerm
							}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setSelectedUser(null);
							}}
							placeholder={'Enter the name'}
							className={`w-full rounded-md border border-gray-300 py-2 px-3 text-md ${
								selectedUser ? 'text-black' : 'text-gray-400'
							} focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]`}
						/>

						{/* Autocomplete Dropdown */}
						{searchTerm.trim() !== '' && !selectedUser && (
							<ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md max-h-40 overflow-y-auto shadow-sm">
								{filteredUsers.length > 0 ? (
									filteredUsers.map((u) => {
										return (
											<li
												key={u.userId}
												onClick={() => {
													setSelectedUser(u);
													setSearchTerm(
														u.name
													);
												}}
												className="px-3 py-2 cursor-pointer hover:bg-indigo-50"
											>
												{u.name}
											</li>
										);
									})
								) : (
									<li className="px-3 py-2 text-gray-500">
										No users found
									</li>
								)}
							</ul>
						)}
					</div>
				)}

				{/* 3. Login Button */}
				<button
					disabled={!selectedRole}
					onClick={handleLogin}
					className="w-full rounded-md bg-[#1A97FE] py-2 text-white font-semibold hover:bg-[#1A97FE] disabled:bg-gray-400"
				>
					Login
				</button>
			</div>
		</div>

	);
};

export default LoginView;