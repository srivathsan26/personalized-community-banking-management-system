import argparse
import os
import shutil
import sys
from pathlib import Path


def configure_paths() -> tuple[Path, Path]:
    server_root = Path(os.environ.get("DESKTOP_SERVER_ROOT", Path(__file__).resolve().parents[1])).resolve()
    backend_root = server_root / "backend"

    sys.path.insert(0, str(server_root))
    sys.path.insert(0, str(backend_root))

    return server_root, backend_root


def ensure_desktop_database(server_root: Path) -> None:
    desktop_data_dir = os.environ.get("DESKTOP_DATA_DIR")
    if not desktop_data_dir:
        return

    data_dir = Path(desktop_data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    target_db = data_dir / "db.sqlite3"
    bundled_db = server_root / "backend" / "db.sqlite3"

    if not target_db.exists() and bundled_db.exists():
        shutil.copy2(bundled_db, target_db)


def run_server(mode: str) -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pcbms_backend.settings")

    if mode == "dev":
        from django.core.management import execute_from_command_line

        execute_from_command_line(
            [
                "desktop_server.py",
                "runserver",
                "127.0.0.1:8001",
                "--noreload",
            ]
        )
        return

    from waitress import serve
    from pcbms_backend.wsgi import application

    serve(application, host="127.0.0.1", port=8001)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["dev", "prod"], default="prod")
    args = parser.parse_args()

    server_root, _ = configure_paths()
    ensure_desktop_database(server_root)
    run_server(args.mode)


if __name__ == "__main__":
    main()
