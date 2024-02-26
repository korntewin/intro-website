import HomePageLayout from '../layouts/homepage.layout';
import PixelArtH2 from '../components/pixelart.component.';
import FigureComponent from '../components/img.component';
import pixelart from '../pics/bulletin-board-pixel-art.jpg';
import BoardComponent, { Box, Image, Summary } from '../components/board.component';

import bsa from '../pics/bsa-pixel-art.jpg'

const boxes = [
  // Add your box data here
  // { image: 'image_url', summary: 'summary text', link: 'page_link' }
  { image: "https://avatars.githubusercontent.com/u/37272798?s=200&v=4", summary: "Real-time Object Detection using Rust's WebAssembly + React on YOLOv8", link: "https://github.com/korntewin/yolo-wasm"},
  { image: "https://images.credly.com/size/340x340/images/2d84e428-9078-49b6-a804-13c15383d0de/image.png", summary: "AWS Certified Solutions Architect – Professional", link: "https://www.credly.com/badges/039ba124-fcf5-4fbf-b4b5-de7817f1d675/linked_in_profile"},
  { image: "https://templates.images.credential.net/16590181582433100721069374350922.png", summary: "GCP Certified Professional Cloud Architect", link: "https://google.accredible.com/34e8fd91-a68a-4325-83e0-fdea8c1e3d44"},
  { image: "https://templates.images.credential.net/16590189412502689960209276019161.png", summary: "GCP Certified Professional Data Engineer", link: "https://google.accredible.com/0bc42dee-895c-4e69-a924-8640cdfe01fd"},
  { image: bsa, summary: "Bank Statement Analyzer: First project at KBTG", link: "https://principled-zebu-497.notion.site/Bank-Statement-Analyzer-a97988bdad4545e7aad7483664931a1d?pvs=4"},
  { image: "https://miro.medium.com/v2/resize:fit:750/format:webp/0*3UXLgiXFgKnOLiZc", summary: "Thai NLP project using Streamlit on GCP", link: "https://korntewin-b.medium.com/thai-nlp-project-on-streamlit-webapp-gcp-509180faf6cd"},
  { image: "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*BaCi_5HkM7szgV-CgRv1-g.jpeg", summary: "Intensive C & Shell programming bootcamp at 42!", link: "https://medium.com/@korntewin-b/awesome-experience-in-42-university-application-b4a21cc8f8ca"},
  { image: "https://templates.images.credential.net/16589346213183572350230433330388.png", summary: "TensorFlow Developer Certificate", link: "https://www.credential.net/b03843b4-2031-45d3-8c07-3173c738be57#gs.50gc92"},
];


export default function ProjectPage() {

    return (
        <HomePageLayout 
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
