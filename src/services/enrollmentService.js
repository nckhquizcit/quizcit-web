import { request } from "./apiClient";
import { mapSubject } from "./mappers";

export async function enrollCourse(subjectId) {
  return request({ method: "POST", url: `/api/users/me/course-enrollments/${subjectId}` });
}

export async function unenrollCourse(subjectId) {
  return request({ method: "DELETE", url: `/api/users/me/course-enrollments/${subjectId}` });
}

export async function getMyEnrollments() {
  const items = await request({ method: "GET", url: "/api/users/me/course-enrollments" });
  return (items || [])
    .map((item) => ({
      ...mapSubject(item),
      enrolledAt: item?.enrolledAt ?? item?.enrolled_at ?? null,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

// BE tra 409 khi mon da duoc dang ky truoc do, caller coi nhu thanh cong.
export function isAlreadyEnrolled(error) {
  return error?.status === 409 || error?.response?.status === 409;
}
