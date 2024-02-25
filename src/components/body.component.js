import styled from 'styled-components';
import { SIDE_BAR_WIDTH } from '../components/sidebar.component';

const Body = styled.div`
    padding: 0.1em 10em 5em 10em;
    margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 40}px` : '0'};
    transition: margin-left 0.3s ease;
    background-color: hsl(60, 9%, 87%);
    min-height: 100vh;
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