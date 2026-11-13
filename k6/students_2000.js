import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// =============================================================
// 수강신청 기간 학생 2000명 시나리오 (읽기 부하)
//
// 실제 프론트엔드(App.tsx)처럼 학생 한 명이 5초마다 과목 목록을 새로고침합니다.
// 2000명이면 초당 약 400개의 요청입니다.
//
//   k6 run -e BASE_URL=http://127.0.0.1:8000 students_2000.js
//   k6 run -e PEAK=500 students_2000.js        # 인원 변경
//
// 기준(2초, 실패 5%)을 넘으면 서버를 계속 괴롭히지 않도록 자동으로 멈춥니다.
// =============================================================
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';
const PEAK = Number(__ENV.PEAK || 2000);
const POLL_SECONDS = Number(__ENV.POLL_SECONDS || 5);

const coursesTrend = new Trend('courses_duration', true);

export const options = {
  stages: [
    { duration: '10s', target: Math.round(PEAK * 0.1) },  // 200명
    { duration: '10s', target: Math.round(PEAK * 0.25) }, // 500명
    { duration: '20s', target: Math.round(PEAK * 0.5) },  // 1000명
    { duration: '20s', target: PEAK },                  // 2000명
    { duration: '20s', target: PEAK },                  // 2000명 유지
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: true, delayAbortEval: '20s' }],
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '20s' }],
  },
};

export default function () {
  if (__ITER === 0) sleep(Math.random() * POLL_SECONDS);

  const res = http.get(`${BASE_URL}/api/courses`, { timeout: '30s', tags: { name: 'courses' } });
  coursesTrend.add(res.timings.duration);
  check(res, {
    'courses 200': (r) => r.status === 200,
    'courses is array': (r) => {
      try { return Array.isArray(r.json()); } catch (e) { return false; }
    },
  });

  sleep(POLL_SECONDS * (0.8 + Math.random() * 0.4));
}
