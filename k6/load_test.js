import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// =============================================================
// 수강신청 기간 트래픽 부하 테스트 (읽기 부하)
//
// 대상 서버 (기본: 로컬 백엔드). 프로젝트 루트에서 실행:
//   k6 run -e VUS=200 ./k6/load_test.js
// =============================================================
const BASE_URL = (__ENV.BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const VUS = Number(__ENV.VUS || 200);
if (!Number.isSafeInteger(VUS) || VUS < 1) {
  throw new Error('VUS must be a positive integer (for example: 50, 100, 300, 500)');
}

const errorRate = new Rate('errors');                      // 사용자 정의 에러율
const coursesTrend = new Trend('courses_duration', true);  // 강의 목록 응답시간

export const options = {
  // 인원별 결과를 분리하기 위해 한 번 실행할 때 한 가지 부하만 측정합니다.
  scenarios: {
    lookup: {
      executor: 'constant-vus',
      vus: VUS,
      duration: '3m',
      gracefulStop: '30s',
    },
  },
  tags: { test_users: String(VUS), variant: __ENV.VARIANT || 'baseline' },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% 요청은 2초 이내
    errors: ['rate<0.05'],             // 에러율 5% 미만
    http_req_failed: ['rate<0.05'],    // 실패 요청 5% 미만
  },
};

export default function () {
  // 1) 서버 헬스체크
  const health = http.get(`${BASE_URL}/api/health`);
  const healthOk = check(health, { 'health 200': (r) => r.status === 200 });

  // 2) 강의 목록 조회 (수강신청 때 가장 많이 호출되는 읽기 요청)
  const courses = http.get(`${BASE_URL}/api/courses`);
  coursesTrend.add(courses.timings.duration);
  const coursesOk = check(courses, {
    'courses 200': (r) => r.status === 200,
    'courses is array': (r) => {
      try { return Array.isArray(r.json()); } catch (e) { return false; }
    },
  });

  // 매 요청마다 성공/실패 기록 (0 = 성공, 1 = 실패) → 정확한 에러율 계산
  errorRate.add(!healthOk);
  errorRate.add(!coursesOk);

  sleep(1); // 두 요청이 완료된 뒤 1초 대기
}