# AR/VR Service

Augmented and Virtual Reality interactive curriculum experiences.

**Status: Architecturally parked — not a launch priority.**

This service exists in the architecture for future activation. The Helyxium VR collaboration module and AR curriculum features will be developed post-launch.

## Future Responsibilities

- AR interactive curriculum experiences (compute-heavy, scales independently)
- VR classroom environment (1920s American schoolhouse)
- Multi-user collaborative classrooms (up to 25 students)
- AI character interactions (Professor Al, Ella, Gus)
- Cloud Vision API integration for AR object recognition
- WebSocket real-time state synchronization

## VR Classroom (Legacy Reference)

The `eg-vr-classroom/` directory contains Phase 1-2 work:
- 21 Unity C# scripts (~8,600 lines)
- OpenXR configuration for Meta Quest
- Python backend services
- Interactive classroom objects (blackboard, desks, globe, books, bell)
- Celebration and treasure systems

This code will inform the rewrite when VR development resumes.

## Target Hardware

- Meta Quest 2/3
- SteamVR
- PSVR (future)

## Key Constraint

**AR/VR must scale independently** — never couple AR rendering with curriculum delivery in the same container. This is why it has its own service.
