
# 세팅

## k6 설치
k6 테스트를 진행하기 위해 PowerShell에서 다음 명령어를 실행합니다.
```bash
winget install k6 --source winget
```

## 버전확인
k6가 정상적으로 설치되었는지 확인하기 위해 VS Code의 터미널에서 다음 명령어를 실행합니다.
```bash
k6 version
```

## k6 실행 명령어
k6 테스트 스크립트를 실행할 때 다음 명령어를 사용합니다.
```bash
k6 run 파일이름
```