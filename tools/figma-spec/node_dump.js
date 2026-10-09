// READ-ONLY Figma Plugin API script for the `use_figma` MCP tool.
//
// Dumps the exact design values of one or more nodes (and their subtree, to a
// depth limit) as JSON: geometry, auto-layout, fills, strokes, radius, effects,
// typography, text characters, component/variant data and bound variables.
// The output feeds `dump_to_yaml.py`, so YAML values are generated from Figma
// data rather than transcribed by hand.
//
// Usage: replace the placeholders before sending as `use_figma.code`:
//   __PAGE_ID__   -> id of the page holding the nodes, or null for the first page
//   __NODE_IDS__  -> JSON array of node ids, e.g. ["1:2","1:3"]
//   __MAX_DEPTH__ -> integer subtree depth (0 = the node only)
//
// This script must stay read-only: it calls no setters, never creates,
// removes or edits nodes, and never touches plugin data. Do not add any
// mutating Plugin API call to it.

const NODE_IDS = __NODE_IDS__;
// Page that holds the nodes (null when they are on the first page). Set once.
const PAGE_ID = __PAGE_ID__;
if (PAGE_ID) {
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== "PAGE") throw new Error("Invalid page ID");
  await figma.setCurrentPageAsync(page);
}
const MAX_DEPTH = __MAX_DEPTH__;
if (!Number.isInteger(MAX_DEPTH) || MAX_DEPTH < 0) throw new Error("Invalid max depth");

const variableNames = new Map();

function round(n) {
  return typeof n === "number" ? n : n;
}

function hex(c, opacity) {
  const to = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  const a = opacity === undefined ? (c.a === undefined ? 1 : c.a) : opacity;
  const base = `#${to(c.r)}${to(c.g)}${to(c.b)}`.toUpperCase();
  return a >= 0.999 ? base : `${base}${to(a).toUpperCase()}`;
}

async function variableName(id) {
  if (!id) return null;
  if (variableNames.has(id)) return variableNames.get(id);
  let name = null;
  try {
    const v = await figma.variables.getVariableByIdAsync(id);
    name = v ? v.name : null;
  } catch (e) {
    name = null;
  }
  variableNames.set(id, name);
  return name;
}

async function boundVars(node) {
  const out = {};
  const bv = node.boundVariables || {};
  for (const key of Object.keys(bv)) {
    const ref = bv[key];
    const refs = Array.isArray(ref) ? ref : [ref];
    const names = [];
    for (const r of refs) {
      if (r && r.id) names.push(await variableName(r.id));
    }
    if (names.length) out[key] = names.length === 1 ? names[0] : names;
  }
  return Object.keys(out).length ? out : undefined;
}

function paints(list) {
  if (!Array.isArray(list)) return undefined;
  const out = list
    .filter((p) => p.visible !== false)
    .map((p) => {
      if (p.type === "SOLID") return { type: "SOLID", color: hex(p.color, p.opacity), rgba: p.color, opacity: p.opacity };
      if (p.type === "IMAGE") return { type: "IMAGE", scaleMode: p.scaleMode, imageHash: p.imageHash, imageTransform: p.imageTransform };
      if (p.type && p.type.startsWith("GRADIENT")) {
        return {
          type: p.type,
          transform: p.gradientTransform,
          stops: (p.gradientStops || []).map((s) => ({ color: hex(s.color), position: round(s.position) })),
        };
      }
      return { type: p.type };
    });
  return out.length ? out : undefined;
}

function effects(list) {
  if (!Array.isArray(list)) return undefined;
  const out = list
    .filter((e) => e.visible !== false)
    .map((e) => ({
      type: e.type,
      color: e.color ? hex(e.color) : undefined,
      offset: e.offset ? { x: round(e.offset.x), y: round(e.offset.y) } : undefined,
      radius: round(e.radius),
      spread: round(e.spread),
    }));
  return out.length ? out : undefined;
}

function radius(node) {
  if (!("cornerRadius" in node)) return undefined;
  if (node.cornerRadius !== figma.mixed) return round(node.cornerRadius);
  return {
    topLeft: round(node.topLeftRadius),
    topRight: round(node.topRightRadius),
    bottomRight: round(node.bottomRightRadius),
    bottomLeft: round(node.bottomLeftRadius),
  };
}

