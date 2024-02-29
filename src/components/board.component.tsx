import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { PixelArtP } from './pixelart.component.';
import woodTexture from '../pics/woodenboard-pixel-art.jpg'
import React from 'react';

const Board = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  background-image: url(${woodTexture}); // set the background image to the wood texture
  background-size: cover;
  background-repeat: no-repeat;
  padding: 1em 1em 1em 1em;
  margin-top: 2em;
`;

const Box = styled(Link)`
  max-width: 20%;
  min-width: 15em;
  padding: 1em 1em 1em 1em;
  margin: 0.5em;
  box-sizing: border-box; // includes padding and border in the box's width and height
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none; // to remove the default underline of Link
  color: inherit; // to inherit the color from parent
  transition: transform 0.3s ease-in-out; // for smooth transition
  background-color: hsl(20, 19%, 87%); // light gray background

  &:hover {
    transform: scale(1.1); // enlarge the box on hover
  }

  // Pixel-art border
  box-shadow: 
    0 0 0 1px #000,
    0 0 0 4px #fff,
    0 0 0 5px #000;
`;

const Image = styled.img`
  width: 80%;
  height: auto;
  align-items: center;
`;

const Summary = styled(PixelArtP)`
  text-align: center;
  justify-content: center;
  align-items: center;
  font-size: 1.5em;
  padding-top: 1em;
  font-weight: bold;
`;

export default function BoardComponent({ children }: {children: React.ReactNode }) {
    return (
        <Board>
            {children}
        </Board>
    );
}

export { Box, Image, Summary };
