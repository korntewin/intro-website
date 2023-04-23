import React, { useRef, useEffect, useState } from "react";
import {Dot, drawEdge, initDots} from "./utils";


type Props = {
    movingDotsId: string;
    dispMain: string;
    dispSub: string[];
};

const MovingDots = ({ movingDotsId, dispMain, dispSub }: Props) => {
    // Create a canvas ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 600, height: 600});

    // Define a function to handle the mouse move event
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // Get the canvas element and its bounding rectangle
        const canvas = canvasRef.current;
        if (canvas != null) {
            const rect = canvas.getBoundingClientRect();

            // Calculate the mouse position relative to the canvas
            let mouseX = e.clientX - rect.left;
            let mouseY = e.clientY - rect.top;

            // Update the state variable with the mouse position
            mousePosRef.current = { x: mouseX, y: mouseY };
        }
    };

    // Define a function to handle the window resize event
    const handleWindowResize = () => {
        const initDotsDiv = document.getElementById(movingDotsId);
        if (initDotsDiv != null) {
            setSize({ width: initDotsDiv.clientWidth, height: initDotsDiv.clientHeight});
        }
    }

    // Define a function to animate the canvas
    const animate = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        dots: Dot[],
        numDots: number,
    ) => {
        /*
            Draw moving dots
        */
        // Get the canvas dimensions and mouse position
        let width = canvas.width;
        let height = canvas.height;
        let mouseX = mousePosRef.current.x;
        let mouseY = mousePosRef.current.y;

        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        // Update and draw each dot
        for (let dot of dots) {
            dot.update(width, height, mouseX, mouseY);
            dot.draw(ctx);
        }

        // Draw edges between each pair of dots
        // only if edges doesn't overlap with another edge
        for (let i = 0; i < numDots; i++) {
            for (let j = i + 1; j < numDots; j++) {
                const [d1, d2] = [dots[i], dots[j]];
                drawEdge(ctx, d1, d2);
            }
        }

        /*
            Draw intro text
        */

        if (canvas != null && ctx != null) {
            ctx.fillStyle = "white";
            ctx.font = `normal 60px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx?.fillText(dispMain, canvas.width / 2, canvas.height / 2);

            ctx.fillStyle = "whitesmoke";
            ctx.font = `lighter 30px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            dispSub.map(
                (dispText, idx) => {
                    let offset = 60
                    ctx?.fillText(dispText, canvas.width / 2, canvas.height / 2 + offset + 40 * idx)
                }
            )
        }

        // Request the next animation frame
        requestAnimationFrame(() => animate(canvas, ctx, dots, numDots));
    };


    // Init moving dots at client side
    useEffect(() => {

        const initDotsDiv = document.getElementById(movingDotsId);

        if (initDotsDiv != null) {
            const width = initDotsDiv.clientWidth;
            const height = initDotsDiv.clientHeight;

            const numDots = Math.round(width * height / 10000 * 1.5);
            const canvas = canvasRef.current;
            const newDots = initDots(width, height, numDots);
            setSize({ width: width, height: height});

            if (canvas != null) {
                const ctx = canvas.getContext("2d");

                if (ctx != null) {
                    // Start the animation loop
                    if (newDots.length > 0) {
                        animate(canvas, ctx, newDots, numDots);
                    }
                }
            }
        }

        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, []);


  return (
    <div 
        className="flex w-full h-screen bg-gradient-to-r from-green-400 to-blue-500" 
        id={movingDotsId}
    >
      <canvas 
        ref={canvasRef} 
        width={size.width}
        height={size.height}
        onMouseMove={handleMouseMove}
    />
    </div>
  );
};

export default MovingDots;
