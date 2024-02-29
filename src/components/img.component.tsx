import styled from "styled-components";

const Image = styled.img`
  width: 100%;
  height: auto;
`;

const Figure = styled.figure`
  margin: 0;
  text-align: center;
`;

const FigCaption = styled.figcaption`
  font-size: 0.8em;
  color: gray;
`;

export default function FigureComponent({
  src,
  caption,
}: {
  src: string;
  caption: string;
}) {
  return (
    <Figure>
      <Image src={src}></Image>
      <FigCaption>{caption}</FigCaption>
    </Figure>
  );
}

export { Image, Figure };
