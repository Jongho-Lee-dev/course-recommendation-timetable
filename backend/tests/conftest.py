import pytest
from app import main


@pytest.fixture(autouse=True)
def empty_catalog_cache():
    # 테스트마다 가짜 DB가 다르므로 과목 목록 캐시를 비웁니다.
    main.clear_catalog_cache()
    yield
    main.clear_catalog_cache()
