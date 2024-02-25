import React, { useEffect, useState } from 'react';
import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/bulletin-board-pixel-art.jpg';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import path from '../contents/aboutme.md';

export default function ProjectPage({ isSidebarOpen, setSideBarOpen }) {

    const [markdown, setMarkdown] = useState('');

    useEffect(() => {
        fetch(path)
            .then(response => response.text())
            .then(text => setMarkdown(text));
    }, [])

    return (
        <HomePageLayout 
            open={isSidebarOpen} 
            setOpen={setSideBarOpen} 
            navbar_welcomemsg={"You are at Village's bulletin board, looking at the finished project!"}
        >
            <FigureComponent src={pixelart} caption="Pixel Art Generated from Copilot!"/>
            <PixelArtH2>Someone nearby: All of the Korn's finished quest are posted here.</PixelArtH2>
            {/* <Markdown remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown> */}
        </HomePageLayout>
    );
};
