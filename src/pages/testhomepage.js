import React, { useState } from 'react';
import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import Image from '../components/img.component';
import pixelart from '../pics/homepage-pixel-art.jpg';

function TestHomePage() {

    const [open, setOpen] = useState(false);
    const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

    return (
        <div>
            <HomePageLayout open={open} setOpen={setOpen}>
                <Image src={pixelart}></Image>
                <PixelArtH2>Welcome to My Personal Website!</PixelArtH2>
                <p>This is where I'll introduce myself.</p>
                {numbers.map((index) => (
                    <div>{index}</div>
                ))}
            </HomePageLayout>
        </div>
    );
}

export default TestHomePage;