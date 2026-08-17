// 1. Data Structure with Unsplash Images
const taxonomyData = {
    name: "Carnivora", rank: "Order", info: "Placental mammals that specialize in eating meat.", img: "https://images.unsplash.com/photo-1590513886561-e0c2f741ba0a?auto=format&fit=crop&w=500&q=80",
    children: [
        {
            name: "Felidae", rank: "Family", info: "The biological family of cats. Agile predators.", img: "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=500&q=80",
            children: [
                {
                    name: "Felinae", rank: "Subfamily", info: "Small to medium-sized cats including cheetahs.", img: "https://images.unsplash.com/photo-153ee71836691-11d2e13292fc?auto=format&fit=crop&w=500&q=80",
                    children: [
                        { name: "Felis catus", rank: "Species", info: "The domestic cat. Highly adaptable.", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80" },
                        { name: "Puma concolor", rank: "Species", info: "Cougar or Mountain Lion. Ambush predator.", img: "https://images.unsplash.com/photo-1588619623832-6bb0b9e84bb2?auto=format&fit=crop&w=500&q=80" }
                    ]
                },
                {
                    name: "Pantherinae", rank: "Subfamily", info: "The big roaring cats.", img: "https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=500&q=80",
                    children: [
                        { name: "Panthera leo", rank: "Species", info: "The Lion. Lives in social groups called prides.", img: "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=500&q=80" },
                        { name: "Panthera tigris", rank: "Species", info: "The Tiger. Largest living cat species.", img: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=500&q=80" }
                    ]
                }
            ]
        },
        {
            name: "Canidae", rank: "Family", info: "Dogs, wolves, foxes, and jackals.", img: "https://images.unsplash.com/photo-1536514072410-5019a3c69182?auto=format&fit=crop&w=500&q=80",
            children: [
                {
                    name: "Caninae", rank: "Subfamily", info: "The only living subfamily of Canidae.", img: "https://images.unsplash.com/photo-1590424744257-f1be20042738?auto=format&fit=crop&w=500&q=80",
                    children: [
                        { name: "Canis lupus", rank: "Species", info: "Gray wolf. Apex predator and ancestor of dogs.", img: "https://images.unsplash.com/photo-1560885673-2cdf179e8a75?auto=format&fit=crop&w=500&q=80" },
                        { name: "Vulpes vulpes", rank: "Species", info: "Red fox. Largest of the true foxes.", img: "https://images.unsplash.com/photo-1516934515560-f4728cc3961c?auto=format&fit=crop&w=500&q=80" }
                    ]
                }
            ]
        }
    ]
};

// 2. Setup Variables & Colors
const width = window.innerWidth;
const height = window.innerHeight;
const nodeRadius = 8;

const colors = {
    "Order": "#ff4757",    // Red
    "Family": "#ff6b81",   // Pink
    "Subfamily": "#a29bfe",// Purple
    "Genus": "#74b9ff",    // Blue
    "Species": "#00d2d3",  // Cyan
    "default": "#ced6e0"
};

// 3. Initialize Canvas & Zoom
const container = d3.select("#tree-container");
const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", "100%");

const g = svg.append("g");

const zoom = d3.zoom()
    .scaleExtent([0.2, 4])
    .on("zoom", (event) => g.attr("transform", event.transform));

svg.call(zoom);

// 4. Setup Tree Hierarchy
const treeLayout = d3.tree().nodeSize([70, 300]); // [vertical spacing, horizontal spacing]
const root = d3.hierarchy(taxonomyData);

// Assign internal IDs and initial positions
root.descendants().forEach((d, i) => {
    d.id = i;
    d.x0 = height / 2;
    d.y0 = 0;
    // Store children for toggling
    d._children = d.children;
});

// Start with root expanded, everything else collapsed
root.children.forEach(collapseNode);

function collapseNode(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapseNode);
        d.children = null;
    }
}

// 5. Tooltip Logic
const tooltip = d3.select("#tooltip");
function showTooltip(event, d) {
    d3.select("#tt-title").text(d.data.name);
    d3.select("#tt-rank").text(d.data.rank || "Unknown");
    d3.select("#tt-info").text(d.data.info || "No description available.");
    d3.select("#tt-img").attr("src", d.data.img || "https://images.unsplash.com/photo-1550159930-40066082a4fc?auto=format&fit=crop&w=500&q=80").style("display", d.data.img ? "block" : "none");
    
    tooltip.style("opacity", 1)
           .style("left", (event.pageX) + "px")
           .style("top", (event.pageY) + "px");
}
function hideTooltip() {
    tooltip.style("opacity", 0);
}

