// 1. Define your taxonomy data here
const taxonomyData = {
    name: "Carnivora (Order)",
    children: [
        {
            name: "Felidae (Family)",
            children: [
                {
                    name: "Felinae (Subfamily)",
                    children: [
                        { name: "Felis (Genus)", children: [{ name: "Felis catus (Species)" }] },
                        { name: "Puma (Genus)", children: [{ name: "Puma concolor (Species)" }] }
                    ]
                },
                {
                    name: "Pantherinae (Subfamily)",
                    children: [
                        { name: "Panthera (Genus)", children: [{ name: "Panthera leo (Species)" }, { name: "Panthera tigris (Species)" }] }
                    ]
                }
            ]
        },
        {
            name: "Canidae (Family)",
            children: [
                {
                    name: "Caninae (Subfamily)",
                    children: [
                        { name: "Canis (Genus)", children: [{ name: "Canis lupus (Species)" }, { name: "Canis familiaris (Species)" }] },
                        { name: "Vulpes (Genus)", children: [{ name: "Vulpes vulpes (Species)" }] }
                    ]
                }
            ]
        }
    ]
};

// 2. Set up the SVG canvas dimensions
const margin = {top: 20, right: 120, bottom: 20, left: 160},
      width = 1200 - margin.right - margin.left,
      height = 600 - margin.top - margin.bottom;

const svg = d3.select("#tree-container").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 3. Create the tree layout
const treeMap = d3.tree().size([height, width]);
const root = d3.hierarchy(taxonomyData);

root.x0 = height / 2;
root.y0 = 0;

let i = 0;
const duration = 400; // Animation speed in ms

// Initialize the tree
update(root);

// 4. The update function handles drawing and redrawing when you click
function update(source) {
    const treeData = treeMap(root);
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);

    // Set a fixed distance between columns (depth)
    nodes.forEach(d => { d.y = d.depth * 200; });

    // --- NODES ---
    const node = svg.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on('click', click);

    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", d => d._children ? "#3498db" : "#fff"); // Blue if it has hidden children

    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -13 : 13)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name);

    // Update nodes
    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle.node')
        .attr('r', 8)
        .style("fill", d => d._children ? "#3498db" : "#fff");

    // Remove exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.select('text').style('fill-opacity', 1e-6);

    // --- LINKS ---
    const link = svg.selectAll('path.link')
        .data(links, d => d.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal(o, o);
        });

    // Update links
    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d, d.parent));

    // Remove exiting links
    const linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', d => {
            const o = {x: source.x, y: source.y};
            return diagonal(o, o);
        })
        .remove();

    // Store old positions for transition.
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to child
    function diagonal(s, d) {
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
    }
}

// 5. Toggle children on click.
function click(event, d) {
    if (d.children) {
        d._children = d.children; // Hide children
        d.children = null;
    } else {
        d.children = d._children; // Show children
        d._children = null;
    }
    update(d);
}
