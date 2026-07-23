/////////// Decision Support System — Forethought
/////////// All logic: tree generation, rendering, time simulation, history

"use strict";

/////////// ─── CONSTANTS ───────────────────────────────────────────────────

const NODE_W = 210;
const NODE_H = 90;
const LEVEL_H = 190;
const SIBLING_GAP = 270;

const TIMEFRAMES = ["week1", "month1", "month3", "month6"];
const TIMEFRAME_LABELS = {
  week1: "1 week",
  month1: "1 month",
  month3: "3 months",
  month6: "6 months",
};

const STORAGE_KEY = "forethought_history";

/////////// ─── STATE ────────────────────────────────────────────────────────

const state = {
  currentTree: null,
  timeFrame: "week1",
  pan: { x: 0, y: 80 },
  zoom: 1,
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  expandedNodes: new Set(),
  activePath: new Set(),
  history: [],
};

/////////// ─── UTILITY ──────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/////////// ─── TREE GENERATOR ENGINE ────────────────────────────────────────
// Rule-based system that detects decision domain from keywords
// and produces meaningful, time-sensitive branching outcomes.

const DOMAINS = {
  CAREER: [
    "job",
    "career",
    "work",
    "freelance",
    "business",
    "startup",
    "boss",
    "promotion",
    "salary",
    "quit",
    "resign",
    "hire",
    "client",
    "office",
  ],
  RELATIONSHIP: [
    "partner",
    "marry",
    "break up",
    "move in",
    "friend",
    "dating",
    "relationship",
    "divorce",
    "propose",
    "date",
  ],
  FINANCE: [
    "invest",
    "buy",
    "sell",
    "house",
    "car",
    "loan",
    "debt",
    "money",
    "crypto",
    "stock",
    "saving",
    "budget",
    "spend",
    "afford",
  ],
  LOCATION: [
    "move",
    "city",
    "country",
    "relocate",
    "apartment",
    "rent",
    "neighborhood",
    "abroad",
    "remote",
  ],
  EDUCATION: [
    "study",
    "degree",
    "school",
    "university",
    "course",
    "learn",
    "bootcamp",
    "phd",
    "masters",
    "graduate",
  ],
  LIFESTYLE: [
    "diet",
    "workout",
    "gym",
    "hobby",
    "travel",
    "vacation",
    "cook",
    "routine",
    "sleep",
    "health",
    "exercise",
  ],
};

function detectDomain(text) {
  const t = text.toLowerCase();
  for (const [domain, kws] of Object.entries(DOMAINS)) {
    if (kws.some((kw) => t.includes(kw))) return domain;
  }
  return "GENERAL";
}

/////////// Generates a probability value that drifts realistically across timeframes
function makeProbs(base, variance) {
  const probs = {};
  let current = base;
  TIMEFRAMES.forEach((tf, i) => {
    current = current + (Math.random() * variance * 2 - variance);
    if (i > 0) current += (Math.random() > 0.5 ? 1.5 : -1.5) * i;
    // Clamp AFTER all adjustments to keep values in [0, 100]
    probs[tf] = Math.round(clamp(current, 0, 100));
  });
  return probs;
}

function makeNode(label, descs, baseProb, impact, children = []) {
  return {
    id: uid(),
    label,
    description: {
      week1: descs[0] ?? descs[descs.length - 1],
      month1: descs[1] ?? descs[descs.length - 1],
      month3: descs[2] ?? descs[descs.length - 1],
      month6: descs[3] ?? descs[descs.length - 1],
    },
    probability: makeProbs(baseProb, 10),
    impact,
    children,
  };
}

