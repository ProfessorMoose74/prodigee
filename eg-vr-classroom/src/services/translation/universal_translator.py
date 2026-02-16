"""
Universal Translator Service
Making the OASIS Education Planet accessible worldwide
"""

import logging
from typing import Dict, List, Optional, Any
from functools import lru_cache
import time

from googletrans import Translator as GoogleTranslator

from src.core.config import config
from src.core.database import session_scope, ApprovedPhrase

logger = logging.getLogger(__name__)


class TranslationError(Exception):
    """Translation error"""
    pass


class UniversalTranslator:
    """
    Universal Translation Service for OASIS

    Features:
    - Real-time text translation (100+ languages)
    - Voice-to-voice translation pipeline
    - Approved phrase translation caching
    - Curriculum translation
    - UI localization
    """

    def __init__(self):
        """Initialize universal translator"""
        self.translator = GoogleTranslator()
        self.cache_enabled = config.get('services.translation.cache_translations', True)

        # Language codes mapping
        self.languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese (Simplified)',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'bn': 'Bengali',
            'pa': 'Punjabi',
            'te': 'Telugu',
            'mr': 'Marathi',
            'ta': 'Tamil',
            'ur': 'Urdu',
            'tr': 'Turkish',
            'vi': 'Vietnamese',
            'th': 'Thai',
            'pl': 'Polish',
            'uk': 'Ukrainian',
            'nl': 'Dutch',
            'sw': 'Swahili',
            'fil': 'Filipino',
            'id': 'Indonesian',
            'he': 'Hebrew',
            'fa': 'Persian',
        }

        logger.info("Universal Translator initialized - 30+ languages supported")

    # ========================================================================
    # BASIC TRANSLATION
    # ========================================================================

    def translate_text(
        self,
        text: str,
        source_lang: str = 'auto',
        target_lang: str = 'en'
    ) -> str:
        """
        Translate text from source to target language

        Args:
            text: Text to translate
            source_lang: Source language code ('auto' for auto-detect)
            target_lang: Target language code

        Returns:
            Translated text

        Example:
            >>> translator.translate_text("Hello", 'en', 'es')
            'Hola'
        """
        try:
            if source_lang == target_lang:
                return text

            result = self.translator.translate(
                text,
                src=source_lang,
                dest=target_lang
            )

            return result.text

        except Exception as e:
            logger.error(f"Translation failed: {e}")
            raise TranslationError(f"Translation failed: {e}")

    def translate_batch(
        self,
        texts: List[str],
        source_lang: str = 'auto',
        target_lang: str = 'en'
    ) -> List[str]:
        """
        Translate multiple texts

        Args:
            texts: List of texts to translate
            source_lang: Source language code
            target_lang: Target language code

        Returns:
            List of translated texts
        """
        try:
            if source_lang == target_lang:
                return texts

            results = self.translator.translate(
                texts,
                src=source_lang,
                dest=target_lang
            )

            return [r.text for r in results]

        except Exception as e:
            logger.error(f"Batch translation failed: {e}")
            raise TranslationError(f"Batch translation failed: {e}")

    def detect_language(self, text: str) -> str:
        """
        Detect language of text

        Args:
            text: Text to analyze

        Returns:
            Language code (e.g., 'en', 'es')
        """
        try:
            detection = self.translator.detect(text)
            return detection.lang
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return 'en'  # Default to English

    # ========================================================================
    # APPROVED PHRASES (COPPA-Safe Communication)
    # ========================================================================

    def get_approved_phrases_translated(
        self,
        target_lang: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all approved phrases translated to target language

        Args:
            target_lang: Target language code
            category: Filter by category

        Returns:
            List of {phrase_id, original, translated, category}
        """
        with session_scope() as session:
            query = session.query(ApprovedPhrase)

            if category:
                query = query.filter_by(category=category)

            phrases = query.all()

            translated_phrases = []

            for phrase in phrases:
                # Check cache first
                cached = phrase.translation_cache.get(target_lang) if phrase.translation_cache else None

                if cached:
                    translated = cached
                else:
                    # Translate and cache
                    translated = self.translate_text(
                        phrase.phrase_text,
                        'en',
                        target_lang
                    )

                    # Update cache in database
                    if phrase.translation_cache is None:
                        phrase.translation_cache = {}

                    phrase.translation_cache[target_lang] = translated
                    session.flush()

                translated_phrases.append({
                    'phrase_id': phrase.phrase_id,
                    'original': phrase.phrase_text,
                    'translated': translated,
                    'category': phrase.category,
                    'language_code': target_lang
                })

            logger.info(f"Translated {len(translated_phrases)} approved phrases to {target_lang}")
            return translated_phrases

    def translate_approved_phrase(
        self,
        phrase_id: int,
        target_lang: str
    ) -> str:
        """
        Translate a specific approved phrase

        Args:
            phrase_id: Approved phrase ID
            target_lang: Target language code

        Returns:
            Translated phrase
        """
        with session_scope() as session:
            phrase = session.query(ApprovedPhrase).filter_by(
                phrase_id=phrase_id
            ).first()

            if not phrase:
                raise ValueError(f"Approved phrase {phrase_id} not found")

            # Check cache
            if phrase.translation_cache and target_lang in phrase.translation_cache:
                return phrase.translation_cache[target_lang]

            # Translate
            translated = self.translate_text(
                phrase.phrase_text,
                'en',
                target_lang
            )

            # Cache
            if phrase.translation_cache is None:
                phrase.translation_cache = {}

            phrase.translation_cache[target_lang] = translated
            session.flush()

            return translated

    # ========================================================================
    # CURRICULUM TRANSLATION
    # ========================================================================

    def translate_curriculum_content(
        self,
        content: Dict[str, Any],
        target_lang: str
    ) -> Dict[str, Any]:
        """
        Translate curriculum content

        Args:
            content: Curriculum data dictionary
            target_lang: Target language code

        Returns:
            Translated curriculum data
        """
        translated = content.copy()

        # Translate specific fields
        translatable_fields = [
            'title', 'description', 'instructions',
            'nursery_rhyme_title', 'nursery_rhyme_lyrics',
            'nursery_rhyme_motions', 'skill_focus'
        ]

        for field in translatable_fields:
            if field in content and content[field]:
                try:
                    translated[field] = self.translate_text(
                        content[field],
                        'en',
                        target_lang
                    )
                except Exception as e:
                    logger.warning(f"Failed to translate field {field}: {e}")

        return translated

    # ========================================================================
    # VOICE TRANSLATION PIPELINE
    # ========================================================================

    def translate_voice_to_voice(
        self,
        audio_data: bytes,
        source_lang: str,
        target_langs: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Full voice-to-voice translation pipeline

        Pipeline:
        1. Speech-to-text (source language)
        2. Translate text to target languages
        3. Text-to-speech (target languages)

        Args:
            audio_data: Audio bytes
            source_lang: Source language code
            target_langs: List of target language codes

        Returns:
            {
                'es': {'text': 'Hola', 'audio': b'...'},
                'fr': {'text': 'Bonjour', 'audio': b'...'},
                ...
            }

        Note: This is a placeholder. Actual implementation requires
        integration with speech recognition and TTS services.
        """
        # TODO: Integrate with voice processing service
        # For now, return placeholder structure

        results = {}

        for target_lang in target_langs:
            results[target_lang] = {
                'text': f"[Translation to {target_lang} pending voice integration]",
                'audio': None,
                'confidence': 0.0
            }

        logger.warning("Voice translation pipeline not yet fully implemented")
        return results

    # ========================================================================
    # UI LOCALIZATION
    # ========================================================================

    @lru_cache(maxsize=1000)
    def get_ui_string(
        self,
        key: str,
        language: str = 'en',
        **format_args
    ) -> str:
        """
        Get localized UI string

        Args:
            key: String key
            language: Language code
            **format_args: Format arguments

        Returns:
            Localized string

        Example:
            >>> translator.get_ui_string('welcome', 'es', name='Maria')
            'Bienvenida, Maria'
        """
        # UI strings database (expandable)
        ui_strings = {
            'welcome': 'Welcome, {name}!',
            'loading': 'Loading...',
            'error': 'An error occurred',
            'success': 'Success!',
            'login': 'Log In',
            'logout': 'Log Out',
            'start_session': 'Start VR Session',
            'end_session': 'End VR Session',
            'good_job': 'Good Job!',
            'try_again': 'Try Again',
            'help': 'Help',
            'settings': 'Settings',
            'emergency_stop': 'Emergency Stop',
            'parent_mode': 'Parent Mode',
            'child_mode': 'Child Mode',
            'classroom': 'Classroom',
            'lunchroom': 'Lunch Room',
            'library': 'Library',
        }

        # Get base string
        base_string = ui_strings.get(key, key)

        # Translate if not English
        if language != 'en':
            try:
                base_string = self.translate_text(base_string, 'en', language)
            except Exception as e:
                logger.warning(f"UI string translation failed for {key}: {e}")

        # Format
        if format_args:
            try:
                return base_string.format(**format_args)
            except KeyError:
                return base_string

        return base_string

    # ========================================================================
    # MULTI-USER TRANSLATION
    # ========================================================================

    def translate_for_classroom(
        self,
        text: str,
        source_child_lang: str,
        target_children_langs: List[str]
    ) -> Dict[str, str]:
        """
        Translate message for multi-user classroom

        Args:
            text: Original message
            source_child_lang: Speaker's language
            target_children_langs: List of recipient languages

        Returns:
            {
                'es': 'Hola',
                'fr': 'Bonjour',
                ...
            }
        """
        translations = {}

        for target_lang in target_children_langs:
            if target_lang == source_child_lang:
                translations[target_lang] = text
            else:
                try:
                    translations[target_lang] = self.translate_text(
                        text,
                        source_child_lang,
                        target_lang
                    )
                except Exception as e:
                    logger.error(f"Classroom translation failed ({target_lang}): {e}")
                    translations[target_lang] = text  # Fallback to original

        return translations

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def get_supported_languages(self) -> Dict[str, str]:
        """Get dictionary of supported languages"""
        return self.languages.copy()

    def is_language_supported(self, lang_code: str) -> bool:
        """Check if language is supported"""
        return lang_code in self.languages

    def get_language_name(self, lang_code: str) -> str:
        """Get language name from code"""
        return self.languages.get(lang_code, 'Unknown')


# Global instance
universal_translator = UniversalTranslator()
