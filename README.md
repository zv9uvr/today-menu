<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/zv9uvr/today-menu/main/today's-menu/menu/static/images/menu-icon.png">
  <img src="https://raw.githubusercontent.com/zv9uvr/today-menu/main/today's-menu/menu/static/images/menu-icon.png" alt="Today's Menu logo" height="70" align="left" style="margin-right: 20px;">
</picture>

# Today's Menu

보안성과 확장성을 고려한 Django 기반 위치 데이터 분석 서비스

## Welcome to Today's Menu

Today's Menu는 1학년 때의 정적인 결과물을 3학년을 앞두고 보안성과 관심사의 분리(SoC)를 고려하여 고도화한 프로젝트입니다. 단순히 기능을 구현하는 것을 넘어, 서비스 운영 단계에서의 취약점 방어와 안정적인 아키텍처 설계를 실천하는 데 중점을 두었습니다.

## Contributing to Today's Menu

본 프로젝트는 개인 학습 및 보안 고도화를 목적으로 하며, 기술적 개선 제안이나 보안 취약점 제보를 환영합니다.
* **보안 취약점 제보**: 서비스 운영 중 발견된 취약점(SQLi, XSS, 로직 결함 등)은 이슈(Issue) 탭을 통해 제보해 주시면 즉시 검토 후 반영하겠습니다.
* **코드 리뷰 및 PR**: 시큐어 코딩 규칙 준수 여부나 아키텍처 개선에 대한 Pull Request는 언제든 환영합니다.
* **문의**: 추가적인 논의가 필요하신 경우 링크드인을 통해 연락 부탁드립니다.

## Security & Architecture
본 프로젝트는 서비스의 가용성뿐만 아니라 보안 무결성을 확보하기 위해 다음과 같은 설계를 반영하였습니다.

* **환경 변수 분리 및 격리**: `python-dotenv`를 활용하여 API Key 등 민감 정보를 소스코드와 분리하여 관리하였습니다.
* **기밀성 유지**: `.gitignore` 설정을 통해 Secret Key 및 설정 파일이 원격 저장소(GitHub)에 노출되지 않도록 사전에 차단하였습니다.
* **서버 측 접근 제어**: 운영 환경(Linux Oracle VM)에서 `chmod 600` 등 최소 권한 원칙(Least Privilege)에 기반한 파일 권한 설정을 적용하여 비인가자의 접근을 제한하였습니다.
* **관심사의 분리(SoC)**: Django의 MVT 패턴을 준수하여 프론트엔드와 백엔드 로직을 분리, 유지보수성과 보안 설계의 명확성을 높였습니다.

