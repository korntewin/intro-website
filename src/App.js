import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/homepage';
import TestHomePage from './pages/testhomepage';


const BASENAME = process.env.PUBLIC_URL;


function App() {
  return (
    <BrowserRouter basename={`/${BASENAME}`}>
      <Routes>
        <Route path="/about" element={<div> ggwp </div>}></Route>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/testhomepage" element={<TestHomePage />}></Route>
      </Routes>

    </BrowserRouter>
  );
}

export default App;
