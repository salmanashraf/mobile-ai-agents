// READ-ONLY Figma Plugin API script for the `use_figma` MCP tool.
//
// Lists every visible TEXT node under each given node, including text inside
// component instances (which `get_metadata` and `get_design_context` do not
// return). Used to read the written spec on a design page: Jobs-to-be-done,
// acceptance criteria, dev notes, state descriptions and copy strings.
//
// Usage: replace __NODE_IDS__ with a JSON array of node ids, and __PAGE_ID__
// with the id of the page holding them (or null for the first page), before
// sending as `use_figma.code`.
//
// This script must stay read-only. Do not add any mutating Plugin API call.

const NODE_IDS = __NODE_IDS__;
// Page that holds the nodes (null when they are on the first page). Set once.
const PAGE_ID = __PAGE_ID__;
if (PAGE_ID) {
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== "PAGE") throw new Error("Invalid page ID");
  await figma.setCurrentPageAsync(page);
}

function isVisible(node, root) {
  let n = node;
  while (n && n !== root.parent) {
    if (n.visible === false) return false;
    n = n.parent;
  }
  return true;
}

function pathOf(node, root) {
  const parts = [];
  let n = node.parent;
  while (n && n !== root.parent) {
    parts.unshift(n.name);
    n = n.parent;
  }
  return parts.join(" / ");
}

const blocks = [];
const missing = [];
for (const id of NODE_IDS) {
  const root = await figma.getNodeByIdAsync(id);
  if (!root) {
    missing.push(id);
    continue;
  }
  const texts = root.type === "TEXT" ? [root] : "findAllWithCriteria" in root ? root.findAllWithCriteria({ types: ["TEXT"] }) : [];
  blocks.push({
    id: root.id,
    name: root.name,
    texts: texts
      .filter((t) => isVisible(t, root) && t.characters.trim().length)
      .map((t) => ({
        id: t.id,
        name: t.name,
        path: pathOf(t, root),
        characters: t.characters,
        x: Math.round(t.absoluteTransform[0][2]),
        y: Math.round(t.absoluteTransform[1][2]),
      }))
      .sort((a, b) => a.y - b.y || a.x - b.x),
  });
}

return JSON.stringify({ blocks, missing });
