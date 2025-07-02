import { useRef, useEffect } from "react";
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
    recordingTimeLeft,
    audioLevel,
    startVoiceConversation,
    stopRecording,
    clearConversation,
    handleSendMessage,
  } = useVoiceToVoice();

  // Ref for the scrollable message container
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

        <div className="flex flex-col items-center justify-start h-full w-full px-4 mx-auto max-w-2xl mt-24">
          <h1 className="text-3xl font-bold text-gray-700 mb-8">Voice Assistant</h1>

          {/* ------------------ Conversation Display ------------------ */}
          <div className="w-full h-96 bg-gray-50 rounded-lg shadow-lg p-4 mb-8 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-center">
                  Press the record button to start a voice conversation
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* System/AI Message - Left Side */}
                    {message.type === 'system' && (
                      <div className="flex items-start space-x-2 max-w-[60%]">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                          <p className="text-gray-800 text-sm leading-relaxed break-words">
                            {message.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* User Message - Right Side */}
                    {message.type === 'user' && (
                      <div className="flex items-start space-x-2 max-w-[60%]">
                        <div className="bg-blue-500 rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                          <p className="text-white text-sm leading-relaxed break-words">
                            {message.text}
                          </p>
                          <p className="text-xs text-blue-100 mt-1 text-right">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">You</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Invisible div to scroll to */}
                <div ref={messagesEndRef} />
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
              <div>
                <p className="text-red-600 font-semibold animate-pulse">
                  🎤 Listening... ({recordingTimeLeft}s remaining)
                </p>
                {/* Audio level indicator */}
                <div className="mt-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">Audio level:</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-100 ${
                          audioLevel > 30 ? 'bg-green-500' : 
                          audioLevel > 10 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{audioLevel}</span>
                  </div>
                  {audioLevel < 5 && (
                    <p className="text-orange-500 text-sm mt-1">
                      Speak louder - very low audio detected
                    </p>
                  )}
                </div>
                {recordingTimeLeft <= 5 && (
                  <p className="text-orange-500 text-sm mt-1 animate-pulse">
                    Recording will stop soon!
                  </p>
                )}
              </div>
            )}
            {!isRecording && !isPlaying && messages.length > 0 && !completed && (
              <p className="text-green-600 font-semibold">✓ Ready for next interaction</p>
            )}
            {completed && !isRecording && !isPlaying && messages.length > 0 && (
              <p className="text-green-600 font-semibold">✓ Conversation completed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
