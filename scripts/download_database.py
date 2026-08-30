import os
import sys
import gzip
import shutil
import sqlite3
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "pl_valuation.db"

DEFAULT_DOWNLOAD_URL = os.getenv(
    "DATABASE_DOWNLOAD_URL",
    "https://github.com/GANESHANCS/premier-league-valuation/releases/download/v1.0.0-data/pl_valuation.db.gz"
)

EXPECTED_TABLE_COUNTS = {
    "clubs": 1000,
    "players": 50000,
    "player_market_values": 600000,
    "transfers": 150000,
    "player_appearances": 1000000,
    "player_predictions": 1000
}

def verify_sqlite_integrity(db_file: Path) -> bool:
    """Verifies SQLite database integrity and minimum expected row counts."""
    if not db_file.exists():
        print(f"[!] Database file does not exist: {db_file}")
        return False

    size_mb = db_file.stat().st_size / (1024 * 1024)
    if size_mb < 250.0:
        print(f"[!] Database file size is suspiciously small: {size_mb:.2f} MB (Expected > 300 MB)")
        return False

    try:
        conn = sqlite3.connect(str(db_file))
        cursor = conn.cursor()

        # 1. PRAGMA integrity_check
        cursor.execute("PRAGMA integrity_check;")
        res = cursor.fetchone()
        if not res or res[0] != "ok":
            print(f"[!] SQLite PRAGMA integrity_check failed: {res}")
            conn.close()
            return False

        # 2. Table row count validation
        for table, min_count in EXPECTED_TABLE_COUNTS.items():
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            cnt = cursor.fetchone()[0]
            if cnt < min_count:
                print(f"[!] Table '{table}' row count ({cnt:,d}) is less than expected minimum ({min_count:,d})")
                conn.close()
                return False
            print(f"  [+] Table '{table}' verified: {cnt:,d} rows (min: {min_count:,d})")

        conn.close()
        print(f"[OK] SQLite Database Integrity Check Passed ({size_mb:.2f} MB)")
        return True

    except Exception as e:
        print(f"[!] Exception during database integrity check: {e}")
        return False


def acquire_database():
    print("==========================================================================")
    print("      PL VALUEDGE - PRODUCTION DATABASE ACQUISITION PIPELINE               ")
    print("==========================================================================")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # If database already exists and is valid, skip download
    if DB_PATH.exists() and verify_sqlite_integrity(DB_PATH):
        print(f"[*] Valid production database found at {DB_PATH}. Ready for service startup.")
        return

    url = DEFAULT_DOWNLOAD_URL
    print(f"[*] Downloading production database artifact from:\n    {url}")

    tmp_file = DATA_DIR / "download_temp.bin"

    try:
        # Stream download
        req = urllib.request.Request(url, headers={"User-Agent": "PL-ValuEdge-Downloader/1.0"})
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                raise RuntimeError(f"HTTP Error {response.status}: Failed to fetch database asset.")
            
            with open(tmp_file, "wb") as f_out:
                shutil.copyfileobj(response, f_out)

        dl_size_mb = tmp_file.stat().st_size / (1024 * 1024)
        print(f"[*] Download completed ({dl_size_mb:.2f} MB). Processing artifact...")

        # Determine if downloaded file is gzipped
        is_gzipped = url.endswith(".gz") or tmp_file.name.endswith(".gz")
        if not is_gzipped:
            with open(tmp_file, "rb") as f_in:
                magic = f_in.read(2)
                if magic == b"\x1f\x8b":
                    is_gzipped = True

        if is_gzipped:
            print("[*] Decompressing gzip archive to pl_valuation.db...")
            with gzip.open(tmp_file, "rb") as f_gz:
                with open(DB_PATH, "wb") as f_db:
                    shutil.copyfileobj(f_gz, f_db)
            tmp_file.unlink(missing_ok=True)
        else:
            shutil.move(tmp_file, DB_PATH)

        # Final Integrity Verification
        if not verify_sqlite_integrity(DB_PATH):
            if DB_PATH.exists():
                DB_PATH.unlink()
            raise RuntimeError("Downloaded database failed integrity verification!")

        print("\n==========================================================================")
        print("      [OK] DATABASE ACQUISITION AND INTEGRITY VERIFIED                   ")
        print("==========================================================================")

    except Exception as e:
        if tmp_file.exists():
            tmp_file.unlink(missing_ok=True)
        print(f"\n[CRITICAL ERROR] Database acquisition failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    acquire_database()
