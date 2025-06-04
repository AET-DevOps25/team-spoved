import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

const LogoutModal = () => {
  const navigate = useNavigate();

  /**
	 * Handles the logout process.
	 * Cleans the local storage and navigates to the login page.
	 * @returns void
	 */
  const handleLogout = () => {
    // Clean the local storage
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');

    // Navigate to the login page
    navigate("/");
  }

  return(      
    <div className="absolute top-6 left-6 z-50">
        <button
            onClick={handleLogout}
            className="px-6 py-4 text-sm font-medium text-[#1A97FE] border border-[#1A97FE] rounded-full hover:bg-[#1A97FE] hover:text-white transition"
            >
            <FontAwesomeIcon icon={faSignOut} />
        </button>
    </div>
  )
};

export default LogoutModal;
