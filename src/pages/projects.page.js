import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/bulletin-board-pixel-art.jpg';
import BoardComponent, { Box, Image, Summary } from '../components/board.component';

import gcpPCA from '../pics/gcp-pca.jpg';
import gcpPDE from '../pics/gcp-pde.jpg';

const boxes = [
  // Add your box data here
  // { image: 'image_url', summary: 'summary text', link: 'page_link' }
  { image: "https://avatars.githubusercontent.com/u/37272798?s=200&v=4", summary: "YOLOv8 Rendering on Browser using Rust's WebAssembly", link: "https://github.com/korntewin/yolo-wasm"},
  { image: "https://images.credly.com/size/340x340/images/2d84e428-9078-49b6-a804-13c15383d0de/image.png", summary: "AWS Certified Solutions Architect – Professional", link: "https://www.credly.com/badges/039ba124-fcf5-4fbf-b4b5-de7817f1d675/linked_in_profile"},
  { image: gcpPDE, summary: "Google Cloud Certified Professional Data Engineer", link: "https://google.accredible.com/0bc42dee-895c-4e69-a924-8640cdfe01fd"},
  { image: gcpPCA, summary: "Google Cloud Certified Professional Cloud Architect", link: "https://google.accredible.com/34e8fd91-a68a-4325-83e0-fdea8c1e3d44"},
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
                <Box key={index} to={box.link} target="_blank" rel="noopener noreferrer">
                    <Image src={box.image} alt={box.summary} />
                    <Summary>{box.summary}</Summary>
                </Box>
                ))}
            </BoardComponent>
        </HomePageLayout>
    );
};
