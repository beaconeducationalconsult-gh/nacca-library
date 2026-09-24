import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Download,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Layers3,
  Lightbulb,
  List,
  Map as MapIcon,
  Maximize2,
  Menu,
  MonitorPlay,
  Network,
  Pause,
  Play,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import { ConceptMap } from "./components/ConceptMap";
import { InteractiveWidget } from "./components/Widgets";
import {
  courseLabel,
  coursePath,
  courses,
  defaultCourseId,
  findPublicLessons,
  getCourse,
  getLesson,
  lessonPath,
  readRoute,
} from "./lib/catalog";

const BASE_PATH = import.meta.env.BASE_URL;
const HERO_TOPICS = {
  "b7-math-t1": ["Powers", "Number", "Fractions"],
  "b7-science-t1": ["Materials", "Cycles", "Energy"],
  "b8-math-t1": ["Indices", "Number", "Graphs"],
  "b8-science-t1": ["Mixtures", "Energy", "Living things"],
};
const PHASE_INFO = [
  {
    key: "engage",
    label: "Engage",
    prompt:
      "Start with a question. What do learners already notice about this idea?",
  },
  {
    key: "explore",
    label: "Explore",
    prompt:
      "Try a model or a conversation. Look for a pattern before naming a rule.",
  },
  {
    key: "explain",
    label: "Explain",
    prompt:
      "Put the idea into words. Connect the model to mathematical language.",
  },
  {
    key: "elaborate",
    label: "Elaborate",
    prompt: "Apply the idea in a different example or situation.",
  },
  {
    key: "evaluate",
    label: "Evaluate",
    prompt: "Reflect on what you can explain now and what needs another try.",
  },
];

function ReviewBanner({ lesson, compact = false }) {
  if (!lesson.review) return null;
  return compact ? (
    <span className="review-pill">
      <TriangleAlert size={14} aria-hidden="true" /> Editorial review
    </span>
  ) : (
    <aside
      className="review-banner"
      role="note"
      aria-label="Editorial review notice"
    >
      <TriangleAlert size={20} aria-hidden="true" />
      <div>
        <strong>Editorial review needed</strong>
        <p>{lesson.review.message}</p>
      </div>
    </aside>
  );
}

function Brand({ onClick }) {
  return (
    <button
      className="brand"
      type="button"
      onClick={onClick}
      aria-label="MapLearn home"
    >
      <span className="brand-icon">
        <Network size={23} strokeWidth={2.3} aria-hidden="true" />
      </span>
      <span>
        map<span className="brand-accent">learn</span>
        <small>TEACHING, CONNECTED</small>
      </span>
    </button>
  );
}

function UnitIcon({ id, subject, size = 20 }) {
  const Icon =
    {
      numeration: Layers3,
      operations: Compass,
      powers: Sparkles,
      fractions: Target,
    }[id] || (subject === "Science" ? FlaskConical : BookOpen);
  return <Icon size={size} aria-hidden="true" />;
}

