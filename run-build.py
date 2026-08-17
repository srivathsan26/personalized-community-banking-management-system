#!/usr/bin/env python3
"""
Build script for Gramin Connect Hub desktop app
Runs: npm run desktop:package
"""

import subprocess
import os
import sys

os.chdir(r'c:\Users\l340 (7lIN)\Documents\gramin-connect-hub')

print("\n" + "=" * 80)
print("BUILDING GRAMIN CONNECT HUB DESKTOP APP")
print("=" * 80)
print("\nThis will:")
print("  1. Build React frontend (dist/)")
print("  2. Compile Python backend to exe (backend/dist/)")
print("  3. Create Windows installer (release/)")
print("  4. Package into zip (dist-package/)")
print("\nThis may take 3-5 minutes. Please wait...\n")

try:
    result = subprocess.run('npm run desktop:package', shell=True)
    sys.exit(result.returncode)
except KeyboardInterrupt:
    print("\n\nBuild cancelled by user")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
