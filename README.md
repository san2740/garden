# 정원 파빌리온 AR

이 폴더는 GitHub Pages에 바로 올릴 수 있는 정적 AR 사이트입니다. Python, Node.js, 별도 빌드 작업이 필요 없습니다.

1. `index.html`, `assets/`, `pavilion.glb`, `.nojekyll`과 나머지 파일을 저장소 루트에 커밋합니다.
2. GitHub 저장소의 **Settings → Pages**에서 **Deploy from a branch → main → /(root)**를 선택하고 저장합니다.
3. Pages 화면에 표시된 HTTPS 주소(예: `https://사용자명.github.io/저장소명/`)를 ARCore 지원 Android 휴대폰의 Chrome에서 엽니다. Google Play AR 서비스가 필요합니다.
4. **카메라 AR 시작**을 누르고 넓은 평지에서 2~4m 앞 바닥을 비춥니다. 초록 원이 보이면 탭해 현관을 배치합니다. 실제 주변을 확인하면서 휴대폰을 들고 걸어 들어가세요.

모델은 3.8 × 6.6m이며 현장에서 탭한 위치에 배치됩니다. AR을 종료하면 배치가 초기화됩니다.

## 아이폰

Safari에서 Pages 주소를 열고 **카메라 AR 시작**를 누르세요. Apple AR Quick Look에서 AR 모드로 전환해 건물을 배치합니다. USDZ 모델은 미터 단위이며 크기 조절을 잠갔습니다. iPhone 실기기에서 실물 크기와 실내 진입 시 표시를 확인해야 합니다. 카카오톡이나 ChatGPT 앱 안의 브라우저를 사용 중이면 Safari에서 주소를 여세요.


## 실험적 문 인터랙션
Android WebXR에서 hand-tracking 기능을 선택적으로 요청합니다. 브라우저가 XRHand 관절 데이터를 제공할 때만 손잡이 부근 집기/당기기가 작동합니다. 일반 스마트폰 Chrome에서는 지원되지 않을 수 있습니다. 대체 조작은 AR 화면의 문 열기/닫기 버튼입니다. 문은 GLB에 영구 저장되지 않고 Android 뷰어가 실행 중에 생성합니다. iPhone Quick Look USDZ에는 아직 반영되지 않습니다.
