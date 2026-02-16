# tasks/pipeline.py
import os
import requests
from bs4 import BeautifulSoup
from celery import shared_task

BACKEND_API_URL = os.getenv('BACKEND_API_URL') # e.g., http://your-backend-ip
OLLAMA_API_URL = os.getenv('OLLAMA_API_URL') # e.g., http://your-ai-server-ip:11434

@shared_task
def process_content(source_url):
    # 1. Acquire
    raw_html = requests.get(source_url).text
    
    # 2. Clean & Chunk
    soup = BeautifulSoup(raw_html, 'html.parser')
    text = soup.get_text()
    # Chunking logic goes here...
    chunks = [text[i:i+500] for i in range(0, len(text), 500)]

    for chunk in chunks:
        # 3. AI Analysis (keywords, summary)
        analysis_payload = {"model": "llama3", "prompt": f"Summarize this: {chunk}"}
        summary_res = requests.post(f"{OLLAMA_API_URL}/api/generate", json=analysis_payload).json()
        
        # 4. Vectorize
        embedding_payload = {"model": "mxbai-embed-large", "prompt": chunk}
        embedding_res = requests.post(f"{OLLAMA_API_URL}/api/embeddings", json=embedding_payload).json()
        
        # 5. Transmit
        final_payload = {
            "text": chunk,
            "summary": summary_res.get('response'),
            "vector": embedding_res.get('embedding'),
            "source": source_url
        }
        
        requests.post(f"{BACKEND_API_URL}/api/v1/library/ingest", json=final_payload)

    return f"Successfully processed {source_url}"