# setting

cmd 명령어
관리자 권한으로 실행
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

wsl --version
만약 버전이 잘 안나오면 아래 코드 실행
wsl --update
wsl --version

wsl -l -v