import { BrowserRouter, Routes, Route } from 'react-router-dom';
import JoinScreen from './components/student/JoinScreen';
import StudentGame from './components/student/StudentGame';
import Dashboard from './components/instructor/Dashboard';
import DebriefDashboard from './components/debrief/DebriefDashboard';

function App() {
  return (
    <BrowserRouter basename="/moon-survival">
      <Routes>
        <Route path="/" element={<JoinScreen />} />
        <Route path="/play/:roomCode/:playerName" element={<StudentGame />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/debrief/:roomCode" element={<DebriefDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
