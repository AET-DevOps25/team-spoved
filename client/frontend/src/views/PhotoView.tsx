import newDesign from "../assets/image_no_bg_left_screen.png";
import LogoutModal from "../components/LogoutModal";
import { usePhotoCapture } from "../hooks/PhotoHook";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";



export default function PhotoView() {

  const navigate = useNavigate();

  const {
    videoRef,
    canvasRef,
    photos,
    cameras,
    selectedCamera,
    uploading,
    errorMsg,
    autoTicketStatus,
    handleCameraChange,
    takePhoto,
    handleSendPhoto,
    removePhoto,
  } = usePhotoCapture(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/worker');
  });


  return (
    <div className="flex h-screen gap-0 overflow-hidden">
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
      <div className="w-1/2 flex flex-col justify-start px-8 py-6 relative overflow-auto">
        <div className="absolute top-6 left-6 z-50">
          <LogoutModal />
        </div>

        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-6">

          {/* ------------------ Photo Capture Container ------------------ */}
          <div className="flex flex-col items-center w-full max-w-xl mx-auto bg-white rounded-2xl p-8 shadow-xl gap-6">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Take Photo
            </h2>

            {/* ------------------ Error Message ------------------ */}
            {errorMsg && <p className="text-red-600">{errorMsg}</p>}

            {/* ------------------ Photo Preview ------------------ */}
            <div className="w-full aspect-video rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* ------------------ Camera Selector ------------------ */}
            <select
              className="w-full p-2 mt-2 rounded border border-back text-sm text-[var(--text-color)]"
              value={selectedCamera}
              onChange={(e) => handleCameraChange(e.target.value)}
            >
              {cameras.map((c) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || "Unknown camera"}
                </option>
              ))}
            </select>

            {/* ------------------ Buttons ------------------ */}
            <div className="flex justify-center gap-3 w-full mt-2">
              {/* Capture Button */}
              <button
                onClick={takePhoto}
                className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
              >
                Capture Photo
              </button>

              {/* Send Button */}
              <button
                onClick={handleSendPhoto}
                disabled={photos.length === 0 || uploading}
                className={`w-1/2 text-white font-bold py-2 px-4 rounded ${
                  photos.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                Send Photo(s)
              </button>
            </div>

            {/* ------------------ Auto Ticket Status ------------------ */}
            {autoTicketStatus !== 'idle' && (
              <div className="mt-4 text-center">
                <p className={`text-sm ${
                  autoTicketStatus === 'success' ? 'text-green-600' : 
                  autoTicketStatus === 'failed' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {autoTicketStatus === 'generating' ? 'Generating ticket...' : 
                  autoTicketStatus === 'success' ? 'Ticket generated successfully!' : 
                  'Failed to generate ticket'}
                </p>
              </div>
            )}

            {autoTicketStatus === 'generating' && (
              <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg text-center">
                🤖 AI is analyzing your photo and creating a ticket...
              </div>
            )}

            {autoTicketStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
                ✅ Ticket automatically created from your photo!
              </div>
            )}

            {autoTicketStatus === 'failed' && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-center">
                ⚠️ Photo uploaded successfully, but automatic ticket creation failed. You can create a ticket manually.
              </div>
            )}

          </div>
          
          {/* ------------------ Photo Gallery ------------------ */}
          {photos.length > 0 && (
            <div className="w-full max-w-xl h-64 overflow-y-auto mt-4 bg-white rounded-lg p-4 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                {photos.map((src, index) => (
                  <div key={index} className="relative">
                    <img
                      src={src}
                      alt={`Captured ${index}`}
                      className="rounded shadow-md object-cover w-full"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow-md"
                      aria-label="Delete photo"
                    >
                      <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
