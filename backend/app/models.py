from typing import Literal
from pydantic import BaseModel, Field, model_validator, ConfigDict


class Schedule(BaseModel):
    dayOfWeek: Literal["월", "화", "수", "목", "금", "토", "일"]
    startPeriod: int = Field(ge=1, le=30)
    endPeriod: int = Field(ge=1, le=30)
    classroom: str = Field(min_length=1, max_length=120)

    @model_validator(mode="after")
    def check(self):
        if self.startPeriod > self.endPeriod:
            raise ValueError("종료교시가 시작교시보다 빠릅니다.")
        return self


class Course(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    courseCode: str = Field(min_length=1, max_length=40)
    sectionNo: str = Field(min_length=1, max_length=20)
    title: str = Field(min_length=1, max_length=200)
    professorName: str = Field(min_length=1, max_length=100)
    credit: float = Field(ge=0, le=30)
    capacity: int = Field(ge=1, le=10000)
    targetGrade: int = Field(ge=1, le=10)
    departmentId: int = Field(ge=1)
    isOnline: bool
    classificationPath: list[str] = Field(min_length=2, max_length=5)
    excludedDepartmentIds: list[int] = Field(default_factory=list)
    schedules: list[Schedule] = Field(max_length=30)

    @model_validator(mode="after")
    def check(self):
        if any(not s.strip() for s in self.classificationPath):
            raise ValueError("분류는 공백일 수 없습니다.")
        if self.isOnline and self.schedules:
            raise ValueError("온라인 과목은 강의시간을 비워주세요.")
        if not self.isOnline and not self.schedules:
            raise ValueError("오프라인 과목은 강의시간이 필요합니다.")
        keys = [tuple(s.model_dump().values()) for s in self.schedules]
        if len(keys) != len(set(keys)):
            raise ValueError("강의시간 중복")
        return self


class Student(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    studentId: str = Field(min_length=1, max_length=30)
    name: str = Field(min_length=1, max_length=80)
    grade: int = Field(ge=1, le=10)
    departmentId: int = Field(ge=1)
    completedCredits: float = Field(ge=0)
    graduationCredits: float = Field(gt=0)
    maxCredits: float = Field(gt=0, le=50)

    @model_validator(mode="after")
    def check(self):
        if self.completedCredits > self.graduationCredits:
            raise ValueError("이수 학점이 졸업 학점보다 큽니다.")
        return self
