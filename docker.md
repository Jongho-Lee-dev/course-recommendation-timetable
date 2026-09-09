# setting

cmd 명령어
관리자 권한으로 실행
```bash
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```
```bash
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```
```bash
wsl --version
```
만약 버전이 잘 안나오면 아래 코드 실행
```bash
wsl --update
wsl --version
```
```bash
wsl -l -v
```