// 6. Main Core Engine (The Fix)
function update(source) {
    // Generate new tree layout mapping
    treeLayout(root);
    
    // We now use root.descendants() and root.links() properly
    const nodes = root.descendants();
    const links = root.links();

    // ---------- NODES ----------
    const node = g.selectAll('g.node')
        .data(nodes, d => d.id);

    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on('click', (event, d) => {
            // Toggle children
            d.children = d.children ? null : d._children;
            update(d);
        })
        .on('mouseover', showTooltip)
        .on('mousemove', showTooltip) // Keep it attached to cursor
        .on('mouseout', hideTooltip);

    nodeEnter.append('circle')
        .attr('r', 1e-6) // Start tiny for animation
        .style("fill", d => d._children ? (colors[d.data.rank] || colors.default) : "#0f1423")
        .style("stroke", d => colors[d.data.rank] || colors.default);

    nodeEnter.append('text')
        .attr("dy", "-1em")
        .attr("x", d => d._children ? -15 : 15)
        .attr("text-anchor", d => d._children ? "end" : "start")
        .text(d => d.data.name);

    nodeEnter.append('text')
        .attr("class", "rank-label")
        .attr("dy", "1.2em")
        .attr("x", d => d._children ? -15 : 15)
        .attr("text-anchor", d => d._children ? "end" : "start")
        .text(d => d.data.rank);

    // Node Update Transitions
    const nodeUpdate = nodeEnter.merge(node);
    
    nodeUpdate.transition().duration(400)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle')
        .attr('r', d => d.highlighted ? 12 : nodeRadius)
        .style("fill", d => d._children ? (colors[d.data.rank] || colors.default) : "#0f1423")
        .style("stroke", d => d.highlighted ? "#00f2fe" : (colors[d.data.rank] || colors.default));

    nodeUpdate.selectAll('text')
        .style("fill", d => d.highlighted ? "#00f2fe" : "#cbd5e1");

    // Node Exit Transitions
    const nodeExit = node.exit().transition().duration(400)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.select('text').style('fill-opacity', 1e-6);

    // ---------- LINKS ----------
    const link = g.selectAll('path.link')
        .data(links, d => d.target.id);

    const linkGenerator = d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x);

    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return linkGenerator({source: o, target: o});
        });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition().duration(400)
        .attr("class", d => d.target.highlighted && d.source.highlighted ? "link highlight" : "link")
        .attr('d', linkGenerator);

    link.exit().transition().duration(400)
        .attr('d', d => {
            const o = {x: source.x, y: source.y};
            return linkGenerator({source: o, target: o});
        })
        .remove();

    // Store positions for next animation
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// 7. Initial Render & Centering
update(root);
centerTree();

function centerTree() {
    // Centers the root node nicely on the left side of the screen
    const t = d3.zoomIdentity.translate(150, height / 2).scale(0.8);
    svg.transition().duration(750).call(zoom.transform, t);
}

// 8. UI Controls
document.getElementById('btn-recenter').addEventListener('click', centerTree);

document.getElementById('btn-expand').addEventListener('click', () => {
    root.descendants().forEach(d => {
        if (d._children) {
            d.children = d._children;
        }
    });
    update(root);
});

document.getElementById('btn-collapse').addEventListener('click', () => {
    root.children.forEach(collapseNode);
    update(root);
    centerTree();
});

// 9. Powerful Search Engine
document.getElementById('search-input').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    
    // Clear previous highlights
    root.descendants().forEach(d => d.highlighted = false);

    if (term.length < 2) {
        update(root);
        return;
    }

    // Find matches and trace path to root
    root.descendants().forEach(d => {
        if (d.data.name.toLowerCase().includes(term) || (d.data.rank && d.data.rank.toLowerCase().includes(term))) {
            let current = d;
            while (current) {
                current.highlighted = true;
                // Force expand parents so the path is visible
                if (current._children) {
                    current.children = current._children;
                }
                current = current.parent;
            }
        }
    });
    
    update(root);
});
