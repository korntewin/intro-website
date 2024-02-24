import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/homepage';
import TestHomePage from './pages/testhomepage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/about" element={<div> ggwp </div>}></Route>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/testhomepage" element={<TestHomePage />}></Route>
      </Routes>

    </BrowserRouter>
  );
}

export default App;
