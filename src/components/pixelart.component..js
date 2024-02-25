import styled from 'styled-components';

const PixelArtH2 = styled.h2`
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  color: #333;
`;

const PixelArtH4 = styled.h4`
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  color: #333;
`;

const PixelArtBold = styled.span`
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  font-size: 1em;
  padding-bottom: 0.5em;
  text-align: center;
  ${props => props.color && `color: ${props.color}`};
`;


const PixelArtP = styled.p`
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  font-size: 1em;
  padding-bottom: 0.5em;
  text-align: center;
  ${props => props.color && `color: ${props.color}`};
`;

export default PixelArtH2;
export { PixelArtH4, PixelArtBold, PixelArtP };