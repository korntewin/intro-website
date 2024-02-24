import React, { useState } from 'react';
import styled from 'styled-components';
import { FaGithub, FaLinkedin, FaBars } from 'react-icons/fa';

const RustColor = '#B7410E';
const SIDE_BAR_WIDTH = 200;

const Navbar = styled.nav`
  display: flex;
  justify-content: space-between;
  padding: 1em;
  background-color: ${RustColor};
  position: sticky;
  top: 0;
`;

const Hamburger = styled(FaBars)`
  font-size: 1.5em;
`;

const Icon = styled.a`
  color: white;
  margin: 0 1em;
  text-decoration: none;
`;

const Body = styled.div`
    padding: 1em;
    color: ${RustColor};
    margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 50}px` : '0'};
    transition: margin-left 0.3s ease;
`;

const Sidebar = styled.aside`
  position: fixed;
  width: ${SIDE_BAR_WIDTH}px;
  height: 100vh;
  background-color: #f5f5f5;
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease;
  padding: 20px;
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function TestHomePage() {

    const [open, setOpen] = useState(false);
    const numbers = Array.from({length: 100}, (_, i) => i + 1);

  return (
    <div>
      <Navbar>
        <Hamburger onClick={() => setOpen(!open)}/>
        <div>
          <Icon href="https://github.com/korntewin" target="_blank" rel="noopener noreferrer">
            <FaGithub size="1.5em" />
          </Icon>
          <Icon href="https://linkedin.com/in/korntewin" target="_blank" rel="noopener noreferrer">
            <FaLinkedin size="1.5em" />
          </Icon>
        </div>
      </Navbar>
    <Sidebar isOpen={open}>
        <SidebarContent>
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
          <a href="#">Link 3</a>
          {/* Add more links as needed */}
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