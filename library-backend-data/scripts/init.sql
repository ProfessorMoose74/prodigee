-- Enable PostgreSQL extensions for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Configure text search
ALTER DATABASE elemental_library SET default_text_search_config = 'pg_catalog.english';

-- Create custom text search configuration
CREATE TEXT SEARCH CONFIGURATION english_unaccent (COPY = english);
ALTER TEXT SEARCH CONFIGURATION english_unaccent
    ALTER MAPPING FOR asciiword, asciihword, hword_asciipart,
                      word, hword, hword_part
    WITH unaccent, english_stem;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gin_documents_title ON documents USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gin_documents_author ON documents USING gin (author gin_trgm_ops);