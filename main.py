import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

payload = {
    "model": "phi3",
    "prompt": "what is happening to bangladesh",
    "stream": False
}

response = requests.post(OLLAMA_URL, json=payload)
response.raise_for_status()

print(response.json()["response"])
