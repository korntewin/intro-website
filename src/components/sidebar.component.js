import React from 'react';
import styled from 'styled-components';
import { PixelArtBold } from './pixelart.component.';

const RustColor = '#3b2e2a';
const SIDE_BAR_WIDTH = 250;
const BASENAME = process.env.PUBLIC_URL;

const Sidebar = styled.aside`
  position: fixed;
  top: 0;
  background-color: ${RustColor}; 
  width: ${SIDE_BAR_WIDTH}px;
  height: 100vh;
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease;
  padding: 20px;
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StyledLink = styled.a`
  color: #c8c9db;
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  font-size: 0.7em;
`;

const SideBarComponent = ({ open }) => {

  return (
    <div>
        <Sidebar isOpen={open}>
            <SidebarContent>
                <PixelArtBold color="white"> Village Map </PixelArtBold>
                <StyledLink href={`${BASENAME}`}>Village Entrance</StyledLink>
                <StyledLink href={`${BASENAME}/about`}>Korn's House</StyledLink>
                <StyledLink href={`${BASENAME}/experience`}>Guild Post Experience</StyledLink>
                <StyledLink href={`${BASENAME}/projects`}>Korn's Training Ground</StyledLink>
                <StyledLink href={`${BASENAME}/mycat`}>Play with Cat</StyledLink>
            </SidebarContent>
        </Sidebar>
    </div>
  );
};

export default SideBarComponent;
export {SIDE_BAR_WIDTH};