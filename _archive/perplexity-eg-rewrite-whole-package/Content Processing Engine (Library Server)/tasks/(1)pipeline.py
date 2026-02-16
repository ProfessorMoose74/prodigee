# tasks/pipeline.py
import os
import requests
from bs4 import BeautifulSoup
from celery import shared_task

# These would be set in the worker's environment
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://your-backend-ip')
OLLAMA_API_URL = os.getenv('OLLAMA_API_URL', 'http://your-ai-server-ip:11434')
INTERNAL_API_KEY = os.getenv('INTERNAL_API_KEY')

@shared_task
def process_content_from_url(source_url):
    # 1. Acquire
    try:
        raw_html = requests.get(source_url).text
    except requests.RequestException:
        return f"Failed to fetch {source_url}"
    
    # 2. Clean & Chunk
    soup = BeautifulSoup(raw_html, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)] # Chunk into 1000-char pieces

    for chunk in chunks:
        # 3. AI Analysis (Summary)
        try:
            summary_res = requests.post(f"{OLLAMA_API_URL}/api/generate", json={
                "model": "llama3",
                "prompt": f"Summarize this text in one paragraph: {chunk}",
                "stream": False
            }).json()
            summary = summary_res.get('response', '')
        except requests.RequestException:
            summary = "Could not generate summary."

        # 4. Transmit to Backend
        final_payload = {
            "text": chunk,
            "summary": summary,
            "source": source_url
        }
        headers = {'X-Internal-API-Key': INTERNAL_API_KEY}
        
        try:
            requests.post(f"{BACKEND_API_URL}/api/v1/library/ingest", json=final_payload, headers=headers)
        except requests.RequestException as e:
            print(f"Failed to ingest chunk: {e}")

    return f"Successfully processed {len(chunks)} chunks from {source_url}"