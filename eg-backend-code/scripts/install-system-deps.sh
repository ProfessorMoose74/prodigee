#!/bin/bash
# System Dependencies Installation Script for Elemental Genius
# For openSUSE Leap 15.6 and Ubuntu/Debian systems

set -e

echo "Installing system dependencies for Elemental Genius..."

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
fi

case "$OS" in
    "openSUSE Leap")
        echo "Detected openSUSE Leap - using zypper"
        sudo zypper refresh
        sudo zypper install -y \
            python311 \
            python311-devel \
            python311-pip \
            python311-virtualenv \
            portaudio-devel \
            alsa-devel \
            pulseaudio-devel \
            ffmpeg \
            postgresql15 \
            postgresql15-devel \
            redis \
            git \
            gcc \
            make
        ;;
    "Ubuntu"*)
        echo "Detected Ubuntu - using apt"
        sudo apt-get update
        sudo apt-get install -y \
            python3.11 \
            python3.11-dev \
            python3.11-venv \
            python3-pip \
            portaudio19-dev \
            libasound2-dev \
            libpulse-dev \
            ffmpeg \
            postgresql-client \
            libpq-dev \
            redis-tools \
            git \
            build-essential
        ;;
    *)
        echo "Unsupported OS: $OS"
        echo "Please install dependencies manually:"
        echo "- Python 3.11 with dev headers"
        echo "- PortAudio development libraries"
        echo "- ALSA/PulseAudio development libraries"
        echo "- FFmpeg"
        echo "- PostgreSQL client and dev libraries"
        echo "- Redis tools"
        echo "- Build tools (gcc, make)"
        exit 1
        ;;
esac

echo "System dependencies installed successfully!"
echo "Note: Ensure PostgreSQL and Redis services are running on target servers."