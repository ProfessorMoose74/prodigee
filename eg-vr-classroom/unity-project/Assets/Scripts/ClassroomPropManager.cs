using System.Collections.Generic;
using UnityEngine;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Classroom Prop Manager - Spawns and manages all interactive objects in the classroom
    /// Makes it easy to populate the classroom with toys, supplies, and educational items
    /// </summary>
    public class ClassroomPropManager : MonoBehaviour
    {
        #region Singleton
        private static ClassroomPropManager _instance;
        public static ClassroomPropManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<ClassroomPropManager>();
                }
                return _instance;
            }
        }
        #endregion

        #region Inspector Settings
        [Header("Prop Prefabs - School Supplies")]
        [SerializeField] private GameObject chalkPrefab;
        [SerializeField] private GameObject eraserPrefab;
        [SerializeField] private GameObject pencilPrefab;
        [SerializeField] private GameObject pencilBoxPrefab;
        [SerializeField] private GameObject rulerPrefab;
        [SerializeField] private GameObject bookPrefab;
        [SerializeField] private GameObject notebookPrefab;

        [Header("Prop Prefabs - Toys")]
        [SerializeField] private GameObject marblePrefab;
        [SerializeField] private GameObject toyCarPrefab;
        [SerializeField] private GameObject toySoldierPrefab;
        [SerializeField] private GameObject ballPrefab;
        [SerializeField] private GameObject stuffedAnimalPrefab;
        [SerializeField] private GameObject jacksPrefab;
        [SerializeField] private GameObject yoyoPrefab;

        [Header("Prop Prefabs - Educational")]
        [SerializeField] private GameObject globePrefab;
        [SerializeField] private GameObject compassPrefab;
        [SerializeField] private GameObject magnifyingGlassPrefab;
        [SerializeField] private GameObject miniTelescopePrefab;
        [SerializeField] private GameObject abacusPrefab;

        [Header("Prop Prefabs - Nature")]
        [SerializeField] private GameObject rockPrefab;
        [SerializeField] private GameObject featherPrefab;
        [SerializeField] private GameObject acornPrefab;
        [SerializeField] private GameObject shellPrefab;
        [SerializeField] private GameObject crystalPrefab;

        [Header("Prop Prefabs - Special")]
        [SerializeField] private GameObject bellPrefab;
        [SerializeField] private GameObject applePrefab;
        [SerializeField] private GameObject goldenStarPrefab;
        [SerializeField] private GameObject certificatePrefab;

        [Header("Spawn Locations")]
        [SerializeField] private Transform teacherDeskTop;
        [SerializeField] private Transform bookshelf;
        [SerializeField] private Transform windowSill;
        [SerializeField] private Transform chalkTray;
        [SerializeField] private List<Transform> customSpawnPoints = new List<Transform>();

        [Header("Auto-Populate Settings")]
        [SerializeField] private bool populateOnStart = true;
        [SerializeField] private bool randomizePropSelection = true;
        [SerializeField] private int minPropsPerArea = 2;
        [SerializeField] private int maxPropsPerArea = 5;
        #endregion

        #region Properties
        public List<GameObject> SpawnedProps { get; private set; } = new List<GameObject>();
        public Dictionary<string, GameObject> PropRegistry { get; private set; } = new Dictionary<string, GameObject>();
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;

            InitializePropRegistry();
        }

        private void Start()
        {
            if (populateOnStart)
            {
                PopulateClassroom();
            }
        }
        #endregion

        #region Initialization
        private void InitializePropRegistry()
        {
            // Register all prop prefabs for easy access
            RegisterProp("chalk", chalkPrefab);
            RegisterProp("eraser", eraserPrefab);
            RegisterProp("pencil", pencilPrefab);
            RegisterProp("pencilBox", pencilBoxPrefab);
            RegisterProp("ruler", rulerPrefab);
            RegisterProp("book", bookPrefab);
            RegisterProp("notebook", notebookPrefab);

            RegisterProp("marble", marblePrefab);
            RegisterProp("toyCar", toyCarPrefab);
            RegisterProp("toySoldier", toySoldierPrefab);
            RegisterProp("ball", ballPrefab);
            RegisterProp("stuffedAnimal", stuffedAnimalPrefab);
            RegisterProp("jacks", jacksPrefab);
            RegisterProp("yoyo", yoyoPrefab);

            RegisterProp("globe", globePrefab);
            RegisterProp("compass", compassPrefab);
            RegisterProp("magnifyingGlass", magnifyingGlassPrefab);
            RegisterProp("telescope", miniTelescopePrefab);
            RegisterProp("abacus", abacusPrefab);

            RegisterProp("rock", rockPrefab);
            RegisterProp("feather", featherPrefab);
            RegisterProp("acorn", acornPrefab);
            RegisterProp("shell", shellPrefab);
            RegisterProp("crystal", crystalPrefab);

            RegisterProp("bell", bellPrefab);
            RegisterProp("apple", applePrefab);
            RegisterProp("goldenStar", goldenStarPrefab);
            RegisterProp("certificate", certificatePrefab);

            Debug.Log($"[PropManager] Registered {PropRegistry.Count} prop types");
        }

        private void RegisterProp(string name, GameObject prefab)
        {
            if (prefab != null)
            {
                PropRegistry[name] = prefab;
            }
        }
        #endregion

        #region Population
        /// <summary>
        /// Populate entire classroom with props
        /// </summary>
        public void PopulateClassroom()
        {
            Debug.Log("[PropManager] Populating classroom with props...");

            // Teacher's desk
            if (teacherDeskTop != null)
            {
                PopulateArea(teacherDeskTop, new[] { "bell", "apple", "book", "pencilBox" });
            }

            // Chalk tray
            if (chalkTray != null)
            {
                PopulateArea(chalkTray, new[] { "chalk", "eraser" }, forceAll: true);
            }

            // Bookshelf
            if (bookshelf != null)
            {
                PopulateArea(bookshelf, new[] { "book", "globe", "abacus", "compass" });
            }

            // Window sill
            if (windowSill != null)
            {
                PopulateArea(windowSill, new[] { "rock", "shell", "feather", "crystal" });
            }

            // Custom spawn points
            foreach (var spawnPoint in customSpawnPoints)
            {
                PopulateAreaRandom(spawnPoint);
            }

            Debug.Log($"[PropManager] Spawned {SpawnedProps.Count} props");
        }

        /// <summary>
        /// Populate specific area with selected prop types
        /// </summary>
        private void PopulateArea(Transform area, string[] propTypes, bool forceAll = false)
        {
            if (area == null) return;

            List<string> propsToSpawn = new List<string>(propTypes);

            if (!forceAll && randomizePropSelection)
            {
                // Random selection
                int count = Random.Range(minPropsPerArea, Mathf.Min(maxPropsPerArea, propsToSpawn.Count) + 1);
                propsToSpawn = GetRandomSubset(propsToSpawn, count);
            }

            // Spawn each prop
            for (int i = 0; i < propsToSpawn.Count; i++)
            {
                Vector3 offset = new Vector3(
                    Random.Range(-0.2f, 0.2f),
                    0.1f,
                    Random.Range(-0.2f, 0.2f)
                );

                SpawnProp(propsToSpawn[i], area.position + offset, area);
            }
        }

        /// <summary>
        /// Populate area with completely random props
        /// </summary>
        private void PopulateAreaRandom(Transform area)
        {
            if (area == null) return;

            int count = Random.Range(minPropsPerArea, maxPropsPerArea + 1);

            for (int i = 0; i < count; i++)
            {
                // Pick random prop from registry
                List<string> propNames = new List<string>(PropRegistry.Keys);
                string randomProp = propNames[Random.Range(0, propNames.Count)];

                Vector3 offset = new Vector3(
                    Random.Range(-0.3f, 0.3f),
                    0.1f,
                    Random.Range(-0.3f, 0.3f)
                );

                SpawnProp(randomProp, area.position + offset, area);
            }
        }
        #endregion

        #region Spawning
        /// <summary>
        /// Spawn specific prop by name
        /// </summary>
        public GameObject SpawnProp(string propName, Vector3 position, Transform parent = null)
        {
            if (!PropRegistry.ContainsKey(propName))
            {
                Debug.LogWarning($"[PropManager] Prop '{propName}' not found in registry");
                return null;
            }

            GameObject prefab = PropRegistry[propName];
            if (prefab == null)
            {
                Debug.LogWarning($"[PropManager] Prefab for '{propName}' is null");
                return null;
            }

            GameObject prop = Instantiate(prefab, position, Random.rotation, parent);
            SpawnedProps.Add(prop);

            // Ensure it has GrabbableObject component
            if (prop.GetComponent<GrabbableObject>() == null)
            {
                prop.AddComponent<GrabbableObject>();
            }

            Debug.Log($"[PropManager] Spawned {propName} at {position}");

            return prop;
        }

        /// <summary>
        /// Spawn prop at random location within bounds
        /// </summary>
        public GameObject SpawnPropInBounds(string propName, Bounds bounds)
        {
            Vector3 randomPos = new Vector3(
                Random.Range(bounds.min.x, bounds.max.x),
                Random.Range(bounds.min.y, bounds.max.y),
                Random.Range(bounds.min.z, bounds.max.z)
            );

            return SpawnProp(propName, randomPos);
        }

        /// <summary>
        /// Spawn multiple props at once
        /// </summary>
        public List<GameObject> SpawnMultipleProps(string[] propNames, Vector3 centerPosition, float radius = 1f)
        {
            List<GameObject> spawnedProps = new List<GameObject>();

            for (int i = 0; i < propNames.Length; i++)
            {
                Vector3 offset = Random.insideUnitSphere * radius;
                offset.y = Mathf.Abs(offset.y); // Keep above ground

                GameObject prop = SpawnProp(propNames[i], centerPosition + offset);
                if (prop != null)
                {
                    spawnedProps.Add(prop);
                }
            }

            return spawnedProps;
        }
        #endregion

        #region Desk Integration
        /// <summary>
        /// Fill desk with random props (for treasure system)
        /// </summary>
        public void FillDeskWithProps(Transform deskTransform, int count = 3)
        {
            DeskTreasure deskTreasure = deskTransform.GetComponent<DeskTreasure>();

            if (deskTreasure != null)
            {
                // Let DeskTreasure system handle it
                deskTreasure.GenerateTreasures();
            }
            else
            {
                // Manual fill
                List<string> possibleProps = new List<string>
                {
                    "marble", "pencil", "eraser", "toy", "rock", "feather"
                };

                for (int i = 0; i < count; i++)
                {
                    string randomProp = possibleProps[Random.Range(0, possibleProps.Count)];
                    SpawnProp(randomProp, deskTransform.position, deskTransform);
                }
            }
        }

        /// <summary>
        /// Fill all student desks with props
        /// </summary>
        public void FillAllDesks()
        {
            StudentDesk[] desks = FindObjectsOfType<StudentDesk>();

            foreach (var desk in desks)
            {
                FillDeskWithProps(desk.transform, Random.Range(1, 4));
            }

            Debug.Log($"[PropManager] Filled {desks.Length} desks with props");
        }
        #endregion

        #region Cleanup
        /// <summary>
        /// Remove all spawned props
        /// </summary>
        public void ClearAllProps()
        {
            foreach (var prop in SpawnedProps)
            {
                if (prop != null)
                {
                    Destroy(prop);
                }
            }

            SpawnedProps.Clear();

            Debug.Log("[PropManager] Cleared all props");
        }

        /// <summary>
        /// Reset props to original positions (if they have return-to-origin enabled)
        /// </summary>
        public void ResetAllProps()
        {
            foreach (var prop in SpawnedProps)
            {
                if (prop != null)
                {
                    GrabbableObject grabbable = prop.GetComponent<GrabbableObject>();
                    if (grabbable != null)
                    {
                        grabbable.ReturnToOrigin();
                    }
                }
            }

            Debug.Log("[PropManager] Reset all props to origin");
        }
        #endregion

        #region Utility
        private List<string> GetRandomSubset(List<string> source, int count)
        {
            List<string> shuffled = new List<string>(source);

            // Fisher-Yates shuffle
            for (int i = shuffled.Count - 1; i > 0; i--)
            {
                int j = Random.Range(0, i + 1);
                string temp = shuffled[i];
                shuffled[i] = shuffled[j];
                shuffled[j] = temp;
            }

            return shuffled.GetRange(0, Mathf.Min(count, shuffled.Count));
        }

        /// <summary>
        /// Get all props of specific type
        /// </summary>
        public List<GameObject> GetPropsOfType(GrabbableObject.ObjectType type)
        {
            List<GameObject> matchingProps = new List<GameObject>();

            foreach (var prop in SpawnedProps)
            {
                if (prop != null)
                {
                    GrabbableObject grabbable = prop.GetComponent<GrabbableObject>();
                    if (grabbable != null && grabbable.objectType == type)
                    {
                        matchingProps.Add(prop);
                    }
                }
            }

            return matchingProps;
        }

        /// <summary>
        /// Count total props in classroom
        /// </summary>
        public int GetPropCount()
        {
            // Remove null references
            SpawnedProps.RemoveAll(prop => prop == null);
            return SpawnedProps.Count;
        }
        #endregion

        #region Special Spawns
        /// <summary>
        /// Spawn reward item for child achievement
        /// </summary>
        public GameObject SpawnReward(Vector3 position, DeskTreasure.TreasureRarity rarity)
        {
            string propName = "";

            switch (rarity)
            {
                case DeskTreasure.TreasureRarity.Common:
                    propName = "certificate";
                    break;
                case DeskTreasure.TreasureRarity.Rare:
                    propName = "goldenStar";
                    break;
                case DeskTreasure.TreasureRarity.Legendary:
                    propName = "trophy"; // Would need to add trophy prefab
                    break;
            }

            GameObject reward = SpawnProp(propName, position);

            // Celebration!
            if (reward != null)
            {
                CelebrationEffects.Instance?.CelebrateSpecial(position, "Reward Earned!");
            }

            return reward;
        }

        /// <summary>
        /// Daily surprise prop appears somewhere in classroom
        /// </summary>
        public GameObject SpawnDailySurprise()
        {
            // Pick random rare/legendary prop
            string[] specialProps = { "crystal", "telescope", "compass", "magnifyingGlass", "goldenStar" };
            string propName = specialProps[Random.Range(0, specialProps.Length)];

            // Pick random spawn point
            Transform spawnPoint = customSpawnPoints[Random.Range(0, customSpawnPoints.Count)];

            GameObject surprise = SpawnProp(propName, spawnPoint.position);

            Debug.Log($"[PropManager] Daily surprise: {propName} spawned!");

            // Add special glow
            if (surprise != null)
            {
                // Add treasure glow effect
                DeskTreasure.TreasureRarity rarity = DeskTreasure.TreasureRarity.Legendary;
                // Visual feedback handled by GrabbableObject
            }

            return surprise;
        }
        #endregion

        #region Context Menu (Testing)
        [ContextMenu("Populate Classroom")]
        private void TestPopulateClassroom()
        {
            PopulateClassroom();
        }

        [ContextMenu("Clear All Props")]
        private void TestClearAllProps()
        {
            ClearAllProps();
        }

        [ContextMenu("Fill All Desks")]
        private void TestFillAllDesks()
        {
            FillAllDesks();
        }

        [ContextMenu("Spawn Daily Surprise")]
        private void TestSpawnDailySurprise()
        {
            SpawnDailySurprise();
        }
        #endregion
    }
}
