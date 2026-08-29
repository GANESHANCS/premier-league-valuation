import urllib.request
import re
import json

mixkit_urls = [
    # Stadium
    "https://mixkit.co/free-stock-video/flying-low-on-a-pitch-in-an-empty-stadium-30601/",
    "https://mixkit.co/free-stock-video/lights-in-an-empty-stadium-30602/",
    "https://mixkit.co/free-stock-video/stadium-lights-shining-at-night-42261/",
    "https://mixkit.co/free-stock-video/illuminated-empty-soccer-stadium-at-night-43499/",

    # Soccer / Training / Pitch
    "https://mixkit.co/free-stock-video/legs-of-a-soccer-player-dribbling-a-ball-43481/",
    "https://mixkit.co/free-stock-video/soccer-player-kicking-a-ball-on-a-field-43484/",
    "https://mixkit.co/free-stock-video/soccer-player-practicing-dribbling-on-the-pitch-43494/",
    "https://mixkit.co/free-stock-video/soccer-players-training-on-a-green-field-43490/",

    # Tactical / Aerial Pitch
    "https://mixkit.co/free-stock-video/aerial-view-of-a-soccer-field-30600/",
    "https://mixkit.co/free-stock-video/drone-shot-over-a-soccer-pitch-44601/",
    "https://mixkit.co/free-stock-video/view-of-a-soccer-field-from-above-41372/",

    # Tunnel / Arrival
    "https://mixkit.co/free-stock-video/walking-through-a-futuristic-illuminated-tunnel-46139/",
    "https://mixkit.co/free-stock-video/soaring-through-golden-rings-into-a-3d-light-31491/",
    "https://mixkit.co/free-stock-video/walking-down-a-dark-underground-passageway-19594/",

    # Model Grid / Tech
    "https://mixkit.co/free-stock-video/digital-animation-of-screens-and-data-30590/",
    "https://mixkit.co/free-stock-video/abstract-technology-network-lines-30599/",
    "https://mixkit.co/free-stock-video/digital-grid-of-glowing-nodes-and-lines-41638/",
]

details = []

for page_url in mixkit_urls:
    req = urllib.request.Request(page_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        title = title_match.group(1).strip() if title_match else page_url
        mp4_720 = re.findall(r'https://assets\.mixkit\.co/videos/[^\"]+-720\.mp4', html)
        mp4_1080 = re.findall(r'https://assets\.mixkit\.co/videos/[^\"]+-1080\.mp4', html)
        mp4_any = re.findall(r'https://assets\.mixkit\.co/videos/[^\"]+\.mp4', html)
        
        details.append({
            'page_url': page_url,
            'title': title,
            'mp4_1080': mp4_1080[0] if mp4_1080 else (mp4_720[0] if mp4_720 else (mp4_any[0] if mp4_any else None))
        })
    except Exception as e:
        print(f"Error on {page_url}: {e}")

print(json.dumps(details, indent=2))
