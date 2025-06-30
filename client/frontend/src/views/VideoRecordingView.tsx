import newDesign from '../assets/image_no_bg_left_screen.png'
import LogoutModal from '../components/LogoutModal'
import { useNavigate } from 'react-router-dom'
import { useVideoRecorder } from '../hooks/VideoHook'

const VideoRecordingView = () => {

  const navigate = useNavigate()

  const {
    videoRef,
    cameras,
    selectedCamera,
    isRecording,
    isPreviewMode,
    previewUrl,
    uploading,
    errorMsg,
    startRecording,
    stopRecording,
    handleCameraChange,
    handleSendVideo,
    handleReRecord,
  } = useVideoRecorder(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/worker');
  })


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

          {/* ------------------ Video Recording Container ------------------ */}
          <div className="flex flex-col items-center gap-6 w-full max-w-xl bg-white rounded-2xl p-8 shadow-xl mx-auto">

            {/* ------------------ Container Title ------------------ */}
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 text-center mb-4 mt-4">
              {isPreviewMode
                ? "Preview of the Video"
                : "Take a Video"}
            </h2>

            {/* ------------------ Error Message ------------------ */}
            {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

            {/* ------------------ Video Preview ------------------ */}
            <div className="relative w-full aspect-video max-w-full rounded-lg">
              <video
                ref={videoRef}
                className="relative top-0 left-0 w-full h-full"
                autoPlay
                playsInline
                controls={isPreviewMode}
                src={isPreviewMode && previewUrl ? previewUrl : undefined}
                onPlay={() => {
                  if (isPreviewMode && videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              />
            </div>


            {/* ------------------ Camera Selection and Recording Controls ------------------ */}
            {!isPreviewMode ? (
              <>
                <select
                  className="w-full mt-2 p-2 rounded border border-back text-sm text-[var(--text-color)]"
                  value={selectedCamera}
                  onChange={(e) => handleCameraChange(e.target.value)}
                >
                  {cameras.map((c: MediaDeviceInfo) => (
                    <option key={c.deviceId} value={c.deviceId}>
                      {c.label || "Unknown camera"}
                    </option>
                  ))}
                </select>

                {/* ------------------ Recording Buttons ------------------ */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploading}
                  className={`mt-4 w-full rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${isRecording
                      ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
                      : 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {
                    uploading
                      ? "Upload"
                      : isRecording
                        ? "Stop recording"
                        : "Start recording"
                  }
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-center">

                {/* ------------------ Retake Button ------------------ */}
                <button
                  onClick={handleReRecord}
                  disabled={uploading}
                  className={`w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${uploading
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                >
                  Retake
                </button>

                {/* ------------------ Send Video Button ------------------ */}
                <button
                  onClick={handleSendVideo}
                  disabled={uploading}
                  className={`w-full sm:w-auto rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${uploading
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                >
                  {uploading
                    ? "Upload"
                    : "Send"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoRecordingView;

