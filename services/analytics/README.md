# Analytics Service

Student progress tracking, parent dashboards, and teacher/admin reporting.

## Responsibilities

- Aggregate and serve student progress data
- Power parent monitoring dashboards (all children's progress)
- Generate teacher/admin classroom reports
- Track phonemic awareness mastery across 8 skills and 35 weeks
- Record assessment milestones and intervention triggers
- Provide system health and performance metrics

## API Endpoints

### Student Progress
- `GET /child/{child_id}/progress` — Comprehensive progress report
- `GET /child/{child_id}/phonemic-progress` — Phonemic skill breakdown (8 skills)
- `GET /child/{child_id}/sessions` — Learning session history
- `GET /child/{child_id}/assessments` — Assessment results and milestones

### Parent Dashboard
- `GET /parent/{parent_id}/dashboard` — Aggregated analytics for all children

### Teacher/Admin
- `GET /classroom/{classroom_id}/report` — Classroom-level reporting

### System
- `GET /system/metrics` — Platform health and performance

## Mastery Levels

Progress is tracked across 5 mastery levels per phonemic skill:

| Level | Description |
|-------|-------------|
| `not_started` | Skill not yet introduced |
| `emerging` | Initial exposure, below 40% accuracy |
| `developing` | Building proficiency, 40-69% accuracy |
| `proficient` | Consistent performance, 70-89% accuracy |
| `advanced` | Exceeds expectations, 90%+ accuracy |

Intervention triggers automatically when a child scores below 2/5 correct on any skill.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ANALYTICS_ENVIRONMENT` | `development` | Environment |
| `ANALYTICS_PROJECT_ID` | `prodigee-488119` | GCP project ID |

## Firestore Collections (read)

This service primarily reads from collections written by the learning engine:
- `phonemic_progress`, `learning_sessions`, `assessments`, `voice_interactions`
