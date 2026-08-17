// 1. Enriched Data Structure (Added 'rank' and 'info' for tooltips)
const taxonomyData = {
    name: "Carnivora", rank: "Order", info: "Meat-eating mammals.",
    children: [
        {
            name: "Felidae", rank: "Family", info: "The biological family of cats.",
            children: [
                {
                    name: "Felinae", rank: "Subfamily", info: "Small to medium-sized cats.",
                    children: [
                        { name: "Felis", rank: "Genus", info: "Small cats including the domestic cat.", children: [{ name: "Felis catus", rank: "Species", info: "Domestic cat." }] },
                        { name: "Puma", rank: "Genus", info: "Cougars and jaguarundis.", children: [{ name: "Puma concolor", rank: "Species", info: "Mountain lion / Cougar." }] }
                    ]
                },
                {
                    name: "Pantherinae", rank: "Subfamily", info: "The big cats.",
                    children: [
                        { name: "Panthera", rank: "Genus", info: "Lions, tigers, jaguars, leopards.", children: [{ name: "Panthera leo", rank: "Species", info: "Lion." }, { name: "Panthera tigris", rank: "Species", info: "Tiger." }] }
                    ]
                }
            ]
        },
        {
            name: "Canidae", rank: "Family", info: "Dogs, wolves, foxes, and jackals.",
            children: [
                {
                    name: "Caninae", rank: "Subfamily", info: "The only living subfamily of Canidae.",
                    children: [
                        { name: "Canis", rank: "Genus", info: "Wolves, dogs, coyotes.", children: [{ name: "Canis lupus", rank: "Species", info: "Gray wolf." }, { name: "Canis familiaris", rank: "Species", info: "Domestic dog." }] },
                        { name: "Vulpes", rank: "Genus", info: "True foxes.", children: [{ name: "Vulpes vulpes", rank: "Species", info: "Red fox." }] }
                    ]
                }
            ]
        }
    ]
};

// Color scale based on taxonomic rank
const colorScale = {
    "Order": "#e11d48",     // Red
    "Family": "#d946ef",    // Fuchsia
    "Subfamily": "#8b5cf6", // Purple
    "Genus": "#3b82f6",     // Blue
    "Species": "#10b981",   // Green
    "default": "#64748b"    // Gray
};

const width = window.innerWidth;
const height = window.innerHeight;
const margin = {top: 20, right: 120, bottom: 20, left: 120};

// Set up Tooltip
const tooltip = d3.select("#tooltip");

// Create SVG and Zoom behavior
const svg = d3.select("#tree-container").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(d3.zoom().scaleExtent([0.1, 3]).on("zoom", (event) => {
        g.attr("transform", event.transform);
    }));

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${height/2})`);

const treeMap = d3.tree().nodeSize([60, 250]); // Spacing [vertical, horizontal]
const root = d3.hierarchy(taxonomyData);

root.x0 = 0;
root.y0 = 0;

let i = 0;
const duration = 500;

// Initialize
update(root);
centerTree();

// --- UPDATE FUNCTION ---
function update(source) {
    const treeData = treeMap(root);
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);

    // --- NODES ---
    const node = g.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on('click', (event, d) => {
            if (d.children) { d._children = d.children; d.children = null; } 
            else { d.children = d._children; d._children = null; }
            update(d);
        })
        .on('mouseover', function(event, d) {
            const nodeData = d.data;
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <div class="title">${nodeData.name}</div>
                <div class="rank">${nodeData.rank || 'Unknown Rank'}</div>
                <div>${nodeData.info || 'No description available.'}</div>
            `)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px");
        })
        .on('mouseout', () => tooltip.transition().duration(500).style("opacity", 0));

    // Draw Circles
    nodeEnter.append('circle')
        .attr('r', 1e-6)
        .style("fill", d => d._children ? (colorScale[d.data.rank] || colorScale.default) : "#1e293b")
        .style("stroke", d => colorScale[d.data.rank] || colorScale.default);

    // Draw Text (Name)
    nodeEnter.append('text')
        .attr("dy", "-0.8em")
        .attr("x", d => d.children || d._children ? -15 : 15)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name)
        .style("fill", d => d.highlighted ? "#00f2fe" : "#cbd5e1")
        .style("font-weight", d => d.highlighted ? "bold" : "normal");

    // Draw Text (Rank)
    nodeEnter.append('text')
        .attr("class", "rank-label")
        .attr("dy", "0.8em")
        .attr("x", d => d.children || d._children ? -15 : 15)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.rank);

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition().duration(duration)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle')
        .attr('r', d => d.highlighted ? 10 : 8)
        .style("fill", d => d._children ? (colorScale[d.data.rank] || colorScale.default) : "#1e293b")
        .style("box-shadow", d => d.highlighted ? "0 0 10px white" : "none");

    nodeUpdate.select('text').style("fill", d => d.highlighted ? "#00f2fe" : "#cbd5e1");

    const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.select('text').style('fill-opacity', 1e-6);

    // --- LINKS ---
    const link = g.selectAll('path.link')
        .data(links, d => d.id);

    const linkEnter = link.enter().insert('path', "g")
        .attr("class", d => d.target.highlighted && d.source.highlighted ? "link highlight" : "link")
        .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return d3.linkHorizontal().x(d => d.y).y(d => d.x)({source: o, target: o});
        });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition().duration(duration)
        .attr("class", d => d.target.highlighted && d.source.highlighted ? "link highlight" : "link")
        .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x));

    link.exit().transition().duration(duration)
        .attr('d', d => {
            const o = {x: source.x, y: source.y};
            return d3.linkHorizontal().x(d => d.y).y(d => d.x)({source: o, target: o});
        }).remove();

    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
}

// --- CONTROLS LOGIC ---

// Center Tree
function centerTree() {
    const t = d3.zoomIdentity.translate(margin.left, height / 2).scale(0.8);
    svg.transition().duration(750).call(d3.zoom().transform, t);
}
document.getElementById('btn-recenter').addEventListener('click', centerTree);

// Expand All
document.getElementById('btn-expand').addEventListener('click', () => {
    root.each(d => { if (d._children) { d.children = d._children; d._children = null; } });
    update(root);
});

// Collapse All
document.getElementById('btn-collapse').addEventListener('click', () => {
    root.each(d => {
        if (d.depth > 0 && d.children) { d._children = d.children; d.children = null; }
    });
    update(root);
    centerTree();
});

// Search Engine
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Reset highlights
    root.each(d => { d.highlighted = false; });

    if (searchTerm.length < 2) {
        update(root);
        return;
    }

    // Find and highlight matching nodes and their parents
    root.each(d => {
        if (d.data.name.toLowerCase().includes(searchTerm) || (d.data.rank && d.data.rank.toLowerCase().includes(searchTerm))) {
            let current = d;
            while (current) {
                current.highlighted = true;
                // Auto-expand parents
                if (current._children) {
                    current.children = current._children;
                    current._children = null;
                }
                current = current.parent;
            }
        }
    });
    update(root);
});
