#!/usr/bin/env python3
import os
import sys
import zipfile
import hashlib

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    dist_dir = os.path.join(root_dir, 'packages/extension/dist')
    release_dir = os.path.join(root_dir, 'release')
    zip_path = os.path.join(release_dir, 'letme-extension-v0.1.0.zip')

    if not os.path.exists(dist_dir):
        print(f"[letme-release] Error: Directory {dist_dir} does not exist. Run 'npm run build' first.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(release_dir, exist_ok=True)

    print(f"[letme-release] Creating Chrome Extension release package: {zip_path}")

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, dist_dir)
                zipf.write(file_path, arcname)

    size = os.path.getsize(zip_path)
    with open(zip_path, 'rb') as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    print("----------------------------------------------------")
    print("✓ Release Package Created Successfully!")
    print(f"- File:    release/letme-extension-v0.1.0.zip")
    print(f"- Size:    {size / 1024:.2f} KB ({size} bytes)")
    print(f"- SHA-256: {sha256}")
    print("----------------------------------------------------")

if __name__ == '__main__':
    main()
