import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/bulletin-board-pixel-art.jpg';
import BoardComponent, { Box, Image, Summary } from '../components/board.component';

import imgProj1 from '../pics/bulletin-board-pixel-art.jpg';

const boxes = [
  // Add your box data here
  // { image: 'image_url', summary: 'summary text', link: 'page_link' }
  { image: imgProj1, summary: "YOLOv8 Rendering on Browser using Rust's WebAssembly", link: ""},
  { image: imgProj1, summary: "YOLOv8 Rendering on Browser using Rust's WebAssembly", link: ""},
  { image: imgProj1, summary: "YOLOv8 Rendering on Browser using Rust's WebAssembly", link: ""},
  { image: imgProj1, summary: "YOLOv8 Rendering on Browser using Rust's WebAssembly", link: ""},
  { image: imgProj1, summary: "YOLOv8 Rendering on Browser using Rust's WebAssembly", link: ""},
  { image: imgProj1, summary: "YOLOv8 Rendering on Browser using Rust's WebAssembly", link: ""},
];


export default function ProjectPage({ isSidebarOpen, setSideBarOpen }) {

    return (
        <HomePageLayout 
            open={isSidebarOpen} 
            setOpen={setSideBarOpen} 
            navbar_welcomemsg={"You are at Village's bulletin board, looking at the finished project!"}
        >
            <FigureComponent src={pixelart} caption="Pixel Art Generated from Copilot!"/>
            <PixelArtH2>Someone nearby: All of the Korn's finished quests are posted here.</PixelArtH2>
            <BoardComponent>
                {boxes.map((box, index) => (
                <Box key={index} onClick={() => window.location.href = box.link}>
                    <Image src={imgProj1} alt={box.summary} />
                    <Summary>{box.summary}</Summary>
                </Box>
                ))}
            </BoardComponent>
        </HomePageLayout>
    );
};
