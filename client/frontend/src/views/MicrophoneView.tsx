import newDesign from "../assets/image_no_bg_left_screen.png"
import LogoutModal from "../components/LogoutModal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faStop, faTrash, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useVoiceToVoice } from "../hooks/MicrophoneHook";

export default function MicrophoneView() {
  const {
    messages,
    isRecording,
    isPlaying,
    errorMsg,
    completed,
    startVoiceConversation,
    stopRecording,
    clearConversation,
    handleSendMessage,
  } = useVoiceToVoice();


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

        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-700 mb-8">Voice Assistant</h1>

          {/* ------------------ Conversation Display ------------------ */}
          <div className="w-full bg-white rounded-lg shadow-lg p-6 mb-8 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">
                Press the record button to start a voice conversation
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ------------------ Error Message ------------------ */}
          {errorMsg && (
            <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errorMsg}
            </div>
          )}

          {/* ------------------ Control Buttons ------------------ */}
          <div className="flex gap-4 items-center">
            {/* ------------------ Record Button ------------------ */}
            <button
              onClick={startVoiceConversation}
              disabled={isRecording || isPlaying}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all ${
                isRecording || isPlaying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
              }`}
            >
              <FontAwesomeIcon icon={faMicrophone} />
            </button>

            {/* ------------------ Stop Button ------------------ */}
            {(isRecording || isPlaying) && (
              <button
                onClick={stopRecording}
                className="w-20 h-20 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-2xl shadow-lg transition-all hover:scale-105"
              >
                <FontAwesomeIcon icon={faStop} />
              </button>
            )}

            {/* ------------------ Clear Button ------------------ */}
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                disabled={isRecording || isPlaying}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all ${
                  isRecording || isPlaying
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
                }`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}

            {/* ------------------ Send Button ------------------ */}
          {completed && (
            <button
              onClick={handleSendMessage}
              disabled={!completed}
              className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          )}

          </div>


          {/* ------------------ Status Indicator ------------------ */}
          <div className="mt-6 text-center">
            {isPlaying && (
              <p className="text-blue-600 font-semibold">🔊 System is speaking...</p>
            )}
            {isRecording && (
              <p className="text-red-600 font-semibold animate-pulse">🎤 Listening...</p>
            )}
            {!isRecording && !isPlaying && messages.length > 0 && !completed && (
              <p className="text-green-600 font-semibold">✓ Ready for next interaction</p>
            )}
            {completed && (
              <p className="text-green-600 font-semibold">✓ Conversation completed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