/////////// Domain-specific branch templates
function buildCareerTree() {
  return {
    branches: [
      makeNode(
        "Take the leap",
        [
          "High stress, high excitement — routine is disrupted",
          "Adjustment period; navigating new responsibilities",
          "Building momentum and expanding your network",
          "Career trajectory has measurably shifted",
        ],
        45,
        "high",
        [
          makeNode(
            "Rapid growth",
            [
              "Steep learning curve but early wins appear",
              "Recognition building within new environment",
              "Compound progress — each win enables the next",
              "Established as a trusted contributor",
            ],
            60,
            "high",
          ),
          makeNode(
            "Struggle and pivot",
            [
              "Unexpected blockers slow progress",
              "Strategy needs reassessment",
              "Finding a more realistic niche",
              "Stable but on a different path than planned",
            ],
            40,
            "medium",
          ),
        ],
      ),
      makeNode(
        "Stay the course",
        [
          "Familiar routine continues — secure but unchanged",
          "Slight restlessness, but stability maintained",
          "Side interests start filling the gap",
          "Expertise deepens within current lane",
        ],
        75,
        "low",
        [
          makeNode(
            "Steady advancement",
            [
              "Consistent, reliable performance",
              "Modest salary increase or title bump",
              "Reputation for dependability grows",
              "Predictable, comfortable trajectory",
            ],
            80,
            "low",
          ),
          makeNode(
            "Gradual stagnation",
            [
              "Feeling of being under-utilised",
              "Skills slowly falling behind the market",
              "Frustration becomes harder to ignore",
              "External pressure eventually forces change",
            ],
            20,
            "medium",
          ),
        ],
      ),
    ],
    insights: {
      week1: [
        {
          id: uid(),
          title: "High immediate friction",
          desc: "Any leap creates short-term disruption. Prepare for a chaotic first week — that is expected, not a warning sign.",
        },
      ],
      month1: [
        {
          id: uid(),
          title: "Adjustment settling in",
          desc: "The new normal is forming. Uncertainty remains high but the initial shock fades. Look for early signals, not final verdicts.",
        },
      ],
      month3: [
        {
          id: uid(),
          title: "Trajectory becomes readable",
          desc: "Three months in, early indicators of success or struggle become reliable. This is when honest assessment is most useful.",
        },
      ],
      month6: [
        {
          id: uid(),
          title: "Compounding returns appear",
          desc: "The risk profile drops significantly as new skills and relationships solidify. The hardest part is now behind you.",
        },
      ],
    },
    recommendation:
      "Staying put is safer short-term, but stagnation carries its own long-term risk. The leap is uncomfortable precisely because it matters.",
  };
}

function buildRelationshipTree() {
  return {
    branches: [
      makeNode(
        "Take the step",
        [
          "Vulnerability is high — nerves are normal",
          "Finding a new rhythm and dynamic together",
          "Deeper mutual understanding developing",
          "The relationship has entered a new chapter",
        ],
        55,
        "high",
        [
          makeNode(
            "Stronger bond",
            [
              "Initial awkwardness fades quickly",
              "Trust deepens; shared goals emerge",
              "Communication becomes more fluent",
              "Foundation is solid — built through honesty",
            ],
            65,
            "high",
          ),
          makeNode(
            "Friction surfaces",
            [
              "Differences that were invisible become visible",
              "Communication is tested under pressure",
              "Working through conflict together",
              "The relationship is defined by how this is handled",
            ],
            35,
            "medium",
          ),
        ],
      ),
      makeNode(
        "Hold back for now",
        [
          "Comfortable but unresolved tension lingers",
          "One side may begin to pull back quietly",
          "Ambiguity erodes the current dynamic",
          "A natural decision point arrives anyway",
        ],
        70,
        "low",
        [
          makeNode(
            "Gradual drift",
            [
              "Less frequent connection",
              "Emotional distance grows unnoticed",
              "Relationship loses momentum",
              "Quiet ending, or a forced reset",
            ],
            40,
            "medium",
          ),
          makeNode(
            "Stable equilibrium",
            [
              "Routine feels safe and manageable",
              "Low conflict but also low growth",
              "Comfortable, but not progressing",
              "Both parties accept it as it is",
            ],
            60,
            "low",
          ),
        ],
      ),
    ],
    insights: {
      week1: [
        {
          id: uid(),
          title: "Vulnerability is the point",
          desc: "Taking action in a relationship context involves real exposure. That discomfort is not a signal to stop — it is the signal that it matters.",
        },
      ],
      month1: [
        {
          id: uid(),
          title: "Patterns form early",
          desc: "Communication habits established in the first month tend to persist. Pay attention to what becomes normal.",
        },
      ],
      month3: [
        {
          id: uid(),
          title: "Clarity arrives",
          desc: "By month three you will have a clear read on whether this direction was right. Trust what you observe, not what you hoped.",
        },
      ],
      month6: [
        {
          id: uid(),
          title: "New baseline set",
          desc: "Whatever choice was made now defines the new normal for this relationship. Change after this point takes deliberate effort.",
        },
      ],
    },
    recommendation:
      "Ambiguity in relationships rarely resolves itself. Honest action, even imperfect, almost always costs less than prolonged uncertainty.",
  };
}

