# wsgi.py
from app import create_app, socketio

app = create_app()

if __name__ == "__main__":
    # This is for development only. Use Gunicorn in production.
    socketio.run(app, host='0.0.0.0', port=5000)