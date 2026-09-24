import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
} from "@xyflow/react";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CircleHelp,
  Lightbulb,
  List,
  Maximize2,
  Network,
  Target,
  X,
} from "lucide-react";

const TYPES = {
  indicator: {
    icon: Target,
    label: "Indicator",
    relation: "This lesson explores",
  },
  concept: { icon: Lightbulb, label: "Key word", relation: "A word to know" },
  prerequisite: {
    icon: BookOpen,
    label: "Earlier lesson",
    relation: "Builds on",
  },
  model: { icon: Boxes, label: "Interactive model", relation: "Explore with" },
  goal: { icon: CircleHelp, label: "Learning goal", relation: "Aim for" },
  next: { icon: ArrowRight, label: "Up next", relation: "Leads to" },
};

function shortLabel(label, max = 5) {
  const words = label.split(/\s+/);
  return words.length > max ? `${words.slice(0, max).join(" ")}…` : label;
}

function buildDiagram(lesson, lessons) {
  const byNumber = new Map(lessons.map((item) => [item.number, item]));
  const nodes = [];
  const edges = [];
  const add = (id, kind, label, detail, x, y, extra = {}) => {
    nodes.push({
      id,
      type: "mapCard",
      position: { x, y },
      data: { id, kind, label, detail, ...extra },
    });
  };
  const connect = (id, source, target, kind = "default") => {
    edges.push({
      id,
      source,
      target,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: {
        stroke: kind === "prior" ? "#90a6b4" : "#a9b7c3",
        strokeWidth: 1.6,
      },
    });
  };
  add("root", "indicator", lesson.title, lesson.indicator.text, 390, 220, {
    code: lesson.indicator.code || "Mapping under review",
  });
  const prior = lesson.priorLessons.slice(-3);
  if (prior.length) {
    prior.forEach((number, index) => {
      const previous = byNumber.get(number);
      const id = `prior-${number}`;
      add(
        id,
        "prerequisite",
        `Lesson ${number}: ${shortLabel(previous.title, 3)}`,
        `This lesson builds on Lesson ${number}: ${previous.title}.`,
        20,
        60 + index * 134,
        { linkLesson: number },
      );
      connect(`e-${id}`, id, "root", "prior");
    });
  } else {
    add(
      "prior-general",
      "prerequisite",
      "What you already know",
      `Start with what you already know about ${lesson.strand.toLowerCase()}.`,
      20,
      184,
    );
    connect("e-prior-general", "prior-general", "root", "prior");
  }
  add(
    "goal",
    "goal",
    "What you will be able to do",
    lesson.learningGoal,
    390,
    0,
  );
  connect("e-goal", "root", "goal");
  lesson.vocabulary.slice(0, 5).forEach((word, index) => {
    const id = `word-${index}`;
    add(
      id,
      "concept",
      word,
      `“${word}” is a key term in this lesson. Use it to explain the idea in your own words.`,
      770,
      index * 104 - 50,
    );
    connect(`e-${id}`, "root", id);
  });
  if (lesson.widgetId) {
    add(
      "model",
      "model",
      "Try the interactive model",
      `Explore the ${lesson.title.toLowerCase()} model. Change one thing at a time and notice what stays the same.`,
      375,
      425,
      { widgetId: lesson.widgetId },
    );
    connect("e-model", "root", "model");
  }
  if (lesson.number < lessons.length) {
    const next = byNumber.get(lesson.number + 1);
    add(
      "next",
      "next",
      `Lesson ${next.number}: ${shortLabel(next.title, 3)}`,
      `Continue with ${next.title}.`,
      780,
      514,
      { linkLesson: next.number },
    );
    connect("e-next", "root", "next");
  }
  return { nodes, edges };
}

function MapCard({ data, selected }) {
  const InfoIcon = TYPES[data.kind].icon;
  return (
    <div
      className={`map-card map-card-${data.kind} ${selected ? "map-card-selected" : ""}`}
      role="group"
      aria-label={`${TYPES[data.kind].label}: ${data.label}`}
    >
      <Handle type="target" position={Position.Left} className="map-handle" />
      <span className="map-card-icon">
        <InfoIcon size={17} aria-hidden="true" />
      </span>
      <span className="map-card-copy">
        <small>{data.code || TYPES[data.kind].label}</small>
        <strong>
          {shortLabel(data.label, data.kind === "indicator" ? 7 : 5)}
        </strong>
      </span>
      <Handle type="source" position={Position.Right} className="map-handle" />
    </div>
  );
}

