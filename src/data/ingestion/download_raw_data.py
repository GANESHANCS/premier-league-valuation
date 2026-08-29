import os
import urllib.request
import gzip
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"

# Dataset Source: Third-Party Transfermarkt-derived dataset (dcaribou/transfermarkt-datasets)
# Disclaimer: PL ValuEdge is not affiliated with or endorsed by Transfermarkt.
R2_BASE_URL = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data"

FILES_TO_DOWNLOAD = [
    "competitions.csv.gz",
    "clubs.csv.gz",
    "players.csv.gz",
    "player_valuations.csv.gz",
    "transfers.csv.gz",
    "games.csv.gz",
    "appearances.csv.gz",
    "club_games.csv.gz"
]

def download_and_decompress():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[*] Downloading third-party Transfermarkt-derived dataset (dcaribou/transfermarkt-datasets)")
    print(f"[*] Raw data destination directory: {RAW_DATA_DIR}")

    for filename in FILES_TO_DOWNLOAD:
        gz_url = f"{R2_BASE_URL}/{filename}"
        gz_path = RAW_DATA_DIR / filename
        csv_filename = filename.replace(".gz", "")
        csv_path = RAW_DATA_DIR / csv_filename

        if csv_path.exists() and csv_path.stat().st_size > 0:
            size_mb = csv_path.stat().st_size / (1024 * 1024)
            print(f"    [+] Already present: {csv_filename} ({size_mb:.2f} MB)")
            continue

        print(f"[*] Downloading {gz_url} ...")
        try:
            req = urllib.request.Request(gz_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(gz_path, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)

            with gzip.open(gz_path, 'rb') as f_in:
                with open(csv_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            if gz_path.exists():
                os.remove(gz_path)
            size_mb = csv_path.stat().st_size / (1024 * 1024)
            print(f"    [OK] Successfully retrieved & decompressed: {csv_filename} ({size_mb:.2f} MB)")

        except Exception as e:
            print(f"    [ERROR] Failed downloading {filename}: {e}")

if __name__ == "__main__":
    download_and_decompress()
