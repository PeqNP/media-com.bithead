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
    console.log("Rendering node");
    const r = style.size;
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
        console.log("Found node (" + node.name +")");
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
    };
}
