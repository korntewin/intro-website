import styled from 'styled-components';
import { SM_BREAKPOINT } from '../config';

const PixelArtH2 = styled.h2`
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  color: #333;

  @media (max-width: ${SM_BREAKPOINT}px) {
    font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
    color: #333;
    font-size: 1em;
  }
`;

const PixelArtH4 = styled.h4`
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  color: #333;
`;

type PixelArtProps = {
  color?: String
};

const PixelArtBold = styled.span<PixelArtProps>`
  font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
  font-size: 1em;
  padding-bottom: 0.5em;
  text-align: center;
  ${props => props.color && `color: ${props.color}`};

  @media (max-width: ${SM_BREAKPOINT}px) {
    font-family: 'Press Start 2P', cursive; // This is a pixel art-like font
    font-size: 0.7em;
    padding: 0.5em;
    text-align: center;
    ${props => props.color && `color: ${props.color}`};
  }

`;


const PixelArtP = styled.span<PixelArtProps>`
  font-family: 'VT323', cursive; // This is a pixel art-like font
  text-align: center;
  ${props => props.color && `color: ${props.color}`};
`;

export default PixelArtH2;
export { PixelArtH4, PixelArtBold, PixelArtP };