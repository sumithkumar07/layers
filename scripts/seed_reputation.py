import requests
import os

def seed_reputation():
    print("Seeding reputation database...")
    os.makedirs('data', exist_ok=True)
    
    # 1. Threat Hostlist (Using StevenBlack as reliable source including many lists)
    url = "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
    print(f"Downloading bad domains from {url}...")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open('data/bad_domains.txt', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("Saved data/bad_domains.txt")
        else:
            print(f"Failed to download. Status code: {response.status_code}")
    except Exception as e:
        print(f"Error downloading bad domains: {e}")

if __name__ == "__main__":
    seed_reputation()
