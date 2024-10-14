// Node drawing facilities using the visjs library.

function drawNodes() {
    console.log("Draw nodes");
}

// Returns a function that draws a shape using the <canvas> object.
//
// NOTE: These shapes will be scaled to fit, and work with all other graph features.
//
// References
// - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
function makeNode(ctx, size, x, y, label) {
    return () => {
        ctx.beginPath();
        const sides = 6;
        const a = (Math.PI * 2) / sides;
        ctx.moveTo(x, y + size);
        for (let i = 1; i < sides; i++) {
            ctx.lineTo(x + size * Math.sin(a * i), y + size * Math.cos(a * i));
        }
        ctx.closePath();
        ctx.save();
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.font = "normal 12px sans-serif";
        ctx.fillStyle = "black";
        ctx.fillText(label, x - size + 10, y, 2 * size - 20);
    };
}