function buildFinanceTree() {
  return {
    branches: [
      makeNode(
        "Commit capital",
        [
          "Liquidity drops immediately — make sure you can live with that",
          "Monitoring early signals closely",
          "Position becomes meaningful in portfolio",
          "Compounding effects — positive or negative — begin",
        ],
        48,
        "high",
        [
          makeNode(
            "Positive return",
            [
              "Early signal holds; conviction grows",
              "Reinvestment becomes worth considering",
              "Position outperforming your baseline",
              "Patience from early on is vindicated",
            ],
            55,
            "high",
          ),
          makeNode(
            "Drawdown period",
            [
              "Value drops below entry point",
              "Your conviction is being stress-tested",
              "Deciding whether to hold or cut losses",
              "Lesson absorbed regardless of outcome",
            ],
            45,
            "medium",
          ),
        ],
      ),
      makeNode(
        "Wait and observe",
        [
          "Capital is preserved — opportunity cost begins accruing",
          "Watching conditions from the sidelines",
          "Gathering more information before acting",
          "Waiting for a clearer entry signal",
        ],
        72,
        "low",
        [
          makeNode(
            "Better entry found",
            [
              "Patience creates a lower-cost opportunity",
              "Entering with higher margin of safety",
              "Stronger conviction at execution",
              "Higher expected return from improved entry",
            ],
            45,
            "medium",
          ),
          makeNode(
            "Rally missed",
            [
              "Price moves without you",
              "Regret sets in; chasing becomes tempting",
              "Emotional entry at worse levels likely",
              "Discipline tested most when it matters most",
            ],
            55,
            "high",
          ),
        ],
      ),
    ],
    insights: {
      week1: [
        {
          id: uid(),
          title: "Short-term is high noise",
          desc: "Week-one signals in financial decisions are almost always noise. Do not make or reverse decisions based on immediate price movement.",
        },
      ],
      month1: [
        {
          id: uid(),
          title: "Check the thesis, not the price",
          desc: "A month in, ask whether your original reasoning still holds — not whether the number is up or down.",
        },
      ],
      month3: [
        {
          id: uid(),
          title: "Trend vs. noise",
          desc: "Three months provides enough signal to separate a genuine trend from volatility. This is the right time for honest review.",
        },
      ],
      month6: [
        {
          id: uid(),
          title: "Compounding is working",
          desc: "Financial decisions compound in both directions. A well-reasoned early call has produced meaningful difference by month six.",
        },
      ],
    },
    recommendation:
      "Act from analysis, not urgency. The best financial decisions are made from patience — not from fear of missing out.",
  };
}

function buildLocationTree() {
  return {
    branches: [
      makeNode(
        "Relocate",
        [
          "Logistical load is high — the move itself is demanding",
          "Exploring new surroundings, still a stranger",
          "Building a new social circle takes real effort",
          "Feeling settled and genuinely integrated",
        ],
        50,
        "high",
        [
          makeNode(
            "Thriving socially",
            [
              "Meeting neighbours; finding local rhythms",
              "Social anchors beginning to form",
              "Hosting; a community of sorts emerging",
              "Deep roots — this feels like home",
            ],
            55,
            "high",
          ),
          makeNode(
            "Persistent isolation",
            [
              "Homesickness sets in harder than expected",
              "Struggling to form genuine connections",
              "Energy redirected into work instead",
              "Re-evaluating whether this was the right move",
            ],
            45,
            "medium",
          ),
        ],
      ),
      makeNode(
        "Stay put",
        [
          "Status quo maintained — no disruption",
          "Saving money and energy on the move itself",
          "Investing in your current environment instead",
          "Deepening roots where you already are",
        ],
        80,
        "low",
        [
          makeNode(
            "Home improvement",
            [
              "Upgrading and optimising your space",
              "Comfort and familiarity increases",
              "Environment better reflects your life now",
              "High satisfaction with the decision to stay",
            ],
            70,
            "low",
          ),
          makeNode(
            "Wanderlust returns",
            [
              "Restlessness re-emerges sooner than expected",
              "Planning extended trips as a pressure valve",
              "Dissatisfaction with location grows",
              "Back to considering the move again",
            ],
            30,
            "medium",
          ),
        ],
      ),
    ],
    insights: {
      week1: [
        {
          id: uid(),
          title: "Moving costs are front-loaded",
          desc: "The financial and emotional cost of relocating is highest in the first week. Prepare for that, not for what comes after.",
        },
      ],
      month1: [
        {
          id: uid(),
          title: "Novelty is not the same as fit",
          desc: "New locations feel like a holiday for the first month. Reality and genuine integration begin after that phase ends.",
        },
      ],
      month3: [
        {
          id: uid(),
          title: "Social infrastructure is the key variable",
          desc: "The critical window for building a support network is months two through four. Miss it and isolation compounds.",
        },
      ],
      month6: [
        {
          id: uid(),
          title: "The new normal is established",
          desc: "By month six, the place either feels like home or the exit planning is already underway. There is rarely an in-between.",
        },
      ],
    },
    recommendation:
      "The quality of your existing social support matters more than the destination. Relocation is high impact — budget energy for rebuilding community.",
  };
}

