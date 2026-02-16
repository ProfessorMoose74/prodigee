# Elemental Genius Educational Platform - API Documentation

## Overview
Complete REST API for the Elemental Genius educational platform, featuring comprehensive phonemic awareness curriculum, real-time parent monitoring, and multi-subject educational content.

**Base URL**: `http://localhost:5000` (development)  
**Authentication**: Bearer JWT tokens  
**Content-Type**: `application/json`

---

## Authentication Endpoints

### Parent Registration
```http
POST /parent/register
Content-Type: application/json

{
  "name": "Parent Name",
  "email": "parent@example.com",
  "password": "securepassword123",
  "subscription_tier": "premium",
  "communication_preferences": {
    "email_notifications": true,
    "daily_summary": true
  }
}
```

**Response**: `201 Created`
```json
{
  "message": "Parent registered successfully",
  "parent_id": 1,
  "next_step": "Please log in to add children to your account"
}
```

### Parent Login
```http
POST /parent/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "securepassword123"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "parent": {
    "id": 1,
    "name": "Parent Name",
    "email": "parent@example.com",
    "subscription_tier": "premium"
  },
  "expires_in_hours": 24
}
```

### Child Login (COPPA Compliant)
```http
POST /child/login
Content-Type: application/json

{
  "child_id": 1,
  "parent_token": "parent_jwt_token_here"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "token": "child_jwt_token_here",
  "child": {
    "id": 1,
    "name": "Child Name",
    "age": 5,
    "current_week": 3,
    "avatar": "🌟"
  },
  "session_duration_hours": 4
}
```

### Logout
```http
POST /logout
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "message": "Logout successful. Token has been invalidated.",
  "logged_out_at": "2025-01-15T10:30:00Z"
}
```

---

## Child Learning Endpoints

### Get Child Dashboard
```http
GET /child/dashboard
Authorization: Bearer {child_token}
```

**Response**: `200 OK`
```json
{
  "child": {
    "id": 1,
    "name": "Child Name",
    "current_week": 3,
    "total_stars": 45,
    "streak_days": 5
  },
  "week_activities": {
    "rhyming": {
      "listen_identify": {
        "instruction": "Listen carefully. Do these words rhyme?",
        "difficulty_progression": 0.25
      }
    }
  },
  "nursery_rhyme": {
    "title": "Humpty Dumpty",
    "lyrics": "Humpty Dumpty sat on a wall...",
    "motions": "Sitting and falling motions"
  },
  "progress": {
    "rhyming": 75.0,
    "onset_fluency": 45.0,
    "blending": 20.0
  },
  "recommendation": {
    "recommended_skill": "rhyming",
    "reason": "You're making great progress with rhyming. Keep going!",
    "motivation_level": "high"
  }
}
```

### Get Activity Details
```http
GET /child/activity/{activity_type}
Authorization: Bearer {child_token}
```

**Response**: `200 OK`
```json
{
  "skill_name": "rhyming",
  "skill_info": {
    "description": "Listen to rhyming pairs and produce rhymes",
    "difficulty": "easiest",
    "hand_motions": "Point to ear for listening"
  },
  "week_number": 3,
  "activities": {
    "listen_identify": {
      "instruction": "Listen carefully. Do these words rhyme?",
      "examples": [["cat", "hat"], ["dog", "log"]],
      "interaction_type": "yes_no"
    }
  },
  "child_progress": 75.0
}
```

### Complete Activity
```http
POST /child/activity/{activity_type}/complete
Authorization: Bearer {child_token}
Content-Type: application/json

{
  "accuracy": 85.0,
  "duration": 300,
  "stars_earned": 3,
  "engagement": 9.2
}
```

**Response**: `200 OK`
```json
{
  "message": "Activity completed and progress saved.",
  "progress_gained": 5.2,
  "new_progress": 80.2,
  "stars_earned": 3,
  "current_week": 3
}
```

---

## Detailed Progress Tracking

### Get Phonemic Progress
```http
GET /child/phonemic-progress?child_id=1
Authorization: Bearer {parent_token}
```

**Response**: `200 OK`
```json
{
  "child_id": 1,
  "progress_by_skill": {
    "rhyming": [
      {
        "progress_id": 1,
        "skill_category": "listen_identify",
        "week_number": 3,
        "mastery_level": 75.0,
        "accuracy_percentage": 85.0,
        "attempts_total": 20,
        "attempts_correct": 17,
        "voice_recognition_accuracy": 92.0,
        "last_practiced": "2025-01-15T10:30:00Z"
      }
    ]
  },
  "total_records": 5
}
```

