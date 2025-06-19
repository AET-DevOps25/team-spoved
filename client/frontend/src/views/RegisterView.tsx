import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import newDesign from "../assets/image_no_bg_left_screen.png";
import { registerUser } from '../api/userService';
import type { Role } from '../types/UserDto';

export default function RegisterView() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const credentials = { name, password, role };
      await registerUser(credentials);
      navigate('/login');
    } catch {
      setError('Registration failed');
    }
  };

  return (
    <div className="flex h-screen gap-0">
      {/* Left Image Panel */}
      <div className="w-1/2 relative">
        <img
          src={newDesign}
          alt="Globe Design"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-[20%] right-[48%] transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-7xl font-bold text-black drop-shadow-md">
            SPOVED
          </h1>
        </div>
      </div>
      {/* Right Content Panel */}
      <div className="w-1/2 flex flex-col justify-center px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white p-6 rounded-md shadow-md mb-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Username"
                  required
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-md focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-md focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-md focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]"
                >
                  <option value="WORKER">Worker</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>
              {error && <div className="text-red-500 mb-2">{error}</div>}
              <button
                type="submit"
                className="w-full rounded-md bg-[#1A97FE] py-2 text-white font-semibold hover:bg-[#1A97FE] disabled:bg-gray-400"
              >
                Register
              </button>
            </form>
            <div className="text-center mt-4">
              <span>Already have an account? </span>
              <Link to="/" className="text-blue-600 hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
