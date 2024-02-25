import React, { useEffect, useState } from 'react';
import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/korn-pixel-art.jpg';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import path from '../contents/aboutme.md';

export default function AboutMe({ isSidebarOpen, setSideBarOpen }) {

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
            navbar_welcomemsg={"You met with Korn, he is a friendly villager!"}
        >
            <FigureComponent src={pixelart} caption="Pixel Art Generated from Copilot!"/>
            <PixelArtH2>Korn: Hi there, welcome to the village! Well...</PixelArtH2>
            <Markdown remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown>
        </HomePageLayout>
    );
};
