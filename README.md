# Gramin Connect Hub

> A comprehensive, secure banking and financial management platform for community-based institutions and rural banking operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](./CHANGELOG.md)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4.svg)](.)
[![Status](https://img.shields.io/badge/Status-Stable-success.svg)](.)

## 🚀 Download & Install

**Latest Release: v1.0.0**

👉 **[Download Installer](https://github.com/graminconnect/releases/latest)**

```bash
# Windows: Download and run
Gramin Connect Hub-Setup-1.0.0.exe
```

## ✨ Key Features

🏦 **Banking Operations** - Account management, transactions, customer profiles  
📊 **Financial Reports** - Analytics, summaries, custom reports  
👥 **Multi-User System** - Role-based access, secure authentication  
🔒 **Security** - Encryption, backups, audit logs  
💻 **Desktop App** - Native Windows application, modern UI

## 📖 Documentation

- **[Complete User Guide](./USER_GUIDE.md)** - How to use the application
- **[Installation & Deployment](./DISTRIBUTION.md)** - How to install and deploy
- **[Version History](./CHANGELOG.md)** - What's new in each version
- **[Developer Guide](./README-PRODUCTION.md)** - For developers & contributors
- **[License](./LICENSE)** - MIT License terms

## 🛠️ For Developers

### Quick Start

```bash
# Clone repository
git clone https://github.com/graminconnect/gramin-connect-hub.git
cd gramin-connect-hub

# Install dependencies
npm install

# Start development
npm run desktop:dev
```

### Build for Production

```bash
# Create Windows installer
npm run desktop:build

# Package for distribution
npm run desktop:package
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Django 5.2, Django REST Framework, SQLite
- **Desktop**: Electron 37, PyInstaller

## 💬 Support

- **[User Guide](./USER_GUIDE.md)** - Comprehensive documentation
- **[FAQ](./DISTRIBUTION.md#faq)** - Frequently asked questions
- **Email**: support@graminconnect.local
- **Issues**: [GitHub Issues](https://github.com/graminconnect/issues)

## 📋 System Requirements

| Component | Requirement |
|-----------|-----------|
| **OS** | Windows 7 or later |
| **RAM** | 2GB minimum (4GB recommended) |
| **Disk** | 500MB free space |
| **Network** | Optional (works offline) |

## 🤝 Contributing

We welcome contributions! See [README-PRODUCTION.md](./README-PRODUCTION.md#-contributing) for guidelines.

## 📄 License

MIT License - Free for commercial and personal use. See [LICENSE](./LICENSE) for details.

## 🎯 Roadmap

- ✅ v1.0.0 - Banking core, reporting, multi-user
- 🔄 v1.1.0 - Enhanced reports, email notifications, loans
- 🔄 v1.2.0 - Mobile app, cloud backup
- 🔄 v2.0.0 - macOS/Linux, cloud-native

## 📊 Project Status

**Stable Release - Production Ready**

---

## Next Steps

1. **For Users**: [Download the installer](https://github.com/graminconnect/releases/latest)
2. **For Developers**: See [README-PRODUCTION.md](./README-PRODUCTION.md)
3. **For Support**: Check [USER_GUIDE.md](./USER_GUIDE.md)

---

© 2026 Gramin Connect Hub - Made with ❤️ for community banking

## Desktop app

This project can now run as a desktop application using Electron while keeping the existing React frontend and Django backend.

### Desktop development

Install both Node dependencies and Python dependencies first:

```sh
npm install
pip install -r backend/requirements.txt
```

Then start the desktop app:

```sh
npm run desktop:dev
```

This launches:

- the Django backend on `127.0.0.1:8001`
- the Vite frontend on `127.0.0.1:8080`
- an Electron desktop window

### Desktop build

To package the app for Windows:

```sh
npm run desktop:build
```

The installer is written to the `release/` folder.

### Create distribution package (zip file)

To build and package the app into a distributable zip file:

```sh
npm run desktop:package
```

This creates `dist-package/Gramin-Connect-Hub-Setup.zip` (~120-150MB) that can be:
- Shared via email, cloud storage, or web hosting
- Extracted and run on any Windows machine without Python installed

For detailed distribution instructions, see [DISTRIBUTION.md](./DISTRIBUTION.md).

### Packaging note

The packaged Electron app bundles a standalone Python backend executable (built with PyInstaller). This means **no Python installation is required** on the target machine — the installer is fully self-contained. SQLite data is stored in the app's user data directory instead of inside the installed app bundle.

The build process automatically:
1. Builds the frontend with Vite
2. Compiles the Django backend into `backend-server.exe` using PyInstaller
3. Packages everything into a Windows installer using electron-builder

Development workflow (`npm run desktop:dev`) still uses Python directly from your machine.
