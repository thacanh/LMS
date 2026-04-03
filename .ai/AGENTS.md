# 🎓 AGENTS.md — LMS Microservices Agent Instructions
# Compatible with: Codex, Claude Code, Copilot Agent, Cursor, Windsurf, etc.

## Identity

You are a software engineering assistant working on a Learning Management System (LMS) microservices assignment.

You help students design, build, debug, document, and deploy a production-style system that supports:
- Online courses
- Video streaming
- Progress tracking (resume learning)
- Quiz system
- Admin (teacher) content management

---

## Project Architecture

frontend/              → React (TypeScript - TSX)
gateway/               → API Gateway / reverse proxy

services/
  auth-service/        → Authentication (JWT, roles)
  course-service/      → Course management
  lesson-service/      → Lessons + video upload/streaming
  progress-service/    → Learning progress tracking
  quiz-service/        → Quiz & scoring

docs/
  api-specs/           → OpenAPI 3.0 YAML specifications
  architecture.md
  analysis-and-design.md

docker-compose.yml     → Container orchestration
.env.example           → Environment variables template

---

## Core Constraints

1. Technology-agnostic (prefer FastAPI + React TSX if not specified)
2. Docker-first (MANDATORY)
   - All services run in containers
   - System must start with:
     docker compose up --build

3. Database per service
   - Using MySQL
   - No shared databases

4. Gateway routing only
   - Frontend → Gateway → Services
   - Never call services directly from frontend

5. Stateless authentication
   - JWT-based
   - No server-side session

6. Role-based access control (RBAC)
   - Roles:
     - student
     - teacher
   - Teacher-only for all write operations

7. Health checks
   - Each service must implement:
     GET /health → { "status": "ok" }

8. Environment variables
   - Use .env
   - No hardcoded secrets

9. OpenAPI-first
   - APIs must be defined in docs/api-specs/

---

## LMS Core Logic

### Video System (lesson-service)

- Upload via multipart/form-data
- Store in local filesystem:
  ENV: VIDEO_STORAGE_PATH
- Return video_url

Streaming must support:
- HTTP Range Requests
- Seek (resume playback)

---

### Progress System (progress-service)

Track per lesson:
- status: not_started | in_progress | completed
- progress_percent
- last_position (seconds)

Behavior:
- Frontend sends update every 10 seconds
- Updates must be idempotent
- Latest timestamp wins

Resume logic:
- Fetch last_position when loading lesson

Continue learning:
GET /progress/continue

---

### Quiz System (quiz-service)

- Multiple choice questions
- Auto grading
- Store attempt history

---

## Admin (Teacher) Capabilities

Teacher can:
- Create / update / delete courses
- Create lessons
- Upload videos
- Create and manage quizzes

Constraints:
- All write endpoints require role = teacher
- Students can only read and learn

---

## Coding Standards

- Use idiomatic FastAPI (backend)
- Use React + TypeScript (frontend)
- Use Pydantic for validation
- Add proper error handling
- Use type hints
- Write unit tests

Error format:
{
  "error": "message"
}

Comments:
- Explain WHY, not WHAT

---

## When Creating/Modifying Services

1. Check docs/api-specs/
2. Implement/update GET /health
3. Use Docker service names:
   http://service-name:port
4. Update OpenAPI spec
5. Update service README
6. Ensure Dockerfile builds
7. Add tests

---

## When Debugging

1. Check logs:
   docker compose logs <service>
2. Verify service connectivity
3. Check environment variables
4. Check ports in docker-compose
5. Test /health first

---

## File Conventions

| Purpose | Location | Format |
|--------|---------|--------|
| API specs | docs/api-specs/<service>.yaml | OpenAPI 3.0 |
| Architecture | docs/architecture.md | Markdown |
| Service docs | <service>/readme.md | Markdown |
| Env config | .env.example → .env | KEY=VALUE |
| Diagrams | docs/assets/ | PNG/SVG/Mermaid |

---

## Response Format

- Be concise and actionable
- Show code with file paths
- Follow existing structure strictly
- Explain trade-offs when needed
- Suggest next steps after each task