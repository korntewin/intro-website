import React from 'react';
import styled from 'styled-components';
import { PixelArtBold } from './pixelart.component.';
import { Link } from 'react-router-dom';
import useStore from '../store';
import { useShallow } from 'zustand/react/shallow';

const RustColor = '#3b2e2a';
const SIDE_BAR_WIDTH = 250;

const Sidebar = styled.aside`
  position: fixed;
  top: 0;
  background-color: ${RustColor}; 
  width: ${SIDE_BAR_WIDTH}px;
  min-height: 100vh;
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease;
  padding: 20px;
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const LinkStyle = {
  color: "#c8c9db",
  fontFamily: "'Press Start 2P', cursive",
  fontSize: "0.7em",
};

const SideBarComponent = () => {

  const [isSideBarOpen, closeSideBar] = useStore(useShallow(state => [state.isSideBarOpen, state.closeSideBar]));

  return (
    <div>
        <Sidebar isOpen={isSideBarOpen}>
            <SidebarContent>
                <PixelArtBold color="white"> Village Map </PixelArtBold>
                <Link to="/" style={LinkStyle} onClick={closeSideBar}>Village Entrance</Link>
                <Link to="/about" style={LinkStyle} onClick={closeSideBar}>Korn's House</Link>
                <Link to="/project" style={LinkStyle} onClick={closeSideBar}>Project Bulletin Board</Link>
                <Link to="/mycat" style={LinkStyle} onClick={closeSideBar}>Cats' Playground</Link>
            </SidebarContent>
        </Sidebar>
    </div>
  );
};

export default SideBarComponent;
export {SIDE_BAR_WIDTH};