# Gramin Connect Hub

> A comprehensive, secure banking and financial management platform for community-based institutions and rural banking operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](./CHANGELOG.md)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4.svg)](.)
[![Status](https://img.shields.io/badge/Status-Stable-success.svg)](.)

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Development](#-development)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## ✨ Features

### 🏦 Banking Operations
- ✅ Secure account management with encryption
- ✅ Customer profile management
- ✅ Transaction processing (deposits, withdrawals, transfers)
- ✅ Real-time balance updates
- ✅ Transaction history and audit logs
- ✅ Loan management framework

### 📊 Financial Analytics
- ✅ Comprehensive reporting system
- ✅ Transaction analytics and insights
- ✅ Financial dashboard with key metrics
- ✅ Custom date range reporting
- ✅ CSV export functionality

### 👥 Multi-User Management
- ✅ Role-based access control (RBAC)
- ✅ Admin and user roles
- ✅ Session management
- ✅ Activity logging and audit trail
- ✅ Secure password hashing

### 🔒 Security & Data Protection
- ✅ End-to-end encryption
- ✅ Secure authentication
- ✅ Automatic daily backups
- ✅ Manual backup/restore functionality
- ✅ CORS protection
- ✅ SQL injection prevention

### 💻 Desktop Application
- ✅ Native Windows application
- ✅ Modern, responsive UI
- ✅ Dark/Light theme support
- ✅ Zero external dependencies on target machine
- ✅ Standalone deployment

## 🚀 Quick Start

### For End Users

**Get started in 3 steps:**

1. **Download** `Gramin Connect Hub-Setup-1.0.0.exe`
2. **Run** the installer and follow prompts
3. **Launch** the app and login

👉 **[Download Latest Release](https://github.com/graminconnect/releases/latest)**

### For Developers

**Set up development environment:**

```bash
# 1. Clone repository
git clone https://github.com/graminconnect/gramin-connect-hub.git
cd gramin-connect-hub

# 2. Install dependencies
npm install

# 3. Start development server
npm run desktop:dev
```

## 📦 Installation

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 7+ | Windows 10/11 |
| **RAM** | 2GB | 4GB+ |
| **Disk** | 500MB | 1GB+ SSD |
| **Network** | Optional | Stable for multi-user |

### Installation Methods

#### Method 1: Standard Installer (Recommended)
```bash
# Download and run:
Gramin Connect Hub-Setup-1.0.0.exe
```

#### Method 2: Portable Zip
```bash
# Download, extract, and run:
Gramin-Connect-Hub-Setup.zip
→ Extract all
→ Run: Gramin Connect Hub-Setup-0.0.0.exe
```

#### Method 3: Development Installation
```bash
# Clone repository
git clone <repo-url>
cd gramin-connect-hub

# Install dependencies
npm install
pip install -r backend/requirements.txt

# Run in development mode
npm run desktop:dev
```

## 💡 Usage

### Getting Started

1. **First Launch**
   - Application creates database automatically
   - Default admin credentials provided separately
   - Configure settings as needed

2. **Main Dashboard**
   - View account summaries
   - Access recent transactions
   - Navigate to all features

3. **Common Operations**
   - Create customer accounts
   - Process transactions
   - Generate reports
   - Manage users (admin)

### For Detailed Instructions

👉 See [USER_GUIDE.md](./USER_GUIDE.md) - Complete user manual with screenshots

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New transaction |
| `Ctrl+S` | Save/Submit |
| `Ctrl+E` | Export to CSV |
| `Ctrl+Q` | Quit application |
| `F1` | Help & Documentation |

## 🛠️ Development

### Project Structure

```
gramin-connect-hub/
├── src/                      # React frontend
│   ├── components/          # Reusable UI components
│   ├── pages/              # Application pages
│   ├── services/           # API services
│   └── styles/             # Styling
├── backend/                 # Django REST API
│   ├── pcbms_backend/      # Main Django app
│   ├── manage.py           # Django CLI
│   ├── desktop_server.py   # Desktop launcher
│   └── requirements.txt    # Python dependencies
├── electron/               # Desktop app wrapper
│   ├── main.cjs           # Electron main process
│   └── preload.cjs        # Preload script
├── dist/                   # Built frontend (generated)
├── release/                # Installer output (generated)
└── package.json           # npm configuration
```

### Development Workflow

```bash
# 1. Start development servers
npm run desktop:dev

# 2. Edit code in your IDE
# Changes auto-reload in the app

# 3. Test in development
# Use built-in DevTools (F12)

# 4. Build for production
npm run desktop:build

# 5. Package for distribution
npm run desktop:package
```

### Available Scripts

```bash
# Development
npm run dev                    # Start Vite dev server
npm run desktop:dev           # Start full desktop dev (frontend + backend + electron)
npm run dev:frontend          # Frontend only
npm run dev:backend           # Django backend only
npm run dev:electron          # Electron only

# Building
npm run build                 # Build frontend
npm run backend:build         # Compile backend with PyInstaller
npm run desktop:build         # Create installer
npm run desktop:package       # Build + package to zip

# Maintenance
npm run lint                  # Run ESLint
npm run backend:migrate       # Run Django migrations
npm run backend:check         # Check Django configuration
npm run backend:seed          # Seed demo data

# Utilities
npm run preview              # Preview production build
npm run package:zip          # Create distribution zip
```

### Technology Stack

#### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Navigation
- **React Query** - Data fetching

#### Backend
- **Django 5.2** - Web framework
- **Django REST Framework** - REST API
- **SQLite3** - Database
- **Waitress** - WSGI server
- **django-cors-headers** - CORS support

#### Desktop
- **Electron 37** - Desktop framework
- **PyInstaller** - Python bundling
- **Node.js** - Runtime

### Setting Up IDE

#### VS Code (Recommended)
```bash
# Install extensions
- ESLint
- Prettier
- Python
- Thunder Client (for API testing)
- GitLens

# Settings
- Format on save: enabled
- Auto-lint: enabled
```

#### Other IDEs
- WebStorm, IntelliJ IDEA, PyCharm all work well
- Configure ESLint and Python linting

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
npm run test

# Backend tests
python backend/manage.py test

# End-to-end tests
npm run test:e2e
```

### Build Verification

```bash
# Verify everything builds correctly
npm run build
npm run backend:build
npm run desktop:build

# Test installer
release/Gramin\ Connect\ Hub-Setup-1.0.0.exe
```

## 📚 Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** - End-user documentation
- **[DISTRIBUTION.md](./DISTRIBUTION.md)** - Deployment guide
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[LICENSE](./LICENSE)** - License terms
- **API Docs** - See backend/docs/ (if available)

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Commit** with meaningful messages (`git commit -m 'Add amazing feature'`)
5. **Push** to your fork (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Contribution Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation if needed
- Test your changes thoroughly
- Include meaningful commit messages

### Code Standards

- **Frontend**: ESLint + Prettier
- **Backend**: PEP 8 + Black formatter
- **Commits**: Conventional Commits

## 🐛 Bug Reports & Issues

Found a bug? Please report it:

1. **Check** if issue already exists
2. **Provide** detailed reproduction steps
3. **Include** error messages and logs
4. **Specify** your OS and version
5. **Submit** via [GitHub Issues](https://github.com/graminconnect/issues)

## 💬 Support

### Getting Help

**Quick Help**
- 📖 Read [USER_GUIDE.md](./USER_GUIDE.md)
- 🔍 Search [Documentation](.)
- 💬 Ask in community forum

**Technical Support**
- 📧 Email: support@graminconnect.local
- 📱 Phone: [Your support number]
- 🎟️ Ticket system: [Support portal]

### Emergency Support

For critical issues (data loss, security):
1. Contact emergency support immediately
2. Provide detailed error information
3. Include system information
4. Have backups ready

## 📊 Project Status

### Current Version: 1.0.0 ✅

- ✅ Core banking operations
- ✅ Customer management
- ✅ Reporting system
- ✅ Multi-user support
- ✅ Desktop application
- ✅ Production ready

### Roadmap

**Q2 2026 (v1.1)**
- Enhanced reporting with charts
- Email notifications
- Mobile app preview

**Q3 2026 (v1.2)**
- Full mobile app (iOS/Android)
- Cloud backup integration
- Multi-branch support

**Q4 2026 (v2.0)**
- macOS/Linux support
- Cloud-native architecture
- API marketplace

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) file for details.

### Key Points
- ✅ Free for commercial use
- ✅ Can modify and redistribute
- ✅ Must include license notice
- ⚠️ No warranty provided

## 🙏 Credits

### Core Team
- **Project Lead**: [Your Name]
- **Backend Development**: Django/Python team
- **Frontend Development**: React/TypeScript team
- **QA & Testing**: Quality Assurance team

### Built With
- React, TypeScript, Vite
- Django, Python, SQLite
- Electron, PyInstaller
- And many open-source libraries

### Special Thanks

Thanks to all contributors, testers, and users who help make Gramin Connect Hub better!

## 📞 Contact

- **Website**: [Your website]
- **Email**: support@graminconnect.local
- **GitHub**: [Your GitHub org]
- **Issues**: [GitHub Issues](.)

## 🗺️ Additional Resources

- [User Guide](./USER_GUIDE.md) - How to use the application
- [Distribution Guide](./DISTRIBUTION.md) - How to deploy
- [Changelog](./CHANGELOG.md) - What's new
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Security Policy](./SECURITY.md) - Security information

---

## Quick Links

| Resource | Link |
|----------|------|
| **Latest Release** | [Download](.) |
| **Documentation** | [Read Docs](.) |
| **Report Issue** | [GitHub Issues](.) |
| **Request Feature** | [Feature Request](.) |
| **Ask Question** | [Discussions](.) |

---

**Made with ❤️ for community banking**

© 2026 Gramin Connect Hub - All Rights Reserved

