import { BrowserRouter as Router, Routes, Route, } from "react-router-dom"
import LoginView from './views/LoginView'
import SupervisorTicketView from './views/SupervisorTicketView'
import WorkerView from "./views/WorkerView"

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginView />} />
        <Route path="/supervisor" element={<SupervisorTicketView />} />
        <Route path="/worker" element={<WorkerView />} />
      </Routes>
    </Router>
  )
}

export default App
