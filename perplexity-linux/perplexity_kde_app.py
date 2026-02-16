import sys
import requests
from PyQt6.QtWidgets import (QApplication, QWidget, QVBoxLayout, QTextEdit, 
                             QLineEdit, QPushButton, QLabel, QScrollArea)
from PyQt6.QtGui import QFont
from PyQt6.QtCore import Qt

# --- CONFIGURATION ---
# PASTE YOUR PERPLEXITY API KEY HERE
PERPLEXITY_API_KEY = "YOUR_PERPLEXITY_API_KEY"
API_URL = "https://api.perplexity.ai/chat/completions"

class PerplexityApp(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        # --- Window Setup ---
        self.setWindowTitle('Perplexity for KDE')
        self.setGeometry(200, 200, 700, 500)

        # --- Layout ---
        layout = QVBoxLayout()
        self.setLayout(layout)

        # --- UI Elements ---
        # Title Label
        title_label = QLabel('Ask Perplexity')
        title_label.setFont(QFont('Noto Sans', 16, QFont.Weight.Bold))
        layout.addWidget(title_label)
        
        # Input box for the question
        self.question_input = QLineEdit()
        self.question_input.setPlaceholderText('Enter your question here...')
        self.question_input.setFont(QFont('Noto Sans', 11))
        self.question_input.returnPressed.connect(self.ask_perplexity) # Allow pressing Enter
        layout.addWidget(self.question_input)

        # 'Ask' button
        self.ask_button = QPushButton('Ask')
        self.ask_button.setFont(QFont('Noto Sans', 11))
        self.ask_button.clicked.connect(self.ask_perplexity)
        layout.addWidget(self.ask_button)

        # A label to show status (e.g., "Thinking...")
        self.status_label = QLabel('Ready.')
        self.status_label.setStyleSheet("color: #888;")
        layout.addWidget(self.status_label)

        # Text area to display the result (made scrollable)
        self.result_display = QTextEdit()
        self.result_display.setReadOnly(True)
        self.result_display.setFont(QFont('Noto Sans', 10))
        layout.addWidget(self.result_display)
        
        self.show()

    def ask_perplexity(self):
        question = self.question_input.text()
        if not question:
            self.result_display.setText("Please enter a question first.")
            return

        if not PERPLEXITY_API_KEY or PERPLEXITY_API_KEY == "YOUR_PERPLEXITY_API_KEY":
            self.result_display.setText("ERROR: API Key is missing. Please edit the script and add your key.")
            return

        # Update UI to show we are working
        self.status_label.setText('Thinking...')
        self.ask_button.setEnabled(False)
        QApplication.processEvents() # Force UI update

        try:
            # --- API Call Logic ---
            headers = {
                "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama-3-sonar-large-32k-online", # A powerful and fast model
                "messages": [
                    {
                        "role": "system",
                        "content": "Be precise and concise."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            }

            response = requests.post(API_URL, headers=headers, json=payload)
            response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

            # --- Process Response ---
            data = response.json()
            answer = data['choices'][0]['message']['content']
            
            self.result_display.setMarkdown(answer) # Using setMarkdown to render formatting like bold, lists, etc.
            self.status_label.setText('Done.')

        except requests.exceptions.RequestException as e:
            self.result_display.setText(f"API Request Failed:\n\n{e}")
            self.status_label.setText('Error.')
        except Exception as e:
            self.result_display.setText(f"An unexpected error occurred:\n\n{e}")
            self.status_label.setText('Error.')
        finally:
            # Re-enable the button
            self.ask_button.setEnabled(True)

# --- Main execution block ---
if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = PerplexityApp()
    sys.exit(app.exec())