function buildEducationTree() {
  return {
    branches: [
      makeNode(
        "Pursue the qualification",
        [
          "Time and money committed — adjusting your schedule",
          "Early coursework establishing a foundation",
          "Depth of knowledge building meaningfully",
          "Credential earned; market positioning changed",
        ],
        52,
        "high",
        [
          makeNode(
            "Opens new doors",
            [
              "Early conversations shifted by new credential",
              "Opportunities previously unavailable now accessible",
              "Network from the programme pays forward",
              "Return on investment becoming visible",
            ],
            62,
            "high",
          ),
          makeNode(
            "Disappointing return",
            [
              "Credential less valued than expected in practice",
              "Market requires experience more than qualification",
              "Skills from the programme still useful",
              "Different path to the goal now pursued",
            ],
            38,
            "medium",
          ),
        ],
      ),
      makeNode(
        "Self-directed learning",
        [
          "Lower cost, higher flexibility — but no structure",
          "Progress depends entirely on self-discipline",
          "Gaps appear where a programme would have filled them",
          "Portfolio and practical work as the credentialing",
        ],
        68,
        "medium",
        [
          makeNode(
            "Equivalent outcome",
            [
              "Demonstrable skills built through projects",
              "Portfolio impresses without formal credential",
              "Faster, cheaper route to same destination",
              "Market validates the work, not the certificate",
            ],
            50,
            "medium",
          ),
          makeNode(
            "Credentialing gap remains",
            [
              "Skills strong but resume doesn't reflect them",
              "Missing the network a programme provides",
              "Some doors still closed without formal qualification",
              "Returning to structured learning eventually",
            ],
            50,
            "medium",
          ),
        ],
      ),
    ],
    insights: {
      week1: [
        {
          id: uid(),
          title: "Commitment is the first test",
          desc: "The first week reveals whether the motivation was genuine or momentary. Finishing week one meaningfully is its own signal.",
        },
      ],
      month1: [
        {
          id: uid(),
          title: "Structure vs. freedom trade-off",
          desc: "A month in, the advantages and disadvantages of your chosen path are fully visible. Adjust — do not abandon.",
        },
      ],
      month3: [
        {
          id: uid(),
          title: "Knowledge compounding",
          desc: "Learning compounds. Consistent study for three months produces a depth that sporadic effort cannot replicate.",
        },
      ],
      month6: [
        {
          id: uid(),
          title: "Marketable skill visible",
          desc: "Six months of focused learning is enough to be genuinely credible in a new area. The credential follows the competence.",
        },
      ],
    },
    recommendation:
      "The credential matters less than the competence, and the competence comes from consistent effort — not from which path you chose.",
  };
}

function buildLifestyleTree() {
  return {
    branches: [
      makeNode(
        "Start the change",
        [
          "Disrupting old habits is harder than anticipated",
          "First results visible but still modest",
          "New routine is beginning to solidify",
          "Transformed baseline — the change is now the default",
        ],
        52,
        "high",
        [
          makeNode(
            "Habit locked in",
            [
              "Initial resistance fades by week three",
              "Consistency becomes easier, not harder",
              "Results compound visibly",
              "New identity — this is just what you do now",
            ],
            62,
            "high",
          ),
          makeNode(
            "Falls off mid-way",
            [
              "Motivation dips around the three-week mark",
              "Missed days start compounding",
              "Partial results still present — not zero",
              "Restarting with better knowledge of your obstacles",
            ],
            38,
            "medium",
          ),
        ],
      ),
      makeNode(
        "Keep current habits",
        [
          "No disruption to daily life — comfort maintained",
          "The same challenges persist unchanged",
          "Awareness of the gap grows slowly",
          "Same outcomes as before, reliably",
        ],
        78,
        "low",
        [
          makeNode(
            "Slow drift",
            [
              "Baseline slowly declining without noticing",
              "Missed opportunities accumulate quietly",
              "Growing awareness of the gap",
              "An external event eventually forces the change",
            ],
            40,
            "medium",
          ),
          makeNode(
            "Stable comfort",
            [
              "Routine continues — low energy cost",
              "Modest satisfaction, no drama",
              "Change is deferred, not eliminated",
              "The decision gets revisited in 6-12 months",
            ],
            60,
            "low",
          ),
        ],
      ),
    ],
    insights: {
      week1: [
        {
          id: uid(),
          title: "Willpower is finite",
          desc: "Week one runs on motivation. Build environmental cues early so that consistency requires less decision-making, not more.",
        },
      ],
      month1: [
        {
          id: uid(),
          title: "The fragile phase",
          desc: "Habits take 60-90 days to automate. Month one is still the window where most people fall off. Expect it and plan for it.",
        },
      ],
      month3: [
        {
          id: uid(),
          title: "Results become visible",
          desc: "Lifestyle changes produce their clearest early results at three months — this is when outside observers notice.",
        },
      ],
      month6: [
        {
          id: uid(),
          title: "Identity shift complete",
          desc: "By month six, a sustained change stops feeling like discipline. It starts feeling like who you are.",
        },
      ],
    },
    recommendation:
      "Start smaller than feels necessary. Consistency at 60% effort beats intensity at 100% that burns out in two weeks.",
  };
}

