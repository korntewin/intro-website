import styled from 'styled-components';
import { SIDE_BAR_WIDTH } from '../components/sidebar.component';

const Body = styled.div`
    padding: 0.1em 5em 0em 5em;
    margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 40}px` : '0'};
    transition: margin-left 0.3s ease;
    background-color: hsl(60, 9%, 87%);
`;

const BodyComponent = ({ children, open }) => {

    return (
        <div>
            <Body isSidebarOpen={open}>
                {children}
            </Body>
        </div>
    );
}

export default BodyComponent;