const nodeTypes = { mapCard: MapCard };

export function ConceptMap({ lesson, lessons, onOpenLesson, onOpenWidget }) {
  const diagram = useMemo(
    () => buildDiagram(lesson, lessons),
    [lesson, lessons],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(diagram.nodes);
  const [selected, setSelected] = useState(diagram.nodes[0].data);
  const [outline, setOutline] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 700px)").matches,
  );
  useEffect(() => {
    setNodes(diagram.nodes);
    setSelected(diagram.nodes[0].data);
  }, [diagram, setNodes]);
  const SelectedIcon = TYPES[selected.kind].icon;
  return (
    <section className="map-section" aria-labelledby="map-heading">
      <div className="section-title map-section-title">
        <div>
          <span className="eyebrow">THE CONNECTED LESSON</span>
          <h2 id="map-heading">Concept map</h2>
          <p>
            Start at the indicator. Follow what comes before it, the words it
            uses, and where it leads.
          </p>
        </div>
        <div className="view-toggle" role="group" aria-label="Concept map view">
          <button
            type="button"
            className={!outline ? "active" : ""}
            aria-pressed={!outline}
            onClick={() => setOutline(false)}
          >
            <Network size={16} /> Map
          </button>
          <button
            type="button"
            className={outline ? "active" : ""}
            aria-pressed={outline}
            onClick={() => setOutline(true)}
          >
            <List size={16} /> Outline
          </button>
        </div>
      </div>
      <div className={`map-workspace ${outline ? "map-outline-mode" : ""}`}>
        <div className="map-canvas">
          {outline ? (
            <div
              className="map-outline"
              role="list"
              aria-label="Accessible concept map outline"
            >
              {diagram.nodes.map((node) => {
                const Icon = TYPES[node.data.kind].icon;
                return (
                  <button
                    type="button"
                    role="listitem"
                    className={`outline-row ${selected.id === node.id ? "selected" : ""}`}
                    key={node.id}
                    onClick={() => setSelected(node.data)}
                  >
                    <span className={`outline-icon outline-${node.data.kind}`}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span>
                      <small>{TYPES[node.data.kind].relation}</small>
                      <strong>{node.data.label}</strong>
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          ) : (
            <ReactFlow
              key={lesson.id}
              nodes={nodes}
              edges={diagram.edges}
              onNodesChange={onNodesChange}
              onNodeClick={(_, node) => setSelected(node.data)}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.35}
              maxZoom={1.8}
              nodesConnectable={false}
              elementsSelectable
              panOnScroll
              zoomOnPinch
              attributionPosition="bottom-left"
              aria-label={`Interactive concept map for ${lesson.title}`}
            >
              <Background color="#d9e1e6" gap={22} size={1.5} />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>
        <aside
          className="map-detail"
          aria-live="polite"
          aria-label="Selected concept detail"
        >
          <div className="map-detail-top">
            <span className={`outline-icon outline-${selected.kind}`}>
              <SelectedIcon size={20} />
            </span>
            <span className="eyebrow">{TYPES[selected.kind].label}</span>
          </div>
          <h3>{selected.label}</h3>
          <p>{selected.detail}</p>
          {selected.linkLesson && (
            <button
              className="text-action"
              type="button"
              onClick={() => onOpenLesson(selected.linkLesson)}
            >
              Open Lesson {selected.linkLesson} <ArrowRight size={16} />
            </button>
          )}
          {selected.widgetId && (
            <button
              className="text-action"
              type="button"
              onClick={onOpenWidget}
            >
              Try the model <ArrowRight size={16} />
            </button>
          )}
          <div className="map-detail-foot">
            Tip:{" "}
            {outline
              ? "Choose another row to follow the idea."
              : "Drag to move around. Scroll or pinch to zoom."}
          </div>
        </aside>
      </div>
      <p className="map-source-note">
        <BookOpen size={15} /> Seeded from this course’s public lesson overview.
        {lesson.review ? " This source mapping needs editorial review." : ""} No
        source assessments, teacher-only notes or marking keys are included.
      </p>
    </section>
  );
}
