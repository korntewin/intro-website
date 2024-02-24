import React from 'react';
import styled from 'styled-components';

const RustColor = '#3b2e2a';
const SIDE_BAR_WIDTH = 200;

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
`;

const SideBarComponent = ({ open }) => {

  return (
    <div>
        <Sidebar isOpen={open}>
            <SidebarContent>
                <StyledLink href='/about'>Link 1</StyledLink>
                <StyledLink href='/'>Link 2</StyledLink>
                <StyledLink href='/testhomepage'>Link 3</StyledLink>
            </SidebarContent>
        </Sidebar>
    </div>
  );
};

export default SideBarComponent;
export {SIDE_BAR_WIDTH};