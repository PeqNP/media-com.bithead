// Node drawing facilities using the visjs library.

var __nodes = new Map();

// Set all node states.
function setNodes(nodes) {
    __nodes = nodes;
}

// Update a node's state.
function updateNode(id, node) {
    __nodes.set(id, node);
}

// Returns a node UI renderer w/ dimensions. This is the same interface
// required by `ctxRenderer` w/in the `vis.DataSet`.
function renderNode({ctx, id, x, y, state: { selected, hover }, style, label}) {
    const r = style.size;
    // console.log("Rendering node (" + id + ") x (" + x + ") y (" + y + ") size (" + r + ")");
    const drawNode = makeNode(ctx, r, x, y, id);
    return {
        drawNode,
        nodeDimensions: { width: 2 * r, height: 2 * r },
    };
}


// Returns a function that draws the node UI.
//
// NOTE: These shapes will be scaled to fit, and work with all other graph features.
//
// References
// - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
// - https://visjs.github.io/vis-network/docs/network/nodes.html (Node properties)
function makeNode(ctx, size, x, y, id) {
    return () => {
        var node = __nodes.get(id);
        if (node === undefined) {
            console.log("Could not find node with ID (" + id + ")");
            return;
        }
        // console.log("Found node (" + node.name +")");
        // console.log("Rendering @ x (" + x + ") y (" + y + ") w/ size (" + size + ")");

        // Background
        ctx.fillStyle = "#0D303C";
        ctx.fillRect(x - (size * 2), y - size, 80, 60);

        // Status as a value
        ctx.font = "normal 26px Roboto-Regular";
        ctx.fillStyle = "#96BD0D";
        ctx.fillText("117", x - (size * 1.4), y - 4, 2 * size);

        // Node name
        ctx.font = "normal 12px Roboto-Regular";
        ctx.fillStyle = "white";

        var loc_x = x - (size * 2) + 6;
        var loc_y = y + (size - 4);
        // console.log("text loc_x (" + loc_x + ") loc_y (" + loc_y + ")");
        ctx.fillText(node.name, loc_x, loc_y, 2 * size);

        // Bottom line with status indicator
        ctx.fillStyle = "#EBEBEB";
        ctx.fillRect(x - (size * 1.8), y + (size - 14), 60, 2);

        // Status indicator
        ctx.beginPath();
        ctx.arc(x + (size - 3), y + (size - 13), 2 /* radius */, 0, 2 * Math.PI, false);
        ctx.fillStyle = "#96BD0D";
        ctx.fill();
        ctx.closePath();

        ctx.beginPath()
        ctx.arc(x + (size - 3), y + (size - 13), 4 /* radius */, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#EBEBEB";
        ctx.stroke();
        ctx.closePath();

        // Do NOT use ctx.restore(). It causes the entire renderer to fail.
    };
}

/**
 * Draw hex with red fill.
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
        ctx.fillText(node.name, x - size + 10, y, 2 * size - 20);
 */

