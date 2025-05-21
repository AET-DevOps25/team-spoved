import { BrowserRouter as Router, Routes, Route, } from "react-router-dom"
import LoginView from './views/LoginView'
import SupervisorView from './views/SupervisorView'
import WorkerView from "./views/WorkerView"

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginView />} />
        <Route path="/supervisor" element={<SupervisorView />} />
        <Route path="/worker" element={<WorkerView />} />
      </Routes>
    </Router>
  )
}

export default App