### Create/Update Phonemic Progress
```http
POST /child/phonemic-progress
Authorization: Bearer {child_token}
Content-Type: application/json

{
  "skill_type": "rhyming",
  "skill_category": "listen_identify",
  "week_number": 3,
  "mastery_level": 80.0,
  "accuracy_percentage": 90.0,
  "attempts_total": 10,
  "attempts_correct": 9
}
```

---

## Learning Sessions

### Get Learning Sessions
```http
GET /child/learning-sessions?child_id=1&page=1&per_page=10
Authorization: Bearer {parent_token}
```

**Response**: `200 OK`
```json
{
  "child_id": 1,
  "sessions": [
    {
      "session_id": 1,
      "session_type": "daily_practice",
      "planned_duration": 900,
      "actual_duration": 850,
      "completion_status": "completed",
      "overall_accuracy": 87.5,
      "engagement_score": 9.2,
      "stars_earned": 5,
      "session_start": "2025-01-15T09:00:00Z",
      "session_end": "2025-01-15T09:14:10Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 25,
    "pages": 3,
    "has_next": true
  }
}
```

### Start Learning Session
```http
POST /child/learning-sessions
Authorization: Bearer {child_token}
Content-Type: application/json

{
  "session_type": "daily_practice",
  "planned_duration": 900,
  "activities_planned": 3
}
```

### Complete Learning Session
```http
PUT /child/learning-sessions/{session_id}/complete
Authorization: Bearer {child_token}
Content-Type: application/json

{
  "actual_duration": 850,
  "completion_status": "completed",
  "activities_completed": 3,
  "overall_accuracy": 87.5,
  "engagement_score": 9.2,
  "stars_earned": 5
}
```

---

## Voice Interactions (COPPA Compliant)

### Get Voice Interactions
```http
GET /child/voice-interactions?child_id=1&session_id=1
Authorization: Bearer {parent_token}
```

**Response**: `200 OK`
```json
{
  "child_id": 1,
  "interactions": [
    {
      "interaction_id": 1,
      "session_id": 1,
      "interaction_type": "phoneme_response",
      "prompt_given": "What sound does 'cat' start with?",
      "expected_response": "/c/",
      "actual_response": "/c/",
      "recognition_confidence": 0.95,
      "accuracy_score": 1.0,
      "response_time_seconds": 2.3,
      "success_achieved": true,
      "timestamp": "2025-01-15T09:05:00Z"
    }
  ]
}
```

### Log Voice Interaction
```http
POST /child/voice-interactions
Authorization: Bearer {child_token}
Content-Type: application/json

{
  "interaction_type": "phoneme_response",
  "prompt_given": "What sound does 'dog' start with?",
  "expected_response": "/d/",
  "actual_response": "/d/",
  "recognition_confidence": 0.92,
  "accuracy_score": 1.0,
  "response_time_seconds": 1.8,
  "success_achieved": true,
  "session_id": 1
}
```

---

## Assessment System

### Get Assessments
```http
GET /child/assessments?child_id=1&assessment_type=weekly
Authorization: Bearer {parent_token}
```

