# Project EGO: Connectivity Architecture

## Overview

Project EGO uses a **hybrid connectivity model** - internet is required for full functionality, with intelligent offline fallback for limited use cases. This document explains what requires internet, what works offline, and why.

---

## 🌐 Internet Required (Primary Mode)

### Core Requirements

**1. System Updates & Security**
- Security patches and vulnerability fixes
- System updates and new features
- VR client updates
- Database schema migrations
- **Why**: Cannot compromise security. Systems must stay patched.

**2. User Authentication & Account Management**
- Parent login and registration
- Child account creation
- JWT token generation and validation
- Session management
- Parental consent verification
- **Why**: Centralized user database ensures data integrity and account security.

**3. Multi-User VR Classrooms**
- Real-time student synchronization
- Spatial voice chat
- Shared activities and interactions
- Classroom presence indicators
- **Why**: Requires WebSocket server for real-time communication between users.

**4. Parent Monitoring (Shadow Mode)**
- Remote monitoring from parent's device
- Real-time session viewing
- Emergency stop controls
- Activity progress notifications
- **Why**: Parent may be on different device/location than child.

**5. Curriculum Content Delivery**
- New curriculum weeks (35-week Heggerty program)
- STEM challenges and activities
- Curriculum updates and improvements
- Activity instructions and assets
- **Why**: Content library is centralized, too large to pre-install everything.

**6. 3D Assets & Media**
- Character models (Professor Al, Ella, Gus)
- Classroom 3D models
- Audio files (ambient, effects, voice)
- Daily landmark images for lunchroom murals
- Texture downloads
- **Why**: Asset library is massive (~10+ GB), downloads on-demand.

**7. Translation Services**
- Real-time text translation (30+ languages)
- New approved phrase translations
- Curriculum content translation
- UI localization updates
- **Why**: Translation API (Google Translate) requires internet connection.

**8. Progress Backup & Sync**
- Cloud backup of child progress
- Cross-device progress sync
- Parent dashboard data
- Learning analytics
- Achievement history
- **Why**: Progress must be preserved if device fails or child switches devices.

**9. Voice Processing Pipeline**
- Speech-to-text transcription
- Voice command processing
- Adult voice detection (safety)
- Voice interaction logging
- **Why**: Heavy AI processing runs on backend servers, not local device.

---

## 📴 Offline Fallback (Limited Mode)

### What Works Without Internet

**1. Local Progress Storage (SQLite)**
- Child progress saved locally
- Session data cached
- Activity completion logged
- **Syncs when reconnected**

**2. Pre-Downloaded Curriculum Content**
- Previously cached weeks
- Downloaded activity instructions
- Saved audio files
- **Must be downloaded while online first**

**3. Cached 3D Assets**
- Previously downloaded classroom models
- Cached character models
- Stored textures and materials
- **Must be downloaded while online first**

**4. Pre-Translated Approved Phrases**
- Cached phrase translations in database
- Common phrases for child's language
- **Pre-loaded during online session**

**5. Single-Player Mode**
- Solo practice with AI characters
- Local curriculum activities
- Offline mini-games
- **No multi-user, simplified activities**

**6. Local Authentication (Limited)**
- Re-authentication using cached token (if not expired)
- Session resumption within token TTL
- **Cannot create new accounts offline**

### What DOES NOT Work Offline

❌ Multi-user VR classrooms
❌ Parent remote monitoring
❌ New curriculum content downloads
❌ Real-time translation
❌ Voice processing (speech-to-text)
❌ Account creation/registration
❌ Progress cloud backup
❌ System updates
❌ New asset downloads
❌ Security patches

---

## 🔄 Sync Strategy

### When Internet Reconnects

**Automatic Sync Process:**

1. **Verify Connection**
   - Test backend API connectivity
   - Authenticate with cached credentials
   - Validate JWT token (refresh if needed)

2. **Upload Local Data**
   - Child progress from SQLite → PostgreSQL
   - Cached session records
   - Activity completion data
   - Engagement metrics

3. **Download Updates**
   - New curriculum content (if available)
   - System updates
   - Security patches
   - Approved phrase translations

4. **Resume Full Features**
   - Re-enable multi-user mode
   - Restore parent monitoring
   - Enable voice processing
   - Allow new content downloads

5. **Verify Data Integrity**
   - Check for sync conflicts
   - Merge local and cloud progress
   - Log any discrepancies

---

## 🌍 Use Cases

### Scenario 1: Stable Home Internet (Primary Use Case)

**Setup**: Child at home with WiFi
- ✅ Full functionality
- ✅ Multi-user classrooms
- ✅ Parent monitoring
- ✅ Real-time translation
- ✅ Voice processing
- ✅ Cloud progress backup

**Experience**: Optimal - all features available

---

### Scenario 2: Intermittent Connectivity

**Setup**: Child in area with unstable internet
- ⚠️ Pre-download curriculum week while connected
- ⚠️ Cache classroom assets
- ⚠️ Works in single-player when disconnected
- ⚠️ Syncs progress when connection returns

**Experience**: Functional - can practice offline, syncs later

---

### Scenario 3: Low Bandwidth Connection

**Setup**: Child in rural area with slow internet
- ⚠️ Pre-cache content during off-peak hours
- ⚠️ Disable real-time translation (use cached phrases)
- ⚠️ Single-player mode preferred
- ⚠️ Periodic sync when bandwidth available

**Experience**: Usable - requires planning, but works

