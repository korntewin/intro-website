import React, { useEffect, useState } from 'react';
import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/cats-playground.jpg';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import path from '../contents/mycat.md';

export default function AboutMyCat({ isSidebarOpen, setSideBarOpen }) {

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
            navbar_welcomemsg={"As you wondered around the village, you found playground full of cats!"}
        >
            <FigureComponent src={pixelart} caption="Pixel Art Generated from Copilot!"/>
            <PixelArtH2>Kao Neow (baby white cat): Meow  ...Mrr </PixelArtH2>
            <Markdown remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown>
        </HomePageLayout>
    );
};
