import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SinglePlayerGame } from './components/SinglePlayerGame';
import { InstructorCreate } from './components/multiplayer/InstructorCreate';
import { InstructorDashboard } from './components/multiplayer/InstructorDashboard';
import { StudentJoin } from './components/multiplayer/StudentJoin';
import { MultiplayerGame } from './components/multiplayer/MultiplayerGame';

export default function App() {
  return (
    <BrowserRouter basename="/newsvendor">
      <Routes>
        {/* Single player */}
        <Route path="/" element={<SinglePlayerGame />} />

        {/* Multiplayer */}
        <Route path="/multiplayer/create" element={<InstructorCreate />} />
        <Route path="/multiplayer/instructor/:gameCode" element={<InstructorDashboard />} />
        <Route path="/multiplayer/join" element={<StudentJoin />} />
        <Route path="/multiplayer/play/:gameCode/:playerName" element={<MultiplayerGame />} />
      </Routes>
    </BrowserRouter>
  );
}