function buildGeneralTree() {
  return {
    branches: [
      makeNode(
        "Take action",
        [
          "Current routine is disrupted — adjustment required",
          "Early feedback arrives; signals are mixed",
          "Adaptation phase — you are learning what works",
          "New baseline established; uncertainty normalised",
        ],
        50,
        "high",
        [
          makeNode(
            "Strong outcome",
            [
              "Transition goes smoother than feared",
              "Positive early signals compound",
              "Progress outpaces the disruption cost",
              "The goal is reached — or close to it",
            ],
            58,
            "high",
          ),
          makeNode(
            "Unexpected friction",
            [
              "Obstacles appear that were not visible before",
              "Additional resources or time required",
              "Course correction underway",
              "Outcome is achievable — just different than planned",
            ],
            42,
            "medium",
          ),
        ],
      ),
      makeNode(
        "Wait or do nothing",
        [
          "Flexibility is preserved — opportunity cost begins",
          "More information is gathered passively",
          "Conditions may or may not improve",
          "Decision point arrives again — with less time",
        ],
        68,
        "medium",
        [
          makeNode(
            "Better conditions",
            [
              "Patience is rewarded — situation improves",
              "More data makes the next decision clearer",
              "Entering at a lower cost or risk",
              "Strategic advantage from waiting",
            ],
            48,
            "medium",
          ),
          makeNode(
            "Window closes",
            [
              "Opportunity moves on without you",
              "Regret becomes the dominant emotion",
              "Settling for a diminished version",
              "Status quo is now locked in by default",
            ],
            52,
            "high",
          ),
        ],
      ),
    ],
    insights: {
      week1: [
        {
          id: uid(),
          title: "Action increases near-term uncertainty",
          desc: "Taking action almost always raises uncertainty in the short term before reducing it. That is normal — it is not a sign of a wrong decision.",
        },
      ],
      month1: [
        {
          id: uid(),
          title: "Early feedback matters",
          desc: "The first month produces the data you need to decide whether to stay the course or adjust. Treat it as information, not verdict.",
        },
      ],
      month3: [
        {
          id: uid(),
          title: "Paths diverge visibly",
          desc: "By month three, the difference between having acted and having waited becomes clearly readable. The gap only widens from here.",
        },
      ],
      month6: [
        {
          id: uid(),
          title: "Consequences are integrated",
          desc: 'The effects of this choice are now woven into your baseline. The question shifts from "did I choose right?" to "what do I do from here?"',
        },
      ],
    },
    recommendation:
      "Weigh the cost of immediate disruption against the compounding cost of delayed action. Most people consistently underestimate the latter.",
  };
}

function generateDecisionTree(prompt, context) {
  const domain = detectDomain(prompt);
  const builders = {
    CAREER: buildCareerTree,
    RELATIONSHIP: buildRelationshipTree,
    FINANCE: buildFinanceTree,
    LOCATION: buildLocationTree,
    EDUCATION: buildEducationTree,
    LIFESTYLE: buildLifestyleTree,
    GENERAL: buildGeneralTree,
  };

  const { branches, insights, recommendation } = (
    builders[domain] || builders.GENERAL
  )();

  /////////// Pad each timeframe to have 3 insights
  TIMEFRAMES.forEach((tf) => {
    if (insights[tf].length < 3) {
      insights[tf].push(
        {
          id: uid(),
          title: "Resource allocation",
          desc: `By ${TIMEFRAME_LABELS[tf]}, time and attention are deeply committed to this path — switching costs are rising.`,
        },
        {
          id: uid(),
          title: "Emotional resilience",
          desc: "Expect your patience to be tested around this timeframe. That is structural, not a sign of failure.",
        },
      );
    }
  });

  const root = {
    id: uid(),
    label: prompt.length > 50 ? prompt.slice(0, 47) + "…" : prompt,
    description: {
      week1: "Evaluating the options — no commitment yet",
      month1: "Initial commitment phase; path becoming clearer",
      month3: "Living with the choice; results beginning",
      month6: "Full integration — reviewing outcomes",
    },
    probability: { week1: 100, month1: 100, month3: 100, month6: 100 },
    impact: "high",
    children: branches,
  };

  return {
    id: uid(),
    timestamp: Date.now(),
    prompt,
    context: context || "",
    domain,
    rootNode: root,
    insights,
    recommendation,
  };
}

