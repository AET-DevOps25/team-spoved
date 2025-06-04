import newDesign from "../assets/image_no_bg_left_screen.png"
import LogoutModal from "../components/LogoutModal"

export default function MicrophoneView() {
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

            <div className="flex flex-col items-center justify-center h-full">
                <h1>Microphone View</h1>
            </div>
        </div>
    </div>
    )
}

