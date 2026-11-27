"""Build an ERD from the read-only PostgreSQL metadata snapshot.

Outputs PNG + SVG using identical drawing operations, Mermaid source,
and a complete textual schema reference. Does not access the database.
"""
import json
import math
from html import escape
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / 'schema-metadata.json').read_text(encoding='utf-8'))
W, H, SCALE = 2280, 1720, 2
INK, MUTED, LINE = '#172b46', '#5c6d82', '#ccd6e1'
BLUE, GREEN, PURPLE, GRAY = '#265f99', '#257466', '#7756a7', '#52657b'
im = Image.new('RGB', (W*SCALE, H*SCALE), 'white')
draw = ImageDraw.Draw(im)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
       '<rect width="100%" height="100%" fill="white"/>']

def font(size, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf', round(size*SCALE))

def text(s, x, y, size=20, fill=INK, bold=False, anchor='start'):
    f = font(size, bold)
    width = draw.textlength(s, font=f)/SCALE
    xx = x if anchor=='start' else x-width if anchor=='end' else x-width/2
    assert 0 <= xx and xx+width <= W, (s, xx, width)
    draw.text((xx*SCALE, y*SCALE), s, font=f, fill=fill, anchor='ls')
    svg.append(f'<text x="{x}" y="{y}" fill="{fill}" font-family="Malgun Gothic, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" text-anchor="{anchor}">{escape(s)}</text>')
    return width

def rect(x, y, w, h, fill='white', stroke=None, radius=0):
    box = (round(x*SCALE), round(y*SCALE), round((x+w)*SCALE), round((y+h)*SCALE))
    draw.rounded_rectangle(box, radius=radius*SCALE, fill=fill, outline=stroke, width=2*SCALE)
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="2"/>')

def poly(points, color=BLUE, width=2, dashed=False):
    if dashed:
        for (x1,y1),(x2,y2) in zip(points, points[1:]):
            length = math.hypot(x2-x1,y2-y1)
            if not length:
                continue
            for t in range(0, math.ceil(length), 13):
                end=min(t+7,length)
                draw.line(((x1+(x2-x1)*t/length)*SCALE,(y1+(y2-y1)*t/length)*SCALE,
                           (x1+(x2-x1)*end/length)*SCALE,(y1+(y2-y1)*end/length)*SCALE), fill=color,width=width*SCALE)
    else:
        draw.line([(round(x*SCALE),round(y*SCALE)) for x,y in points],fill=color,width=width*SCALE)
    coords=' '.join(f'{x},{y}' for x,y in points)
    dash=' stroke-dasharray="7 6"' if dashed else ''
    svg.append(f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="{width}"{dash}/>')

def circle(x,y,r,color):
    draw.ellipse(((x-r)*SCALE,(y-r)*SCALE,(x+r)*SCALE,(y+r)*SCALE), fill='white', outline=color,width=2*SCALE)
    svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="white" stroke="{color}" stroke-width="2"/>')

def cardinal(endpoint, nextpoint, many=False, color=BLUE):
    x,y=endpoint
    dx,dy=nextpoint[0]-x,nextpoint[1]-y
    n=math.hypot(dx,dy)
    ux,uy=dx/n,dy/n
    px,py=-uy,ux
    def p(a,b=0): return (x+ux*a+px*b,y+uy*a+py*b)
    if many:
        poly([p(1,-8),p(17),p(1,8)],color)
        circle(*p(26),5,color)
    else:
        for d in (10,17): poly([p(d,-8),p(d,8)],color)

def relationship(points):
    poly(points)
    cardinal(points[0], points[1])
    cardinal(points[-1], points[-2], many=True)

def label(s,x,y,size=17,color=BLUE):
    width=draw.textlength(s,font=font(size))/SCALE
    rect(x-6,y-size-3,width+12,size+9)
    text(s,x,y,size,color)

TABLES={
    'departments': (60,170,570,'학과',BLUE),
    'students': (60,550,570,'학생',BLUE),
    'courses': (1630,170,590,'교과목 원장',BLUE),
    'open_courses': (830,170,600,'개설 강좌 · 분반',BLUE),
    'enrollments': (830,910,600,'수강신청 내역',GREEN),
    'schedules': (1630,570,590,'강의 시간 및 강의실',BLUE),
    'notice': (60,1080,570,'공지사항 · 독립 테이블',GRAY),
    'registration_period': (830,1320,600,'수강신청 기간 · 독립 테이블',GRAY),
    'course_seats': (1630,1080,590,'좌석 현황 · 집계 VIEW',PURPLE),
}
FOOTERS={
    'departments':'학과 정보: 단과대학 / 학부 / 전공',
    'students':'owner: 기본키  ·  studentId: 고유 학번',
    'courses':'동일 과목의 여러 분반이 참조',
    'open_courses':'UQ (courseCode, sectionNo)',
    'enrollments':'UQ (studentOwner, openCourseId)',
    'schedules':'CHECK (endPeriod >= startPeriod)',
    'notice':'다른 테이블을 참조하는 FK 없음',
    'registration_period':'CHECK (id = 1), CHECK (endsAt > startsAt)',
    'course_seats':"status = 'enrolled'인 신청만 집계",
}
COLS={name:[c for c in DATA['columns'] if c['table_name']==name] for name in TABLES}
CONS={name:[c for c in DATA['constraints'] if c['table_name']==name] for name in TABLES}
assert set(TABLES)=={r['name'] for r in DATA['relations']}
assert sum(c['type']=='f' for c in DATA['constraints'])==6

text('AI 기반 개인 맞춤형 수강신청 및 시간표 설계 플랫폼',60,64,34,bold=True)
text('데이터베이스 ERD',60,111,28,bold=True)
text('Supabase PostgreSQL · public 스키마 · 실제 DB 메타데이터 검증',2220,104,19,MUTED,anchor='end')
poly([(60,135),(2220,135)],LINE)

# FK relationships, from parent to child. Crow's foot: exactly 1 to 0..N.
relationship([(345,424),(345,550)])
label('id → departmentId',371,497)
relationship([(630,250),(725,250),(725,455),(830,455)])
label('id →',665,231)
label('departmentId',684,488)
relationship([(1630,290),(1430,290)])
label('courseCode',1460,271)
relationship([(1430,640),(1630,640)])
label('id → openCourseId',1439,619,15)
relationship([(345,954),(345,995),(830,995)])
label('owner → studentOwner',448,982)
relationship([(1130,694),(1130,910)])
label('id → openCourseId',1156,810)

# Dashed arrows are VIEW dependencies, not FK relationships.
poly([(1430,680),(1505,680),(1505,1030),(1925,1030),(1925,1080)],PURPLE,dashed=True)
poly([(1917,1068),(1925,1080),(1933,1068)],PURPLE)
label('개설 강좌',1680,1014,17,PURPLE)
poly([(1430,1160),(1630,1160)],PURPLE,dashed=True)
poly([(1618,1152),(1630,1160),(1618,1168)],PURPLE)
label('신청 내역 집계',1456,1138,16,PURPLE)

for name,(x,y,w,korean,color) in TABLES.items():
    columns=COLS[name]
    h=134+30*len(columns)
    rect(x,y,w,h,'white',LINE,8)
    rect(x,y,w,64,color,radius=8)
    rect(x,y+52,w,12,color)
    text(name,x+18,y+29,24,'white',True)
    text(korean,x+18,y+53,17,'#edf4ff')
    rect(x+1,y+64,w-2,30,'#eef3f8')
    for title,xx in [('KEY',x+14),('COLUMN',x+79),('TYPE',x+w-172),('NULL',x+w-44)]:
        text(title,xx,y+85,12,MUTED,True)
    for i,col in enumerate(columns):
        yy=y+94+i*30
        if i%2==1: rect(x+1,yy,w-2,30,'#f8fafc')
        key=[]
        for c in CONS[name]:
            if col['column_name'] in c['columns']:
                if c['type']=='p': key.append('PK')
                if c['type']=='f': key.append('FK')
                if c['type']=='u' and len(c['columns'])==1: key.append('UQ')
        text(','.join(key),x+14,yy+21,13,color,True)
        field=col['column_name']
        size=17 if len(field)>18 else 18
        field_width=text(field,x+79,yy+21,size,INK,'PK' in key)
        assert field_width < w-257, (name,field,field_width)
        typ=col['data_type'].replace('timestamp with time zone','timestamptz')
        text(typ,x+w-172,yy+21,15,MUTED)
        null_value='—' if name=='course_seats' else 'Y' if not col['not_null'] else 'N'
        text(null_value,x+w-27,yy+21,14,MUTED,anchor='middle')
    fy=y+94+30*len(columns)
    poly([(x,fy),(x+w,fy)],LINE,1)
    text(FOOTERS[name],x+14,fy+25,15,color)

# Legend and notes occupy the remaining bottom corners, outside the FK graph.
text('표기 안내',60,1460,21,bold=True)
text('PK  기본키     FK  외래키     UQ  고유 제약',60,1496,18,MUTED)
text('NULL: Y 허용 / N 불가 / — 뷰는 제약 미표시',60,1529,18,MUTED)
poly([(65,1567),(195,1567)],BLUE)
cardinal((65,1567),(195,1567))
cardinal((195,1567),(65,1567),True)
text('1 : 0..N   실제 FK 관계',222,1574,18,MUTED)
poly([(65,1605),(195,1605)],PURPLE,dashed=True)
text('집계 뷰의 원본 참조 · FK 아님',222,1612,18,MUTED)

text('현재 구현에서 구분할 사항',1630,1460,21,bold=True)
text('분류 트리: classificationPath 배열에서 생성',1630,1496,17,MUTED)
text('excludedDepartmentIds: 배열 · DB FK 아님',1630,1529,17,MUTED)
text('강의계획서 PDF: Storage 저장 / DB에는 경로·이름',1630,1562,17,MUTED)
text('예비시간표·즐겨찾기: 브라우저 저장 · DB 테이블 아님',1630,1595,17,MUTED)
poly([(60,1650),(2220,1650)],LINE)
text('8 TABLES  /  1 VIEW  /  6 FOREIGN KEYS',60,1686,17,MUTED,True)
text('검증일: 2026.11.27 (KST)  ·  컬럼·자료형·PK·FK·UQ 확인  ·  업무 데이터 조회 및 변경 없음',2220,1686,16,MUTED,anchor='end')
svg.append('</svg>')
(HERE/'platform-erd.svg').write_text('\n'.join(svg),encoding='utf-8')
im.save(HERE/'platform-erd.png',dpi=(300,300),optimize=True)
im.resize((1710,1290),Image.Resampling.LANCZOS).save(HERE/'preview.png')

# Machine-editable ER source contains physical tables only. The view is in SVG/PNG.
mmd=['erDiagram','    direction LR',
     '    %% Verified PostgreSQL physical tables. View dependencies are in the SVG/PNG.',
     '    %% NULL Y/N in column comments. Compound UQ constraints are table notes in SVG/PNG.']
for name in TABLES:
    if name=='course_seats': continue
    mmd.append('    '+name+' {')
    for c in COLS[name]:
        tags=[]
        for con in CONS[name]:
            if c['column_name'] in con['columns']:
                if con['type']=='p': tags.append('PK')
                if con['type']=='f': tags.append('FK')
                if con['type']=='u' and len(con['columns'])==1: tags.append('UK')
        typ=c['data_type'].replace('timestamp with time zone','timestamptz')
        keys=(' '+', '.join(tags)) if tags else ''
        mmd.append(f'        {typ} {c["column_name"]}{keys} "NULL {"N" if c["not_null"] else "Y"}"')
    mmd.append('    }')
for con in DATA['constraints']:
    if con['type']=='f':
        mmd.append(f'    {con["referenced_table"]} ||..o{{ {con["table_name"]} : "{con["columns"][0]}"')
(HERE/'platform-erd.mmd').write_text('\n'.join(mmd)+'\n',encoding='utf-8')

notes=['데이터베이스 ERD 검증 내역',
       '검증일: 2026-11-27 (Asia/Seoul)',
       '출처: backend/.env에 설정된 PostgreSQL의 pg_catalog 메타데이터.',
       '읽기 전용 트랜잭션으로 public 스키마의 구조만 조회. 업무 레코드·비밀번호 값·접속 비밀정보는 포함하지 않음.',
       '', '보고서 그림 제목: 그림 2. 수강신청 및 시간표 설계 플랫폼 데이터베이스 ERD',
       '', '보고서용 설명:',
       '데이터베이스는 학과, 학생, 교과목, 개설 강좌, 강의 시간, 수강신청 내역, 공지사항 및 수강신청 기간을 관리하는 8개 테이블과 좌석 현황을 계산하는 1개 뷰로 구성하였다. 학생과 개설 강좌의 다대다 관계는 수강신청 테이블로 연결하며, 외래키와 고유 제약을 통해 참조 관계와 중복 신청 데이터를 관리한다. 강좌의 분류 경로는 배열로 저장하여 계층형 검색 필터 구성에 활용한다.',
       '', '주요 확인 사항:',
       '- tt_students의 PK는 owner(uuid), studentId는 UNIQUE(text)이다.',
       '- tt_enrollments는 studentOwner → students.owner를 참조한다. 학번을 FK로 사용하지 않는다.',
       '- tt_enrollments는 UNIQUE(studentOwner, openCourseId)를 가진다. status는 enrolled 또는 cancelled이다.',
       '- 모든 FK 컬럼은 NOT NULL이며 단독 UNIQUE가 아니다. 부모 1개 대 자식 0개 이상의 관계다.',
       '- PNG/SVG 실선은 FK 관계의 존재를 뜻하며 식별 관계를 뜻하지 않는다. 모든 관계는 비식별 관계이며 Mermaid에는 점선으로 표시하였다.',
       '- tt_course_seats는 일반 VIEW이며 PK/FK를 가진 물리 테이블이 아니다.',
       '- VIEW는 tt_open_courses와 status=enrolled인 tt_enrollments를 LEFT JOIN하여 강좌별 집계한다.',
       '- enrolledCount = count(e.id)::integer, remainingSeats = greatest(0, capacity-count(e.id))::integer.',
       '- 뷰의 NULL 표기는 생략하였다. pg_attribute의 attnotnull=false가 실제 결과의 NULL 발생을 의미하지 않는다.',
       '- tt_open_courses의 classificationPath(text[])는 별도의 필터 테이블이 아니다.',
       '- excludedDepartmentIds(bigint[])에는 DB 외래키가 없다. 애플리케이션에서 학과코드를 확인한다.',
       '- capacity는 tt_open_courses에 저장하며 뷰에서는 이를 조회한다.',
       '- tt_registration_period는 id=1 제약으로 최대 1행을 저장한다. notice와 함께 연결된 FK가 없는 독립 테이블이다.',
       '- timestamptz는 PostgreSQL timestamp with time zone의 별칭이다.',
       '- Storage 내부 스키마는 이 ERD의 범위가 아니다. PDF 파일은 Storage, 메타데이터는 tt_open_courses에 둔다.',
       '- 예비시간표와 즐겨찾기, AI 추천 결과를 위한 별도 테이블은 현재 public 스키마에 없다.',
       '- frontend/src/shared/types/database.ts의 설계 제안용 타입을 실제 테이블로 간주하지 않았다.',
       '', '전체 컬럼 및 실제 제약:']
for name in TABLES:
    notes.extend(['',name + (' [VIEW]' if name=='course_seats' else ' [TABLE]')])
    for c in COLS[name]:
        null='제약 미표시(VIEW)' if name=='course_seats' else 'NOT NULL' if c['not_null'] else 'NULL 허용'
        extra=f'; default={c["default_expression"]}' if c['default_expression'] is not None else ''
        if c['identity_kind']: extra+='; identity='+{'a':'ALWAYS','d':'BY DEFAULT'}[c['identity_kind']]
        notes.append(f'  {c["column_name"]}: {c["data_type"]}; {null}{extra}')
    for con in CONS[name]: notes.append('  '+con['name']+': '+con['definition'])
notes.extend(['','뷰 정의:',DATA['views'][0]['definition']])
(HERE/'schema-notes.txt').write_text('\n'.join(notes)+'\n',encoding='utf-8')
print(f'Generated PNG {W*SCALE}x{H*SCALE}, SVG, Mermaid, and schema notes.')
