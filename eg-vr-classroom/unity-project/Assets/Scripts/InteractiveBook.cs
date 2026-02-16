using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace EG.OASIS.Classroom
{
    /// <summary>
    /// Interactive Book - Children can pick up, open, and read books
    /// Includes page turning, reading mode, and educational content
    /// </summary>
    [RequireComponent(typeof(GrabbableObject))]
    public class InteractiveBook : MonoBehaviour
    {
        #region Inspector Settings
        [Header("Book Properties")]
        [SerializeField] private string bookTitle = "The Adventures of Al";
        [SerializeField] private string author = "Professor Al";
        [SerializeField] private BookType bookType = BookType.Story;
        [SerializeField] private int totalPages = 10;

        [Header("Visual Components")]
        [SerializeField] private Transform bookCover;
        [SerializeField] private Transform leftPage;
        [SerializeField] private Transform rightPage;
        [SerializeField] private Canvas pageCanvas;
        [SerializeField] private TextMeshProUGUI leftPageText;
        [SerializeField] private TextMeshProUGUI rightPageText;
        [SerializeField] private Image leftPageImage;
        [SerializeField] private Image rightPageImage;

        [Header("Animation")]
        [SerializeField] private float openAngle = 120f;
        [SerializeField] private float openSpeed = 2f;
        [SerializeField] private float pageFlipSpeed = 5f;

        [Header("Audio")]
        [SerializeField] private AudioClip bookOpenSound;
        [SerializeField] private AudioClip bookCloseSound;
        [SerializeField] private AudioClip pageFlipSound;
        [SerializeField] private AudioSource audioSource;

        [Header("Content")]
        [SerializeField] private TextAsset contentFile; // JSON or text file with pages
        [SerializeField] private Sprite[] pageImages;
        #endregion

        #region Book Types
        public enum BookType
        {
            Story,
            Educational,
            Picture,
            Activity,
            Reference
        }
        #endregion

        #region Properties
        public bool IsOpen { get; private set; }
        public int CurrentPage { get; private set; } = 0;
        public string Title => bookTitle;
        public string Author => author;
        #endregion

        #region Private Fields
        private GrabbableObject _grabbable;
        private Quaternion _closedRotation;
        private Quaternion _openRotation;
        private bool _isAnimating;
        private string[] _pageContents;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeComponents();
            LoadContent();
        }

        private void Update()
        {
            if (_isAnimating)
            {
                AnimateBookCover();
            }
        }
        #endregion

        #region Initialization
        private void InitializeComponents()
        {
            _grabbable = GetComponent<GrabbableObject>();

            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
                audioSource.spatialBlend = 1f;
                audioSource.maxDistance = 5f;
            }

            // Calculate rotations
            if (bookCover != null)
            {
                _closedRotation = bookCover.localRotation;
                _openRotation = _closedRotation * Quaternion.Euler(0, 0, openAngle);
            }

            // Hide pages initially
            if (pageCanvas != null)
            {
                pageCanvas.gameObject.SetActive(false);
            }
        }

        private void LoadContent()
        {
            // Load page contents
            if (contentFile != null)
            {
                LoadFromFile();
            }
            else
            {
                GenerateDefaultContent();
            }

            Debug.Log($"[Book] Loaded '{bookTitle}' with {totalPages} pages");
        }

        private void LoadFromFile()
        {
            // Parse JSON or text file
            // For now, simple text parsing
            string text = contentFile.text;
            _pageContents = text.Split(new string[] { "[PAGE]" }, System.StringSplitOptions.None);
            totalPages = _pageContents.Length;
        }

        private void GenerateDefaultContent()
        {
            // Generate sample content based on book type
            _pageContents = new string[totalPages];

            switch (bookType)
            {
                case BookType.Story:
                    GenerateStoryContent();
                    break;
                case BookType.Educational:
                    GenerateEducationalContent();
                    break;
                case BookType.Picture:
                    GeneratePictureBookContent();
                    break;
                default:
                    GenerateGenericContent();
                    break;
            }
        }

        private void GenerateStoryContent()
        {
            string[] storyPages = new string[]
            {
                "Once upon a time, in a magical classroom...",
                "Professor Al, a wise owl, taught children from around the world.",
                "Ella the Elephant was kind and gentle, helping everyone learn.",
                "Gus the Grasshopper was full of energy and loved to explore!",
                "Together, they went on amazing adventures in the OASIS.",
                "They learned about countries, numbers, and reading.",
                "Every day was filled with discovery and fun!",
                "The children made friends from every corner of Earth.",
                "And they all learned that education is the greatest adventure.",
                "The End. What will you discover today?"
            };

            _pageContents = storyPages;
            totalPages = storyPages.Length;
        }

        private void GenerateEducationalContent()
        {
            string[] eduPages = new string[]
            {
                $"{bookTitle}\n\nBy {author}",
                "Chapter 1: Introduction\n\nLet's learn together!",
                "Fact 1: The Earth is round like a ball.",
                "Fact 2: There are 7 continents on Earth.",
                "Fact 3: The sun gives us light and warmth.",
                "Fact 4: Reading helps our brains grow!",
                "Fact 5: Every language is special and important.",
                "Fact 6: Math helps us solve problems.",
                "Fact 7: Science explains how things work.",
                "Keep learning and exploring!"
            };

            _pageContents = eduPages;
            totalPages = eduPages.Length;
        }

        private void GeneratePictureBookContent()
        {
            string[] picPages = new string[]
            {
                "Look at the pictures!",
                "Can you find the hidden owl?",
                "What color is the elephant?",
                "Count the grasshoppers!",
                "Point to the globe!",
                "Find the alphabet!",
                "Spot the differences!",
                "Draw your favorite part!",
                "Tell a story about this picture!",
                "Great job looking!"
            };

            _pageContents = picPages;
            totalPages = picPages.Length;
        }

        private void GenerateGenericContent()
        {
            _pageContents = new string[totalPages];
            for (int i = 0; i < totalPages; i++)
            {
                _pageContents[i] = $"Page {i + 1}\n\n{bookTitle}";
            }
        }
        #endregion

        #region Book Opening/Closing
        /// <summary>
        /// Open the book
        /// </summary>
        public void Open()
        {
            if (IsOpen) return;

            IsOpen = true;
            _isAnimating = true;
            CurrentPage = 0;

            // Show pages
            if (pageCanvas != null)
            {
                pageCanvas.gameObject.SetActive(true);
            }

            // Display first pages
            DisplayCurrentPages();

            // Play sound
            SoundManager.Instance?.PlaySound(bookOpenSound);

            Debug.Log($"[Book] Opened '{bookTitle}'");
        }

        /// <summary>
        /// Close the book
        /// </summary>
        public void Close()
        {
            if (!IsOpen) return;

            IsOpen = false;
            _isAnimating = true;

            // Hide pages
            if (pageCanvas != null)
            {
                pageCanvas.gameObject.SetActive(false);
            }

            // Play sound
            SoundManager.Instance?.PlaySound(bookCloseSound);

            Debug.Log($"[Book] Closed '{bookTitle}'");
        }

        /// <summary>
        /// Toggle book open/closed
        /// </summary>
        public void Toggle()
        {
            if (IsOpen)
            {
                Close();
            }
            else
            {
                Open();
            }
        }

        private void AnimateBookCover()
        {
            if (bookCover == null) return;

            Quaternion targetRotation = IsOpen ? _openRotation : _closedRotation;

            bookCover.localRotation = Quaternion.Lerp(
                bookCover.localRotation,
                targetRotation,
                Time.deltaTime * openSpeed
            );

            // Check if animation complete
            if (Quaternion.Angle(bookCover.localRotation, targetRotation) < 0.5f)
            {
                bookCover.localRotation = targetRotation;
                _isAnimating = false;
            }
        }
        #endregion

        #region Page Turning
        /// <summary>
        /// Turn to next page
        /// </summary>
        public void NextPage()
        {
            if (!IsOpen) return;

            if (CurrentPage < totalPages - 2)
            {
                CurrentPage += 2; // Two pages at a time (left + right)
                DisplayCurrentPages();
                PlayPageFlipSound();

                Debug.Log($"[Book] Page {CurrentPage}/{totalPages}");
            }
            else
            {
                Debug.Log("[Book] Last page reached");
            }
        }

        /// <summary>
        /// Turn to previous page
        /// </summary>
        public void PreviousPage()
        {
            if (!IsOpen) return;

            if (CurrentPage > 0)
            {
                CurrentPage -= 2;
                CurrentPage = Mathf.Max(0, CurrentPage);
                DisplayCurrentPages();
                PlayPageFlipSound();

                Debug.Log($"[Book] Page {CurrentPage}/{totalPages}");
            }
            else
            {
                Debug.Log("[Book] First page reached");
            }
        }

        /// <summary>
        /// Jump to specific page
        /// </summary>
        public void GoToPage(int pageNumber)
        {
            if (!IsOpen) return;

            pageNumber = Mathf.Clamp(pageNumber, 0, totalPages - 1);

            // Make sure it's even (left page)
            if (pageNumber % 2 != 0)
            {
                pageNumber--;
            }

            CurrentPage = pageNumber;
            DisplayCurrentPages();
            PlayPageFlipSound();
        }

        private void DisplayCurrentPages()
        {
            // Left page
            if (leftPageText != null && CurrentPage < _pageContents.Length)
            {
                leftPageText.text = _pageContents[CurrentPage];
            }

            // Right page
            if (rightPageText != null && CurrentPage + 1 < _pageContents.Length)
            {
                rightPageText.text = _pageContents[CurrentPage + 1];
            }

            // Images (if available)
            if (pageImages != null && pageImages.Length > 0)
            {
                if (leftPageImage != null && CurrentPage < pageImages.Length)
                {
                    leftPageImage.sprite = pageImages[CurrentPage];
                    leftPageImage.enabled = true;
                }

                if (rightPageImage != null && CurrentPage + 1 < pageImages.Length)
                {
                    rightPageImage.sprite = pageImages[CurrentPage + 1];
                    rightPageImage.enabled = true;
                }
            }
        }

        private void PlayPageFlipSound()
        {
            SoundManager.Instance?.PlaySound(pageFlipSound);
        }
        #endregion

        #region VR Interaction
        /// <summary>
        /// Handle grab - open book
        /// </summary>
        public void OnGrabbed()
        {
            if (!IsOpen)
            {
                Open();
            }
        }

        /// <summary>
        /// Handle trigger press - turn page
        /// </summary>
        public void OnTriggerPress()
        {
            if (IsOpen)
            {
                NextPage();
            }
        }

        /// <summary>
        /// Handle grip press - previous page
        /// </summary>
        public void OnGripPress()
        {
            if (IsOpen)
            {
                PreviousPage();
            }
        }
        #endregion

        #region Reading Mode
        /// <summary>
        /// Enter reading mode (book faces player)
        /// </summary>
        public void EnterReadingMode()
        {
            if (!IsOpen)
            {
                Open();
            }

            // Position book in front of player
            if (Camera.main != null)
            {
                Vector3 readingPosition = Camera.main.transform.position +
                                         Camera.main.transform.forward * 0.5f;

                transform.position = readingPosition;
                transform.LookAt(Camera.main.transform);
                transform.Rotate(0, 180, 0); // Face player
            }

            Debug.Log("[Book] Entered reading mode");
        }

        /// <summary>
        /// Exit reading mode
        /// </summary>
        public void ExitReadingMode()
        {
            Close();
            Debug.Log("[Book] Exited reading mode");
        }
        #endregion

        #region Content Management
        /// <summary>
        /// Set custom page content
        /// </summary>
        public void SetPageContent(int pageIndex, string content)
        {
            if (pageIndex >= 0 && pageIndex < _pageContents.Length)
            {
                _pageContents[pageIndex] = content;

                // Refresh display if on current page
                if (pageIndex == CurrentPage || pageIndex == CurrentPage + 1)
                {
                    DisplayCurrentPages();
                }
            }
        }

        /// <summary>
        /// Get current page content
        /// </summary>
        public string GetPageContent(int pageIndex)
        {
            if (pageIndex >= 0 && pageIndex < _pageContents.Length)
            {
                return _pageContents[pageIndex];
            }
            return "";
        }

        /// <summary>
        /// Add bookmark
        /// </summary>
        public void AddBookmark(int pageNumber)
        {
            // Could save bookmark to player profile
            Debug.Log($"[Book] Bookmarked page {pageNumber}");
        }
        #endregion

        #region Educational Integration
        /// <summary>
        /// Load activity page (for activity books)
        /// </summary>
        public void LoadActivityPage(string activityTitle, string activityDescription)
        {
            if (bookType == BookType.Activity)
            {
                CurrentPage = 0;
                _pageContents[0] = $"{activityTitle}\n\n{activityDescription}";
                DisplayCurrentPages();
            }
        }

        /// <summary>
        /// Mark page as read (for progress tracking)
        /// </summary>
        public void MarkPageAsRead(int pageNumber)
        {
            // Send to backend for progress tracking
            Debug.Log($"[Book] Page {pageNumber} marked as read");
        }
        #endregion

        #region Gizmos
        private void OnDrawGizmos()
        {
            // Draw book outline
            Gizmos.color = Color.blue;
            Gizmos.DrawWireCube(transform.position, transform.localScale);

            // Draw open direction
            if (IsOpen && bookCover != null)
            {
                Gizmos.color = Color.green;
                Gizmos.DrawLine(transform.position, bookCover.position);
            }
        }
        #endregion

        #region Context Menu (Testing)
        [ContextMenu("Open Book")]
        private void TestOpen()
        {
            Open();
        }

        [ContextMenu("Close Book")]
        private void TestClose()
        {
            Close();
        }

        [ContextMenu("Next Page")]
        private void TestNextPage()
        {
            NextPage();
        }

        [ContextMenu("Previous Page")]
        private void TestPreviousPage()
        {
            PreviousPage();
        }
        #endregion
    }
}
