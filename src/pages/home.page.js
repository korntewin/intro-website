import React, { useEffect, useState } from 'react';
import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import Image from '../components/img.component';
import pixelart from '../pics/homepage-pixel-art.jpg';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hompageContentPath from '../contents/homepage.md';

export default function HomePage({ isSidebarOpen, setSideBarOpen }) {

    const [markdown, setMarkdown] = useState('');

    useEffect(() => {
        fetch(hompageContentPath)
            .then(response => response.text())
            .then(text => setMarkdown(text));
    }, [])

    return (
        <HomePageLayout open={isSidebarOpen} setOpen={setSideBarOpen} navbar_welcomemsg={"You are entering my small village!"}>
            <Image src={pixelart}></Image>
            <PixelArtH2>Welcome to My Personal Website!</PixelArtH2>
            <Markdown remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown>
        </HomePageLayout>
    );
};