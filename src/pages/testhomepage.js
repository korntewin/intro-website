import React, { useState } from 'react';
import styled from 'styled-components';
import NavigationBar from '../components/navbar.component';
import SideBarComponent from '../components/sidebar.component';
import { SIDE_BAR_WIDTH } from '../components/sidebar.component';

const Body = styled.div`
    padding: 0.1em 5em 0em 5em;
    margin-left: ${props => props.isSidebarOpen ? `${SIDE_BAR_WIDTH + 40}px` : '0'};
    transition: margin-left 0.3s ease;
    background-color: hsl(60, 9%, 87%);
`;

function TestHomePage() {

    const [open, setOpen] = useState(false);
    const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

    return (
        <div>
            <NavigationBar open={open} setOpen={setOpen} />
            <SideBarComponent open={open} />
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