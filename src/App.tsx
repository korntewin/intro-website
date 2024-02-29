import { useState, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/home.page';
import AboutMe from './pages/aboutme.page';
import ProjectPage from './pages/projects.page';
import AboutMyCat from './pages/mycat.page';
import useStore from './store';
import { useShallow } from 'zustand/react/shallow';


function App() {

  const onScrollHandler = useStore(useShallow(state => state.onScrollHandler));

  useEffect(() => {
      window.addEventListener('scroll', onScrollHandler);
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/about" element={<AboutMe />}></Route>
        <Route path="/project" element={<ProjectPage />}></Route>
        <Route path="/mycat" element={<AboutMyCat />}></Route>
      </Routes>

    </HashRouter>
  );
}

export default App;