function Sidebar({
  route,
  course,
  onHome,
  onCourse,
  onLesson,
  onAbout,
  open,
  onClose,
}) {
  const current = getLesson(course.id, route.lessonNumber) || course.lessons[0];
  const items = [
    {
      label: "Overview",
      icon: Compass,
      action: onHome,
      active: route.view === "home",
    },
    {
      label: "Concept map",
      icon: Network,
      action: () => onLesson(course.id, current.number, "map"),
      active: route.view === "map",
    },
    {
      label: "Teach display",
      icon: MonitorPlay,
      action: () => onLesson(course.id, current.number, "teach"),
      active: route.view === "teach",
    },
  ];
  return (
    <>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <Brand
          onClick={() => {
            onHome();
            onClose();
          }}
        />
        <button
          className="mobile-close"
          type="button"
          aria-label="Close menu"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        <div className="sidebar-divider" />
        <span className="sidebar-label">WORKSPACE</span>
        <nav className="sidebar-nav">
          {items.map(({ label, icon: Icon, action, active }) => (
            <button
              key={label}
              type="button"
              className={`nav-item ${active ? "nav-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                action();
                onClose();
              }}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
              {active && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <span className="sidebar-label sidebar-label-space">
          FOUR COURSES · TERM 1
        </span>
        <div className="sidebar-courses" aria-label="Choose a course">
          {courses.map((item) => {
            const Icon = item.subject === "Science" ? FlaskConical : BookOpen;
            return (
              <button
                key={item.id}
                className={`sidebar-course ${item.id === course.id ? "course-active" : ""}`}
                type="button"
                aria-current={item.id === course.id ? "true" : undefined}
                onClick={() => {
                  onCourse(item.id);
                  onClose();
                }}
              >
                <span className="course-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <strong>{item.subject}</strong>
                  <small>
                    {item.level} · {item.lessons.length} lessons
                  </small>
                </span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <span className="tip-icon">
            <Lightbulb size={18} />
          </span>
          <strong>Start with the big picture.</strong>
          <p>Follow the connections between lessons, not just their order.</p>
        </div>
        <button
          type="button"
          className="sidebar-about"
          onClick={() => {
            onAbout();
            onClose();
          }}
        >
          <HelpCircle size={18} /> About this preview <ArrowUpRight size={15} />
        </button>
        <div className="sidebar-foot">
          <span className="status-dot" /> Public preview · v0.2
        </div>
      </aside>
    </>
  );
}

function Header({
  route,
  onMenu,
  onSearch,
  search,
  searchOpen,
  setSearchOpen,
  onLesson,
  online,
  ready,
  onAbout,
}) {
  const matches = findPublicLessons(search);
  const course = getCourse(route.courseId);
  const current = getLesson(course.id, route.lessonNumber);
  return (
    <header className="topbar">
      <button
        className="menu-trigger"
        type="button"
        aria-label="Open menu"
        onClick={onMenu}
      >
        <Menu size={23} />
      </button>
      <div className="topbar-context">
        <span>LEARNING LIBRARY</span>
        <strong>
          {current
            ? `${courseLabel(course)} · Lesson ${current.number} · ${current.title}`
            : route.view === "about"
              ? "About this preview"
              : `${courseLabel(course)} · Term overview`}
        </strong>
      </div>
      <div className="topbar-actions">
        <div className="search-wrap">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search all 98 lessons"
            aria-label="Search all courses, lessons or indicator codes"
            value={search}
            onChange={(e) => {
              onSearch(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchOpen(false);
              if (e.key === "Enter" && matches[0]) {
                onLesson(
                  matches[0].course.id,
                  matches[0].lesson.number,
                  "overview",
                );
                onSearch("");
                setSearchOpen(false);
              }
            }}
          />
          <kbd>/</kbd>
          {searchOpen && search.trim() && (
            <div
              className="search-results"
              role="listbox"
              aria-label="Lesson search results"
            >
              {matches.length ? (
                matches.map(({ course: item, lesson }) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    key={lesson.id}
                    onClick={() => {
                      onLesson(item.id, lesson.number, "overview");
                      onSearch("");
                      setSearchOpen(false);
                    }}
                  >
                    <span className="search-result-num">
                      {String(lesson.number).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{lesson.title}</strong>
                      <small>
                        {courseLabel(item)} · Week {lesson.week} ·{" "}
                        {lesson.indicator.code || "Mapping under review"}
                      </small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))
              ) : (
                <p>No lessons found. Try an indicator code or topic.</p>
              )}
            </div>
          )}
        </div>
        <button
          className="connection-pill"
          type="button"
          onClick={onAbout}
          title="How offline access works"
        >
          {online ? (
            ready ? (
              <Download size={16} />
            ) : (
              <Wifi size={16} />
            )
          ) : (
            <WifiOff size={16} />
          )}
          <span>
            {!online ? "Offline" : ready ? "Offline ready" : "Online"}
          </span>
        </button>
        <span className="avatar" aria-label="Public visitor">
          <GraduationCap size={17} aria-hidden="true" />
        </span>
      </div>
    </header>
  );
}

function HeroGraphic({ topics }) {
  return (
    <div className="hero-graphic" aria-hidden="true">
      <div className="hero-ring ring-one" />
      <div className="hero-ring ring-two" />
      <div className="hero-line line-one" />
      <div className="hero-line line-two" />
      <div className="hero-line line-three" />
      <span className="orbit-node orbit-a">
        <Layers3 size={22} />
      </span>
      <span className="orbit-node orbit-b">
        <Sparkles size={21} />
      </span>
      <span className="orbit-node orbit-c">
        <Target size={20} />
      </span>
      <span className="orbit-node orbit-d">
        <BookOpen size={19} />
      </span>
      <div className="hero-center">
        <span>BIG IDEA</span>
        <strong>
          Every lesson
          <br />
          connects.
        </strong>
        <span className="hero-center-spark">✳</span>
      </div>
      <span className="hero-tag hero-tag-a">{topics[0]}</span>
      <span className="hero-tag hero-tag-b">{topics[1]}</span>
      <span className="hero-tag hero-tag-c">{topics[2]}</span>
    </div>
  );
}

function CoursePicker({ activeId, onCourse }) {
  return (
    <section className="course-picker" aria-labelledby="course-picker-heading">
      <div className="section-title">
        <div>
          <span className="eyebrow">CHOOSE A LEARNING PATH</span>
          <h2 id="course-picker-heading">
            Four courses, one connected library.
          </h2>
          <p>98 learner-safe lesson overviews across Basic 7 and Basic 8.</p>
        </div>
      </div>
      <div className="course-picker-grid">
        {courses.map((item) => {
          const Icon = item.subject === "Science" ? FlaskConical : BookOpen;
          return (
            <button
              key={item.id}
              type="button"
              className={`course-tile ${activeId === item.id ? "selected" : ""}`}
              aria-current={activeId === item.id ? "true" : undefined}
              onClick={() => onCourse(item.id)}
            >
              <span className="course-tile-icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span>
                <small>{item.level.toUpperCase()} · TERM 1</small>
                <strong>{item.subject}</strong>
                <em>
                  {item.lessons.length} lessons · {item.lessons.at(-1).week}{" "}
                  weeks
                </em>
              </span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HomeScreen({ course, week, setWeek, onCourse, onLesson, onAbout }) {
  const lessons = course.lessons;
  const shown = lessons.filter((lesson) => lesson.week === week);
  const unit = course.units.find((entry) => entry.id === shown[0]?.unitId);
  const unitNames = [
    ...new Set(
      shown.map(
        (lesson) =>
          course.units.find((entry) => entry.id === lesson.unitId)?.name,
      ),
    ),
  ].join(" + ");
  const weeks = lessons.at(-1).week;
  const featured = lessons.find((lesson) => lesson.widgetId)?.number || 1;
  return (
    <div className="page-stack home-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR CURRICULUM, MADE EXPLORABLE</span>
          <h1>
            Make the whole term <em>make sense.</em>
          </h1>
          <p>
            Move from the scheme of work to the idea behind every lesson. See
            what connects, try a model, and bring the questions to your
            classroom.
          </p>
        </div>
        <div className="welcome-meta">
          <span className="welcome-dot" /> PUBLIC LEARNING PREVIEW
        </div>
      </div>
      <CoursePicker activeId={course.id} onCourse={onCourse} />
      <section
        className={`hero-card hero-${course.subject.toLowerCase()}`}
        aria-label={`${courseLabel(course)} term introduction`}
      >
        <div className="hero-copy">
          <span className="hero-badge">
            <Sparkles size={15} /> THE CONNECTED TERM
          </span>
          <h2>
            One term.
            <br />
            <span>{lessons.length} ideas.</span>
            <br />A clearer way to learn.
          </h2>
          <p>
            Explore {courseLabel(course)} through curriculum-linked overviews,
            concept maps and hands-on models. The source packs remain under
            editorial review.
          </p>
          <div className="hero-actions">
            <button
              className="button button-lime"
              type="button"
              onClick={() => onLesson(course.id, 1, "overview")}
            >
              Start with Lesson 1 <ArrowRight size={18} />
            </button>
            <button
              className="hero-link"
              type="button"
              onClick={() => onLesson(course.id, featured, "map")}
            >
              See a concept map <ArrowUpRight size={17} />
            </button>
          </div>
        </div>
        <HeroGraphic topics={HERO_TOPICS[course.id]} />
        <div className="hero-bottom">
          <span>
            <span className="hero-bottom-dot" /> {course.subject.toUpperCase()}{" "}
            · {course.level.toUpperCase()} · TERM 1
          </span>
          <span>
            Built for curious minds in Ghana <span aria-hidden="true">↗</span>
          </span>
        </div>
      </section>
      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-icon stat-blue">
            <CalendarDays size={21} />
          </span>
          <div>
            <strong>
              {weeks} <small>weeks</small>
            </strong>
            <span>Teaching journey</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-green">
            <BookOpen size={21} />
          </span>
          <div>
            <strong>
              {lessons.length} <small>lessons</small>
            </strong>
            <span>Connected ideas</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-violet">
            <Network size={21} />
          </span>
          <div>
            <strong>
              {lessons.length} <small>maps</small>
            </strong>
            <span>A picture for every lesson</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-orange">
            <Layers3 size={21} />
          </span>
          <div>
            <strong>
              {course.units.length} <small>chapters</small>
            </strong>
            <span>One learning story</span>
          </div>
        </div>
      </div>
      <section
        className="scheme-section"
        id="scheme"
        aria-labelledby="scheme-heading"
      >
        <div className="section-title">
          <div>
            <span className="eyebrow">EXPLORE THE SCHEME</span>
            <h2 id="scheme-heading">Your term, week by week</h2>
            <p>
              Pick a week to see its lessons and the source-plan indicator
              (where verified).
            </p>
          </div>
          <span className="section-counter">
            {weeks} teaching weeks · 2 lessons each
          </span>
        </div>
        <div
          className="week-scroll"
          role="group"
          aria-label="Choose a teaching week"
        >
          {Array.from({ length: weeks }, (_, i) => i + 1).map((n) => (
            <button
              type="button"
              key={n}
              className={`week-button ${week === n ? "active" : ""}`}
              aria-pressed={week === n}
              onClick={() => setWeek(n)}
            >
              <small>WEEK</small>
              <strong>{String(n).padStart(2, "0")}</strong>
            </button>
          ))}
        </div>
        <div className="week-heading">
          <div>
            <span className="unit-mark">
              <UnitIcon id={unit?.id} subject={course.subject} size={18} />
            </span>
            <span>
              WEEK {String(week).padStart(2, "0")}{" "}
              <span className="week-divider">/</span> {unitNames}
            </span>
          </div>
          <span>Two 60-minute lessons</span>
        </div>
        <div className="lesson-grid">
          {shown.map((lesson) => (
            <LessonCard
              key={lesson.id}
              course={course}
              lesson={lesson}
              onLesson={onLesson}
            />
          ))}
        </div>
      </section>
      <section className="unit-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">THE THREADS OF THIS COURSE</span>
            <h2>Follow the learning path</h2>
          </div>
        </div>
        <div
          className={`unit-grid ${course.units.length > 6 ? "many-units" : ""}`}
        >
          {course.units.map((item, index) => {
            const first = lessons.find((lesson) => lesson.unitId === item.id);
            const count = lessons.filter(
              (lesson) => lesson.unitId === item.id,
            ).length;
            return (
              <button
                type="button"
                key={item.id}
                className={`unit-card unit-${item.colour}`}
                onClick={() => onLesson(course.id, first.number, "overview")}
              >
                <span className="unit-card-top">
                  <UnitIcon id={item.id} subject={course.subject} size={23} />
                  <span>
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(course.units.length).padStart(2, "0")}
                  </span>
                </span>
                <strong>{item.name}</strong>
                <small>
                  {count} connected {count === 1 ? "lesson" : "lessons"}{" "}
                  <ArrowUpRight size={14} />
                </small>
              </button>
            );
          })}
        </div>
      </section>
      <div className="preview-note">
        <ShieldCheck size={20} />
        <p>
          <strong>A learning preview, not a gradebook.</strong> This app has no
          accounts and stores no learner information. Source assessments,
          answers and staff-only notes are excluded.
        </p>
        <button type="button" onClick={onAbout}>
          Read more <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function LessonCard({ course, lesson, onLesson }) {
  const unit = course.units.find((entry) => entry.id === lesson.unitId);
  return (
    <article className="lesson-card">
      <div className="lesson-card-top">
        <span className={`unit-pill pill-${unit?.colour}`}>{unit?.name}</span>
        <span className="lesson-card-time">
          <Clock3 size={15} /> {lesson.durationMin} min
        </span>
      </div>
      <span className="lesson-number">
        LESSON {String(lesson.number).padStart(2, "0")}
      </span>
      <ReviewBanner lesson={lesson} compact />
      <h3>{lesson.title}</h3>
      <p>{lesson.learningGoal}</p>
      <div className="lesson-card-bottom">
        <span className="code-pill">
          <Target size={14} /> {lesson.indicator.code || "Mapping under review"}
        </span>
        <button
          type="button"
          aria-label={`Open ${courseLabel(course)} Lesson ${lesson.number}: ${lesson.title}`}
          onClick={() => onLesson(course.id, lesson.number, "overview")}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </article>
  );
}

function CurriculumRibbon({ lesson }) {
  return (
    <div className="curriculum-ribbon" aria-label="Curriculum alignment">
      <div>
        <span>STRAND</span>
        <strong>{lesson.strand}</strong>
      </div>
      <span className="ribbon-separator">
        <ChevronRight size={16} />
      </span>
      <div>
        <span>SUB-STRAND</span>
        <strong>{lesson.subStrand}</strong>
      </div>
      <span className="ribbon-separator">
        <ChevronRight size={16} />
      </span>
      <div>
        <span>CONTENT STANDARD</span>
        <strong>{lesson.contentStandard.code || "Mapping under review"}</strong>
      </div>
      <span className="ribbon-separator">
        <ChevronRight size={16} />
      </span>
      <div>
        <span>{lesson.review ? "PLAN INDICATOR · REVIEW" : "INDICATOR"}</span>
        <strong>{lesson.indicator.code || "Mapping under review"}</strong>
      </div>
    </div>
  );
}

function OverviewTab({ course, lesson, onLesson, onMap, onTeach }) {
  return (
    <div className="overview-grid">
      <div className="overview-main">
        <section className="content-card learning-goal">
          <div className="card-icon icon-lime">
            <Target size={22} />
          </div>
          <span className="eyebrow">THE LEARNING GOAL</span>
          <h2>{lesson.learningGoal}</h2>
          <div className="learning-goal-rule" />
          <span className="code-label">
            {lesson.indicator.code || "Indicator mapping under review"}
          </span>
          <p>{lesson.indicator.text}</p>
        </section>
        <section className="content-card standard-card">
          <span className="eyebrow">WHERE IT FITS IN THE CURRICULUM</span>
          <h3>
            Content standard{" "}
            <span>{lesson.contentStandard.code || "Under review"}</span>
          </h3>
          <p>{lesson.contentStandard.text}</p>
        </section>
        <section className="content-card phases-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">FIVE STEPS, ONE LESSON</span>
              <h3>The 5E journey</h3>
            </div>
            <span className="time-badge">
              <Clock3 size={16} /> {lesson.durationMin} min
            </span>
          </div>
          <div className="phase-list">
            {PHASE_INFO.map((phase, index) => (
              <div className="phase-row" key={phase.key}>
                <span className={`phase-circle phase-${phase.key}`}>
                  {index + 1}
                </span>
                <div>
                  <strong>{phase.label}</strong>
                  <span>{phase.prompt}</span>
                </div>
                <time>{lesson.phaseMinutes[phase.key]} min</time>
              </div>
            ))}
          </div>
          <button type="button" className="text-action" onClick={onTeach}>
            Open the presentation timer <ArrowRight size={16} />
          </button>
        </section>
        {lesson.widgetId ? (
          <InteractiveWidget key={lesson.widgetId} widgetId={lesson.widgetId} />
        ) : (
          <div className="content-card no-widget">
            <div className="card-icon icon-blue">
              <Network size={21} />
            </div>
            <div>
              <span className="eyebrow">MAKE THE CONNECTION</span>
              <h3>A map for this idea</h3>
              <p>
                Follow the indicator, earlier lessons and vocabulary on a map
                you can explore.
              </p>
              <button className="text-action" onClick={onMap} type="button">
                Explore this lesson’s map <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      <aside className="overview-side">
        <div className="side-card">
          <span className="eyebrow">WORDS THAT MATTER</span>
          <h3>Vocabulary</h3>
          <div className="vocab-list">
            {lesson.vocabulary.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
          <p>Look for these words as you work through the lesson.</p>
        </div>
        <div className="side-card prerequisite-card">
          <span className="eyebrow">THE CONNECTION BEFORE</span>
          <h3>Build on what you know</h3>
          {lesson.priorLessons.length ? (
            lesson.priorLessons.map((number) => {
              const previous = getLesson(course.id, number);
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => onLesson(course.id, number, "overview")}
                >
                  <span>L{String(number).padStart(2, "0")}</span>
                  <strong>{previous.title}</strong>
                  <ArrowRight size={16} />
                </button>
              );
            })
          ) : (
            <p>
              This topic starts a new thread. Begin with what you already know
              about {course.subject.toLowerCase()}.
            </p>
          )}
        </div>
        <div className="map-teaser">
          <div className="teaser-spark">
            <Network size={29} />
          </div>
          <span>SEE THE BIGGER PICTURE</span>
          <h3>Ideas make more sense together.</h3>
          <p>
            Open the interactive map and follow the path through this lesson.
          </p>
          <button type="button" onClick={onMap}>
            View concept map <ArrowRight size={17} />
          </button>
        </div>
        <div className="side-disclaimer">
          <ShieldCheck size={17} />
          <span>
            Overview only. Full lesson activities and assessment materials
            remain under review.
          </span>
        </div>
      </aside>
    </div>
  );
}

function LessonDetail({ course, lesson, view, onLesson, onHome }) {
  const [copied, setCopied] = useState(false);
  const changeView = (next) => onLesson(course.id, lesson.number, next);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="page-stack detail-page">
      <div className="breadcrumb">
        <button onClick={onHome} type="button">
          Term overview
        </button>
        <ChevronRight size={16} />
        <span>Week {lesson.week}</span>
        <ChevronRight size={16} />
        <strong>Lesson {lesson.number}</strong>
      </div>
      <div className="lesson-hero">
        <div>
          <span className="lesson-overline">
            {courseLabel(course).toUpperCase()} <span>·</span> WEEK{" "}
            {String(lesson.week).padStart(2, "0")} <span>·</span> LESSON{" "}
            {String(lesson.number).padStart(2, "0")}
          </span>
          <h1>{lesson.title}</h1>
          <p>
            Explore the idea, trace its connections, then bring it into the
            room.
          </p>
          <div className="lesson-meta">
            <span>
              <Clock3 size={17} /> {lesson.durationMin} minutes
            </span>
            <span>
              <Target size={17} />{" "}
              {lesson.indicator.code || "Mapping under review"}
            </span>
            <span>
              <UnitIcon id={lesson.unitId} subject={course.subject} size={17} />{" "}
              {course.units.find((u) => u.id === lesson.unitId)?.name}
            </span>
          </div>
        </div>
        <div className="detail-hero-art" aria-hidden="true">
          <span className="art-ring art-ring-a" />
          <span className="art-ring art-ring-b" />
          <span className="art-circle">
            <Network size={39} />
          </span>
          <span className="art-orb art-orb-a" />
          <span className="art-orb art-orb-b" />
        </div>
      </div>
      <ReviewBanner lesson={lesson} />
      <CurriculumRibbon lesson={lesson} />
      <div className="detail-tabs" role="tablist" aria-label="Lesson views">
        <button
          role="tab"
          aria-selected={view === "overview"}
          className={view === "overview" ? "active" : ""}
          type="button"
          onClick={() => changeView("overview")}
        >
          <BookOpen size={18} /> Overview
        </button>
        <button
          role="tab"
          aria-selected={view === "map"}
          className={view === "map" ? "active" : ""}
          type="button"
          onClick={() => changeView("map")}
        >
          <Network size={18} /> Concept map
        </button>
        <button
          role="tab"
          aria-selected={view === "teach"}
          className={view === "teach" ? "active" : ""}
          type="button"
          onClick={() => changeView("teach")}
        >
          <MonitorPlay size={18} /> Teach display
        </button>
        <div className="tab-actions">
          <button
            aria-label={copied ? "Link copied" : "Copy lesson link"}
            title="Copy link"
            type="button"
            onClick={copyLink}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        </div>
      </div>
      {view === "map" ? (
        <ConceptMap
          key={lesson.id}
          lesson={lesson}
          lessons={course.lessons}
          onOpenLesson={(number) => onLesson(course.id, number, "overview")}
          onOpenWidget={() => changeView("overview")}
        />
      ) : (
        <OverviewTab
          key={lesson.id}
          course={course}
          lesson={lesson}
          onLesson={onLesson}
          onMap={() => changeView("map")}
          onTeach={() => changeView("teach")}
        />
      )}
      <div className="lesson-pagination">
        {lesson.number > 1 ? (
          <button
            type="button"
            onClick={() => onLesson(course.id, lesson.number - 1, "overview")}
          >
            <ArrowLeft size={18} />
            <span>
              <small>PREVIOUS LESSON</small>
              <strong>{getLesson(course.id, lesson.number - 1).title}</strong>
            </span>
          </button>
        ) : (
          <span />
        )}
        {lesson.number < course.lessons.length ? (
          <button
            type="button"
            className="next-lesson"
            onClick={() => onLesson(course.id, lesson.number + 1, "overview")}
          >
            <span>
              <small>NEXT LESSON</small>
              <strong>{getLesson(course.id, lesson.number + 1).title}</strong>
            </span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function TeachDisplay({ course, lesson, onClose, onMap }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(
    lesson.phaseMinutes[PHASE_INFO[0].key] * 60,
  );
  const [running, setRunning] = useState(false);
  const current = PHASE_INFO[phaseIndex];
  useEffect(() => {
    setPhaseIndex(0);
    setRunning(false);
    setRemaining(lesson.phaseMinutes.engage * 60);
  }, [lesson.id]);
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(
      () => setRemaining((time) => Math.max(0, time - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const pickPhase = (index) => {
    setPhaseIndex(index);
    setRemaining(lesson.phaseMinutes[PHASE_INFO[index].key] * 60);
    setRunning(false);
  };
  const fullscreen = async () => {
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* Browser or embedded preview may not permit fullscreen; the display itself remains usable. */
    }
  };
  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <div
      className="teach-display"
      role="dialog"
      aria-modal="true"
      aria-label={`Teach display for ${courseLabel(course)} Lesson ${lesson.number}`}
    >
      <header className="teach-top">
        <div className="teach-brand">
          <span className="brand-icon">
            <Network size={20} />
          </span>
          <span>
            maplearn <small>/ TEACH DISPLAY</small>
          </span>
        </div>
        <div className="teach-top-actions">
          <span className="teach-privacy">
            <ShieldCheck size={15} /> Learner-safe display
          </span>
          <button
            type="button"
            onClick={fullscreen}
            aria-label="Toggle fullscreen"
          >
            <Maximize2 size={19} />
          </button>
          <button type="button" onClick={exit} aria-label="Exit teach display">
            <X size={23} />
          </button>
        </div>
      </header>
      <div className="teach-body">
        <div className="teach-lesson-heading">
          <span>
            {courseLabel(course).toUpperCase()} <span>·</span> WEEK{" "}
            {String(lesson.week).padStart(2, "0")} <span>·</span> LESSON{" "}
            {String(lesson.number).padStart(2, "0")}
          </span>
          <h1>{lesson.title}</h1>
          <p>
            {lesson.indicator.code || "Indicator mapping under review"}{" "}
            <span>·</span> {lesson.subStrand}
          </p>
        </div>
        <ReviewBanner lesson={lesson} />
        <div className="teach-center">
          <div className="teach-phase-overline">
            PHASE {String(phaseIndex + 1).padStart(2, "0")} / 05 <span>·</span>{" "}
            {lesson.phaseMinutes[current.key]} MINUTES
          </div>
          <div className="teach-phase-name">
            {current.label}
            <span className={`teach-phase-bloom bloom-${current.key}`}>✳</span>
          </div>
          <p>{current.prompt}</p>
          <div
            className="teach-timer"
            aria-live="off"
            aria-label={`${mm} minutes ${ss} seconds remaining`}
          >
            {mm}
            <span>:</span>
            {ss}
          </div>
          <div className="teach-controls">
            <button
              type="button"
              className="teach-play"
              onClick={() =>
                remaining === 0
                  ? (setRemaining(lesson.phaseMinutes[current.key] * 60),
                    setRunning(true))
                  : setRunning(!running)
              }
            >
              {running ? (
                <Pause size={21} fill="currentColor" />
              ) : (
                <Play size={21} fill="currentColor" />
              )}{" "}
              {running
                ? "Pause timer"
                : remaining === 0
                  ? "Restart phase"
                  : "Start timer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setRemaining(lesson.phaseMinutes[current.key] * 60);
              }}
            >
              <RotateCcw size={18} /> Reset
            </button>
            <button type="button" onClick={onMap}>
              <Network size={18} /> See map
            </button>
          </div>
        </div>
        <div className="teach-bottom">
          <div className="teach-steps">
            {PHASE_INFO.map((phase, index) => (
              <button
                type="button"
                key={phase.key}
                aria-current={phaseIndex === index ? "step" : undefined}
                className={phaseIndex === index ? "active" : ""}
                onClick={() => pickPhase(index)}
              >
                <span className="teach-step-dot">{index + 1}</span>
                <span>{phase.label}</span>
                <small>{lesson.phaseMinutes[phase.key]}m</small>
              </button>
            ))}
          </div>
          <div className="teach-navigation">
            <button
              type="button"
              disabled={phaseIndex === 0}
              onClick={() => pickPhase(phaseIndex - 1)}
            >
              <ChevronLeft size={19} /> Previous
            </button>
            <button
              type="button"
              disabled={phaseIndex === 4}
              onClick={() => pickPhase(phaseIndex + 1)}
            >
              Next phase <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </div>
      <div className="teach-footnote">
        Public preview: no private teaching notes, test questions, answer keys
        or learner data appear on this screen.
      </div>
    </div>
  );
}

function AboutScreen({ onHome }) {
  return (
    <div className="about-page">
      <button className="back-link" onClick={onHome} type="button">
        <ArrowLeft size={17} /> Back to course
      </button>
      <span className="eyebrow">ABOUT THIS PREVIEW</span>
      <h1>
        Built to make learning <em>connect.</em>
      </h1>
      <p className="about-lead">
        MapLearn is an early public preview of 98 Term 1 lesson overviews across
        Basic 7 and Basic 8 Mathematics and Science. Navigate a course, follow
        connections and explore independently curated models.
      </p>
      <div className="about-grid">
        <div className="content-card">
          <span className="card-icon icon-lime">
            <ShieldCheck size={22} />
          </span>
          <h2>Safe by design today</h2>
          <p>
            No sign-in, learner names, gradebook, source assessments, answer
            keys or staff-only notes are included. The ungraded inquiry activity
            saves no responses or personal learning data.
          </p>
        </div>
        <div className="content-card">
          <span className="card-icon icon-blue">
            <BookOpen size={22} />
          </span>
          <h2>Grounded in the curriculum</h2>
          <p>
            Public lesson-overview excerpts are attributed to the NaCCA
            Mathematics and Science Common Core Programmes (B7–B9, September
            2020) and the supplied Basic 7/8 Term 1 Mathematics and Science
            teaching guides. No full-pack redistribution is implied.
          </p>
        </div>
        <div className="content-card">
          <span className="card-icon icon-orange">
            <TriangleAlert size={22} />
          </span>
          <h2>Editorial review still open</h2>
          <p>
            B7 Science Lessons 10, 20 and 24 need indicator alignment review. B8
            Mathematics Week 12 follows the lesson plan’s graph sequence, while
            the corrected scheme lists angles. Review labels stay visible on
            those lessons.
          </p>
        </div>
        <div className="content-card">
          <span className="card-icon icon-violet">
            <Wifi size={22} />
          </span>
          <h2>Ready for a patchy connection</h2>
          <p>
            After a successful first visit to the built app, its shell and
            public overviews can open offline on supported devices. First
            installation needs a network connection.
          </p>
        </div>
      </div>
      <div className="about-warning">
        <HelpCircle size={21} />
        <p>
          <strong>What this is not yet:</strong> an official NaCCA product, a
          full lesson-note replacement, an assessment or grading tool, or a
          secure school data system. The raw-source audit still has known
          discrepancies; future school features need content sign-off,
          authentication and privacy testing.
        </p>
      </div>
    </div>
  );
}

function MobileNav({ route, onHome, onLesson }) {
  const current = route.lessonNumber || 1;
  return (
    <nav className="mobile-nav" aria-label="Quick navigation">
      <button
        type="button"
        className={route.view === "home" ? "active" : ""}
        onClick={onHome}
      >
        <Compass size={20} />
        <span>Home</span>
      </button>
      <button
        type="button"
        className={route.view === "overview" ? "active" : ""}
        onClick={() => onLesson(route.courseId, current, "overview")}
      >
        <BookOpen size={20} />
        <span>Lesson</span>
      </button>
      <button
        type="button"
        className={route.view === "map" ? "active" : ""}
        onClick={() => onLesson(route.courseId, current, "map")}
      >
        <Network size={20} />
        <span>Map</span>
      </button>
      <button
        type="button"
        className={route.view === "teach" ? "active" : ""}
        onClick={() => onLesson(route.courseId, current, "teach")}
      >
        <MonitorPlay size={20} />
        <span>Display</span>
      </button>
    </nav>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => readRoute(window.location.search));
  const [week, setWeek] = useState(
    getLesson(route.courseId, route.lessonNumber)?.week || 1,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateRef = useRef(null);
  useEffect(() => {
    const onPop = () => {
      const next = readRoute(window.location.search);
      setRoute(next);
      setWeek(getLesson(next.courseId, next.lessonNumber)?.week || 1);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("popstate", onPop);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.ready
        .then(() => setOfflineReady(true))
        .catch(() => {});
    updateRef.current = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    const onSearchKey = (event) => {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        event.preventDefault();
        document.querySelector(".search-wrap input")?.focus();
      }
    };
    window.addEventListener("keydown", onSearchKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("keydown", onSearchKey);
    };
  }, []);
  const navigate = (next, url) => {
    window.history.pushState({}, "", url);
    setRoute(next);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const goCourse = (courseId) => {
    if (!getCourse(courseId)) return;
    if (courseId !== route.courseId) setWeek(1);
    navigate(
      { courseId, lessonNumber: null, view: "home" },
      coursePath(courseId, BASE_PATH),
    );
  };
  const goHome = () => goCourse(route.courseId);
  const goAbout = () =>
    navigate(
      { courseId: route.courseId, lessonNumber: null, view: "about" },
      `${BASE_PATH}?${route.courseId === defaultCourseId ? "" : `course=${route.courseId}&`}about=1`,
    );
  const goLesson = (courseId, number, view = "overview") => {
    const target = getLesson(courseId, number);
    if (target) {
      setWeek(target.week);
      navigate(
        { courseId, lessonNumber: target.number, view },
        lessonPath(courseId, target.number, view, BASE_PATH),
      );
    }
  };
  const course = getCourse(route.courseId) || courses[0];
  const lesson = getLesson(course.id, route.lessonNumber);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar
        route={route}
        course={course}
        onCourse={goCourse}
        onHome={goHome}
        onLesson={goLesson}
        onAbout={goAbout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="app-content">
        <Header
          route={route}
          onMenu={() => setMenuOpen(true)}
          onSearch={setSearch}
          search={search}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          onLesson={goLesson}
          online={online}
          ready={offlineReady}
          onAbout={goAbout}
        />
        {searchOpen && search && (
          <button
            className="search-dismiss"
            type="button"
            aria-label="Close search results"
            onClick={() => setSearchOpen(false)}
          />
        )}
        <main id="main-content" className="main-content">
          {route.view === "about" ? (
            <AboutScreen onHome={goHome} />
          ) : lesson ? (
            <LessonDetail
              course={course}
              lesson={lesson}
              view={route.view}
              onLesson={goLesson}
              onHome={goHome}
            />
          ) : (
            <HomeScreen
              course={course}
              week={week}
              setWeek={setWeek}
              onCourse={goCourse}
              onLesson={goLesson}
              onAbout={goAbout}
            />
          )}
          <footer className="site-footer">
            <span>
              © MapLearn preview · Curriculum attribution: NaCCA Mathematics and
              Science CCP, September 2020.
            </span>
            <span>
              No learner data collected <ShieldCheck size={15} />
            </span>
          </footer>
        </main>
        <MobileNav route={route} onHome={goHome} onLesson={goLesson} />
      </div>
      {lesson && route.view === "teach" && (
        <TeachDisplay
          key={lesson.id}
          course={course}
          lesson={lesson}
          onClose={() => goLesson(course.id, lesson.number, "overview")}
          onMap={() => goLesson(course.id, lesson.number, "map")}
        />
      )}
      {updateAvailable && route.view !== "teach" && (
        <div className="update-prompt" role="status">
          <Sparkles size={18} />
          <span>A newer version is ready.</span>
          <button type="button" onClick={() => updateRef.current?.(true)}>
            Refresh now
          </button>
          <button
            type="button"
            aria-label="Dismiss update"
            onClick={() => setUpdateAvailable(false)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
