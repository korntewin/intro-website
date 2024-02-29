import { useState, useEffect } from "react";
import HomePageLayout from "../layouts/homepage.layout";
import PixelArtH2 from "../components/pixelart.component.";
import FigureComponent from "../components/img.component";
import pixelart from "../pics/cats-playground.jpg";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import catcontent from "../contents/mycat.md";

export default function AboutMyCat() {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch(catcontent)
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <HomePageLayout
      navbar_welcomemsg={
        "As you wander around the village, you find a playground full of cats!"
      }
    >
      <FigureComponent
        src={pixelart}
        caption="Pixel Art Generated from Copilot!"
      />
      <PixelArtH2>Kao Neow (baby white cat): Meow ...Mrrr </PixelArtH2>
      <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
        {markdown}
      </Markdown>
    </HomePageLayout>
  );
}
