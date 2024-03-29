import styled from "styled-components";
import { FaGithub, FaLinkedin, FaBars } from "react-icons/fa";
import { SIDE_BAR_WIDTH } from "./sidebar.component";
import { PixelArtBold } from "./pixelart.component.";
import { SM_BREAKPOINT } from "../config";
import useStore from "../store";
import { useShallow } from "zustand/react/shallow";

type NavBarProps = {
  isSidebarOpen: boolean;
  isNavOpen: boolean;
};

const Navbar = styled.nav<NavBarProps>`
  display: flex;
  justify-content: space-between;
  padding: 1em 0.5em 0em 1.5em;
  background-color: hsl(60, 9%, 87%);
  position: sticky;
  top: 0;
  margin-left: ${(props) =>
    props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 40}px` : "0"};
  transition: margin-left 0.3s ease;
  transform: ${(props) =>
    props.isNavOpen ? "translateY(0)" : "translateY(-100%)"};
  transition: transform 0.3s ease;
`;

const Hamburger = styled(FaBars)`
  font-size: 1.5em;
  cursor: pointer;

  @media (max-width: ${SM_BREAKPOINT}px) {
    font-size: 3em;
    cursor: pointer;
  }
`;

const Icon = styled.a`
  color: gray;
  margin: 0 1em;
  text-decoration: none;
`;

const NavigationBar = ({ welcomemsg }: { welcomemsg: String }) => {
  const [isSideBarOpen, openSideBar, closeSideBar, isNavOpen] = useStore(
    useShallow((state) => [
      state.isSideBarOpen,
      state.openSideBar,
      state.closeSideBar,
      state.isNavOpen,
    ]),
  );

  return (
    <Navbar isSidebarOpen={isSideBarOpen} isNavOpen={isNavOpen}>
      <Hamburger
        onClick={() => (isSideBarOpen ? closeSideBar() : openSideBar())}
      />
      <PixelArtBold color="gray">{welcomemsg}</PixelArtBold>
      <div>
        <Icon
          href="https://github.com/korntewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub size="1.5em" />
        </Icon>
        <Icon
          href="https://linkedin.com/in/korntewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaLinkedin size="1.5em" />
        </Icon>
      </div>
    </Navbar>
  );
};

export default NavigationBar;