---

### Scenario 4: Developing Nation / Limited Infrastructure

**Setup**: Community center with limited internet hours
- ⚠️ Bulk download curriculum content during available hours
- ⚠️ Cache entire weeks of activities
- ⚠️ Pre-download all assets for multiple children
- ⚠️ Local network multi-user (future feature)
- ⚠️ Batch sync progress weekly

**Experience**: Planned usage - requires adult supervision for downloads

---

### Scenario 5: No Internet Available

**Setup**: Remote area, no connectivity
- ❌ **Not recommended**
- ❌ Cannot download curriculum
- ❌ Cannot create accounts
- ❌ Cannot update system
- ❌ Security vulnerabilities cannot be patched

**Experience**: Not viable long-term

---

## 📊 Bandwidth Requirements

### Minimum Bandwidth (Degraded Mode)
- **Download**: 1 Mbps
- **Upload**: 0.5 Mbps
- **Latency**: < 300ms
- **Features Available**:
  - ✅ Authentication
  - ✅ Curriculum download (slow)
  - ✅ Single-player mode
  - ❌ Multi-user (too laggy)
  - ❌ Voice processing (timeouts)

### Recommended Bandwidth (Full Features)
- **Download**: 10 Mbps
- **Upload**: 5 Mbps
- **Latency**: < 100ms
- **Features Available**:
  - ✅ All features enabled
  - ✅ Multi-user VR
  - ✅ Real-time translation
  - ✅ Voice processing
  - ✅ Parent monitoring

### Optimal Bandwidth (Best Experience)
- **Download**: 25+ Mbps
- **Upload**: 10+ Mbps
- **Latency**: < 50ms
- **Features Available**:
  - ✅ Everything at highest quality
  - ✅ Instant asset downloads
  - ✅ HD textures
  - ✅ Multiple simultaneous users

---

## 💾 Storage Requirements

### Local Storage Needs

**Minimum**:
- VR Client: 2 GB
- One curriculum week (cached): 500 MB
- Database (SQLite): 100 MB
- **Total**: ~3 GB

**Recommended**:
- VR Client: 2 GB
- 5 curriculum weeks (cached): 2.5 GB
- All classroom assets: 1 GB
- Character models: 500 MB
- Audio files: 500 MB
- Database (SQLite): 100 MB
- **Total**: ~7 GB

**Optimal** (Full offline capability):
- VR Client: 2 GB
- All 35 curriculum weeks: 17.5 GB
- Complete asset library: 3 GB
- All character models/animations: 1 GB
- Full audio library: 2 GB
- Database (SQLite): 200 MB
- **Total**: ~26 GB

---

## 🔐 Security Considerations

### Why Internet is Required for Security

1. **Patch Distribution**
   - COPPA compliance vulnerabilities must be fixed immediately
   - Cannot wait for manual updates

2. **Threat Detection**
   - Adult voice detection requires cloud AI
   - Suspicious behavior monitoring
   - Real-time safety alerts

3. **Authentication**
   - JWT tokens expire (4-24 hours)
   - Cannot issue new tokens offline
   - Account compromise mitigation

4. **Data Integrity**
   - Child progress must be backed up
   - Local device failure cannot lose months of progress

5. **Compliance**
   - COPPA audit logs require central storage
   - Parent consent records must be secure
   - Session recordings (if enabled) need secure storage

---

## 🎯 Design Rationale

### Why Not Fully Offline?

**Technical Reasons:**
1. **Asset Size**: Full library is 20+ GB, too large to pre-install
2. **Translation**: Google Translate API requires internet
3. **Voice AI**: Speech processing too heavy for VR headset
4. **Multi-User**: Cannot sync without server

**Business Reasons:**
1. **Security**: Must push urgent patches
2. **Updates**: Curriculum improvements need distribution
3. **Analytics**: Parent dashboards need real-time data
4. **Compliance**: COPPA audit trails require central logging

**User Experience Reasons:**
1. **Multi-User**: Kids want to learn with other children
2. **Parent Monitoring**: Parents want remote visibility
3. **Progress Sync**: Child may use multiple devices
4. **Fresh Content**: Daily landmark murals, new activities

---

## 🚀 Future Enhancements

### Improved Offline Support (Roadmap)

**Phase 3: Enhanced Caching**
- Intelligent content pre-fetch based on usage patterns
- Predictive download of next week's curriculum
- Low-bandwidth mode with compressed assets
- Better offline activity selection

**Phase 4: Peer-to-Peer Multi-User**
- Local network multi-user (same WiFi)
- Bluetooth classroom pairing
- No internet required for local collaboration
- Sync when any peer connects to internet

**Phase 5: Offline Voice Processing**
- On-device speech-to-text (Whisper.cpp)
- Local voice activity detection
- Cached voice models for 5 major languages
- Requires high-end VR hardware

---

## 📞 Summary

**Internet Connectivity Philosophy:**

> Project EGO is designed for **modern internet-connected homes**, with intelligent fallback for **intermittent connectivity**. It is **not designed for completely offline use**, as this would compromise security, safety, and the collaborative educational experience.

**Target User:**
- Has internet access (WiFi or mobile data)
- Connection may be slow or intermittent
- Values multi-user collaborative learning
- Wants cloud-backed progress
- Needs parent monitoring features

**Not Target User:**
- Completely offline environment
- No internet access at all
- Cannot download updates
- Requires 100% local operation

---

*Last Updated: October 8, 2025*
