import React, { useEffect, useState } from 'react';
import HomePageLayout from '../../layouts/homepage.layout';
import PixelArtH2 from '../../components/pixelart.component.';
import FigureComponent from '../../components/img.component';
import pixelart from '../../pics/homepage-pixel-art.jpg';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


const URL = "https://raw.githubusercontent.com/korntewin/yolo-wasm/main/README.md";

export default function YoloWasmProject({ isSidebarOpen, setSideBarOpen }) {

    const [markdown, setMarkdown] = useState('');

    useEffect(() => {
        fetch(URL)
            .then(response => response.text())
            .then(text => setMarkdown(text));
    }, [])

    return (
        <HomePageLayout
            open={isSidebarOpen}
            setOpen={setSideBarOpen}
            navbar_welcomemsg={"You are entering small korn's village!"}
        >
            <FigureComponent src={pixelart} caption="Pixel Art Generated from Copilot!" />
            <PixelArtH2>Villagers: Welcome to Korn's Village!</PixelArtH2>
            <Markdown remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown>
        </HomePageLayout>
    );
};