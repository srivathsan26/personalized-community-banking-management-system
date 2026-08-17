# -*- mode: python ; coding: utf-8 -*-
import os
import sys
this_dir = os.path.abspath(os.path.join(os.getcwd(), '..'))  # repo root
backend_dir = os.path.abspath(os.getcwd())

# ensure Django app packages in repo root are discoverable for PyInstaller hooks
sys.path.insert(0, this_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pcbms_backend.settings')

a = Analysis(
    ['desktop_server.py'],
    pathex=[this_dir, backend_dir],
    binaries=[],
    datas=[
        ('pcbms_backend', 'pcbms_backend'),
    ],
    hiddenimports=[
        'django',
        'django.core',
        'django.core.management',
        'django.core.management.commands',
        'django.core.wsgi',
        'django.db',
        'django.db.backends',
        'django.db.backends.sqlite3',
        'rest_framework',
        'rest_framework.decorators',
        'rest_framework.response',
        'corsheaders',
        'waitress',
        'sqlite3',
        'banking',
        'banking.*',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludedimports=[],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
