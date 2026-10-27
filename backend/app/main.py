import base64, hashlib, hmac, json, os, time, uuid
from contextlib import asynccontextmanager, AsyncExitStack
from pathlib import Path
from typing import Annotated
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from .models import Course, Student
from .excel import parse_excel, export_excel

load_dotenv(Path(__file__).resolve().parents[1]/'.env')
# from .notice import router as notice_router

@asynccontextmanager
async def lifespan(application):
    async with httpx.AsyncClient(timeout=20) as client:
        application.state.http=client
        yield
    application.state.http=None

app=FastAPI(title='수강신청 API',version='1.0.0',lifespan=lifespan)
cors_origins=[origin.strip() for origin in os.getenv('CORS_ORIGINS','http://localhost:5173,http://127.0.0.1:5173').split(',') if origin.strip()]
cors_origins.append('https://course-recommendation-timetable.vercel.app')
app.add_middleware(CORSMiddleware,allow_origins=cors_origins,allow_methods=['GET','POST','PUT','PATCH','DELETE'],allow_headers=['Authorization','Content-Type'])

# app.include_router(notice_router)

async def db(method,path,body=None,params=None):
    url=os.getenv('SUPABASE_URL','').rstrip('/');key=os.getenv('SUPABASE_SERVICE_ROLE_KEY','')
    if not url or not key: raise HTTPException(503,'backend/.env에 Supabase 연결 정보를 설정하세요.')
    async with AsyncExitStack() as stack:
        client=getattr(app.state,'http',None)
        if client is None:
            client=await stack.enter_async_context(httpx.AsyncClient(timeout=20))
        try:
            r=await client.request(method,f'{url}/rest/v1/{path}',json=body,params=params,headers={'apikey':key,'Authorization':f'Bearer {key}','Prefer':'return=representation'})
        except httpx.RequestError: raise HTTPException(503,'DB 연결에 실패했습니다.')
    if r.is_error:
        error=r.json() if r.headers.get('content-type','').startswith('application/json') else {}
        if error.get('code')=='P0001': raise HTTPException(409,error.get('message','신청 처리에 실패했습니다.'))
        if r.status_code==409: raise HTTPException(409,'학번 또는 학수번호·분반이 이미 등록되어 있습니다.')
        raise HTTPException(502,'DB 요청 실패: SQL 설치 여부 및 입력값을 확인하세요.')
    return r.json() if r.content else None

def secret():
    s=os.getenv('SESSION_SECRET','')
    if len(s)<32 or s.startswith('CHANGE-'): raise HTTPException(503,'32자 이상의 SESSION_SECRET을 설정하세요.')
    return s.encode()

def token(role,subject):
    data=base64.urlsafe_b64encode(json.dumps({'role':role,'sub':subject,'exp':int(time.time())+28800}).encode()).decode()
    sig=hmac.new(secret(),data.encode(),hashlib.sha256).hexdigest()
    return f'{data}.{sig}'

def claims(authorization: Annotated[str|None,Header()]=None):
    try:
        raw=authorization.removeprefix('Bearer '); data,sig=raw.split('.')
        if not hmac.compare_digest(hmac.new(secret(),data.encode(),hashlib.sha256).hexdigest(),sig): raise ValueError()
        c=json.loads(base64.urlsafe_b64decode(data))
        if c['exp']<=time.time(): raise ValueError()
        return c
    except (AttributeError,ValueError,KeyError,TypeError): raise HTTPException(401,'로그인이 필요하거나 세션이 만료되었습니다.')

@app.get('/api/health')
async def health():
    await db('GET','tt_departments',params={'select':'id','limit':'1'})
    return {'status':'ok'}

@app.get('/api/departments')
async def departments(): return await db('GET','tt_departments',params={'order':'id'})

