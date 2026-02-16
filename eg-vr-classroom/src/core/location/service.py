"""
Location Service Integration
Handles location-based content localization through Helyxium
"""

import asyncio
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import logging
from datetime import datetime, timezone
import pytz

logger = logging.getLogger(__name__)


class Region(Enum):
    """Global regions for content localization"""
    NORTH_AMERICA = "na"
    SOUTH_AMERICA = "sa"
    EUROPE = "eu"
    ASIA_PACIFIC = "apac"
    MIDDLE_EAST = "me"
    AFRICA = "af"
    OCEANIA = "oc"


@dataclass
class LocationData:
    """Comprehensive location information"""
    country_code: str           # ISO 3166-1 alpha-2
    country_name: str
    region: Region
    state_province: Optional[str]
    city: Optional[str]
    timezone: str               # IANA timezone
    latitude: Optional[float]
    longitude: Optional[float]
    language_codes: List[str]   # Preferred languages for region
    currency_code: str          # ISO 4217
    measurement_system: str     # "metric" or "imperial"
    date_format: str           # Local date format
    academic_year_start: str   # Month when school year starts
    cultural_holidays: List[str]


@dataclass
class Landmark:
    """Educational landmark for virtual classroom"""
    id: str
    name: str
    type: str  # "natural", "architectural", "historical", "cultural"
    country_code: str
    description: str
    image_url: str
    coordinates: Tuple[float, float]
    educational_value: str
    age_appropriate: List[str]  # ["5-7", "8-10", "11-13"]
    fun_fact: str


