import styled from 'styled-components';
import { SIDE_BAR_WIDTH } from '../components/sidebar.component';
import { SM_BREAKPOINT } from '../config';

const Body = styled.div`
    padding: 0.1em 5em 5em 5em;
    margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 40}px` : '0'};
    transition: margin-left 0.3s ease;
    background-color: hsl(60, 9%, 87%);
    min-height: 100vh;

    @media (max-width: ${SM_BREAKPOINT}px) {
        padding: 0.1em 1em 1em 1em;
        margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 40}px` : '0'};
        transition: margin-left 0.3s ease;
        background-color: hsl(60, 9%, 87%);
        min-height: 100vh;
    }
`;

const BodyComponent = ({ children, open, setOpen}) => {

    return (
        <div>
            <Body isSidebarOpen={open} onClick={() => setOpen(false)}>
                {children}
            </Body>
        </div>
    );
}

export default BodyComponent;