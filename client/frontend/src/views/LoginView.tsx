import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { UserDto } from "../types/UserDto";
import { getFilteredUsers } from "../api/userService";
import newDesign from "../assets/image_no_bg_left_screen.png";

const LoginView = () => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

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
    getFilteredUsers(selectedRole, debouncedSearchTerm)
      .then(setUsers)
      .catch((err: Error) => console.error("Error fetching users:", err));

  }, [selectedRole, debouncedSearchTerm]);

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

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

  const handleLogin = async () => {
    if (!selectedRole || !selectedUser) {
      return;
    }

    // Set the role, name and user id
    localStorage.setItem("role", selectedRole);
    localStorage.setItem("name", selectedUser?.name || "");

    const user = await getFilteredUsers(selectedRole, debouncedSearchTerm);
    const userId = user.find((u) => u.name === selectedUser?.name)?.userId || 0;

    localStorage.setItem("userId", userId.toString());

    if (selectedRole === "WORKER") {
      navigate("/worker");
    } else {
      navigate("/supervisor");
    }
  };

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
      <div className="w-1/2 flex flex-col justify-center px-8 ">
        <div className="w-full max-w-md mx-auto">
          {/* ------------------ Login Panel ------------------ */}
          <div className="bg-white p-6 rounded-md shadow-md mb-8">
            {/* ------------------ Login Title ------------------ */}
            <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

            {/* ------------------ Role Selector ------------------ */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className={`w-full rounded-md border border-gray-300 py-2 px-3 text-md ${
                  selectedRole ? "text-black" : "text-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]`}
                value={selectedRole}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setSelectedRole(e.target.value);
                  setSearchTerm("");
                  setShowDropdown(false);
                }}
              >
                <option value="" disabled>
                  Role select...
                </option>
                <option value="WORKER">Worker</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>

            {/* ------------------ Name Search ------------------ */}
            {selectedRole && (
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
                  className={`w-full rounded-md border border-gray-300 py-2 px-3 text-md ${
                    selectedUser ? "text-black" : "text-gray-400"
                  } focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]`}
                />
                {showDropdown && !selectedUser && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md max-h-40 overflow-y-auto shadow-sm">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <li
                          key={u.userId}
                          onClick={() => handleUserSelect(u)}
                          className="px-3 py-2 cursor-pointer hover:bg-indigo-50"
                        >
                          {u.name}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-gray-500">
                        No users found
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {/* ------------------ Login Button ------------------ */}
            <button
              disabled={!selectedRole || !selectedUser}
              onClick={handleLogin}
              className="w-full rounded-md bg-[#1A97FE] py-2 text-white font-semibold hover:bg-[#1A97FE] disabled:bg-gray-400"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
