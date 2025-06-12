import newDesign from "../assets/image_no_bg_left_screen.png";
import LogoutModal from "../components/LogoutModal";
import { usePhotoCapture } from "../hooks/PhotoHook";
import { useNavigate } from "react-router-dom";



export default function PhotoView() {
  const navigate = useNavigate();

  const {
    videoRef,
    canvasRef,
    photos,
    cameras,
    selectedCamera,
    errorMsg,
    handleCameraChange,
    takePhoto,
    clearPhotos,
    handleSendPhoto,
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
                disabled={photos.length === 0}
                className={`w-1/2 text-white font-bold py-2 px-4 rounded ${
                  photos.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                Send Photo(s)
              </button>
            </div>

          </div>
          {/* ------------------ Photo Gallery ------------------ */}
          {photos.length > 0 && (
            <div className="w-full max-w-xl h-64 overflow-y-auto mt-4 bg-white rounded-lg p-4 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                {photos.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`Captured ${index}`}
                    className="rounded shadow-md object-cover w-full"
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
