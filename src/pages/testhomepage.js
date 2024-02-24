import React, { useState } from 'react';
import styled from 'styled-components';
import NavigationBar from '../components/navbar.component';

const RustColor = '#3b2e2a';
const SIDE_BAR_WIDTH = 200;

const Body = styled.div`
    padding: 1em;
    margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 50}px` : '0'};
    transition: margin-left 0.3s ease;
    background-color: hsl(60, 9%, 87%);
`;

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

function TestHomePage() {

    const [open, setOpen] = useState(false);
    const numbers = Array.from({length: 100}, (_, i) => i + 1);

  return (
    <div>
    <NavigationBar open={open} setOpen={setOpen} />
    <Sidebar isOpen={open}>
        <SidebarContent>
            <StyledLink href='#'>Link 1</StyledLink>
            <StyledLink href='#'>Link 2</StyledLink>
            <StyledLink href='#'>Link 3</StyledLink>
        </SidebarContent>
      </Sidebar>
      <Body isSidebarOpen={open}>
        <h1>Welcome to My Personal Website</h1>
        <p>This is where I'll introduce myself.</p>
            {numbers.map((index) => (
                <div>index</div>
            ))}
      </Body>
    </div>
  );
}

export default TestHomePage;