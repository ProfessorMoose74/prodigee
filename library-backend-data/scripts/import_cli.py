#!/usr/bin/env python3
"""
Command-line interface for importing content into the library database.

Usage:
    python import_cli.py gutenberg /path/to/gutenberg/files
    python import_cli.py bible /path/to/bible.xml
    python import_cli.py founding /path/to/founding/documents
"""

import argparse
import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.utils.import_data import DataImporter
from app.core.database import SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def import_gutenberg(args):
    """Import Project Gutenberg texts."""
    db = SessionLocal()
    importer = DataImporter(db)
    
    if os.path.isfile(args.path):
        logger.info(f"Importing single file: {args.path}")
        success = importer.import_gutenberg_file(args.path, args.category)
    else:
        logger.info(f"Importing directory: {args.path}")
        success_count = 0
        for file_path in Path(args.path).glob('*.txt'):
            logger.info(f"Processing {file_path.name}...")
            if importer.import_gutenberg_file(str(file_path), args.category):
                success_count += 1
        success = success_count > 0
    
    stats = importer.get_import_stats()
    logger.info(f"Import complete: {stats}")
    db.close()
    return success


def import_bible(args):
    """Import Bible XML."""
    db = SessionLocal()
    importer = DataImporter(db)
    
    logger.info(f"Importing Bible from: {args.path}")
    success = importer.import_bible_xml(args.path)
    
    stats = importer.get_import_stats()
    logger.info(f"Import complete: {stats}")
    db.close()
    return success


def import_founding(args):
    """Import U.S. founding documents."""
    db = SessionLocal()
    importer = DataImporter(db)
    
    logger.info(f"Importing founding documents from: {args.path}")
    success = importer.import_founding_documents(args.path)
    
    stats = importer.get_import_stats()
    logger.info(f"Import complete: {stats}")
    db.close()
    return success


def main():
    parser = argparse.ArgumentParser(
        description='Import content into the Elemental Genius Library'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Import commands')
    
    # Gutenberg import
    gutenberg_parser = subparsers.add_parser(
        'gutenberg',
        help='Import Project Gutenberg texts'
    )
    gutenberg_parser.add_argument('path', help='Path to file or directory')
    gutenberg_parser.add_argument(
        '--category',
        default='Literature',
        help='Category for imported texts'
    )
    
    # Bible import
    bible_parser = subparsers.add_parser(
        'bible',
        help='Import Bible XML'
    )
    bible_parser.add_argument('path', help='Path to Bible XML file')
    
    # Founding documents import
    founding_parser = subparsers.add_parser(
        'founding',
        help='Import U.S. founding documents'
    )
    founding_parser.add_argument('path', help='Path to documents directory')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    commands = {
        'gutenberg': import_gutenberg,
        'bible': import_bible,
        'founding': import_founding
    }
    
    command_func = commands.get(args.command)
    if command_func:
        success = command_func(args)
        return 0 if success else 1
    else:
        logger.error(f"Unknown command: {args.command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())