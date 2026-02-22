# PRODIGEE — Technical Architecture & Development Prompt
## Elemental Genius Unified Learning Platform

**Project:** prodigee
**Owner:** Rob — Founder & CEO, Elemental Genius LLC
**Date:** February 16, 2026
**Purpose:** Master technical reference prompt for Claude Code development sessions

---

## 1. Project Overview

Prodigee is the unified codebase for the Elemental Genius adaptive learning platform. It consolidates all previous fragmented builds (backend, libraries, mobile frontends, PC frontends) into a single, cloud-native, containerized application.

### Origin & Context
- Consolidated from 15 legacy files down to 10 core sub-folders
- Legacy code was originally written for OpenSUSE — all specs must be converted to **Ubuntu**
- Much of the original code was written during the early days of Claude Code and needs modernization
- Previous architecture assumed self-hosting on local Dell PowerEdge R730xd servers — this is **no longer the case**
- Former technical collaborator (Aiman) code and configurations have been identified and removed
- Git repositories have been created; development is active

---

## 2. Deployment Architecture

### Target Platform: Google Cloud Platform (GCP)
- **NOT self-hosted** — all previous self-hosting assumptions, configurations, and workarounds should be stripped
- Follows the same GCP deployment patterns established with TruckerFlow
- Cloud-native from day one — no "migrate later" compromises

### Containerized Microservices (Required)
The application MUST be containerized from the start due to:
- Scale and depth of the platform
- AR/VR functionality requiring independent compute scaling
- Multiple service layers with different resource profiles
- Need to scale classroom-level concurrent AR sessions independently from curriculum delivery

### What to Remove from Legacy Specs
- Local load balancing configurations
- Manual backup scripts for local servers
- Hardware-specific optimizations (V100/PowerEdge references)
- Self-hosted AI inference engine configurations
- Self-hosted model training/fine-tuning pipelines
- Built-in multilanguage processing code
- Any OpenSUSE-specific package management, service files, or paths

---

## 3. Container Architecture

### Core Services (Containers)

#### 3.1 Learning Engine
- Adaptive curriculum delivery
- Phonemic awareness instruction (Dr. Heggerty methodology)
- Special needs education pathways
- Student progress tracking and analytics
- Lesson sequencing and difficulty adjustment

#### 3.2 AR/VR Services
- Augmented Reality interactive curriculum experiences
- Must scale independently — compute-heavy rendering
- Helyxium VR collaboration module parked here architecturally
  - **Do NOT prioritize for launch** — it exists in the architecture for future activation
  - Will be expanded as a post-launch feature in later development phases

#### 3.3 User & Auth Management
- Student accounts, teacher/admin accounts
- Role-based access control
- Session management
- Parent/guardian access controls

#### 3.4 Analytics & Progress Tracking
- Student performance dashboards
- Teacher/admin reporting
- Adaptive learning data pipeline
- Assessment and milestone tracking

#### 3.5 API Gateway
- Routes to all internal services
- Manages external GCP API calls
- Rate limiting, authentication, request routing

---

## 4. Externalized Services (GCP API Calls)

A key architectural decision: **offload everything Google does better to GCP APIs.** This eliminates ~30-40% of the original codebase complexity.

### 4.1 AI / Intelligence Layer
- **Vertex AI API** — replaces the previously planned self-hosted Gemma 3 model
- Handles adaptive learning intelligence, content generation, assessment analysis
- Model-agnostic — can swap to newer models by changing an API endpoint
- No local GPU inference, no model management, no fine-tuning pipelines

### 4.2 Multilanguage Support
- **Google Cloud Translation API** — replaces all previously built-in language processing
- Multilanguage support is now API calls, NOT compiled into the application
- Supports dynamic language switching at runtime

### 4.3 Speech & Audio Processing
- **Google Cloud Speech-to-Text API** — critical for phonemic awareness curriculum
- Student speech recognition for pronunciation assessment
- Real-time audio processing for interactive lessons

