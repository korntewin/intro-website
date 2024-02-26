import { useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/home.page';
import AboutMe from './pages/aboutme.page';
import ProjectPage from './pages/projects.page';
import AboutMyCat from './pages/mycat.page';


function App() {

  const [open, setOpen] = useState(false);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage isSidebarOpen={open} setSideBarOpen={setOpen}/>}></Route>
        <Route path="/about" element={<AboutMe isSidebarOpen={open} setSideBarOpen={setOpen}/>}></Route>
        <Route path="/project" element={<ProjectPage isSidebarOpen={open} setSideBarOpen={setOpen}/>}></Route>
        <Route path="/mycat" element={<AboutMyCat isSidebarOpen={open} setSideBarOpen={setOpen}/>}></Route>
      </Routes>

    </HashRouter>
  );
}

export default App;