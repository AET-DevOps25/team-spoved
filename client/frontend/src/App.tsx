import { BrowserRouter as Router, Routes, Route, } from "react-router-dom"
import LoginView from './views/LoginView'
import SupervisorTicketView from './views/SupervisorTicketView'
import WorkerView from "./views/WorkerView"
import PhotoView from "./views/PhotoView"
import VideoRecordingView from "./views/VideoRecordingView"
import WorkerTicketView from "./views/WorkerTicketView"
import MicrophoneView from "./views/MicrophoneView"
function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginView />} />
        <Route path="/supervisor" element={<SupervisorTicketView />} />
        <Route path="/worker" element={<WorkerView />} />
        <Route path="/worker/camera" element={<PhotoView />} />
        <Route path="/worker/videoRecording" element={<VideoRecordingView />} />
        <Route path="/worker/tickets" element={<WorkerTicketView />} />
        <Route path="/worker/microphone" element={<MicrophoneView />} />
      </Routes>
    </Router>
  )
}

export default App