**Response**: `200 OK`
```json
{
  "child_id": 1,
  "assessments": [
    {
      "assessment_id": 1,
      "assessment_type": "weekly",
      "week_number": 3,
      "skills_assessed": ["rhyming", "onset_fluency"],
      "overall_score": 82.5,
      "skill_scores": {
        "rhyming": 85.0,
        "onset_fluency": 80.0
      },
      "recommendations": ["Continue rhyming practice", "Focus on consonant sounds"],
      "administered_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### Create Assessment
```http
POST /child/assessments
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "child_id": 1,
  "assessment_type": "weekly",
  "week_number": 3,
  "skills_assessed": ["rhyming", "onset_fluency"],
  "overall_score": 82.5,
  "skill_scores": {
    "rhyming": 85.0,
    "onset_fluency": 80.0
  }
}
```

---

## Content Library

### Get Educational Content
```http
GET /content?subject_area=phonemic_awareness&age_range=3-5&page=1
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "content": [
    {
      "content_id": 1,
      "content_type": "activity",
      "subject_area": "phonemic_awareness",
      "age_range": "3-5",
      "skill_objectives": ["Master rhyming skills"],
      "difficulty_level": "easy",
      "prerequisite_skills": [],
      "file_path": "/content/phonemic/rhyming/",
      "created_at": "2025-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 50,
    "has_next": true
  }
}
```

---

## Heggerty Curriculum

### Get Week Curriculum
```http
GET /curriculum/week/3
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "week_number": 3,
  "active_skills": ["rhyming", "onset_fluency"],
  "activities": {
    "rhyming": {
      "skill_info": {
        "description": "Listen to rhyming pairs and produce rhymes",
        "difficulty": "easiest"
      },
      "activities": {
        "listen_identify": {
          "instruction": "Listen carefully. Do these words rhyme?"
        }
      }
    }
  },
  "nursery_rhyme": {
    "title": "Humpty Dumpty",
    "lyrics": "Humpty Dumpty sat on a wall..."
  }
}
```

### Get Child Assessment Report
```http
GET /child/assessment
Authorization: Bearer {child_token}
```

**Response**: `200 OK`
```json
{
  "child_info": {
    "name": "Child Name",
    "age": 5,
    "current_week": 3
  },
  "overall_assessment": {
    "phonemic_awareness_score": 65.2,
    "learning_velocity": 1.2,
    "attention_span": 8,
    "preferred_interaction": "voice"
  },
  "skill_assessments": {
    "rhyming": {
      "progress_percentage": 75.0,
      "mastery_level": "proficient",
      "readiness": {
        "ready": true,
        "readiness_score": 1.0
      }
    }
  },
  "next_objectives": [
    {
      "skill": "onset_fluency",
      "target": "Improve onset fluency to 80% proficiency",
      "current_progress": 60.0
    }
  ]
}
```

---

## Parent Dashboard

### Get Analytics Dashboard
```http
GET /analytics/dashboard
Authorization: Bearer {parent_token}
```

**Response**: `200 OK`
```json
{
  "parent_id": 1,
  "summary": {
    "total_children": 2,
    "total_learning_sessions": 45,
    "completed_sessions": 42,
    "completion_rate": 93.3,
    "average_engagement_score": 8.7
  },
  "recent_assessments": [
    {
      "assessment_id": 1,
      "child_name": "Child Name",
      "assessment_type": "weekly",
      "overall_score": 82.5,
      "administered_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

## Parent Management

### Add Child
```http
POST /parent/add_child
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "name": "New Child",
  "age": 4,
  "grade_level": "Pre-K",
  "learning_style": "visual"
}
```

---

## System Analytics

### Get System Metrics
```http
GET /analytics/system?metric_type=performance&server_component=AI
Authorization: Bearer {parent_token}
```

### Log System Metric
```http
POST /analytics/system
Content-Type: application/json

{
  "metric_type": "performance",
  "metric_name": "response_time",
  "metric_value": 150.5,
  "server_component": "AI",
  "context_data": {
    "endpoint": "/child/activity/rhyming",
    "user_count": 25
  }
}
```

---

## WebSocket Events (Real-time Parent Monitoring)

### Connection
```javascript
// Connect to WebSocket
const socket = io('http://localhost:5000');

// Join parent room for notifications
socket.emit('join_parent_room', {
  parent_id: 1
});
```

### Events Received by Parents
```javascript
// Child login notification
socket.on('child_login', (data) => {
  console.log(`${data.child_name} logged in at ${data.login_time}`);
});

// Activity started
socket.on('child_activity_started', (data) => {
  console.log(`${data.child_name} started ${data.activity_type} activity`);
});

// Activity completed
socket.on('child_activity_completed', (data) => {
  console.log(`${data.child_name} completed activity with ${data.accuracy}% accuracy`);
});

// Learning session events
socket.on('learning_session_started', (data) => {
  console.log(`Learning session started: ${data.session_type}`);
});

socket.on('learning_session_completed', (data) => {
  console.log(`Session completed with ${data.engagement_score}/10 engagement`);
});
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limits

- **Authentication endpoints**: 10 requests per 5 minutes
- **General endpoints**: 100 requests per minute
- **Registration**: 5 requests per 10 minutes

---

## Security Features

✅ **JWT Authentication** with token blacklisting  
✅ **COPPA Compliance** - voice data stored as text only  
✅ **Rate Limiting** - prevents abuse  
✅ **Input Validation** - comprehensive JSON validation  
✅ **Parent Authorization** - children cannot login independently  
✅ **Secure Logout** - token invalidation  
✅ **HTTPS Required** - all data encrypted in transit

---

## Demo Account

**Parent Login:**
- Email: `demo@elementalgenius.com`
- Password: `demo123`

**Demo Child ID:** Check parent dashboard after login

---

This API provides comprehensive educational tracking, real-time parent monitoring, and COPPA-compliant voice interaction logging for the Elemental Genius educational platform.