/////////// ─── HISTORY (localStorage) ──────────────────────────────────────

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function addToHistory(tree) {
  state.history = [
    { id: tree.id, timestamp: tree.timestamp, prompt: tree.prompt, tree },
    ...state.history.filter((h) => h.prompt !== tree.prompt),
  ].slice(0, 20);
  saveHistory(state.history);
  renderHistory();
}

/////////// ─── TREE LAYOUT ──────────────────────────────────────────────────
// Computes absolute (x, y) positions for all nodes via a simple
// recursive centring algorithm (Reingold-Tilford simplified).

function layoutTree(tree, expandedIds) {
  const nodes = [];

  function measure(node, depth) {
    const children =
      expandedIds.has(node.id) && node.children.length
        ? node.children.map((c) => measure(c, depth + 1))
        : [];

    const width = children.length
      ? children.reduce((s, c) => s + c.subtreeW, 0) +
        Math.max(0, children.length - 1) * (SIBLING_GAP - NODE_W)
      : NODE_W;

    return { node, depth, children, subtreeW: Math.max(NODE_W, width) };
  }

  function assign(measured, cx) {
    const { node, depth, children } = measured;
    const isLeaf = children.length === 0;

    let opacity = 1;
    if (depth === 2) {
      if (state.timeFrame === "week1") opacity = 0;
      if (state.timeFrame === "month1") opacity = 0;
      if (state.timeFrame === "month3") opacity = 0.55;
    }

    nodes.push({
      ...node,
      x: cx,
      y: depth * LEVEL_H,
      depth,
      opacity,
      isLeaf,
      parentId: null,
    });

    if (children.length > 0) {
      const totalW =
        children.reduce((s, c) => s + c.subtreeW, 0) +
        Math.max(0, children.length - 1) * (SIBLING_GAP - NODE_W);
      let leftX = cx - totalW / 2;
      children.forEach((child) => {
        assign(child, leftX + child.subtreeW / 2);
        leftX += child.subtreeW + (SIBLING_GAP - NODE_W);
      });
    }
  }

  const measured = measure(tree.rootNode, 0);
  assign(measured, 0);

  /////////// Inject parentId from the original tree structure
  function linkParents(node, parentId) {
    const found = nodes.find((n) => n.id === node.id);
    if (found) found.parentId = parentId;
    if (expandedIds.has(node.id))
      node.children.forEach((c) => linkParents(c, node.id));
  }
  linkParents(tree.rootNode, null);

  return nodes;
}

/////////// ─── SVG PATH BUILDER ─────────────────────────────────────────────

function cubicPath(x1, y1, x2, y2) {
  const midY = y1 + (y2 - y1) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

/////////// ─── RENDER TREE ──────────────────────────────────────────────────

function renderTree() {
  if (!state.currentTree) return;

  const nodesLayer = document.getElementById("nodes-layer");
  const svgLayer = document.getElementById("svg-layer");
  nodesLayer.innerHTML = "";
  svgLayer.innerHTML = "";

  const nodes = layoutTree(state.currentTree, state.expandedNodes);
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  /////////// Draw SVG edges first (behind nodes)
  nodes.forEach((node, i) => {
    if (!node.parentId) return;
    const parent = nodeMap[node.parentId];
    if (!parent || node.opacity === 0) return;

    const x1 = parent.x;
    const y1 = parent.y + NODE_H / 2;
    const x2 = node.x;
    const y2 = node.y - NODE_H / 2;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", cubicPath(x1, y1, x2, y2));
    path.setAttribute("class", "edge-path");
    path.setAttribute("data-source", parent.id);
    path.setAttribute("data-target", node.id);
    path.style.opacity = node.opacity;
    path.style.animationDelay = `${i * 0.06}s`;
    svgLayer.appendChild(path);
  });

  /////////// Draw node cards
  nodes.forEach((node, i) => {
    if (node.opacity === 0) return;

    const prob = node.probability[state.timeFrame];
    const probHigh = prob >= 65;
    const probLow = prob < 35;
    const probClass = probHigh ? "high" : probLow ? "low" : "mid";
    const hasKids = node.children && node.children.length > 0;
    const isActive = state.activePath.has(node.id);

    const el = document.createElement("div");
    el.className = [
      "tree-node",
      node.depth === 0 ? "is-root" : "",
      hasKids ? "clickable" : "",
      isActive ? "active-path" : "",
    ]
      .filter(Boolean)
      .join(" ");

    el.style.left = `${node.x - NODE_W / 2}px`;
    el.style.top = `${node.y - NODE_H / 2}px`;
    el.style.opacity = node.opacity;
    el.style.width = `${NODE_W}px`;
    el.style.minHeight = `${NODE_H}px`;
    el.style.animationDelay = `${i * 0.05}s`;

    if (prob > 40) {
      el.style.boxShadow = `0 0 ${Math.round(prob / 5)}px rgba(74,124,255,${(prob / 100) * 0.25})`;
    }

    el.innerHTML = `
      <div class="node-prob-fill" style="width:${prob}%"></div>
      <div class="node-top">
        <span class="node-label">${escapeHtml(node.label)}</span>
        <span class="node-prob-badge ${probClass}">${prob}%</span>
      </div>
      <p class="node-desc">${escapeHtml(node.description[state.timeFrame])}</p>
      ${hasKids ? '<div class="node-expand-hint"></div>' : ""}
    `;

    el.addEventListener("mouseenter", () => {
      const path = new Set();
      let cur = node;
      while (cur) {
        path.add(cur.id);
        cur = cur.parentId ? nodeMap[cur.parentId] : null;
      }
      state.activePath = path;
      refreshActivePaths();
    });

    el.addEventListener("mouseleave", () => {
      state.activePath = new Set();
      refreshActivePaths();
    });

    if (hasKids) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.expandedNodes.has(node.id)) {
          state.expandedNodes.delete(node.id);
        } else {
          state.expandedNodes.add(node.id);
        }
        renderTree();
      });
    }

    nodesLayer.appendChild(el);
  });
}

