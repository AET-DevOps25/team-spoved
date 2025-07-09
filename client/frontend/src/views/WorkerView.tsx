import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faList, faMicrophone, faVideo, faCamera } from "@fortawesome/free-solid-svg-icons"
import newDesign from "../assets/image_no_bg_left_screen.png"
import LogoutModal from "../components/LogoutModal"

const WorkerView = () => {
  const navigate = useNavigate()
  
  const handleRecording = () => {
    navigate("/worker/videoRecording")
  }

  
  const handleWorkerTickets = () => {
    navigate("/worker/tickets")
  }
  

  const handleMicrophone = () => {
    navigate("/worker/microphone")
  }

  const handleCamera = () => {
    navigate("/worker/camera")
  }

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
      <div className="w-1/2 flex flex-col justify-start px-8 py-6 relative overflow-hidden">

        {/* ------------------ Logout Modal ------------------ */}
        <div className="absolute top-6 left-6 z-50">
          <LogoutModal />
        </div>

        <div className="flex items-center justify-center min-h-screen px-6 py-6">

          {/* ------------------ Worker Dashboard ------------------ */}
          <div className="flex flex-col items-center gap-6 w-full max-w-xl bg-white rounded-2xl p-8 shadow-xl mx-auto">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 text-center mb-4 mt-4">Worker Personnel Dashboard</h1>

              {/* ------------------ Worker Tickets button ------------------ */}
              <div className="w-full flex justify-center items-center">
                <div className="grid grid-cols-2 gap-x-24 gap-y-4">
                  {/* ------------------ Worker Tickets Button ------------------ */}
                  <button
                    onClick={handleWorkerTickets}
                    className="w-24 h-24 bg-blue-900 text-white rounded-full hover:bg-blue-600 flex items-center justify-center text-xl shadow-md mb-4"
                  >
                    <FontAwesomeIcon icon={faList} />
                  </button>

                  {/* ------------------ Microphone Button ------------------ */}
                  <button
                    onClick={handleMicrophone}
                    className="w-24 h-24 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 flex items-center justify-center text-xl shadow-md mb-4"
                  >
                    <FontAwesomeIcon icon={faMicrophone} />
                  </button>

                  {/* ------------------ Video Recording Button ------------------ */}
                  <button
                    onClick={handleRecording}
                    className="w-24 h-24 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center text-xl shadow-md mb-4"
                  >
                    <FontAwesomeIcon icon={faVideo} />
                  </button>

                  {/* ------------------ Camera Button ------------------ */}
                  <button
                    onClick={handleCamera}
                    className="w-24 h-24 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center text-xl shadow-md mb-4"
                  >
                    <FontAwesomeIcon icon={faCamera} />
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerView