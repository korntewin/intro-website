import styled from 'styled-components';
import { FaGithub, FaLinkedin, FaBars } from 'react-icons/fa';

const SIDE_BAR_WIDTH = 200;

const Navbar = styled.nav`
    display: flex;
    justify-content: space-between;
    padding: 1em 0.5em 0.5em 1.5em;
    background-color: hsl(60, 9%, 87%);
    position: sticky;
    margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 40}px` : '0'};
    transition: margin-left 0.3s ease;
`;

const Hamburger = styled(FaBars)`
  font-size: 1em;
  cursor: pointer;
`;

const Icon = styled.a`
  color: gray;
  margin: 0 1em;
  text-decoration: none;
`;

const NavigationBar = ({ open, setOpen }) => {

  return (
    <div>
      <Navbar isSidebarOpen={open}>
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
    </div>
  );
}

export default NavigationBar;