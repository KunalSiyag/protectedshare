import json
import urllib.request
import re
import os

KEY = "d3a7e4b2c1f94856a9d0b3c2e1f4a5b6"
HOST = "protectedshare.me"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
SITEMAP_PATH = "apps/web/.next/server/app/sitemap.xml.body"

def main():
    if not os.path.exists(SITEMAP_PATH):
        print(f"Error: Sitemap not found at {SITEMAP_PATH}")
        # Try finding it in another location or fetching it via HTTP as fallback
        return

    with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
        xml_data = f.read()

    # Extract all <loc> tags from the sitemap
    urls = re.findall(r'<loc>(.*?)</loc>', xml_data)

    if not urls:
        print("No URLs found in sitemap.")
        return

    print(f"Found {len(urls)} URLs in sitemap.")

    # Prepare IndexNow payload
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"}
    )

    try:
        response = urllib.request.urlopen(req)
        print(f"IndexNow submission successful! Status: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"Failed to submit to IndexNow: HTTP {e.code} - {e.reason}")
        print(e.read().decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"Failed to submit to IndexNow: {e.reason}")

if __name__ == "__main__":
    main()
