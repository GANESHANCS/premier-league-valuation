import urllib.request
import os
import subprocess
import json

TARGET_DIR = r"d:\PremierLeague-Valuation\frontend\public\videos"
os.makedirs(TARGET_DIR, exist_ok=True)

ASSET_SOURCES = {
    "stadium_ambient.mp4": {
        "url": "https://assets.mixkit.co/videos/43499/43499-720.mp4",
        "alt_url": "https://assets.mixkit.co/videos/30601/30601-720.mp4",
        "page": "https://mixkit.co/free-stock-video/illuminated-empty-soccer-stadium-at-night-43499/",
        "source": "Mixkit",
        "license": "Mixkit Stock Video Free License (Free for commercial & non-commercial use)",
        "route": "/"
    },
    "training_pitch.mp4": {
        "url": "https://assets.mixkit.co/videos/43490/43490-720.mp4",
        "alt_url": "https://assets.mixkit.co/videos/43481/43481-720.mp4",
        "page": "https://mixkit.co/free-stock-video/soccer-players-training-on-a-green-field-43490/",
        "source": "Mixkit",
        "license": "Mixkit Stock Video Free License (Free for commercial & non-commercial use)",
        "route": "/players and /players/:id"
    },
    "tactical_pitch.mp4": {
        "url": "https://assets.mixkit.co/videos/41372/41372-720.mp4",
        "alt_url": "https://assets.mixkit.co/videos/44601/44601-720.mp4",
        "page": "https://mixkit.co/free-stock-video/view-of-a-soccer-field-from-above-41372/",
        "source": "Mixkit",
        "license": "Mixkit Stock Video Free License (Free for commercial & non-commercial use)",
        "route": "/compare"
    },
    "tunnel_arrival.mp4": {
        "url": "https://assets.mixkit.co/videos/46139/46139-720.mp4",
        "alt_url": "https://assets.mixkit.co/videos/31491/31491-720.mp4",
        "page": "https://mixkit.co/free-stock-video/walking-through-a-futuristic-illuminated-tunnel-46139/",
        "source": "Mixkit",
        "license": "Mixkit Stock Video Free License (Free for commercial & non-commercial use)",
        "route": "/transfers"
    },
    "model_grid.mp4": {
        "url": "https://assets.mixkit.co/videos/30599/30599-720.mp4",
        "alt_url": "https://assets.mixkit.co/videos/30590/30590-720.mp4",
        "page": "https://mixkit.co/free-stock-video/abstract-technology-network-lines-30599/",
        "source": "Mixkit",
        "license": "Mixkit Stock Video Free License (Free for commercial & non-commercial use)",
        "route": "/model-analytics"
    }
}

download_report = {}

for filename, info in ASSET_SOURCES.items():
    filepath = os.path.join(TARGET_DIR, filename)
    print(f"Downloading {filename} from {info['url']}...")
    req = urllib.request.Request(info['url'], headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp, open(filepath, 'wb') as f:
            f.write(resp.read())
        size_bytes = os.path.getsize(filepath)
        size_mb = size_bytes / (1024 * 1024)
        print(f"Downloaded {filename}: {size_mb:.2f} MB")
        
        download_report[filename] = {
            "size_mb": round(size_mb, 2),
            "size_bytes": size_bytes,
            "url": info['url'],
            "page": info['page'],
            "source": info['source'],
            "license": info['license'],
            "route": info['route']
        }
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

print("\n--- DOWNLOAD SUMMARY ---")
print(json.dumps(download_report, indent=2))
