import catalog from "../data/public-catalog.json" with { type: "json" };

export const courses = catalog.courses;
export const defaultCourseId = courses[0].id;
export const allLessons = courses.flatMap((course) =>
  course.lessons.map((lesson) => ({ course, lesson })),
);

export const getCourse = (id) => courses.find((course) => course.id === id);
export const getLesson = (courseId, number) =>
  getCourse(courseId)?.lessons.find(
    (lesson) => lesson.number === Number(number),
  );
export const courseLabel = (course) => `${course.level} ${course.subject}`;

export function readRoute(search) {
  const params = new URLSearchParams(search);
  const requestedCourse = params.get("course");
  const course = getCourse(requestedCourse) || courses[0];
  // A stale or misspelled course link must not silently open a different
  // lesson in the default course (lesson numbers repeat across all four).
  const validCourse = !requestedCourse || requestedCourse === course.id;
  const lesson = validCourse
    ? getLesson(course.id, params.get("lesson"))
    : null;
  if (params.has("about"))
    return { courseId: course.id, lessonNumber: null, view: "about" };
  return {
    courseId: course.id,
    lessonNumber: lesson?.number ?? null,
    view: lesson
      ? ["overview", "map", "teach"].includes(params.get("view"))
        ? params.get("view")
        : "overview"
      : "home",
  };
}

export function coursePath(courseId, base = "/") {
  return courseId === defaultCourseId
    ? base
    : `${base}?course=${encodeURIComponent(courseId)}`;
}

export function lessonPath(courseId, number, view = "overview", base = "/") {
  return `${base}?course=${encodeURIComponent(courseId)}&lesson=${number}&view=${view}`;
}

export function findPublicLessons(query, limit = 6) {
  const text = query.trim().toLocaleLowerCase();
  if (!text) return [];
  return allLessons
    .filter(({ course, lesson }) =>
      `${courseLabel(course)} ${lesson.title} ${lesson.indicator.code || ""} ${lesson.vocabulary.join(" ")}`
        .toLocaleLowerCase()
        .includes(text),
    )
    .slice(0, limit);
}