async def get_catalog(active_only=True):
    snapshot=await db('POST','rpc/tt_enrollment_snapshot',{})
    counts={c['id']:c['enrolledCount'] for c in snapshot['counts']}
    rows=await db('GET','tt_open_courses',params={**({'active':'eq.true'} if active_only else {}),'select':'*,tt_courses(*),tt_departments(*),tt_schedules(*)','order':'id','limit':'10000'})
    result=[]
    for r in rows:
        base=r.pop('tt_courses');dept=r.pop('tt_departments');schedules=r.pop('tt_schedules')
        path=r['classificationPath']
        result.append({**r,'enrolledCount':counts.get(r['id'],0),'remainingSeats':max(0,r['capacity']-counts.get(r['id'],0)),**base,**{k:v for k,v in dept.items() if k!='id' and v is not None},'category':path[0],'courseType':path[1],'generalEducationArea':path[2] if len(path)>2 else '', 'generalEducationElectiveArea':path[3] if len(path)>3 else '', 'schedules':sorted(schedules,key=lambda s:s['id'])})
    return result

@app.get('/api/courses')
async def courses():
    return await get_catalog()

async def validate_departments(items):
    ids={d['id'] for d in await departments()}
    if any(c['departmentId'] not in ids or not set(c['excludedDepartmentIds'])<=ids for c in items): raise HTTPException(422,'존재하지 않는 학과코드입니다.')
    basics={}
    for c in items:
        key=c['courseCode'];sig=(c['title'],c['credit'])
        if key in basics and basics[key]!=sig: raise HTTPException(422,'같은 학수번호의 과목명·학점이 다릅니다.')
        basics[key]=sig

@app.post('/api/admin/courses')
async def create_course(body:Course):
    items=[body.model_dump()];await validate_departments(items)
    existing=await courses()
    if any(c['courseCode']==body.courseCode and c['sectionNo']==body.sectionNo for c in existing): raise HTTPException(409,'학수번호·분반 중복')
    await db('POST','rpc/tt_save_catalog',{'items':items,'replace_all':False,'edit_id':0})
    return await courses()

@app.put('/api/admin/courses/{course_id}')
async def update_course(course_id:int,body:Course):
    items=[body.model_dump()];await validate_departments(items)
    await db('POST','rpc/tt_save_catalog',{'items':items,'replace_all':False,'edit_id':course_id})
    return await courses()

@app.delete('/api/admin/courses/{course_id}')
async def delete_course(course_id:int):
    await db('POST','rpc/tt_delete_course',{'course_id':course_id});return await courses()

@app.post('/api/admin/courses-import')
async def import_courses(file:UploadFile=File(...)):
    data=await file.read(5*1024*1024+1)
    if len(data)>5*1024*1024: raise HTTPException(413,'5MB 이하의 엑셀만 업로드하세요.')
    try: items=parse_excel(data)
    except Exception as e: raise HTTPException(422,f'엑셀 검증 실패: {e}')
    await validate_departments(items)
    await db('POST','rpc/tt_save_catalog',{'items':items,'replace_all':True})
    return await courses()

@app.get('/api/admin/courses.xlsx')
async def excel_download():
    return Response(export_excel(await courses()),media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',headers={'Content-Disposition':'attachment; filename="courses.xlsx"'})

@app.post('/api/students')
async def save_student(body:Student, c=Depends(claims)):
    if c['role']!='student': raise HTTPException(403,'학생 세션이 필요합니다.')
    rows=await db('GET','tt_students',params={'owner':f'eq.{c["sub"]}'})
    if not rows: raise HTTPException(404,'학생 정보가 없습니다.')
    if rows[0]['studentId']!=body.studentId: raise HTTPException(403,'학번은 변경할 수 없습니다.')
    if body.departmentId not in {d['id'] for d in await departments()}: raise HTTPException(422,'학과코드 오류')
    await db('PATCH','tt_students',body.model_dump(),{'owner':f'eq.{c["sub"]}'})
    return {'token':token('student',c['sub']),'student':body.model_dump()}

@app.get('/api/students/me')
async def me(c=Depends(claims)):
    if c['role']!='student': raise HTTPException(403,'학생 세션이 필요합니다.')
    rows=await db('GET','tt_students',params={'owner':f'eq.{c["sub"]}'})
    if not rows: raise HTTPException(404,'학생 정보가 없습니다.')
    return Student.model_validate(rows[0]).model_dump()

@app.get('/')
def root():
    return {'message': 'Hello World'}

from .enrollments import install_enrollments
async def enrollment_db(*args, **kwargs):
    return await db(*args, **kwargs)
install_enrollments(app,enrollment_db,claims,get_catalog)

from .auth import install_auth
install_auth(app,enrollment_db,token,departments)
