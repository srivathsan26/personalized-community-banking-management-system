# Distribution & Packaging Guide

## Quick Start

Package your app into a distributable zip file with one command:

```bash
npm run desktop:package
```

This creates: `dist-package/Gramin-Connect-Hub-Setup.zip`

## What Gets Packaged

✅ Windows installer (.exe)  
✅ All frontend assets bundled  
✅ Python backend compiled as standalone exe  
✅ Ready to distribute anywhere  

## Distribution Process

### Option 1: Using npm (Recommended)

```bash
npm run desktop:package
```

**What happens:**
1. Builds React frontend
2. Compiles Python backend to exe
3. Creates Windows installer
4. Packages installer into zip file

**Output:** `dist-package/Gramin-Connect-Hub-Setup.zip` (~100-150MB)

### Option 2: Using batch script

```bash
package-app.bat
```

Same result as Option 1, with detailed progress output.

### Option 3: Manual steps

```bash
# Build frontend
npm run build

# Compile backend
npm run backend:build

# Create installer
npm run desktop:build

# Create zip manually
npm run package:zip
```

## Distribution Methods

### Method 1: Cloud Storage
- Upload `dist-package/Gramin-Connect-Hub-Setup.zip` to:
  - Google Drive
  - Dropbox
  - OneDrive
  - GitHub Releases
- Share download link with users

### Method 2: Email
- Attach zip file directly (~100-150MB)
- Users extract and run installer

### Method 3: Server/Website
- Host zip on web server
- Provide download link
- Include checksums for verification

## For End Users

### Installation Steps

1. **Download**
   - Download `Gramin-Connect-Hub-Setup.zip`

2. **Extract**
   - Right-click → Extract All
   - Or: `unzip Gramin-Connect-Hub-Setup.zip`

3. **Install**
   - Double-click `Gramin Connect Hub-Setup-0.0.0.exe`
   - Follow installer wizard
   - Click "Install"

4. **Run**
   - App automatically launches after install
   - Or find in Start Menu → Gramin Connect Hub

**No Python needed!** Everything is bundled.

## File Structure After Extraction

```
Gramin-Connect-Hub-Setup.zip
└── Gramin Connect Hub-Setup-0.0.0.exe
```

## Release Workflow

### For Developers

1. **Make changes locally**
   ```bash
   npm run desktop:dev
   # Test thoroughly
   ```

2. **Build distribution**
   ```bash
   npm run desktop:package
   ```

3. **Verify**
   - Check zip file exists: `dist-package/Gramin-Connect-Hub-Setup.zip`
   - Installer file size: ~120-150MB
   - Version in filename: `Gramin Connect Hub-Setup-0.0.0.exe`

4. **Distribute**
   - Upload to hosting location
   - Share link with team/users

5. **Archive**
   - Keep zip in version control (optional)
   - Or keep only source, rebuild when needed

## Version Management

### Updating Version

Edit `package.json`:
```json
{
  "version": "1.0.0"
}
```

Then rebuild:
```bash
npm run desktop:package
```

Installer filename will update: `Gramin Connect Hub-Setup-1.0.0.exe`

## Build Artifacts

### After `npm run desktop:package`:

```
dist/                          ← Frontend build
  ├── index.html
  └── assets/
  
backend/dist/                  ← Python backend exe
  └── backend-server/
      └── backend-server.exe

release/                        ← Electron-builder output
  └── Gramin Connect Hub-Setup-0.0.0.exe

dist-package/                  ← Distribution zip
  └── Gramin-Connect-Hub-Setup.zip
```

### Cleanup (if needed)

```bash
# Remove old builds
rmdir /s dist release backend\dist dist-package

# Rebuild fresh
npm run desktop:package
```

## Troubleshooting

### Issue: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "python: command not found"
**Solution:** Install Python from https://www.python.org/

### Issue: PyInstaller errors
**Solution:** 
```bash
pip install -q pyinstaller
npm run backend:build
```

### Issue: Zip not created
**Solution:**
```bash
# Ensure PowerShell is available
npm run package:zip

# Or use batch script
package-app.bat
```

### Issue: Large file size
**Note:** Expected 120-150MB due to bundled Python runtime
- Frontend: ~5-10MB
- Python runtime: ~100-120MB
- Backend dependencies: ~5-15MB

## Development vs Distribution

| Aspect | Development | Distribution |
|--------|-------------|--------------|
| Run with | `npm run desktop:dev` | Double-click .exe |
| Backend | Python interpreter | Compiled exe |
| Setup | npm + Python required | None required |
| Portability | Local machine | Any Windows PC |
| Use case | Development/testing | End users |

## Signing & Security

For production releases, consider:

1. **Code Signing** - Sign the installer executable
2. **Checksum** - Provide SHA256 hash for verification
3. **Virus Scan** - Scan with VirusTotal before releasing

Current setup: No code signing (suitable for internal/trusted distribution)

## Automation

To automate distribution, add to CI/CD:

```bash
npm install
npm run desktop:package

# Then upload dist-package/Gramin-Connect-Hub-Setup.zip
# to your hosting service
```

## Support Resources

- **Help with installer:** Windows installer questions
- **Help with app:** App functionality issues
- **Help with development:** Backend/frontend modifications
- **Help with deployment:** Distribution and version updates

Contact your IT team for specific deployment questions.
