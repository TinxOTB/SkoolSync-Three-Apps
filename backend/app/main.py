import os
from datetime import datetime, date, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, Session

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "")
if len(SECRET_KEY) < 32:
    SECRET_KEY = "DEVELOPMENT_ONLY_CHANGE_THIS_SECRET_KEY_123456"
ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 12
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skoolsync.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

app = FastAPI(title="SkoolSync API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class School(Base):
    __tablename__ = "schools"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(180), nullable=False)
    address = Column(String(250), default="")
    phone = Column(String(40), default="")
    email = Column(String(180), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    username = Column(String(80), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="admin")
    __table_args__ = (UniqueConstraint("school_id", "username", name="uq_school_username"),)

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    class_name = Column(String(60), nullable=False)
    admission_number = Column(String(60), nullable=False)
    __table_args__ = (UniqueConstraint("school_id", "admission_number", name="uq_school_admission"),)

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    __table_args__ = (UniqueConstraint("school_id", "student_id", "attendance_date", name="uq_attendance_day"),)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class RegisterSchool(BaseModel):
    school_name: str = Field(min_length=2, max_length=180)
    address: str = ""
    phone: str = ""
    email: EmailStr
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=10, max_length=72)

class Login(BaseModel):
    school_id: int
    username: str
    password: str

class StudentIn(BaseModel):
    first_name: str
    last_name: str
    class_name: str
    admission_number: str

class AttendanceIn(BaseModel):
    student_id: int
    attendance_date: date
    status: str

def make_token(user: User):
    now = datetime.utcnow()
    payload = {"sub": str(user.id), "school_id": user.school_id, "role": user.role,
               "iat": now, "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
        school_id = int(payload["school_id"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id, User.school_id == school_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    return user

def require_admin(user: User = Depends(current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user

@app.get("/")
def home():
    return {"app": "SkoolSync", "status": "running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/auth/register-school")
def register_school(data: RegisterSchool, db: Session = Depends(get_db)):
    if db.query(School).filter(School.email == data.email).first():
        raise HTTPException(status_code=409, detail="A school with this email is already registered")
    school = School(name=data.school_name, address=data.address, phone=data.phone, email=str(data.email))
    db.add(school)
    db.flush()
    user = User(school_id=school.id, username=data.username,
                password_hash=pwd_context.hash(data.password), role="admin")
    db.add(user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not register school; check school email and username")
    db.refresh(school)
    db.refresh(user)
    return {"message": "School registered", "school_id": school.id,
            "school_name": school.name, "access_token": make_token(user), "token_type": "bearer"}

@app.post("/auth/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.school_id == data.school_id, User.username == data.username).first()
    if not user or not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect school ID, username or password")
    return {"access_token": make_token(user), "token_type": "bearer", "role": user.role}

@app.get("/me")
def me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == user.school_id).first()
    return {"user_id": user.id, "username": user.username, "role": user.role,
            "school_id": school.id, "school_name": school.name}

@app.post("/students")
def add_student(data: StudentIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    student = Student(school_id=user.school_id, **data.model_dump())
    db.add(student)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="Admission number already exists in this school")
    db.refresh(student)
    return {"message": "Student added", "student_id": student.id}

@app.get("/students")
def list_students(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = db.query(Student).filter(Student.school_id == user.school_id).order_by(Student.last_name).all()
    return [{"id": s.id, "first_name": s.first_name, "last_name": s.last_name,
             "class_name": s.class_name, "admission_number": s.admission_number} for s in rows]

@app.post("/attendance")
def record_attendance(data: AttendanceIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if data.status not in {"Present", "Absent", "Late", "Excused"}:
        raise HTTPException(status_code=400, detail="Status must be Present, Absent, Late or Excused")
    student = db.query(Student).filter(Student.id == data.student_id, Student.school_id == user.school_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in this school")
    record = Attendance(school_id=user.school_id, **data.model_dump())
    db.add(record)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="Attendance already recorded for this student and date")
    return {"message": "Attendance saved"}

@app.get("/attendance")
def list_attendance(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = db.query(Attendance).filter(Attendance.school_id == user.school_id).order_by(Attendance.attendance_date.desc()).all()
    return [{"id": a.id, "student_id": a.student_id, "attendance_date": a.attendance_date,
             "status": a.status} for a in rows]
