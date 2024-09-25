#!/usr/bin/env python3

import os
import requests
from requests.exceptions import RequestException

TIMEOUT = 0.1
DEFAULT_LANGUAGE = 'en'
WEBSITE_URLS = {
    'de': 'http://www.andreploeger.com/de/',
    'en': 'http://www.andreploeger.com/en/'
}

COUNTRY_LANGUAGE_MAP = {
    'DE': 'de',
    'AT': 'de',
    'CH': 'de',
}

PROVIDERS = [
    'https://ipapi.co/{}/json/',
    'https://ipinfo.io/{}/json/',
    'https://ipgeolocation.io/ip-api/{}/json/',
]

print("Content-Type: text/html")
print("Status: 302 Found")
print("Location: http://www.andreploeger.com/en/")
print()

def get_user_language():
    lang = os.environ.get('HTTP_ACCEPT_LANGUAGE', '')
    if lang:
        return lang.split(',')[0].split(';')[0]
    return None

def get_language_from_ip(ip):
    for provider in PROVIDERS:
        try:
            response = requests.get(provider.format(ip), timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                country = data.get('country')
                if country in COUNTRY_LANGUAGE_MAP:
                    return COUNTRY_LANGUAGE_MAP[country]
        except RequestException:
            continue

    return DEFAULT_LANGUAGE

user_language = get_user_language()

if not user_language:
    user_ip = os.environ.get('REMOTE_ADDR', '0.0.0.0')
    user_language = get_language_from_ip(user_ip)

redirect_url = WEBSITE_URLS.get(user_language, WEBSITE_URLS[DEFAULT_LANGUAGE])
print(f"Location: {redirect_url}")
print()
