import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// =============================================================
// 수강신청 기간 트래픽 부하 테스트 (읽기 부하)
//
// 대상 서버 (기본: 배포 서버). 로컬 테스트 시:
//   k6 run -e BASE_URL=http://127.0.0.1:8000 load_test.js
// =============================================================
const BASE_URL = __ENV.BASE_URL || 'https://course-recommendation-timetable.onrender.com';

const errorRate = new Rate('errors');                      // 사용자 정의 에러율
const coursesTrend = new Trend('courses_duration', true);  // 강의 목록 응답시간

export const options = {
  // 수강신청 몰림 시나리오: 접속자를 점진적으로 늘림
  stages: [
    { duration: '30s', target: 50 },   // 워밍업: 50명
    { duration: '1m',  target: 200 },  // 급증: 200명 동시 접속
    { duration: '1m',  target: 200 },  // 유지: 200명 1분간
    { duration: '30s', target: 0 },    // 감소
  ],
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

  sleep(1); // 실제 사용자처럼 1초 간격으로 요청
}