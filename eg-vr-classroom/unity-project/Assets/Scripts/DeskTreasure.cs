using System.Collections.Generic;
using UnityEngine;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Desk Treasure System - Surprise collectibles and fun items in desk drawers
    /// Makes exploring and opening desks exciting for children
    /// </summary>
    public class DeskTreasure : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Treasure Spawning")]
        [SerializeField] private bool hasRandomTreasure = true;
        [SerializeField] [Range(0f, 1f)] private float treasureSpawnChance = 0.7f;
        [SerializeField] private Transform treasureSpawnPoint;
        [SerializeField] private int maxTreasuresPerDesk = 3;

        [Header("Treasure Prefabs")]
        [SerializeField] private List<GameObject> commonTreasures = new List<GameObject>();
        [SerializeField] private List<GameObject> rareTreasures = new List<GameObject>();
        [SerializeField] private List<GameObject> legendaryTreasures = new List<GameObject>();
        [SerializeField] [Range(0f, 1f)] private float rareChance = 0.2f;
        [SerializeField] [Range(0f, 1f)] private float legendaryChance = 0.05f;

        [Header("Audio")]
        [SerializeField] private AudioClip treasureFoundSound;
        [SerializeField] private AudioClip rareTreasureSound;
        [SerializeField] private AudioClip legendaryTreasureSound;
        [SerializeField] private AudioSource audioSource;

        [Header("Visual Effects")]
        [SerializeField] private ParticleSystem treasureGlowEffect;
        [SerializeField] private Light treasureLight;
        [SerializeField] private Color commonGlowColor = Color.yellow;
        [SerializeField] private Color rareGlowColor = Color.cyan;
        [SerializeField] private Color legendaryGlowColor = Color.magenta;
        #endregion

        #region Treasure Types
        [System.Serializable]
        public class TreasureItem
        {
            public string name;
            public GameObject prefab;
            public TreasureRarity rarity;
            public string description;
            public bool isCollectible; // For collection tracking
        }

        public enum TreasureRarity
        {
            Common,
            Rare,
            Legendary
        }
        #endregion

        #region Private Fields
        private List<TreasureItem> _currentTreasures = new List<TreasureItem>();
        private StudentDesk _parentDesk;
        private bool _treasuresGenerated = false;
        private bool _deskOpened = false;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            _parentDesk = GetComponentInParent<StudentDesk>();

            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.spatialBlend = 1f;
                audioSource.maxDistance = 5f;
            }

            // Create spawn point if not assigned
            if (treasureSpawnPoint == null)
            {
                GameObject spawnGO = new GameObject("TreasureSpawnPoint");
                spawnGO.transform.SetParent(transform);
                spawnGO.transform.localPosition = Vector3.zero;
                treasureSpawnPoint = spawnGO.transform;
            }
        }

        private void OnEnable()
        {
            // Subscribe to desk open event
            if (_parentDesk != null)
            {
                // We'll manually call this when desk opens
            }
        }
        #endregion

        #region Treasure Generation
        /// <summary>
        /// Generate random treasures for this desk
        /// </summary>
        public void GenerateTreasures()
        {
            if (_treasuresGenerated) return;

            _currentTreasures.Clear();

            if (!hasRandomTreasure) return;

            // Determine number of treasures
            int treasureCount = Random.Range(1, maxTreasuresPerDesk + 1);

            for (int i = 0; i < treasureCount; i++)
            {
                if (Random.value <= treasureSpawnChance)
                {
                    TreasureRarity rarity = DetermineTreasureRarity();
                    GameObject treasurePrefab = SelectTreasurePrefab(rarity);

                    if (treasurePrefab != null)
                    {
                        TreasureItem item = new TreasureItem
                        {
                            name = treasurePrefab.name,
                            prefab = treasurePrefab,
                            rarity = rarity,
                            description = GetTreasureDescription(treasurePrefab),
                            isCollectible = true
                        };

                        _currentTreasures.Add(item);
                    }
                }
            }

            _treasuresGenerated = true;

            Debug.Log($"[DeskTreasure] Generated {_currentTreasures.Count} treasures");
        }

        private TreasureRarity DetermineTreasureRarity()
        {
            float roll = Random.value;

            if (roll <= legendaryChance)
            {
                return TreasureRarity.Legendary;
            }
            else if (roll <= legendaryChance + rareChance)
            {
                return TreasureRarity.Rare;
            }
            else
            {
                return TreasureRarity.Common;
            }
        }

        private GameObject SelectTreasurePrefab(TreasureRarity rarity)
        {
            List<GameObject> treasurePool = null;

            switch (rarity)
            {
                case TreasureRarity.Common:
                    treasurePool = commonTreasures;
                    break;
                case TreasureRarity.Rare:
                    treasurePool = rareTreasures;
                    break;
                case TreasureRarity.Legendary:
                    treasurePool = legendaryTreasures;
                    break;
            }

            if (treasurePool != null && treasurePool.Count > 0)
            {
                return treasurePool[Random.Range(0, treasurePool.Count)];
            }

            return null;
        }

        private string GetTreasureDescription(GameObject prefab)
        {
            // Could be expanded with a database of descriptions
            Dictionary<string, string> descriptions = new Dictionary<string, string>()
            {
                {"Marble", "A shiny glass marble with swirls inside!"},
                {"Toy Soldier", "A brave little toy soldier ready for adventure!"},
                {"Pencil", "A special pencil with a fun eraser on top!"},
                {"Sticker", "A sparkly sticker you can collect!"},
                {"Trading Card", "A rare trading card with a cool character!"},
                {"Rubber Ball", "A bouncy ball that's fun to throw!"},
                {"Whistle", "A tiny whistle that makes a fun sound!"},
                {"Compass", "A real compass that points north!"},
                {"Magnifying Glass", "Look at tiny things up close!"},
                {"Golden Star", "A very special golden star - super rare!"}
            };

            if (descriptions.ContainsKey(prefab.name))
            {
                return descriptions[prefab.name];
            }

            return "A mysterious treasure!";
        }
        #endregion

        #region Treasure Revealing
        /// <summary>
        /// Called when desk is opened - reveal treasures!
        /// </summary>
        public void RevealTreasures()
        {
            if (_deskOpened) return;

            _deskOpened = true;

            // Generate if not already done
            if (!_treasuresGenerated)
            {
                GenerateTreasures();
            }

            // Spawn treasures
            foreach (var treasure in _currentTreasures)
            {
                SpawnTreasure(treasure);
            }

            // Play reveal effects
            if (_currentTreasures.Count > 0)
            {
                PlayRevealEffects(_currentTreasures[0].rarity);
            }
        }

        private void SpawnTreasure(TreasureItem treasure)
        {
            if (treasure.prefab == null) return;

            // Spawn at treasure point with slight randomization
            Vector3 spawnPos = treasureSpawnPoint.position + Random.insideUnitSphere * 0.1f;
            GameObject treasureObj = Instantiate(treasure.prefab, spawnPos, Random.rotation);

            // Make it grabbable
            if (treasureObj.GetComponent<GrabbableObject>() == null)
            {
                GrabbableObject grabbable = treasureObj.AddComponent<GrabbableObject>();
                // Set properties based on treasure type
            }

            // Add glow effect based on rarity
            AddTreasureGlow(treasureObj, treasure.rarity);

            Debug.Log($"[DeskTreasure] Spawned {treasure.name} ({treasure.rarity})");
        }

        private void AddTreasureGlow(GameObject treasureObj, TreasureRarity rarity)
        {
            // Add particle effect
            if (treasureGlowEffect != null)
            {
                ParticleSystem glow = Instantiate(treasureGlowEffect, treasureObj.transform);

                // Color based on rarity
                var main = glow.main;
                switch (rarity)
                {
                    case TreasureRarity.Common:
                        main.startColor = commonGlowColor;
                        break;
                    case TreasureRarity.Rare:
                        main.startColor = rareGlowColor;
                        break;
                    case TreasureRarity.Legendary:
                        main.startColor = legendaryGlowColor;
                        break;
                }

                glow.Play();
            }

            // Add light
            if (treasureLight != null)
            {
                Light light = Instantiate(treasureLight, treasureObj.transform);

                switch (rarity)
                {
                    case TreasureRarity.Common:
                        light.color = commonGlowColor;
                        light.intensity = 0.5f;
                        break;
                    case TreasureRarity.Rare:
                        light.color = rareGlowColor;
                        light.intensity = 1f;
                        break;
                    case TreasureRarity.Legendary:
                        light.color = legendaryGlowColor;
                        light.intensity = 2f;
                        break;
                }
            }
        }

        private void PlayRevealEffects(TreasureRarity highestRarity)
        {
            // Play sound based on rarest treasure
            AudioClip soundToPlay = treasureFoundSound;

            switch (highestRarity)
            {
                case TreasureRarity.Rare:
                    soundToPlay = rareTreasureSound ?? treasureFoundSound;
                    break;
                case TreasureRarity.Legendary:
                    soundToPlay = legendaryTreasureSound ?? treasureFoundSound;
                    break;
            }

            if (audioSource != null && soundToPlay != null)
            {
                audioSource.PlayOneShot(soundToPlay);
            }

            // Celebration effects
            if (highestRarity == TreasureRarity.Legendary)
            {
                CelebrationEffects.Instance?.CelebrateSpecial(
                    treasureSpawnPoint.position,
                    "Legendary Treasure Found!"
                );
            }
            else if (highestRarity == TreasureRarity.Rare)
            {
                CelebrationEffects.Instance?.PlayInteractionSparkle(treasureSpawnPoint.position);
            }
        }
        #endregion

        #region Specific Treasure Lists
        /// <summary>
        /// Preset treasure lists for different themes
        /// </summary>
        public void SetTreasureTheme(TreasureTheme theme)
        {
            // Clear existing
            commonTreasures.Clear();
            rareTreasures.Clear();
            legendaryTreasures.Clear();

            switch (theme)
            {
                case TreasureTheme.SchoolSupplies:
                    // Common: pencils, erasers, paper clips
                    // Rare: special pens, rulers with magnifying glass
                    // Legendary: golden pencil, magic eraser
                    break;

                case TreasureTheme.Toys:
                    // Common: marbles, toy cars, small figures
                    // Rare: wind-up toys, special collectibles
                    // Legendary: rare vintage toy
                    break;

                case TreasureTheme.Nature:
                    // Common: pretty rocks, feathers, acorns
                    // Rare: crystals, rare shells
                    // Legendary: geode, fossil
                    break;

                case TreasureTheme.Educational:
                    // Common: flash cards, stickers
                    // Rare: mini globe, telescope
                    // Legendary: astronomy book, science kit
                    break;
            }

            _treasuresGenerated = false;
        }

        public enum TreasureTheme
        {
            Random,
            SchoolSupplies,
            Toys,
            Nature,
            Educational
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Check if desk has treasures
        /// </summary>
        public bool HasTreasures()
        {
            if (!_treasuresGenerated)
            {
                GenerateTreasures();
            }

            return _currentTreasures.Count > 0;
        }

        /// <summary>
        /// Get list of current treasures (for UI display)
        /// </summary>
        public List<TreasureItem> GetTreasures()
        {
            return _currentTreasures;
        }

        /// <summary>
        /// Manually add a specific treasure
        /// </summary>
        public void AddSpecificTreasure(GameObject treasurePrefab, TreasureRarity rarity)
        {
            TreasureItem item = new TreasureItem
            {
                name = treasurePrefab.name,
                prefab = treasurePrefab,
                rarity = rarity,
                description = GetTreasureDescription(treasurePrefab),
                isCollectible = true
            };

            _currentTreasures.Add(item);

            Debug.Log($"[DeskTreasure] Added specific treasure: {treasurePrefab.name}");
        }
        #endregion

        #region Integration
        /// <summary>
        /// Connect to StudentDesk - call this from StudentDesk.Open()
        /// </summary>
        public void OnDeskOpened()
        {
            RevealTreasures();
        }

        /// <summary>
        /// Reset treasures (for new session/day)
        /// </summary>
        public void ResetTreasures()
        {
            _currentTreasures.Clear();
            _treasuresGenerated = false;
            _deskOpened = false;

            Debug.Log("[DeskTreasure] Treasures reset");
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            // Draw treasure spawn point
            if (treasureSpawnPoint != null)
            {
                Gizmos.color = Color.yellow;
                Gizmos.DrawWireSphere(treasureSpawnPoint.position, 0.05f);

                if (_currentTreasures != null && _currentTreasures.Count > 0)
                {
                    #if UNITY_EDITOR
                    UnityEditor.Handles.Label(
                        treasureSpawnPoint.position + Vector3.up * 0.2f,
                        $"{_currentTreasures.Count} Treasures"
                    );
                    #endif
                }
            }
        }
        #endregion
    }
}
