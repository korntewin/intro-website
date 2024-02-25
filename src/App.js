import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/home.page';
import AboutMe from './pages/aboutme.page';


const BASENAME = process.env.PUBLIC_URL;


function App() {

  const [open, setOpen] = useState(false);

  return (
    <BrowserRouter basename={`/${BASENAME}`}>
      <Routes>
        <Route path="/" element={<HomePage isSidebarOpen={open} setSideBarOpen={setOpen}/>}></Route>
        <Route path="/about" element={<AboutMe isSidebarOpen={open} setSideBarOpen={setOpen}/>}></Route>
      </Routes>

    </BrowserRouter>
  );
}

export default App;
