#!/usr/bin/env python3
"""Pixel-compare two screenshots and write a diff image.

Used in two places:
- **Harvest:** a fresh Figma screenshot against the stored reference, to detect
  design drift.
- **Implementation / task-gate:** a native UI golden or device screenshot against
  the Figma reference.

    python3 tools/figma-spec/compare_screens.py REFERENCE.png CANDIDATE.png \
        [--out diff.png] [--threshold 2.0] [--tolerance 16] [--crop x,y,w,h]

Size mismatches fail unless --resize is explicitly requested after confirming
matching logical viewports and aspect ratios. A pixel counts as different when any
RGBA channel differs by more than --tolerance (0-255).

Exit codes:
- 0: the share of differing pixels is at or below --threshold (percent)
- 1: above it
- 2: bad input
"""

import argparse
import json
import sys

try:
    from PIL import Image
    import numpy as np
except ImportError:  # pragma: no cover
    print("compare_screens.py needs Pillow and numpy (pip install pillow numpy)", file=sys.stderr)
    sys.exit(2)


def load(path, crop=None):
    img = Image.open(path).convert("RGBA")
    if crop:
        x, y, w, h = crop
        if x + w > img.width or y + h > img.height:
            raise ValueError("crop exceeds candidate bounds")
        img = img.crop((x, y, x + w, y + h))
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reference")
    ap.add_argument("candidate")
    ap.add_argument("--out", default=None)
    ap.add_argument("--threshold", type=float, default=2.0, help="max %% of differing pixels")
    ap.add_argument("--tolerance", type=int, default=16, help="per-channel tolerance 0-255")
    ap.add_argument("--crop", default=None, help="x,y,w,h applied to the candidate before resize")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--resize", action="store_true", help="explicit resampling for a documented export-scale difference")
    args = ap.parse_args()

    if not 0 <= args.threshold <= 100 or not 0 <= args.tolerance <= 255:
        ap.error("threshold must be 0..100 and tolerance 0..255")
    crop = tuple(int(v) for v in args.crop.split(",")) if args.crop else None
    if crop and (len(crop) != 4 or min(crop[:2]) < 0 or min(crop[2:]) <= 0):
        ap.error("crop must be nonnegative x,y and positive width,height")
    try:
        ref = load(args.reference)
        cand = load(args.candidate, crop)
    except (OSError, ValueError) as error:
        ap.error(str(error))
    if cand.size != ref.size:
        if not args.resize:
            ap.error(f"image sizes differ: {ref.size} vs {cand.size}; capture matching viewports or explicitly use --resize")
        if abs(cand.width / cand.height - ref.width / ref.height) > 0.001:
            ap.error("cannot resize images with different aspect ratios")
        cand = cand.resize(ref.size, Image.LANCZOS)

    a = np.asarray(ref, dtype=np.int16)
    b = np.asarray(cand, dtype=np.int16)
    delta = np.abs(a - b).max(axis=2)
    mask = delta > args.tolerance
    percent = float(mask.mean() * 100.0)
    mean_delta = float(delta.mean())

    if args.out:
        overlay = np.asarray(ref, dtype=np.uint8)[:, :, :3].copy()
        overlay = (overlay * 0.35).astype(np.uint8)
        overlay[mask] = [255, 0, 80]
        Image.fromarray(overlay).save(args.out)

    result = {
        "reference": args.reference,
        "candidate": args.candidate,
        "size": list(ref.size),
        "resampling_allowed": args.resize,
        "crop": crop,
        "different_pixels_percent": round(percent, 3),
        "mean_channel_delta": round(mean_delta, 2),
        "threshold_percent": args.threshold,
        "tolerance": args.tolerance,
        "match": percent <= args.threshold,
        "diff_image": args.out,
    }
    if args.json:
        print(json.dumps(result))
    else:
        verdict = "MATCH" if result["match"] else "MISMATCH"
        print(f"{verdict}: {percent:.2f}% pixels differ (threshold {args.threshold}%), mean delta {mean_delta:.1f}")
        if args.out:
            print(f"diff image: {args.out}")
    sys.exit(0 if result["match"] else 1)


if __name__ == "__main__":
    main()
