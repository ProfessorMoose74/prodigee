# Learning Engine Service

Core adaptive curriculum delivery for the Prodigee platform. This is the heart of the educational experience.

## Responsibilities

- Deliver Heggerty phonemic awareness curriculum (35 weeks, 8 skills)
- Serve STEM and character education content
- Process student speech via Cloud Speech-to-Text for pronunciation assessment
- Generate adaptive learning recommendations via Vertex AI
- Translate content dynamically via Cloud Translation API
- Manage educational content in Cloud Storage
- Track activity completions and session data

## API Endpoints

### Curriculum
- `GET /curriculum/week/{week_number}` — Get Heggerty curriculum for a week
- `GET /subjects` — List available subjects
- `GET /content` — List educational content with filters

### Child Learning
- `GET /child/dashboard` — Main learning interface (activities, progress, recommendations)
- `GET /child/activity/{activity_type}` — Get activity details
- `POST /child/activity/{activity_type}/complete` — Record activity completion

### Voice / Speech
- `POST /voice/process` — Process speech via Cloud Speech-to-Text (pronunciation assessment)
- `POST /voice/synthesize` — Generate speech via Cloud Text-to-Speech

### AI / Adaptive Learning
- `POST /ai/recommendation` — Get Vertex AI learning recommendation

## GCP API Dependencies

| API | Purpose |
|-----|---------|
| **Vertex AI** | Adaptive learning intelligence, content recommendations, assessment analysis |
| **Cloud Speech-to-Text** | Student pronunciation assessment (critical for phonemic awareness) |
| **Cloud Translation** | Dynamic multilanguage content delivery (30+ languages) |
| **Cloud Storage** | Media assets, curriculum files, student uploads |

## Curriculum Structure

### Heggerty Phonemic Awareness (35 weeks)

8 core skills progressing from simple to complex:

1. **Rhyming** (weeks 1-2) — Recognition and production
2. **Onset Fluency** (week 3) — Syllable awareness
3. **Blending** (weeks 6-10) — CVC word blending
4. **Isolating** (week 5) — Phoneme isolation
5. **Segmenting** (weeks 11-15) — Phoneme segmentation
6. **Adding** (weeks 16-20) — Phoneme addition
7. **Deleting** (weeks 21-25) — Phoneme deletion
8. **Substituting** (weeks 26-30) — Phoneme substitution
9. **Mastery** (weeks 31-35) — Comprehensive review

Daily lesson structure: Warm-up (1 min) → Instruction (3 min) → Guided Practice (3 min) → Assessment (1 min)

### STEM Integration
- Age-specific projects (3-5, 6-8, 9-10)
- 5-14 day project duration

### Character Development
- 12 core traits, one per month
- Biblical foundations with American values connections

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LEARNING_VERTEX_AI_MODEL` | `gemini-2.0-flash` | Vertex AI model for recommendations |
| `LEARNING_SPEECH_LANGUAGE_CODE` | `en-US` | Default speech recognition language |
| `LEARNING_SPEECH_SAMPLE_RATE` | `16000` | Audio sample rate (Hz) |
| `LEARNING_TRANSLATION_DEFAULT_LANGUAGE` | `en` | Default content language |
| `LEARNING_CONTENT_BUCKET` | `prodigee-content` | Cloud Storage bucket for content |
| `LEARNING_MEDIA_BUCKET` | `prodigee-media` | Cloud Storage bucket for media |

## Firestore Collections

- `phonemic_progress` — Per-child, per-skill progress tracking
- `learning_sessions` — Session records with metrics
- `assessments` — Assessment results and recommendations
- `voice_interactions` — Text transcripts (COPPA: no audio stored)
- `curriculum_data` — Cached curriculum content