### 4.4 Vision & AR
- **Google Cloud Vision API** — potential integration for AR interactions
- Image recognition for interactive learning experiences

### 4.5 Other GCP Services
- Cloud Storage for media assets and student files
- Cloud SQL or Firestore for data persistence
- Cloud Run or GKE for container orchestration
- Cloud CDN for content delivery
- Identity Platform for authentication (if not custom)

---

## 5. Development Standards

### OS Target
- **Ubuntu** — all package references, service files, paths, and configurations must target Ubuntu
- Remove any OpenSUSE references (zypper, YaST, OpenSUSE-specific paths)
- Use apt/dpkg for package management
- Use systemd service patterns consistent with Ubuntu

### Code Quality
- Modern patterns — refactor legacy code written during early Claude Code era
- Clean separation of concerns across container boundaries
- API-first design between services
- Environment-based configuration (dev/staging/production)

### Repository Structure
- 10 core sub-folders (consolidated from legacy 15-file structure)
- Each container/service should have its own clear directory
- Shared libraries in a common directory
- Infrastructure-as-code for GCP deployment (Terraform or similar)

### CI/CD
- Follow patterns established with TruckerFlow GCP deployment
- Automated builds per container
- Container registry integration
- Staging → Production promotion pipeline

---

## 6. Target Users & Use Cases

### Primary Audience
- **Students** (K-12, with emphasis on early learners and special needs)
- **Teachers** administering phonemic awareness and adaptive curriculum
- **Parents/Guardians** monitoring progress
- **School Administrators** managing deployments and reporting

### Key Differentiators
- AI-powered adaptive learning (via Vertex AI)
- Phonemic awareness focus (Dr. Heggerty methodology)
- Special needs education pathways
- AR-enhanced interactive lessons
- Multilanguage support via API (not hardcoded)
- VR collaboration capabilities (future phase via Helyxium)

---

## 7. Development Workflow

### Tooling
- **Claude** (web/app) — architecture, planning, technical prompts, strategic decisions
- **Claude Code** — implementation, code generation, debugging, refactoring
- **Gemini / Copilot** — supplementary research, graphics design, alternative perspectives
- **Git** — version control, established repos for all 10 sub-folders

### Current Phase
- OpenSUSE → Ubuntu spec conversion
- Legacy code audit and modernization
- Container architecture definition
- GCP service integration planning
- Stripping self-hosting assumptions from all codebases

---

## 8. Related Projects & Context

### Active Sibling Projects
- **TruckerFlow** — navigation & compliance app for truck drivers (final stages, deployed on GCP)
- **CreatorFlow** — social media automation tool (pending Microsoft Store certification)
- **ServiceFlow** — business management platform (on Google Play Store)
- **TidyFlow** — file organization utility

### Parent Company
- **Elemental Genius LLC** — founded July 2024
- AI-powered educational technology
- Fundraising active — VC outreach to 200+ firms

### Brand
- **S3L3CT** — merchandise brand, interconnected with EG ecosystem

---

## 9. Critical Reminders for Claude Code Sessions

1. **This is cloud-native on GCP** — never suggest self-hosting solutions
2. **Containerized from day one** — no monolith patterns
3. **Use GCP APIs** for AI, translation, speech, vision — do not build these in-house
4. **Ubuntu only** — flag and convert any OpenSUSE remnants
5. **Helyxium VR is parked** — architecturally present but not a launch priority
6. **Strip Aiman's code** — any legacy configurations from the former collaborator should be flagged and removed
7. **Follow TruckerFlow patterns** for GCP deployment where applicable
8. **10 sub-folders** are the canonical structure — maintain this organization
9. **AR must scale independently** — never couple AR rendering with curriculum delivery in the same container
10. **The AI brain is an API call** — Vertex AI replaces Gemma 3 / local inference entirely
