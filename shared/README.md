# Shared Library

Common models, utilities, and configuration used across all Prodigee microservices.

## Models

Pydantic models defining canonical Firestore document schemas. These are the single source of truth for data shapes across all services.

### `models/users.py`

| Model | Firestore Collection | Description |
|-------|---------------------|-------------|
| `Parent` | `parents` | Parent/guardian account (email, subscription tier, children list) |
| `Child` | `children` | Child profile — COPPA-compliant (display name only, no email) |

Enums: `SubscriptionTier` (free, standard, premium, institute), `AgeRange` (3-5, 6-8, 9-12, 13+)

### `models/learning.py`

| Model | Firestore Collection | Description |
|-------|---------------------|-------------|
| `PhonemicProgress` | `phonemic_progress` | Per-child, per-skill mastery tracking |
| `LearningSession` | `learning_sessions` | Individual session records with engagement metrics |
| `Assessment` | `assessments` | Assessment results with skill scores and recommendations |

Enums: `PhonemicSkill` (8 skills), `MasteryLevel` (not_started → advanced)

## Usage

```python
from shared.models.users import Parent, Child, AgeRange
from shared.models.learning import PhonemicProgress, PhonemicSkill, MasteryLevel

# Create a child document
child = Child(
    parent_id="abc123",
    display_name="Explorer",
    age=6,
    age_range=AgeRange.AGES_6_8,
)

# Track phonemic progress
progress = PhonemicProgress(
    child_id=child.id,
    skill=PhonemicSkill.RHYMING,
    mastery_level=MasteryLevel.DEVELOPING,
    accuracy=0.72,
)
```

## Adding New Models

1. Create or update a file in `shared/models/`
2. Use Pydantic `BaseModel` with type annotations
3. Include docstrings noting the Firestore collection name
4. Keep models flat — Firestore documents, not relational joins
