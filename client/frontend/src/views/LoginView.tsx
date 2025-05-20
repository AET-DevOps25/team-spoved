import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginView = () => {
	const [selectedRole, setSelectedRole] = useState<string>('');
	const [searchTerm, setSearchTerm] = useState<string>('');

	const navigate = useNavigate();


	const handleLogin = () => {
		if (selectedRole === 'WORKER') navigate('/worker');
		else navigate('/supervisor');
	};

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

				{/* 2. Name Search */}
				{selectedRole && (
					<div className="mb-6 relative">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Name
						</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Enter name..."
                            className="w-full rounded-md border border-gray-300 py-2 px-3 text-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
					</div>
				)}

				{/* 3. Login Button */}
				<button
					disabled={!selectedRole}
					onClick={handleLogin}
                    onMouseEnter={handleLogin}
					className="w-full rounded-md bg-[#1A97FE] py-2 text-white font-semibold hover:bg-[#1A97FE] disabled:bg-gray-400"
				>
					Login
				</button>
			</div>
		</div>

	);
};

export default LoginView;