class LocationService:
    """
    Manages location-based content and localization
    Integrates with Helyxium's location detection
    """
    
    def __init__(self, helyxium_connector):
        self.helyxium = helyxium_connector
        self.location_cache: Dict[str, LocationData] = {}
        self.landmarks_cache: Dict[str, List[Landmark]] = {}
        self.country_data = self._load_country_data()
        
    def _load_country_data(self) -> Dict:
        """Load country-specific configuration data"""
        # In production, this would load from a database
        return {
            "US": {
                "name": "United States",
                "region": Region.NORTH_AMERICA,
                "languages": ["en"],
                "currency": "USD",
                "measurement": "imperial",
                "date_format": "MM/DD/YYYY",
                "academic_year_start": "September",
                "holidays": ["Independence Day", "Thanksgiving", "MLK Day"]
            },
            "GB": {
                "name": "United Kingdom",
                "region": Region.EUROPE,
                "languages": ["en"],
                "currency": "GBP",
                "measurement": "metric",
                "date_format": "DD/MM/YYYY",
                "academic_year_start": "September",
                "holidays": ["Guy Fawkes Day", "Boxing Day", "St. George's Day"]
            },
            "CN": {
                "name": "China",
                "region": Region.ASIA_PACIFIC,
                "languages": ["zh_CN"],
                "currency": "CNY",
                "measurement": "metric",
                "date_format": "YYYY-MM-DD",
                "academic_year_start": "September",
                "holidays": ["Spring Festival", "Mid-Autumn Festival", "National Day"]
            },
            "JP": {
                "name": "Japan",
                "region": Region.ASIA_PACIFIC,
                "languages": ["ja"],
                "currency": "JPY",
                "measurement": "metric",
                "date_format": "YYYY/MM/DD",
                "academic_year_start": "April",
                "holidays": ["Golden Week", "Obon", "Coming of Age Day"]
            },
            "FR": {
                "name": "France",
                "region": Region.EUROPE,
                "languages": ["fr"],
                "currency": "EUR",
                "measurement": "metric",
                "date_format": "DD/MM/YYYY",
                "academic_year_start": "September",
                "holidays": ["Bastille Day", "Armistice Day", "Fête de la Musique"]
            },
            "BR": {
                "name": "Brazil",
                "region": Region.SOUTH_AMERICA,
                "languages": ["pt"],
                "currency": "BRL",
                "measurement": "metric",
                "date_format": "DD/MM/YYYY",
                "academic_year_start": "February",
                "holidays": ["Carnival", "Festa Junina", "Independence Day"]
            },
            "IN": {
                "name": "India",
                "region": Region.ASIA_PACIFIC,
                "languages": ["hi", "en"],
                "currency": "INR",
                "measurement": "metric",
                "date_format": "DD/MM/YYYY",
                "academic_year_start": "April",
                "holidays": ["Diwali", "Holi", "Independence Day", "Republic Day"]
            }
        }
    
    async def get_user_location(self, user_id: str, session_id: str) -> LocationData:
        """
        Get comprehensive location data for a user
        Uses Helyxium's location detection
        """
        # Check cache first
        if user_id in self.location_cache:
            return self.location_cache[user_id]
        
        try:
            # Get location from Helyxium
            helyxium_location = await self.helyxium._get_user_location(user_id)
            
            # Enrich with additional data
            country_info = self.country_data.get(
                helyxium_location.country_code, 
                self.country_data["US"]  # Default fallback
            )
            
            location = LocationData(
                country_code=helyxium_location.country_code,
                country_name=country_info["name"],
                region=country_info["region"],
                state_province=helyxium_location.region,
                city=helyxium_location.city,
                timezone=helyxium_location.timezone,
                latitude=None,  # Privacy: Don't store exact coordinates
                longitude=None,
                language_codes=country_info["languages"],
                currency_code=country_info["currency"],
                measurement_system=country_info["measurement"],
                date_format=country_info["date_format"],
                academic_year_start=country_info["academic_year_start"],
                cultural_holidays=country_info["holidays"]
            )
            
            self.location_cache[user_id] = location
            logger.info(f"Retrieved location for user {user_id}: {location.country_code}")
            return location
            
        except Exception as e:
            logger.error(f"Failed to get user location: {e}")
            # Return default safe location
            return self._get_default_location()
    
    def _get_default_location(self) -> LocationData:
        """Get default location when detection fails"""
        return LocationData(
            country_code="US",
            country_name="United States",
            region=Region.NORTH_AMERICA,
            state_province=None,
            city=None,
            timezone="America/New_York",
            latitude=None,
            longitude=None,
            language_codes=["en"],
            currency_code="USD",
            measurement_system="imperial",
            date_format="MM/DD/YYYY",
            academic_year_start="September",
            cultural_holidays=[]
        )
    
    async def get_classroom_localization(self, location: LocationData) -> Dict[str, Any]:
        """
        Get localized classroom content based on location
        """
        localization = {
            "flag_texture": f"textures/flags/{location.country_code.lower()}.png",
            "map_texture": f"textures/maps/{location.country_code.lower()}.png",
            "clock_timezone": location.timezone,
            "measurement_tools": self._get_measurement_tools(location.measurement_system),
            "calendar_format": location.date_format,
            "academic_calendar": self._get_academic_calendar(location),
            "cultural_decorations": await self._get_cultural_decorations(location),
            "local_landmarks": await self.get_local_landmarks(location.country_code),
            "currency_symbols": self._get_currency_info(location.currency_code),
            "number_format": self._get_number_format(location.country_code)
        }
        
        return localization
    
    def _get_measurement_tools(self, system: str) -> Dict[str, str]:
        """Get appropriate measurement tools for the classroom"""
        if system == "imperial":
            return {
                "ruler": "12 inch ruler",
                "scale": "pounds scale",
                "thermometer": "fahrenheit",
                "volume": "cups and ounces"
            }
        else:
            return {
                "ruler": "30 cm ruler",
                "scale": "kilogram scale",
                "thermometer": "celsius",
                "volume": "liters and milliliters"
            }
    
    def _get_academic_calendar(self, location: LocationData) -> Dict[str, Any]:
        """Generate academic calendar based on location"""
        current_date = datetime.now(pytz.timezone(location.timezone))
        academic_year_month = {
            "January": 1, "February": 2, "March": 3, "April": 4,
            "May": 5, "June": 6, "July": 7, "August": 8,
            "September": 9, "October": 10, "November": 11, "December": 12
        }
        
        start_month = academic_year_month.get(location.academic_year_start, 9)
        
        # Calculate current academic year
        if current_date.month >= start_month:
            academic_year = f"{current_date.year}-{current_date.year + 1}"
        else:
            academic_year = f"{current_date.year - 1}-{current_date.year}"
        
        return {
            "current_year": academic_year,
            "start_month": start_month,
            "holidays": location.cultural_holidays,
            "current_term": self._calculate_term(current_date.month, start_month)
        }
    
    def _calculate_term(self, current_month: int, start_month: int) -> str:
        """Calculate current academic term"""
        months_since_start = (current_month - start_month) % 12
        
        if months_since_start < 3:
            return "Fall Term"
        elif months_since_start < 6:
            return "Winter Term"
        elif months_since_start < 9:
            return "Spring Term"
        else:
            return "Summer Term"
    
    async def _get_cultural_decorations(self, location: LocationData) -> List[str]:
        """Get culturally appropriate classroom decorations"""
        decorations = []
        
        # Add flag and map
        decorations.append(f"flag_{location.country_code.lower()}")
        decorations.append(f"map_{location.region.value}")
        
        # Add cultural elements based on region
        cultural_items = {
            Region.NORTH_AMERICA: ["eagle_poster", "liberty_bell_model"],
            Region.EUROPE: ["castle_picture", "historical_timeline"],
            Region.ASIA_PACIFIC: ["calligraphy_display", "origami_corner"],
            Region.SOUTH_AMERICA: ["rainforest_mural", "cultural_masks"],
            Region.AFRICA: ["wildlife_posters", "traditional_patterns"],
            Region.MIDDLE_EAST: ["geometric_patterns", "desert_landscape"],
            Region.OCEANIA: ["ocean_life_display", "indigenous_art"]
        }
        
        if location.region in cultural_items:
            decorations.extend(cultural_items[location.region])
        
        return decorations
    
    def _get_currency_info(self, currency_code: str) -> Dict[str, str]:
        """Get currency information for math lessons"""
        currencies = {
            "USD": {"symbol": "$", "name": "Dollar", "decimal": "."},
            "EUR": {"symbol": "€", "name": "Euro", "decimal": ","},
            "GBP": {"symbol": "£", "name": "Pound", "decimal": "."},
            "JPY": {"symbol": "¥", "name": "Yen", "decimal": "."},
            "CNY": {"symbol": "¥", "name": "Yuan", "decimal": "."},
            "INR": {"symbol": "₹", "name": "Rupee", "decimal": "."},
            "BRL": {"symbol": "R$", "name": "Real", "decimal": ","}
        }
        return currencies.get(currency_code, currencies["USD"])
    
    def _get_number_format(self, country_code: str) -> Dict[str, str]:
        """Get number formatting rules for the country"""
        formats = {
            "US": {"thousands": ",", "decimal": "."},
            "GB": {"thousands": ",", "decimal": "."},
            "FR": {"thousands": " ", "decimal": ","},
            "DE": {"thousands": ".", "decimal": ","},
            "CN": {"thousands": ",", "decimal": "."},
            "JP": {"thousands": ",", "decimal": "."},
            "BR": {"thousands": ".", "decimal": ","},
            "IN": {"thousands": ",", "decimal": "."}
        }
        return formats.get(country_code, formats["US"])
    
    async def get_local_landmarks(self, country_code: str, 
                                 limit: int = 20) -> List[Landmark]:
        """
        Get educational landmarks for the lunch room murals
        40% local, 60% international mix
        """
        if country_code in self.landmarks_cache:
            return self.landmarks_cache[country_code][:limit]
        
        landmarks = []
        
        # Get local landmarks (40%)
        local_count = int(limit * 0.4)
        local_landmarks = await self._fetch_local_landmarks(country_code, local_count)
        landmarks.extend(local_landmarks)
        
        # Get international landmarks (60%)
        international_count = limit - local_count
        international_landmarks = await self._fetch_international_landmarks(
            country_code, international_count
        )
        landmarks.extend(international_landmarks)
        
        self.landmarks_cache[country_code] = landmarks
        return landmarks
    
    async def _fetch_local_landmarks(self, country_code: str, 
                                    count: int) -> List[Landmark]:
        """Fetch landmarks from the user's country"""
        # In production, this would query a landmark database
        local_landmarks = {
            "US": [
                Landmark(
                    id="us_grand_canyon",
                    name="Grand Canyon",
                    type="natural",
                    country_code="US",
                    description="A steep-sided canyon carved by the Colorado River",
                    image_url="landmarks/us_grand_canyon.jpg",
                    coordinates=(36.1069, -112.1129),
                    educational_value="Geology and erosion",
                    age_appropriate=["8-10", "11-13"],
                    fun_fact="The Grand Canyon is 277 miles long and up to 18 miles wide!"
                ),
                Landmark(
                    id="us_statue_liberty",
                    name="Statue of Liberty",
                    type="architectural",
                    country_code="US",
                    description="A symbol of freedom and democracy",
                    image_url="landmarks/us_statue_liberty.jpg",
                    coordinates=(40.6892, -74.0445),
                    educational_value="History and immigration",
                    age_appropriate=["5-7", "8-10", "11-13"],
                    fun_fact="The statue was a gift from France in 1886!"
                )
            ],
            "GB": [
                Landmark(
                    id="gb_stonehenge",
                    name="Stonehenge",
                    type="historical",
                    country_code="GB",
                    description="Prehistoric monument of standing stones",
                    image_url="landmarks/gb_stonehenge.jpg",
                    coordinates=(51.1789, -1.8262),
                    educational_value="Ancient history and astronomy",
                    age_appropriate=["8-10", "11-13"],
                    fun_fact="Stonehenge is over 5,000 years old!"
                )
            ],
            "CN": [
                Landmark(
                    id="cn_great_wall",
                    name="Great Wall of China",
                    type="architectural",
                    country_code="CN",
                    description="Ancient fortification across northern China",
                    image_url="landmarks/cn_great_wall.jpg",
                    coordinates=(40.4319, 116.5704),
                    educational_value="Ancient engineering and defense",
                    age_appropriate=["5-7", "8-10", "11-13"],
                    fun_fact="The wall is over 13,000 miles long!"
                )
            ]
        }
        
        return local_landmarks.get(country_code, [])[:count]
    
    async def _fetch_international_landmarks(self, exclude_country: str,
                                            count: int) -> List[Landmark]:
        """Fetch famous international landmarks"""
        international_landmarks = [
            Landmark(
                id="fr_eiffel_tower",
                name="Eiffel Tower",
                type="architectural",
                country_code="FR",
                description="Iron lattice tower in Paris",
                image_url="landmarks/fr_eiffel_tower.jpg",
                coordinates=(48.8584, 2.2945),
                educational_value="Engineering and architecture",
                age_appropriate=["5-7", "8-10", "11-13"],
                fun_fact="The tower grows 6 inches in summer due to heat expansion!"
            ),
            Landmark(
                id="eg_pyramids",
                name="Pyramids of Giza",
                type="historical",
                country_code="EG",
                description="Ancient pyramid complex",
                image_url="landmarks/eg_pyramids.jpg",
                coordinates=(29.9792, 31.1342),
                educational_value="Ancient civilizations",
                age_appropriate=["8-10", "11-13"],
                fun_fact="The pyramids were built over 4,500 years ago!"
            ),
            Landmark(
                id="in_taj_mahal",
                name="Taj Mahal",
                type="architectural",
                country_code="IN",
                description="Ivory-white marble mausoleum",
                image_url="landmarks/in_taj_mahal.jpg",
                coordinates=(27.1751, 78.0421),
                educational_value="Architecture and history",
                age_appropriate=["8-10", "11-13"],
                fun_fact="It took 22 years and 20,000 workers to build!"
            ),
            Landmark(
                id="au_opera_house",
                name="Sydney Opera House",
                type="architectural",
                country_code="AU",
                description="Multi-venue performing arts centre",
                image_url="landmarks/au_opera_house.jpg",
                coordinates=(-33.8568, 151.2153),
                educational_value="Modern architecture and arts",
                age_appropriate=["5-7", "8-10", "11-13"],
                fun_fact="The roof is covered with over 1 million tiles!"
            ),
            Landmark(
                id="br_christ_redeemer",
                name="Christ the Redeemer",
                type="cultural",
                country_code="BR",
                description="Art Deco statue overlooking Rio",
                image_url="landmarks/br_christ_redeemer.jpg",
                coordinates=(-22.9519, -43.2105),
                educational_value="Art and culture",
                age_appropriate=["8-10", "11-13"],
                fun_fact="The statue is 98 feet tall and weighs 635 tons!"
            ),
            Landmark(
                id="jp_fuji",
                name="Mount Fuji",
                type="natural",
                country_code="JP",
                description="Japan's highest mountain",
                image_url="landmarks/jp_fuji.jpg",
                coordinates=(35.3606, 138.7274),
                educational_value="Volcanoes and geography",
                age_appropriate=["8-10", "11-13"],
                fun_fact="Mount Fuji last erupted in 1707!"
            )
        ]
        
        # Filter out landmarks from the user's country
        filtered = [l for l in international_landmarks if l.country_code != exclude_country]
        return filtered[:count]
    
    async def get_timezone_info(self, timezone_str: str) -> Dict[str, Any]:
        """Get timezone information for the classroom clock"""
        try:
            tz = pytz.timezone(timezone_str)
            now = datetime.now(tz)
            
            return {
                "timezone": timezone_str,
                "current_time": now.isoformat(),
                "offset": now.strftime("%z"),
                "is_dst": bool(now.dst()),
                "display_name": tz.zone,
                "school_hours": self._get_school_hours(tz)
            }
        except Exception as e:
            logger.error(f"Failed to get timezone info: {e}")
            return self._get_default_timezone_info()
    
    def _get_school_hours(self, timezone) -> Dict[str, str]:
        """Get typical school hours for the timezone"""
        # Standard school hours (can be customized per region)
        return {
            "start": "08:30",
            "lunch_start": "12:00",
            "lunch_end": "12:45",
            "end": "15:30"
        }
    
    def _get_default_timezone_info(self) -> Dict[str, Any]:
        """Default timezone info when detection fails"""
        return {
            "timezone": "UTC",
            "current_time": datetime.now(timezone.utc).isoformat(),
            "offset": "+0000",
            "is_dst": False,
            "display_name": "UTC",
            "school_hours": self._get_school_hours(pytz.UTC)
        }
    
    async def update_landmark_rotation(self, classroom_id: str) -> Landmark:
        """
        Update daily landmark rotation for lunch room
        Returns today's featured landmark
        """
        # Get classroom location
        # In production, this would fetch from database
        country_code = "US"  # Placeholder
        
        # Get landmarks for this location
        landmarks = await self.get_local_landmarks(country_code)
        
        if not landmarks:
            return self._get_default_landmark()
        
        # Simple daily rotation based on day of year
        day_of_year = datetime.now().timetuple().tm_yday
        landmark_index = day_of_year % len(landmarks)
        
        return landmarks[landmark_index]
    
    def _get_default_landmark(self) -> Landmark:
        """Default landmark when none available"""
        return Landmark(
            id="default_landmark",
            name="Planet Earth",
            type="natural",
            country_code="WORLD",
            description="Our beautiful home planet",
            image_url="landmarks/earth.jpg",
            coordinates=(0, 0),
            educational_value="Geography and environment",
            age_appropriate=["5-7", "8-10", "11-13"],
            fun_fact="Earth is the only known planet with life!"
        )