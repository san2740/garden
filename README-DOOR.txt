시작점은 index.html 하나입니다.
기존 AR 시작: iPhone Quick Look / pavilion.usdz (닫힌 문, 손 조작 불가)
후면 카메라로 문 잡기: MediaPipe 손가락 추적 + GLB 문 회전. 후면 카메라 영상 위에 모델 표시, 실제 공간 고정 AR 아님.
손잡이 위치는 GLB에서 화면에 투영하여 근사 판정합니다. 손의 실제 3D 깊이나 물리 접촉을 인식하지 않습니다.
GitHub Pages HTTPS에서 실행. 외부 라이브러리 CDN 연결 필요. Safari 기기 실측 검증 미완료.
ZIP의 garden-pavilion 폴더 안 파일 전체를 사이트 루트에 덮어쓰기.
