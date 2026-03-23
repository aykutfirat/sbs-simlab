import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SinglePlayerApp from './SinglePlayerApp';
import ModeSelectScreen from './components/multiplayer/ModeSelectScreen';
import InstructorCreateGame from './components/multiplayer/InstructorCreateGame';
import InstructorDashboard from './components/multiplayer/InstructorDashboard';
import TeamJoinScreen from './components/multiplayer/TeamJoinScreen';
import TeamGameView from './components/multiplayer/TeamGameView';
import ComparativeDebrief from './components/multiplayer/ComparativeDebrief';

function App() {
  return (
    <BrowserRouter basename="/people-express">
      <Routes>
        <Route path="/" element={<ModeSelectScreen />} />
        <Route path="/play" element={<SinglePlayerApp />} />
        <Route path="/multiplayer/create" element={<InstructorCreateGame />} />
        <Route path="/multiplayer/instructor/:gameCode" element={<InstructorDashboard />} />
        <Route path="/multiplayer/join" element={<TeamJoinScreen />} />
        <Route path="/multiplayer/team/:gameCode/:teamName" element={<TeamGameView />} />
        <Route path="/multiplayer/debrief/:gameCode" element={<ComparativeDebrief />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