function layout(node) {
  if (!("layoutMode" in node) || node.layoutMode === "NONE") return undefined;
  return {
    direction: node.layoutMode,
    gap: round(node.itemSpacing),
    padding: {
      top: round(node.paddingTop),
      right: round(node.paddingRight),
      bottom: round(node.paddingBottom),
      left: round(node.paddingLeft),
    },
    primaryAxisAlign: node.primaryAxisAlignItems,
    counterAxisAlign: node.counterAxisAlignItems,
    primarySizing: node.primaryAxisSizingMode,
    counterSizing: node.counterAxisSizingMode,
    wrap: node.layoutWrap === "WRAP" ? true : undefined,
  };
}

function textStyle(node) {
  if (node.type !== "TEXT") return undefined;
  const mixed = (v) => (v === figma.mixed ? "MIXED" : v);
  const font = node.fontName === figma.mixed ? "MIXED" : node.fontName;
  const lh = node.lineHeight === figma.mixed ? "MIXED" : node.lineHeight;
  const ls = node.letterSpacing === figma.mixed ? "MIXED" : node.letterSpacing;
  return {
    characters: node.characters,
    fontFamily: font === "MIXED" ? "MIXED" : font.family,
    fontStyle: font === "MIXED" ? "MIXED" : font.style,
    fontSize: round(mixed(node.fontSize)),
    fontWeight: mixed(node.fontWeight),
    lineHeight: lh === "MIXED" ? "MIXED" : lh.unit === "AUTO" ? "AUTO" : `${round(lh.value)}${lh.unit === "PIXELS" ? "px" : "%"}`,
    letterSpacing: ls === "MIXED" ? "MIXED" : `${round(ls.value)}${ls.unit === "PIXELS" ? "px" : "%"}`,
    textAlign: node.textAlignHorizontal,
    textCase: mixed(node.textCase),
    textDecoration: mixed(node.textDecoration),
    autoResize: node.textAutoResize,
    maxLines: node.maxLines || undefined,
    truncation: node.textTruncation,
  };
}

async function component(node) {
  if (node.type === "INSTANCE") {
    let main = null;
    try {
      main = await node.getMainComponentAsync();
    } catch (e) {
      main = null;
    }
    return {
      mainComponentId: main ? main.id : undefined,
      mainComponentName: main ? main.name : undefined,
      componentSet: main && main.parent && main.parent.type === "COMPONENT_SET" ? main.parent.name : undefined,
      variantProperties: node.variantProperties || undefined,
      properties: node.componentProperties,
    };
  }
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    return { description: node.description || undefined };
  }
  return undefined;
}

async function dump(node, depth) {
  const out = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible === false ? false : undefined,
    width: "width" in node ? round(node.width) : undefined,
    height: "height" in node ? round(node.height) : undefined,
    x: "x" in node ? round(node.x) : undefined,
    y: "y" in node ? round(node.y) : undefined,
    opacity: "opacity" in node ? node.opacity : undefined,
    constraints: node.constraints,
    rotation: node.rotation,
    layout: layout(node),
    layoutSizing:
      "layoutSizingHorizontal" in node
        ? { horizontal: node.layoutSizingHorizontal, vertical: node.layoutSizingVertical }
        : undefined,
    fills: "fills" in node && node.fills !== figma.mixed ? paints(node.fills) : undefined,
    strokes: "strokes" in node ? paints(node.strokes) : undefined,
    strokeWeight: "strokeWeight" in node && node.strokes && node.strokes.length ? round(node.strokeWeight === figma.mixed ? null : node.strokeWeight) : undefined,
    radius: radius(node),
    effects: "effects" in node ? effects(node.effects) : undefined,
    clipsContent: "clipsContent" in node && node.clipsContent ? true : undefined,
    text: textStyle(node),
    component: await component(node),
    variables: await boundVars(node),
    variableBindings: node.boundVariables,
    explicitVariableModes: node.explicitVariableModes,
  };
  if (depth < MAX_DEPTH && "children" in node) {
    out.children = [];
    for (const child of node.children) {
      out.children.push(await dump(child, depth + 1));
    }
  } else if ("children" in node && node.children.length) {
    out.childCount = node.children.length;
  }
  return JSON.parse(JSON.stringify(out));
}

const results = [];
const missing = [];
for (const id of NODE_IDS) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) {
    missing.push(id);
    continue;
  }
  results.push(await dump(node, 0));
}

return JSON.stringify({
  fileName: figma.root.name,
  dumpedAt: new Date().toISOString(),
  maxDepth: MAX_DEPTH,
  nodes: results,
  missing,
});
