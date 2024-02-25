import React, { useEffect, useState } from 'react';
import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/cats-playground.jpg';

export default function AboutMyCat({ isSidebarOpen, setSideBarOpen }) {

    return (
        <HomePageLayout
            open={isSidebarOpen}
            setOpen={setSideBarOpen}
            navbar_welcomemsg={"As you wondered around the village, you found playground full of cats!"}
        >
            <FigureComponent src={pixelart} caption="Pixel Art Generated from Copilot!" />
            <PixelArtH2>Kao Neow (baby white cat): Meow  ...Mrr </PixelArtH2>

            <h1> My Adorable Kao Neow: From Wounded Kitten to Energetic Feline </h1>
            <img src="https://raw.githubusercontent.com/korntewin/intro-website/main/src/pics/kao-neow-is-adorable.jpg" width="300em" height="auto" />

            <h2> Introduction </h2>
            <p> Meet Kao Neow, my beloved feline companion. His name, inspired by the fragrant Thai sticky rice, perfectly suits his sweet and endearing personality. But don't let the name fool you—this little guy has been through quite the journey.</p>

            <h2>A Rough Start</h2>
            <img src="https://raw.githubusercontent.com/korntewin/intro-website/main/src/pics/kao-neow-firstmet.jpg" width="300em" height="auto" />
            <p>Kao Neow was born on a crisp October morning in 2022. His tiny white fur glowed like freshly fallen snow. But life wasn't kind to him from the beginning. When I adopted him in November of the same year, he bore the scars of a tough life on the streets. His left ear was tattered, and his hind leg had a nasty bite wound. </p>

            <h2>Nursing Back to Health</h2>
            <img src="https://raw.githubusercontent.com/korntewin/intro-website/main/src/pics/kao-neow-medical.jpg" width="300em" height="auto" />
            <p>I knew I had to step up and care for this little fighter. The first few weeks were challenging. I delicately cleaned his wound, applying antiseptic with trembling hands. He'd wince, but those bright blue eyes never lost their trust in me. Feeding him kitten milk was a delicate dance—I'd cradle him in my arms, and he'd nuzzle the bottle with fervor.</p>

            <h2>Bonding Through Healing</h2>
            <img src="https://raw.githubusercontent.com/korntewin/intro-website/main/src/pics/kao-neow-is-better.jpg" width="300em" height="auto" />
            <p>As Kao Neow healed, our bond grew stronger. He'd curl up on my lap while I worked from home, his purring vibrating through my chest. We'd share secrets—the rustling leaves outside our window, the distant hum of traffic—and I'd marvel at how this little creature had become my confidant.</p>

            <h2>The Transformation</h2>
            <p>Fast forward to today: Kao Neow is no longer a fragile kitten but a robust cat with boundless energy. His once-bitten leg now propels him into daring leaps across the living room. He's mastered the art of knocking things off shelves (much to my chagrin), and his playful antics keep me laughing even on the toughest days.</p>

            <h2>Adventures Together</h2>
            <img src="https://raw.githubusercontent.com/korntewin/intro-website/main/src/pics/kao-neow-is-cheeky.jpg" width="300em" height="auto" />
            <p>We've explored sun-drenched windowsills, chased laser pointers until we were both breathless, and shared lazy afternoons watching birds flutter by. Kao Neow's curiosity knows no bounds—he investigates every bag I bring home from the grocery store and insists on inspecting my laptop keyboard during Zoom meetings.</p>

            <h2>Conclusion</h2>
            <p>Kao Neow has taught me resilience, compassion, and the joy of second chances. His journey from wounded kitten to energetic feline mirrors our own paths—filled with challenges, healing, and newfound strength. So here's to you, my sweet Kao Neow: may your days be filled with sunshine, cuddles, and endless adventures.</p>
        </HomePageLayout>
    );
};
