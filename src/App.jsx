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
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import catalog from "./data/public-catalog.json";
import { ConceptMap } from "./components/ConceptMap";
import { InteractiveWidget } from "./components/Widgets";

const LESSONS = catalog.lessons;
const BASE_PATH = import.meta.env.BASE_URL;
const lessonByNumber = (number) =>
  LESSONS.find((lesson) => lesson.number === Number(number));
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

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  const lesson = lessonByNumber(params.get("lesson"));
  if (!lesson && params.has("about"))
    return { lessonNumber: null, view: "about" };
  return {
    lessonNumber: lesson?.number ?? null,
    view: lesson
      ? ["overview", "map", "teach"].includes(params.get("view"))
        ? params.get("view")
        : "overview"
      : "home",
  };
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

function UnitIcon({ id, size = 20 }) {
  const Icon =
    {
      numeration: Layers3,
      operations: Compass,
      powers: Sparkles,
      fractions: Target,
    }[id] || BookOpen;
  return <Icon size={size} aria-hidden="true" />;
}

function Sidebar({ route, onHome, onLesson, onAbout, open, onClose }) {
  const current = lessonByNumber(route.lessonNumber) || LESSONS[13];
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
      action: () => onLesson(current.number, "map"),
      active: route.view === "map",
    },
    {
      label: "Teach display",
      icon: MonitorPlay,
      action: () => onLesson(current.number, "teach"),
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
        <span className="sidebar-label sidebar-label-space">THIS TERM</span>
        <button
          className="sidebar-course"
          type="button"
          onClick={() => {
            onHome();
            onClose();
          }}
        >
          <span className="course-icon">
            <BookOpen size={20} />
          </span>
          <span>
            <strong>Mathematics</strong>
            <small>Basic 7 · Term 1</small>
          </span>
          <ChevronRight size={16} />
        </button>
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
          <span className="status-dot" /> Public preview · v0.1
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
  const matches = search.trim()
    ? LESSONS.filter((lesson) =>
        `${lesson.title} ${lesson.indicator.code} ${lesson.vocabulary.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ).slice(0, 5)
    : [];
  const current = lessonByNumber(route.lessonNumber);
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
            ? `Lesson ${current.number} · ${current.title}`
            : route.view === "about"
              ? "About this preview"
              : "Term overview"}
        </strong>
      </div>
      <div className="topbar-actions">
        <div className="search-wrap">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search lessons or codes"
            aria-label="Search lessons or indicator codes"
            value={search}
            onChange={(e) => {
              onSearch(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchOpen(false);
              if (e.key === "Enter" && matches[0]) {
                onLesson(matches[0].number, "overview");
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
                matches.map((lesson) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    key={lesson.id}
                    onClick={() => {
                      onLesson(lesson.number, "overview");
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
                        {lesson.indicator.code} · Week {lesson.week}
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

function HeroGraphic() {
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
      <span className="hero-tag hero-tag-a">Powers</span>
      <span className="hero-tag hero-tag-b">Number</span>
      <span className="hero-tag hero-tag-c">Fractions</span>
    </div>
  );
}

function HomeScreen({ week, setWeek, onLesson, onAbout }) {
  const shown = LESSONS.filter((lesson) => lesson.week === week);
  const unit = catalog.units.find((entry) => entry.id === shown[0]?.unitId);
  const unitNames = [
    ...new Set(
      shown.map(
        (lesson) =>
          catalog.units.find((entry) => entry.id === lesson.unitId)?.name,
      ),
    ),
  ].join(" + ");
  return (
    <div className="page-stack home-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR CURRICULUM, MADE EXPLOREABLE</span>
          <h1>
            Make the whole term <em>make sense.</em>
          </h1>
          <p>
            Move from the scheme of work to the idea behind every lesson. See
            what connects, try a model, and take it to the classroom.
          </p>
        </div>
        <div className="welcome-meta">
          <span className="welcome-dot" /> PUBLIC LEARNING PREVIEW
        </div>
      </div>
      <section
        className="hero-card"
        aria-label="Basic 7 Mathematics term introduction"
      >
        <div className="hero-copy">
          <span className="hero-badge">
            <Sparkles size={15} /> THE CONNECTED TERM
          </span>
          <h2>
            One term.
            <br />
            <span>Twenty-four ideas.</span>
            <br />A clearer way to learn.
          </h2>
          <p>
            Explore Basic 7 Mathematics through the NaCCA curriculum spine,
            linked concept maps and hands-on models.
          </p>
          <div className="hero-actions">
            <button
              className="button button-lime"
              type="button"
              onClick={() => onLesson(1, "overview")}
            >
              Start with Lesson 1 <ArrowRight size={18} />
            </button>
            <button
              className="hero-link"
              type="button"
              onClick={() => onLesson(14, "map")}
            >
              See a concept map <ArrowUpRight size={17} />
            </button>
          </div>
        </div>
        <HeroGraphic />
        <div className="hero-bottom">
          <span>
            <span className="hero-bottom-dot" /> MATHS · BASIC 7 · TERM 1
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
              12 <small>weeks</small>
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
              24 <small>lessons</small>
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
              24 <small>maps</small>
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
              4 <small>units</small>
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
              Pick a week to see the lessons and the exact indicator each one
              teaches.
            </p>
          </div>
          <span className="section-counter">
            12 teaching weeks · 2 lessons each
          </span>
        </div>
        <div
          className="week-scroll"
          role="group"
          aria-label="Choose a teaching week"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
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
              <UnitIcon id={unit?.id} size={18} />
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
            <LessonCard key={lesson.id} lesson={lesson} onLesson={onLesson} />
          ))}
        </div>
      </section>
      <section className="unit-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">FOUR PARTS OF ONE STORY</span>
            <h2>From numbers to new possibilities</h2>
          </div>
        </div>
        <div className="unit-grid">
          {catalog.units.map((item, index) => {
            const first = LESSONS.find((lesson) => lesson.unitId === item.id);
            const count = LESSONS.filter(
              (lesson) => lesson.unitId === item.id,
            ).length;
            return (
              <button
                type="button"
                key={item.id}
                className={`unit-card unit-${item.colour}`}
                onClick={() => onLesson(first.number, "overview")}
              >
                <span className="unit-card-top">
                  <UnitIcon id={item.id} size={23} />
                  <span>0{index + 1} / 04</span>
                </span>
                <strong>{item.name}</strong>
                <small>
                  {count} connected lessons <ArrowUpRight size={14} />
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
          accounts and stores no learner information. Tests, answer keys and
          staff-only notes are deliberately excluded.
        </p>
        <button type="button" onClick={onAbout}>
          Read more <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function LessonCard({ lesson, onLesson }) {
  const unit = catalog.units.find((entry) => entry.id === lesson.unitId);
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
      <h3>{lesson.title}</h3>
      <p>{lesson.learningGoal}</p>
      <div className="lesson-card-bottom">
        <span className="code-pill">
          <Target size={14} /> {lesson.indicator.code}
        </span>
        <button
          type="button"
          aria-label={`Open Lesson ${lesson.number}: ${lesson.title}`}
          onClick={() => onLesson(lesson.number, "overview")}
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
        <strong>{lesson.contentStandard.code}</strong>
      </div>
      <span className="ribbon-separator">
        <ChevronRight size={16} />
      </span>
      <div>
        <span>INDICATOR</span>
        <strong>{lesson.indicator.code}</strong>
      </div>
    </div>
  );
}

function OverviewTab({ lesson, onLesson, onMap, onTeach }) {
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
          <span className="code-label">{lesson.indicator.code}</span>
          <p>{lesson.indicator.text}</p>
        </section>
        <section className="content-card standard-card">
          <span className="eyebrow">WHERE IT FITS IN THE CURRICULUM</span>
          <h3>
            Content standard <span>{lesson.contentStandard.code}</span>
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
              const previous = lessonByNumber(number);
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => onLesson(number, "overview")}
                >
                  <span>L{String(number).padStart(2, "0")}</span>
                  <strong>{previous.title}</strong>
                  <ArrowRight size={16} />
                </button>
              );
            })
          ) : (
            <p>
              This is the first lesson in the term. Start with what you already
              know about numbers.
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

function LessonDetail({ lesson, view, onLesson, onHome, onView }) {
  const [copied, setCopied] = useState(false);
  const changeView = (next) => onView(lesson.number, next);
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
            BASIC 7 MATHEMATICS <span>·</span> WEEK{" "}
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
              <Target size={17} /> {lesson.indicator.code}
            </span>
            <span>
              <UnitIcon id={lesson.unitId} size={17} />{" "}
              {catalog.units.find((u) => u.id === lesson.unitId)?.name}
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
          onOpenLesson={(number) => onLesson(number, "overview")}
          onOpenWidget={() => changeView("overview")}
        />
      ) : (
        <OverviewTab
          key={lesson.id}
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
            onClick={() => onLesson(lesson.number - 1, "overview")}
          >
            <ArrowLeft size={18} />
            <span>
              <small>PREVIOUS LESSON</small>
              <strong>{lessonByNumber(lesson.number - 1).title}</strong>
            </span>
          </button>
        ) : (
          <span />
        )}
        {lesson.number < 24 ? (
          <button
            type="button"
            className="next-lesson"
            onClick={() => onLesson(lesson.number + 1, "overview")}
          >
            <span>
              <small>NEXT LESSON</small>
              <strong>{lessonByNumber(lesson.number + 1).title}</strong>
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

function TeachDisplay({ lesson, onClose, onMap }) {
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
      aria-label={`Teach display for Lesson ${lesson.number}`}
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
            WEEK {String(lesson.week).padStart(2, "0")} <span>·</span> LESSON{" "}
            {String(lesson.number).padStart(2, "0")}
          </span>
          <h1>{lesson.title}</h1>
          <p>
            {lesson.indicator.code} <span>·</span> {lesson.subStrand}
          </p>
        </div>
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
        <ArrowLeft size={17} /> Back to term
      </button>
      <span className="eyebrow">ABOUT THIS PREVIEW</span>
      <h1>
        Built to make learning <em>connect.</em>
      </h1>
      <p className="about-lead">
        MapLearn is an early, public teaching-and-learning preview for Basic 7
        Mathematics. It helps you navigate a term, see how an idea relates to
        earlier lessons, and try a few interactive models.
      </p>
      <div className="about-grid">
        <div className="content-card">
          <span className="card-icon icon-lime">
            <ShieldCheck size={22} />
          </span>
          <h2>Safe by design today</h2>
          <p>
            No sign-in, learner names, gradebook, exam papers, answer keys or
            staff-only notes are included. This preview collects no personal
            learning data.
          </p>
        </div>
        <div className="content-card">
          <span className="card-icon icon-blue">
            <BookOpen size={22} />
          </span>
          <h2>Grounded in the curriculum</h2>
          <p>
            Lesson headings, learning indicators and vocabulary are attributed
            to the NaCCA Mathematics Common Core Programme (B7–B9, September
            2020) and the supplied Basic 7 Mathematics Term 1 teaching guide.
          </p>
        </div>
        <div className="content-card">
          <span className="card-icon icon-violet">
            <Wifi size={22} />
          </span>
          <h2>Ready for a patchy connection</h2>
          <p>
            Install this web app on a supported device. After the first
            successful visit to the built app, its shell and public lesson
            overviews can open offline. First installation needs a network.
          </p>
        </div>
      </div>
      <div className="about-warning">
        <HelpCircle size={21} />
        <p>
          <strong>What this is not yet:</strong> an official NaCCA product, a
          full lesson-note replacement, an assessment or grading tool, or a
          secure school data system. Those features need content sign-off,
          authentication and testing.
        </p>
      </div>
    </div>
  );
}

function MobileNav({ route, onHome, onLesson }) {
  const current = route.lessonNumber || 14;
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
        onClick={() => onLesson(current, "overview")}
      >
        <BookOpen size={20} />
        <span>Lesson</span>
      </button>
      <button
        type="button"
        className={route.view === "map" ? "active" : ""}
        onClick={() => onLesson(current, "map")}
      >
        <Network size={20} />
        <span>Map</span>
      </button>
      <button
        type="button"
        className={route.view === "teach" ? "active" : ""}
        onClick={() => onLesson(current, "teach")}
      >
        <MonitorPlay size={20} />
        <span>Display</span>
      </button>
    </nav>
  );
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [week, setWeek] = useState(
    route.lessonNumber ? lessonByNumber(route.lessonNumber).week : 1,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateRef = useRef(null);
  useEffect(() => {
    const onPop = () => setRoute(readRoute());
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
  const goHome = () =>
    navigate({ lessonNumber: null, view: "home" }, BASE_PATH);
  const goAbout = () =>
    navigate({ lessonNumber: null, view: "about" }, `${BASE_PATH}?about=1`);
  const goLesson = (number, view = "overview") => {
    const target = lessonByNumber(number);
    if (target) {
      setWeek(target.week);
      navigate(
        { lessonNumber: target.number, view },
        `${BASE_PATH}?lesson=${target.number}&view=${view}`,
      );
    }
  };
  const lesson = lessonByNumber(route.lessonNumber);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar
        route={route}
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
              lesson={lesson}
              view={route.view}
              onLesson={goLesson}
              onHome={goHome}
              onView={goLesson}
            />
          ) : (
            <HomeScreen
              week={week}
              setWeek={setWeek}
              onLesson={goLesson}
              onAbout={goAbout}
            />
          )}
          <footer className="site-footer">
            <span>
              © MapLearn preview · Curriculum attribution: NaCCA Mathematics
              CCP, Sept 2020.
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
          lesson={lesson}
          onClose={() => goLesson(lesson.number, "overview")}
          onMap={() => goLesson(lesson.number, "map")}
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
