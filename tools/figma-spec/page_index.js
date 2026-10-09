// READ-ONLY Figma Plugin API script for the `use_figma` MCP tool.
//
// Two modes, so a single call never switches pages more than once (per the
// figma-use rules; fan out one call per page, in parallel, instead):
// - __PAGE_ID__ = null    -> list every page (id + name) without loading any.
// - __PAGE_ID__ = "12:34" -> load that one page and list its top-level
//                            sections/frames and their direct children (the
//                            numbered spec blocks and example frames).
//
// This script must stay read-only. Do not add any mutating Plugin API call.

const PAGE_ID = __PAGE_ID__;

function brief(n) {
  return {
    id: n.id,
    name: n.name,
    type: n.type,
    width: "width" in n ? Math.round(n.width) : undefined,
    height: "height" in n ? Math.round(n.height) : undefined,
  };
}

if (!PAGE_ID) {
  return JSON.stringify({
    fileName: figma.root.name,
    pages: figma.root.children.map((p) => ({ id: p.id, name: p.name })),
  });
}

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== "PAGE") return JSON.stringify({ error: `not a page: ${PAGE_ID}` });
await figma.setCurrentPageAsync(page);
return JSON.stringify({
  fileName: figma.root.name,
  page: {
    id: page.id,
    name: page.name,
    top: page.children.map((top) => ({
      ...brief(top),
      children: "children" in top ? top.children.map(brief) : [],
    })),
  },
});
