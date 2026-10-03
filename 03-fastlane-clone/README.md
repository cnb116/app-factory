# 03-fastlane-clone

URL 하나로 숏폼 대본 10편을 만들어 주는 앱 (Next.js).

## 배포

- Vercel 프로젝트 `03-fastlane-clone` ← GitHub `cnb116/app-factory` (main) 연동
- Root Directory: `03-fastlane-clone`
- Ignored Build Step: 직전 배포 커밋(`VERCEL_GIT_PREVIOUS_SHA`) 대비 이 폴더에 변경이 있을 때만 빌드
- 환경변수: `GEMINI_API_KEY`, `NEXT_PUBLIC_KAKAO_OPENCHAT_URL` (Vercel 프로젝트 설정에서 관리, 저장소에 커밋하지 않음)
