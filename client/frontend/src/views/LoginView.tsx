import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getFilteredUsers, loginUser } from "../api/userService";
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";

// Custom interface for JWT payload that includes 'role'
interface CustomJwtPayload extends JwtPayload {
  role: string;
}

import newDesign from "../assets/image_no_bg_left_screen.png";

const LoginView = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }

    try {
      const credentials = {name : username, password: password};
      const data = await loginUser(credentials);

      const decoded = jwtDecode<CustomJwtPayload>(data.token);
      
      sessionStorage.setItem("jwt", data.token);
      sessionStorage.setItem("name", username);

      const user = await getFilteredUsers(decoded.role, username);
      const userId = user.find((u) => u.name === username)?.userId || 0;

    localStorage.setItem("userId", userId.toString());
    localStorage.setItem("role", decoded.role);
    localStorage.setItem("name", username);

      const role = decoded.role.toLowerCase();

      navigate(`/${role}`);
   } catch (error) {
      console.error("Login error:", error);
      setError("Authentication failed. Please try again.");
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

            {/* ------------------ Username Input ------------------ */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-md focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]"
              />
            </div>

            {/* ------------------ Password Input ------------------ */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-md focus:outline-none focus:ring-2 focus:ring-[#1A97FE] focus:border-[#1A97FE]"
              />
            </div>

            {/* ------------------ Error Message ------------------ */}
            {error && <div className="text-red-500 mb-2">{error}</div>}

            {/* ------------------ Login Button ------------------ */}
            <button
              disabled={!username || !password}
              onClick={handleLogin}
              className="w-full rounded-md bg-[#1A97FE] py-2 text-white font-semibold hover:bg-[#1A97FE] disabled:bg-gray-400"
            >
              Login
            </button>

            {/* ------------------ Register Link ------------------ */}
            <div className="text-center mt-4">
              <span>Don't have an account? </span>
              <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
