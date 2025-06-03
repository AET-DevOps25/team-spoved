import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faList, faMicrophone, faVideo, faSignOut } from "@fortawesome/free-solid-svg-icons"

const WorkerView = () => {
  const navigate = useNavigate()
  
  const handleRecording = () => {
    navigate("/videoRecording")
  }

  
  const handleCleanerTasks = () => {
    navigate("/cleaner/tasks")
  }
  

  const handleFeedback = () => {
    navigate("/feedback")
  }

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    navigate("/");
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fixed top-6 left-9 z-50">
          <button
            onClick={handleLogout}
            className="px-6 py-4 text-sm font-medium text-[#1A97FE] border border-[#1A97FE] rounded-full hover:bg-[#1A97FE] hover:text-white transition"
          >
            <FontAwesomeIcon icon={faSignOut} />
          </button>
        </div>
      <div className="flex items-center justify-center min-h-screen px-6 py-6">
          
      <div className="flex flex-col items-center gap-6 w-full max-w-xl bg-white rounded-2xl p-8 shadow-xl mx-auto">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 text-center mb-4 mt-4">Worker Personnel Dashboard</h1>
          <div className="flex flex-col sm:flex-col gap-4 w-full">
            {
            <button
              onClick={handleCleanerTasks}
              className="w-full px-4 sm:px-6 py-5 bg-blue-900 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-base md:text-lg"
            >
              <FontAwesomeIcon icon={faList} />
            </button>
            }

            <button 
              onClick={handleRecording}
              className="w-full px-4 sm:px-6 py-5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-base md:text-lg"
            >
              <FontAwesomeIcon icon={faVideo} />
            </button>

            <button
              onClick={handleFeedback}
              className="w-full px-4 sm:px-6 py-5 bg-indigo-500 rounded-lg hover:bg-indigo-600 flex items-center justify-center gap-2 text-base md:text-lg"
            >
              <FontAwesomeIcon icon={faMicrophone} />
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerView