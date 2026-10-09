#!/usr/bin/env python3
"""Validate a scoped Figma contract. Strict mode rejects missing/unverified evidence."""
import argparse
import math
from pathlib import Path
import yaml_io


def validate(root, strict=False):
    root = Path(root).resolve()
    errors, warnings = [], []

    def resolve(ref):
        if not isinstance(ref, str) or not ref:
            raise ValueError('empty path reference')
        target = (root / ref).resolve()
        if not target.is_relative_to(root):
            raise ValueError(f'path escapes spec folder: {ref}')
        return target

    def read(ref):
        try:
            doc = yaml_io.load(resolve(ref))
            if not isinstance(doc, dict):
                raise ValueError('document must be a mapping')
            return doc
        except (ValueError, OSError) as error:
            errors.append(f'{ref}: {error}')
            return {}

    index = read('index.yml')
    criteria = read('acceptance_criteria.yml')
    questions = read('questions.yml')
    if index.get('schema_version') != 1:
        errors.append('index.yml: schema_version must be 1')
    if not (index.get('figma') or {}).get('file_key'):
        errors.append('index.yml: figma.file_key missing')
    if index.get('coverage') != 'complete':
        warnings.append('requested scope coverage is not complete')
    for field in ('unreadable', 'pending'):
        if index.get(field):
            warnings.append(f'scope has {field} entries')
    pages = index.get('pages') or []
    if not pages:
        errors.append('index.yml: no pages listed')
    blocks = {}
    for page in pages:
        doc = read(page.get('file'))
        for section in doc.get('sections') or []:
            for block in section.get('blocks') or []:
                key = block.get('code') or block.get('node_id')
                if not key or key in blocks:
                    errors.append(f'missing or duplicate block ID: {key}')
                blocks[key] = block
    components, seen_nodes = {}, set()
    paths = sorted((root / 'components').glob('*.yml'))
    if not paths:
        errors.append('no component files')

    def walk(node, rel):
        if not isinstance(node, dict):
            errors.append(f'{rel}: invalid design node')
            return
        if node.get('childCount', 0):
            warnings.append(f'{rel}: truncated children at {node.get("id", "root")}')
        if node.get('text') and 'MIXED' in str(node['text']):
            warnings.append(f'{rel}: mixed text values need range-level inspection')
        for child in node.get('children') or []:
            walk(child, rel)

    for path in paths:
        rel = path.relative_to(root).as_posix()
        doc = read(rel)
        comp = doc.get('component') or {}
        node_id = comp.get('node_id')
        if not node_id or node_id in seen_nodes:
            errors.append(f'{rel}: missing or duplicate component.node_id')
        seen_nodes.add(node_id)
        components[rel] = doc
        for key in ('width', 'height'):
            value = (doc.get('frame') or {}).get(key)
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
                errors.append(f'{rel}: invalid frame.{key}')
            if value != (doc.get('design') or {}).get(key):
                errors.append(f'{rel}: frame.{key} differs from design')
        try:
            shot = resolve(doc.get('reference_screenshot'))
            if not shot.is_file() or shot.stat().st_size == 0:
                raise ValueError('missing/empty reference screenshot')
            if shot.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n':
                raise ValueError('reference is not PNG data')
        except (ValueError, OSError) as error:
            errors.append(f'{rel}: {error}')
        ver = doc.get('verification') or {}
        for check in ('values_crosscheck', 'screenshot_capture'):
            if ver.get(check) == 'fail':
                errors.append(f'{rel}: {check} failed')
            elif ver.get(check) != 'pass':
                warnings.append(f'{rel}: {check} unverified')
        if not ver.get('values_checked_at'):
            warnings.append(f'{rel}: crosscheck timestamp missing')
        walk(dict(doc.get('design') or {}, children=doc.get('children') or []), rel)
    acs = criteria.get('acceptance_criteria') or []
    seen, per_block = set(), {}
    for ac in acs:
        aid = ac.get('id')
        if not aid or aid in seen:
            errors.append(f'missing/duplicate AC ID: {aid}')
        seen.add(aid)
        for field in ('block', 'text', 'source', 'source_node_id', 'source_text', 'verify_by'):
            if not ac.get(field):
                errors.append(f'{aid}: missing {field}')
        if ac.get('source') not in ('verbatim', 'derived', 'proposed'):
            errors.append(f'{aid}: invalid source kind')
        if ac.get('source') == 'proposed' and not ac.get('approved'):
            warnings.append(f'{aid}: proposed criterion is not approved')
        if ac.get('block') not in blocks:
            errors.append(f'{aid}: block does not resolve')
        per_block[ac.get('block')] = per_block.get(ac.get('block'), 0) + 1
        if not ac.get('components'):
            errors.append(f'{aid}: no component references')
        for ref in ac.get('components') or []:
            if ref not in components:
                errors.append(f'{aid}: unresolved component {ref}')
    for key, block in blocks.items():
        if not per_block.get(key) and not block.get('no_acceptance_criteria_reason'):
            errors.append(f'{key}: no criteria or explicit reason')
    for q in questions.get('questions') or []:
        if q.get('status', 'open') == 'open' and q.get('blocking', True):
            warnings.append(f'open blocking question: {q.get("id", "unknown")}')
    return errors, warnings


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('spec_dir')
    ap.add_argument('--strict', action='store_true')
    args = ap.parse_args()
    try:
        errors, warnings = validate(args.spec_dir, args.strict)
    except Exception as error:
        ap.exit(2, f'ERROR invalid contract: {error}\n')
    for error in errors:
        print('ERROR', error)
    for warning in warnings:
        print('WARN', warning)
    failed = bool(errors or (args.strict and warnings))
    print('RESULT', 'FAIL' if failed else 'PASS', '(strict readiness)' if args.strict else '(structure only; inspect warnings)')
    raise SystemExit(1 if failed else 0)


if __name__ == '__main__':
    main()
