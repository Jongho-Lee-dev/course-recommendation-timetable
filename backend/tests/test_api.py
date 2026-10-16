import copy, os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app import main
from app.excel import parse_excel,export_excel

ROOT=Path(__file__).resolve().parents[2]
@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv('SESSION_SECRET','test-secret-'*4)
    return TestClient(main.app)

def test_excel_preserves_original_and_roundtrips():
    old=parse_excel((ROOT/'과목 데이터.xlsx').read_bytes())
    import json
    new=json.loads((ROOT/'backend/seed_courses.json').read_text())
    assert len(old)==18 and len(new)==40
    assert new[:18]==old
    assert parse_excel(export_excel(new))==new
    assert len(old[0]['schedules'])==2
    assert old[0]['sectionNo']=='01'

def test_reject_invalid_excel_before_db(client,monkeypatch):
    async def fail(*a,**kw):raise AssertionError('DB must not be called')
    monkeypatch.setattr(main,'db',fail)
    r=client.post('/api/admin/courses-import',files={'file':('bad.xlsx',b'bad')})
    assert r.status_code==422

def test_admin_no_auth_student_still_protected(client,monkeypatch):
    calls=[]
    async def fake(method,path,body=None,params=None):
        calls.append(path)
        if path=='rpc/tt_enrollment_snapshot':return {'counts':[],'courseIds':[]}
        return []
    monkeypatch.setattr(main,'db',fake)
    assert client.delete('/api/admin/courses/1').status_code==200
    assert 'rpc/tt_delete_course' in calls
    assert client.get('/api/students/me').status_code==401
    assert client.get('/api/students/me',headers={'Authorization':'Bearer invalid'}).status_code==401
    assert client.post('/api/admin/login',json={'password':'anything'}).status_code==404

def test_import_uses_one_transaction(client,monkeypatch):
    calls=[]
    async def fake(method,path,body=None,params=None):
        calls.append((method,path,body))
        if path=='tt_departments':return [{'id':x} for x in [1,2,3,4,5,6,7,10,11,12,13,14,15]]
        if path=='tt_open_courses':return []
        if path=='rpc/tt_enrollment_snapshot':return {'counts':[],'courseIds':[]}
    monkeypatch.setattr(main,'db',fake)
    r=client.post('/api/admin/courses-import',files={'file':('data.xlsx',(ROOT/'과목 데이터.xlsx').read_bytes())})
    assert r.status_code==200
    writes=[c for c in calls if c[0]=='POST' and c[1]=='rpc/tt_save_catalog']
    assert len(writes)==1 and writes[0][1]=='rpc/tt_save_catalog'
    assert len(writes[0][2]['items'])==18 and writes[0][2]['replace_all'] is True

def test_student_validation(client):
    r=client.post('/api/auth/signup',json={'password':'12345678','studentId':'123','name':'학생','grade':2,'departmentId':1,'completedCredits':200,'graduationCredits':130,'maxCredits':18})
    assert r.status_code==422

def test_course_rejects_duplicate_schedules():
    from app.models import Course
    original=parse_excel((ROOT/'과목 데이터.xlsx').read_bytes())[0]
    original['schedules'].append(copy.deepcopy(original['schedules'][0]))
    with pytest.raises(ValueError):Course.model_validate(original)


def test_delivered_workbook_matches_seed():
    import json
    assert parse_excel((ROOT/'과목_가데이터_40개.xlsx').read_bytes())==json.loads((ROOT/'backend/seed_courses.json').read_text())
