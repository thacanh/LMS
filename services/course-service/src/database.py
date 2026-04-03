import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_URL = (
    f"mysql+pymysql://{os.getenv('COURSE_DB_USER', 'lms_user')}"
    f":{os.getenv('COURSE_DB_PASSWORD', 'lms_password')}"
    f"@{os.getenv('MYSQL_HOST', 'mysql')}"
    f":{os.getenv('MYSQL_PORT', '3306')}"
    f"/{os.getenv('COURSE_DB_NAME', 'lms_courses')}"
    f"?charset=utf8mb4"
)

engine = create_engine(DB_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
