import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 100,
  duration: "30s",
};

export default function () {
  const res = http.get("https://course-recommendation-timetable.onrender.com");

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}