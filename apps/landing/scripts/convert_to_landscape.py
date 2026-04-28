#!/usr/bin/env python3
"""
Convert portrait JPG image to landscape orientation.
Supports two strategies:
  1. Rotate 90° clockwise or counter-clockwise (best for abstract/pattern images)
  2. Center-crop with optional zoom (best for keeping "top" of image visible)
"""

from PIL import Image
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Convert a portrait image to landscape")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("-o", "--output", help="Output image path (default: inplace overwrite)")
    parser.add_argument(
        "-s",
        "--strategy",
        choices=["rotate_cw", "rotate_ccw", "crop"],
        default="rotate_cw",
        help="Conversion strategy (default: rotate_cw)",
    )
    parser.add_argument(
        "-z",
        "--zoom",
        type=float,
        default=1.0,
        help="Crop zoom factor (>1 zooms in, <1 zooms out). Only used with --strategy crop",
    )
    parser.add_argument(
        "-q", "--quality", type=int, default=95, help="JPEG output quality (default: 95)"
    )
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve() if args.output else input_path

    if not input_path.exists():
        print(f"Error: file not found: {input_path}")
        raise SystemExit(1)

    with Image.open(input_path) as img:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        w, h = img.size
        print(f"Original size: {w}x{h}")

        if w >= h:
            print("Image is already landscape or square — no conversion needed.")
            img.save(output_path, quality=args.quality, optimize=True)
            print(f"Saved to: {output_path}")
            return

        if args.strategy == "rotate_cw":
            converted = img.rotate(-90, expand=True)
        elif args.strategy == "rotate_ccw":
            converted = img.rotate(90, expand=True)
        elif args.strategy == "crop":
            target_w = int(h * args.zoom)
            target_h = int(h * args.zoom)
            left = (w - target_w) // 2
            top = (h - target_h) // 2
            right = left + target_w
            bottom = top + target_h
            converted = img.crop((left, top, right, bottom))
            if converted.size[0] < converted.size[1]:
                converted = converted.rotate(-90, expand=True)
        else:
            raise SystemExit(1)

        print(f"Converted size: {converted.size[0]}x{converted.size[1]}")
        converted.save(output_path, quality=args.quality, optimize=True)
        print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()
