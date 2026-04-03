#!/usr/bin/env python3
"""
Seed script — creates sample data for demo purposes.
Run after `docker compose up` with:
  docker compose exec auth-service python -m src.seed
OR run directly against the running gateway:
  python scripts/seed.py
"""
import requests
import json

BASE = "http://localhost:8080/api"

def main():
    print("🌱 Seeding LMS data…")

    # 1. Create a teacher
    print("\n1. Creating teacher account…")
    r = requests.post(f"{BASE}/auth/register", json={
        "email": "teacher@lms.dev",
        "full_name": "Dr. Sarah Chen",
        "password": "password123",
        "role": "teacher"
    })
    if r.status_code not in (200, 201, 400):
        print(f"  ❌ {r.status_code}: {r.text}")
        return
    print("  ✅ Teacher: teacher@lms.dev / password123")

    # 2. Create two students
    for s in [
        {"email": "alice@lms.dev", "full_name": "Alice Johnson", "password": "password123", "role": "student"},
        {"email": "bob@lms.dev", "full_name": "Bob Smith", "password": "password123", "role": "student"},
    ]:
        r = requests.post(f"{BASE}/auth/register", json=s)
        print(f"  ✅ Student: {s['email']} / {s['password']}")

    # 3. Login as teacher
    r = requests.post(f"{BASE}/auth/login", json={"email": "teacher@lms.dev", "password": "password123"})
    if r.status_code != 200:
        print(f"  ❌ Login failed: {r.text}")
        return
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("\n2. Logged in as teacher")

    # 4. Create courses
    courses_data = [
        {"title": "Introduction to Python", "description": "Learn Python from scratch. Covers variables, loops, functions, and OOP.", "is_published": True},
        {"title": "Web Development with FastAPI", "description": "Build RESTful APIs with FastAPI. Includes authentication, databases, and deployment.", "is_published": True},
        {"title": "Database Design Fundamentals", "description": "Relational database design, SQL, normalization, and best practices.", "is_published": True},
    ]

    course_ids = []
    print("\n3. Creating courses…")
    for cd in courses_data:
        r = requests.post(f"{BASE}/courses", json=cd, headers=headers)
        if r.status_code == 201:
            course_ids.append(r.json()["id"])
            print(f"  ✅ Course: {cd['title']}")
        else:
            print(f"  ❌ {r.status_code}: {r.text}")

    # 5. Create lessons for first course
    print("\n4. Creating lessons for 'Introduction to Python'…")
    if course_ids:
        lessons_data = [
            {"title": "Setting Up Python", "description": "Install Python and configure your development environment.", "order": 0},
            {"title": "Variables and Data Types", "description": "Learn about integers, strings, floats, and booleans.", "order": 1},
            {"title": "Control Flow", "description": "If statements, for loops, and while loops.", "order": 2},
            {"title": "Functions", "description": "Define and call functions, parameters and return values.", "order": 3},
        ]
        lesson_ids = []
        for ld in lessons_data:
            ld["course_id"] = course_ids[0]
            r = requests.post(f"{BASE}/lessons", json=ld, headers=headers)
            if r.status_code == 201:
                lesson_ids.append(r.json()["id"])
                print(f"  ✅ Lesson: {ld['title']}")

    # 6. Create a quiz
    print("\n5. Creating quiz…")
    if course_ids:
        quiz_data = {
            "course_id": course_ids[0],
            "title": "Python Fundamentals Quiz",
            "description": "Test your knowledge of Python basics",
            "pass_score": 60.0,
            "questions": [
                {
                    "text": "Which keyword is used to define a function in Python?",
                    "options": ["func", "define", "def", "function"],
                    "correct_index": 2,
                    "order": 0
                },
                {
                    "text": "What is the output of: print(type(42))?",
                    "options": ["<class 'str'>", "<class 'int'>", "<class 'float'>", "<class 'number'>"],
                    "correct_index": 1,
                    "order": 1
                },
                {
                    "text": "Which of these is a valid Python variable name?",
                    "options": ["2name", "my-var", "my_var", "my var"],
                    "correct_index": 2,
                    "order": 2
                },
                {
                    "text": "What does 'len([1, 2, 3])' return?",
                    "options": ["2", "3", "4", "0"],
                    "correct_index": 1,
                    "order": 3
                },
            ]
        }
        r = requests.post(f"{BASE}/quiz", json=quiz_data, headers=headers)
        if r.status_code == 201:
            print(f"  ✅ Quiz: Python Fundamentals Quiz (4 questions)")
        else:
            print(f"  ❌ {r.status_code}: {r.text}")

    print("\n✅ Seed complete!")
    print("\nTest accounts:")
    print("  Teacher:  teacher@lms.dev  / password123")
    print("  Student:  alice@lms.dev    / password123")
    print("  Student:  bob@lms.dev      / password123")
    print("\nOpen: http://localhost:8080")

if __name__ == "__main__":
    main()
