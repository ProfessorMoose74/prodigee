<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Please create setup and installation directions for this program

Of course! Setting up a backend server can seem daunting, but we can break it down into simple, clear steps. Here are the complete setup and installation instructions for the Digital Library System for your "Elemental Genius" project.

This guide is designed to be easy to follow, even if you're managing it from the road.

## Setting Up Your Elemental Genius Library Server

Welcome! This guide will walk you through setting up the backend Python program that will automatically discover and download educational content for your application.

### Prerequisites

Before you start, make sure you have the following installed on your computer:

1. **Python 3 (version 3.8 or newer):** The program is written in a modern version of Python.
    * **To check if you have Python:** Open your terminal (Command Prompt or PowerShell on Windows, Terminal on Mac/Linux) and type `python --version` or `python3 --version`. If you see a version number like `Python 3.9.7`, you're good to go.
    * If not, you can download it from the official [Python website](https://www.python.org/downloads/).

### Step 1: Create Your Project Folder

First, let's create a dedicated folder to hold the program and all the files it downloads. This keeps everything neat and organized.

1. Open your terminal or command prompt.
2. Create a new directory and move into it. You can name it whatever you like; we'll use `elemental-genius-library`.

```bash
mkdir elemental-genius-library
cd elemental-genius-library
```


### Step 2: Save the Program File

Save the Python code provided in the previous step into a file inside your new `elemental-genius-library` folder.

* **File Name:** `digital_library_system.py`


### Step 3: Set Up a Virtual Environment

This is a best practice that creates an isolated "bubble" for your project's libraries. It prevents conflicts with other Python projects on your system.

1. **Create the environment** (run this command from your project folder):

```bash
python3 -m venv venv
```

*This creates a new subfolder named `venv`.*
2. **Activate the environment:** You must do this every time you open a new terminal to work on this project.
    * **On Windows (Command Prompt/PowerShell):**

```powershell
.\venv\Scripts\Activate.ps1
```

    * **On macOS and Linux:**

```bash
source venv/bin/activate
```


*You'll know it's active because your terminal prompt will change to show `(venv)` at the beginning.*

### Step 4: Install Required Libraries

Now, we'll install the necessary Python packages that your program depends on.

1. **Create a `requirements.txt` file:** Inside your `elemental-genius-library` folder, create a new text file named `requirements.txt` and paste the following lines into it. This file lists all the dependencies.

```text
# requirements.txt

aiohttp
aiofiles
beautifulsoup4
lxml

# Optional: for a performance boost on Linux/macOS
uvloop
```

2. **Install from the requirements file:** With your virtual environment still active, run the following command. `pip` is Python's package installer, and it will automatically read your file and install everything.

```bash
pip install -r requirements.txt
```


You're all set! The program is now ready to run.

## How to Run the Program

You can now run the server from your terminal, as long as you are in the `elemental-genius-library` directory and your `(venv)` is active.

### Basic First Run (Discover and Download)

This command will find the 50 newest books on Project Gutenberg and attempt to download them.

```bash
python digital_library_system.py
```


### Resuming an Interrupted Download

If your download was interrupted (e.g., you lost internet or closed the terminal), you can easily resume it. This command tells the program to skip the discovery phase and just download the files that are still marked as "pending" in its database.

```bash
python digital_library_system.py --resume
```


### Checking Download Statistics

To see a report of how many files have been downloaded, how many failed, and the total size, run this command:

```bash
python digital_library_system.py --stats
```

You will see a clean, formatted output like this:

```
📊 Download Statistics:
=====================
Total Discovered Files: 50
Successful Downloads:   48
Failed Downloads:       2
Skipped Files:          0
Success Rate:           96.0%
Total Data Downloaded:  25.14 MB
```


### Advanced Options

You can combine options to customize the run.

* **Change the download limit:** To discover and download only 10 new files:

```bash
python digital_library_system.py --limit 10
```

* **Change the download directory:** To save files into a folder named `my-books` instead of the default `downloads`:

```bash
python digital_library_system.py --download-dir "my-books"
```


### What to Expect on Your First Run

After running the program, you will see new folders and files appear in your project directory:

* `downloads/`: The main folder for all content.
    * `gutenberg/`: A subfolder specifically for Project Gutenberg content.
        * `12345-0.txt`: Example of a downloaded book file.
    * `library.db`: A small database file the program uses to track every download. **Do not delete this** unless you want to start over completely.
* `logs/`: Contains a log file (`digital_library.log`) that records the program's activity. This is useful for troubleshooting.

You now have a powerful, automated backend for Elemental Genius. It will quietly build a library of content for your educational app to use. Great job on getting this set up