function refreshActivePaths() {
  document.querySelectorAll(".tree-node").forEach((el) => {
    const id = el.querySelector(".node-label")?.textContent;
    // Find node by position — simpler to re-render
  });
  // Re-render is cheaper than tracking DOM ids separately
  renderTree();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/////////// ─── RENDER INSIGHT PANEL ─────────────────────────────────────────

function renderInsightPanel() {
  const body = document.getElementById("insight-body");

  if (!state.currentTree) {
    body.innerHTML =
      '<p class="insight-empty">Generate a decision to see probability scores and observations here.</p>';
    return;
  }

  const tree = state.currentTree;
  const tf = state.timeFrame;
  const topBranches = tree.rootNode.children || [];
  const insights = tree.insights[tf] || [];

  let html = "";

  /////////// Probability bars for top-level branches
  html += '<div class="prob-section">';
  html += '<div class="prob-section-title">Probability by path</div>';
  topBranches.forEach((branch) => {
    const prob = branch.probability[tf];
    const impact = branch.impact;
    html += `
      <div class="prob-row">
        <div class="prob-row-top">
          <span class="prob-row-label">${escapeHtml(branch.label)}</span>
          <div class="prob-row-meta">
            <span class="prob-row-value">${prob}%</span>
            <span class="impact-pill ${impact}">${impact} impact</span>
          </div>
        </div>
        <div class="prob-bar-track">
          <div class="prob-bar-fill" style="width:${prob}%"></div>
        </div>
      </div>
    `;
  });
  html += "</div>";

  /////////// Insights
  html += '<div class="insight-section">';
  html += `<div class="insight-section-title">Observations — ${TIMEFRAME_LABELS[tf]}</div>`;
  insights.forEach((ins) => {
    html += `
      <div class="insight-card">
        <div class="insight-card-title">${escapeHtml(ins.title)}</div>
        <div class="insight-card-desc">${escapeHtml(ins.desc)}</div>
      </div>
    `;
  });
  html += "</div>";

  /////////// Recommendation
  if (tree.recommendation) {
    html += `
      <div class="recommendation-box">
        <div class="recommendation-box-title">Perspective</div>
        <div class="recommendation-box-text">${escapeHtml(tree.recommendation)}</div>
      </div>
    `;
  }

  body.innerHTML = html;
}

/////////// ─── RENDER HISTORY SIDEBAR ───────────────────────────────────────

function renderHistory() {
  const content = document.getElementById("history-content");
  const badge = document.getElementById("history-count");
  const footer = document.getElementById("history-footer");
  const list = state.history;

  badge.textContent = list.length;
  footer.style.display = list.length ? "block" : "none";

  if (!list.length) {
    content.innerHTML =
      '<p class="history-empty">No saved decisions yet.<br>Your explorations will appear here.</p>';
    return;
  }

  content.innerHTML = list
    .map(
      (item) => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-item-text">
        <div class="history-item-label">${escapeHtml(item.prompt)}</div>
        <div class="history-item-meta">${timeAgo(item.timestamp)}</div>
      </div>
      <button class="history-item-delete" data-id="${item.id}" title="Remove">✕</button>
    </div>
  `,
    )
    .join("");

  content.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".history-item-delete")) return;
      const id = el.dataset.id;
      const item = state.history.find((h) => h.id === id);
      if (item) loadTreeFromHistory(item);
    });
  });

  content.querySelectorAll(".history-item-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      state.history = state.history.filter((h) => h.id !== id);
      saveHistory(state.history);
      renderHistory();
    });
  });
}

function loadTreeFromHistory(item) {
  state.currentTree = item.tree;
  state.timeFrame = "week1";
  state.expandedNodes = new Set([
    item.tree.rootNode.id,
    ...item.tree.rootNode.children.map((c) => c.id),
  ]);
  state.pan = { x: 0, y: 80 };
  state.zoom = 1;
  resetPanZoom();
  applyPanZoom();
  centreTree();
  document.getElementById("time-slider").value = "0";
  updateSliderLabel();
  document.getElementById("empty-state").style.display = "none";
  renderTree();
  renderInsightPanel();
}

/////////// ─── PAN & ZOOM ────────────────────────────────────────────────────

function applyPanZoom() {
  const layer = document.getElementById("tree-layer");
  layer.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
}

function centreTree() {
  const canvas = document.getElementById("canvas-area");
  const w = canvas.offsetWidth;
  state.pan.x = w / 2;
  applyPanZoom();
}

function resetPanZoom() {
  state.pan = { x: 0, y: 80 };
  state.zoom = 1;
}

/////////// ─── SLIDER LABEL ─────────────────────────────────────────────────

function updateSliderLabel() {
  const labels = ["1 week", "1 month", "3 months", "6 months"];
  const val = parseInt(document.getElementById("time-slider").value, 10);
  document.getElementById("slider-current").textContent = labels[val];
}

/////////// ─── GENERATE FLOW ────────────────────────────────────────────────

function generate() {
  const prompt = document.getElementById("decision-input").value.trim();
  const context = document.getElementById("context-input").value.trim();

  if (!prompt) {
    document.getElementById("decision-input").focus();
    return;
  }

  const overlay = document.getElementById("loading-overlay");
  overlay.classList.add("visible");
  document.getElementById("generate-btn").disabled = true;

  /////////// Small delay so the loading state is visible before heavy render
  setTimeout(() => {
    const tree = generateDecisionTree(prompt, context);
    state.currentTree = tree;
    state.timeFrame = "week1";
    state.expandedNodes = new Set([
      tree.rootNode.id,
      ...tree.rootNode.children.map((c) => c.id),
    ]);
    state.activePath = new Set();

    resetPanZoom();
    applyPanZoom();
    centreTree();

    document.getElementById("time-slider").value = "0";
    updateSliderLabel();
    document.getElementById("empty-state").style.display = "none";

    renderTree();
    renderInsightPanel();
    addToHistory(tree);

    overlay.classList.remove("visible");
    document.getElementById("generate-btn").disabled = false;
  }, 350);
}

/////////// ─── EVENT WIRING ──────────────────────────────────────────────────

function init() {
  state.history = loadHistory();
  renderHistory();
  renderInsightPanel();

  /////////// Generate button
  document.getElementById("generate-btn").addEventListener("click", generate);

  /////////// Enter key on decision textarea (Ctrl/Cmd+Enter)
  document.getElementById("decision-input").addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
  });

  /////////// Example chips
  document.querySelectorAll(".example-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.getElementById("decision-input").value = chip.dataset.prompt;
      document.getElementById("decision-input").focus();
    });
  });

  /////////// Time slider
  document.getElementById("time-slider").addEventListener("input", (e) => {
    const map = ["week1", "month1", "month3", "month6"];
    state.timeFrame = map[parseInt(e.target.value, 10)];
    updateSliderLabel();
    renderTree();
    renderInsightPanel();
  });

  /////////// Clear history
  document.getElementById("clear-history-btn").addEventListener("click", () => {
    if (!state.history.length) return;
    state.history = [];
    saveHistory([]);
    renderHistory();
  });

  /////////// Mobile sidebar toggle
  document
    .getElementById("toggle-sidebar-btn")
    .addEventListener("click", () => {
      document.getElementById("sidebar-left").classList.toggle("open");
    });

  /////////// Pan (pointer events on canvas)
  const canvas = document.getElementById("canvas-area");

  canvas.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".tree-node")) return;
    state.isDragging = true;
    state.dragStart = {
      x: e.clientX - state.pan.x,
      y: e.clientY - state.pan.y,
    };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!state.isDragging) return;
    state.pan.x = e.clientX - state.dragStart.x;
    state.pan.y = e.clientY - state.dragStart.y;
    applyPanZoom();
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!state.isDragging) return;
    state.isDragging = false;
    canvas.classList.remove("dragging");
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  });

  canvas.addEventListener("pointercancel", (e) => {
    state.isDragging = false;
    canvas.classList.remove("dragging");
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  });

  /////////// Zoom (wheel)
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      state.zoom = clamp(state.zoom + delta, 0.3, 2.2);
      applyPanZoom();
    },
    { passive: false },
  );

  /////////// Initial pan centre
  centreTree();
}

document.addEventListener("DOMContentLoaded", init);