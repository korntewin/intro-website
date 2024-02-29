import { useEffect, useState } from 'react';
import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/korn-pixel-art.jpg';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'
import path from '../contents/aboutme.md';

export default function AboutMe() {

    const [markdown, setMarkdown] = useState('');

    useEffect(() => {
        fetch(path)
            .then(response => response.text())
            .then(text => setMarkdown(text));
    }, [])

    return (
        <HomePageLayout 
            navbar_welcomemsg={"You meet with Korn, he is a friendly villager!"}
        >
            <FigureComponent src={pixelart} caption="Pixel Art Generated from Copilot!"/>
            <PixelArtH2>Korn: Hi there, welcome to the village! Well...</PixelArtH2>
            <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                {markdown}
            </Markdown>
        </HomePageLayout>
    );
};
