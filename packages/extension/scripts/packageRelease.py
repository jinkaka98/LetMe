#!/usr/bin/env python3
import os
import sys
import zipfile
import hashlib
import json

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    dist_dir = os.path.join(root_dir, 'packages/extension/dist')
    manifest_path = os.path.join(root_dir, 'packages/extension/manifest.json')
    version = '3.0.0'
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as mf:
            version = json.load(mf).get('version', version)

    release_dir = os.path.join(root_dir, 'release')
    zip_name = f'letme-extension-v{version}.zip'
    zip_path = os.path.join(release_dir, zip_name)

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
    print(f"- File:    release/{zip_name}")
    print(f"- Size:    {size / 1024:.2f} KB ({size} bytes)")
    print(f"- SHA-256: {sha256}")
    print("----------------------------------------------------")

if __name__ == '__main__':
    main()
