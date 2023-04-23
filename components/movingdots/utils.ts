// Define some constants
const maxSpeed = 3; // Maximum speed of dots
const minDist = 50; // Minimum distance to draw edge
const maxDist = 200; // Maximum distance to draw edge
const mouseRadius = 200; // Radius of mouse effect
const mouseForce = 1; // Force of mouse effect

// Define a dot class
class Dot {
    constructor(
        public x: number,
        public y: number,
        public vx: number,
        public vy: number
    ) {
        this.x = x; // X position
        this.y = y; // Y position
        this.vx = vx; // X velocity
        this.vy = vy; // Y velocity
    }

    // Update the dot position and velocity
    update(width: number, height: number, mouseX: number, mouseY: number) {
        // Move the dot by velocity
        this.x += this.vx;
        this.y += this.vy;

        // Bounce the dot off the edges of the canvas
        if (this.x < 0 || this.x > width) {
            this.vx *= -1;
        }
        if (this.y < 0 || this.y > height) {
            this.vy *= -1;
        }

        // Calculate the distance to the mouse
        let dx = this.x - mouseX;
        let dy = this.y - mouseY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // If the dot is within the mouse radius, apply a repulsive force
        if (dist < mouseRadius) {
            let angle = Math.atan2(dy, dx);
            let fx = Math.cos(angle) * mouseForce;
            let fy = Math.sin(angle) * mouseForce;
            this.vx += fx;
            this.vy += fy;
        }

        // Limit the speed of the dot
        let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            let ratio = maxSpeed / speed;
            this.vx *= ratio;
            this.vy *= ratio;
        }
    }

    // Draw the dot on the canvas context
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "blue";
        ctx.fill();
    }
}

// Define a function to initialize the dots array with random positions and velocities
const initDots = (width: number, height: number, numDots: number) => {
    let dots: Dot[] = [];
    for (let i = 0; i < numDots; i++) {
        let x = Math.random() * width;
        let y = Math.random() * height;
        let vx = Math.random() * maxSpeed * 2 - maxSpeed;
        let vy = Math.random() * maxSpeed * 2 - maxSpeed;
        dots.push(new Dot(x, y, vx, vy));
    }
    return dots;
};

// Define a function to draw an edge between two dots
const drawEdge = (
    ctx: CanvasRenderingContext2D,
    dot1: Dot,
    dot2: Dot
) => {
    // Calculate the distance between the dots
    let dx = dot1.x - dot2.x;
    let dy = dot1.y - dot2.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    // If the distance is within the range, draw a line with alpha proportional to distance
    if (dist > minDist && dist < maxDist) {
        let alpha = 1 - (dist - minDist) / (maxDist - minDist);
        ctx.beginPath();
        ctx.moveTo(dot1.x, dot1.y);
        ctx.lineTo(dot2.x, dot2.y);
        ctx.strokeStyle = `rgba(0,255,255,${alpha})`;
        ctx.stroke();
    }
};


export { Dot, drawEdge, initDots };