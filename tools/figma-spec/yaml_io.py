"""Portable JSON-compatible YAML serialization; optional PyYAML for ordinary YAML."""
import json

def dumps(data, header=None):
    # JSON quotes every string, including node IDs, colors, dates and YAML booleans.
    return json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n"

def dump(data, path, header=None):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(dumps(data, header))

def load(path):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            import yaml
        except ImportError as error:
            raise ValueError("Ordinary YAML requires PyYAML; install pyyaml or use JSON syntax in .yml files") from error
        return yaml.safe_load(text)
