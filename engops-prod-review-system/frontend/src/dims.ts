export type DimQuestion = { id: string; text: string; opts: string[] };
export type DimensionDef = { key: string; label: string; weight: number; sub: string; badge: string; questions: DimQuestion[] };

/** Canonical 5 performance dimensions — same keys/labels as review form builder */
export const PERFORMANCE_DIMENSION_KEYS = [
  'technical_judgment',
  'delivery_execution',
  'quality',
  'communication',
  'ownership_growth',
] as const;

export type PerformanceDimensionKey = (typeof PERFORMANCE_DIMENSION_KEYS)[number];

export const PERFORMANCE_DIMENSION_LABELS: Record<PerformanceDimensionKey, string> = {
  technical_judgment: 'Technical Judgment & Knowledge',
  delivery_execution: 'Delivery & Execution Discipline',
  quality: 'Quality & Maintainability',
  communication: 'Communication & Alignment',
  ownership_growth: 'Ownership, Teamwork & Growth',
};

export const DIMS = [
  {
    key: 'technical_judgment',
    label: 'Technical Judgment & Knowledge',
    weight: 20,
    sub: 'Technical depth, system understanding, debugging, constraints, failure handling, and requirement validation.',
    badge: 'br',
    questions: [
      {
        id: 'tj1',
        text: 'Does the employee have the technical knowledge expected for their role and level?',
        opts: [
          'Often blocked by basic technical gaps',
          'Relies heavily on others for routine concepts',
          'Adequate for straightforward tasks but struggles with complex or unfamiliar work',
          'Handles most role-level problems independently',
          'Solves complex and new problems reliably',
          'Go-to person for hard technical questions and mentoring others'
        ]
      },
      {
        id: 'tj2',
        text: 'How effectively does the employee apply technical knowledge to solve real problems?',
        opts: [
          'Cannot translate knowledge into practical solutions',
          'Struggles to apply concepts without step-by-step help',
          'Solves standard problems but gets stuck on unusual cases',
          'Consistently finds effective solutions to complex problems',
          'Creates efficient solutions that improve performance or maintainability',
          'Introduces new approaches that remove entire classes of problems'
        ]
      },
      {
        id: 'tj3',
        text: 'How well does the employee debug issues and find root causes?',
        opts: [
          'Unable to debug effectively; fixes often create new issues',
          'Fixes visible symptoms but misses the root cause',
          'Needs significant help or time to diagnose standard bugs',
          'Independently diagnoses complex issues accurately',
          'Debugs quickly and implements strong permanent fixes',
          'Anticipates and prevents bugs through strong system thinking'
        ]
      },
      {
        id: 'tj4',
        text: 'Before implementing, do they understand system impact, business logic, and dependencies?',
        opts: [
          'Implements blindly without checking system or business impact',
          'Often misses how their work affects other flows or business rules',
          'Needs reminders to verify requirements, dependencies, and system behavior',
          'Usually checks the relevant business logic and system connections',
          'Spots logic conflicts, hidden dependencies, and side effects early',
          'Aligns technical implementation with long-term product and business goals'
        ]
      },
      {
        id: 'tj5',
        text: 'Do they check technical constraints before committing to an approach?',
        opts: [
          'Commits without checking feasibility and hits avoidable dead ends',
          'Often ignores system limits until they block implementation',
          'Sometimes checks upfront but still misses common constraints',
          'Usually verifies key constraints before choosing an approach',
          'Consistently checks platform, integration, and technical limits early',
          'Finds hidden constraints others miss and guides the team around them'
        ]
      },
      {
        id: 'tj6',
        text: 'Do they think about failure paths, invalid states, and what the system should reject?',
        opts: [
          'Only handles the happy path; errors or invalid states are ignored',
          'Adds shallow error handling and misses important failure cases',
          'Handles obvious cases but misses edge cases, timeouts, or business-rule rejections',
          'Usually designs appropriate guards and failure handling',
          'Consistently models success, failure, and rejection paths clearly',
          'Failure-first mindset; defines what must not happen as carefully as what should happen'
        ]
      },
      {
        id: 'tj7',
        text: 'When requirements are unclear, risky, or technically wrong, do they raise it early?',
        opts: [
          'Does not ask when blocked or confused; proceeds on wrong assumptions or silently stops',
          'Raises concerns very late after significant work is already done',
          'Sometimes flags issues early but may still guess when uncomfortable',
          'Usually raises unclear or risky requirements early with context',
          'Consistently flags problems before starting and proposes alternatives',
          'Stress-tests requirements and uncovers gaps before implementation begins'
        ]
      }
    ]
  },
  {
    key: 'delivery_execution',
    label: 'Delivery & Execution Discipline',
    weight: 20,
    sub: 'Commitment, estimation, scope control, tracker hygiene, planning, follow-through, and pressure handling.',
    badge: 'bp',
    questions: [
      {
        id: 'de1',
        text: 'Does the employee deliver what they promised within the agreed timeline?',
        opts: [
          'Consistently misses commitments and causes project delays',
          'Frequently requires extensions or reminders to finish',
          'Hit-or-miss; delivery is unpredictable',
          'Usually delivers with minor delays occasionally',
          'Consistently delivers what was agreed sprint after sprint',
          'Delivers early or exactly on time without sacrificing quality'
        ]
      },
      {
        id: 'de2',
        text: 'How accurate are their time or effort estimates before starting work?',
        opts: [
          'Estimates are almost always wrong and unusable for planning',
          'Frequently underestimates complexity and causes plan changes',
          'Inconsistent; sometimes accurate, sometimes far off',
          'Usually gives realistic estimates within a small margin',
          'Highly reliable estimates that account for risks and dependencies',
          'Sets the estimation benchmark and improves team planning'
        ]
      },
      {
        id: 'de3',
        text: 'Do they stay within agreed scope and communicate scope changes early?',
        opts: [
          'Adds or removes things without informing anyone',
          'Often drifts from scope and changes are discovered late',
          'Sometimes goes off-scope without a clear reason',
          'Usually stays in scope and raises changes before acting',
          'Always works within agreed scope and flags proposed changes early',
          'Treats scope clearly; nothing changes without reason and alignment'
        ]
      },
      {
        id: 'de4',
        text: 'Do they keep tickets, task status, and progress updates accurate?',
        opts: [
          'Tracker is almost never updated and cannot be trusted',
          'Rarely updates; the real state surprises the team',
          'Updates inconsistently; tracker is only a rough guess',
          'Usually current with occasional small delays',
          'Consistently accurate and trustworthy for their tasks',
          'Real-time and granular; their tracker is the source of truth'
        ]
      },
      {
        id: 'de5',
        text: 'Do they finish what they started and close tasks without being chased?',
        opts: [
          'Leaves unfinished work and needs repeated reminders',
          'Often starts new work before closing existing tasks',
          'Sometimes follows through but needs reminders for longer tasks',
          'Usually completes work before taking new tasks',
          'Self-managing; tracks and closes commitments without prompting',
          'Zero follow-up needed; closes loops before anyone asks'
        ]
      },
      {
        id: 'de6',
        text: 'When they fall behind or priorities change, how well do they recover?',
        opts: [
          'Says nothing until the delay can no longer be hidden',
          'Recovery is disorganized and communication is late',
          'Eventually adjusts but updates are vague or delayed',
          'Usually catches slippage early and shares a revised plan',
          'Flags risks fast, gives a concrete recovery plan, and limits impact',
          'Handles changes so smoothly that the team barely feels the impact'
        ]
      },
      {
        id: 'de7',
        text: 'How dependable are they during critical or high-pressure situations?',
        opts: [
          'Disengages or becomes unproductive under pressure',
          'Needs heavy direction to stay focused during a crisis',
          'Available, but performance drops when things get difficult',
          'Dependable and calm during high-stakes work',
          'Proactively helps resolve issues during pressure',
          'Stabilizes the team and performs strongly in crisis'
        ]
      }
    ]
  },
  {
    key: 'quality',
    label: 'Quality & Maintainability',
    weight: 20,
    sub: 'Code quality, accuracy, testing, review quality, readiness, documentation, and technical debt.',
    badge: 'bt',
    questions: [
      {
        id: 'q1',
        text: 'Is their work accurate, complete, and ready for use when submitted?',
        opts: [
          'Submissions are often broken or missing key requirements',
          'Work requires significant rework after first review',
          'Generally correct but lacks attention to detail',
          'Accurate, thorough, and mostly ready for use',
          'High-quality work that needs minimal correction',
          'Team benchmark; work is complete, polished, and reliable'
        ]
      },
      {
        id: 'q2',
        text: 'Is their code easy for others to read, follow, and maintain?',
        opts: [
          'Code is messy and difficult to maintain',
          'Often hard to follow and requires cleanup',
          'Inconsistent; some areas clean, others messy',
          'Generally readable with occasional structure issues',
          'Consistently clean, logical, and easy to follow',
          'Their code is the team example for maintainability'
        ]
      },
      {
        id: 'q3',
        text: 'How often do bugs from their work escape to review, staging, or production?',
        opts: [
          'Frequent production bugs trace back to their work',
          'Several bugs per cycle escape their own checks',
          'Occasional bugs slip through; about average',
          'Rare bugs; catches most issues before review',
          'Almost never introduces issues that reach review',
          'Zero-escape mindset; catches problems before they leave their hands'
        ]
      },
      {
        id: 'q4',
        text: 'Do they write meaningful tests that catch real issues?',
        opts: [
          'No tests written',
          'Tests are rare or too shallow to catch real bugs',
          'Sometimes writes useful tests but misses critical paths',
          'Usually writes meaningful tests for main flows',
          'Consistently writes reliable tests that catch real issues',
          'Their tests act as a strong safety net for the team'
        ]
      },
      {
        id: 'q5',
        text: 'How useful are their code reviews for others?',
        opts: [
          'Rubber-stamps PRs without real review',
          'Only gives surface-level comments and misses real issues',
          'Catches some things but misses important logic problems',
          'Good reviews with useful, clear feedback',
          'Thorough and educational; improves both code and author',
          'Best reviewer on the team; their feedback makes everyone better'
        ]
      },
      {
        id: 'q6',
        text: 'Do they consider performance, security, scalability, and maintainability while implementing?',
        opts: [
          'Only focuses on whether the feature works functionally',
          'Rarely thinks about non-functional risks unless others catch them',
          'Considers them when reminded but not consistently',
          'Usually considers them appropriately for the context',
          'Consistently applies these concerns as part of normal implementation',
          'Raises the whole team’s awareness of performance, security, and scalability'
        ]
      },
      {
        id: 'q7',
        text: 'Do they know when work is truly ready to ship?',
        opts: [
          'Frequently says done when work is incomplete or broken',
          'Often ships work that needs significant fixes after merging',
          'Judgment is inconsistent; sometimes too early, sometimes over-polished',
          'Usually judges release readiness correctly',
          'Consistently ships at the right time with high stability',
          'Their definition of done is the team standard'
        ]
      },
      {
        id: 'q8',
        text: 'Do they document work and leave the codebase better than they found it?',
        opts: [
          'No useful documentation and often adds technical debt',
          'Minimal notes; often creates new debt without flagging it',
          'Documents only sometimes and leaves code mostly unchanged',
          'Maintains reasonable documentation and cleans obvious issues',
          'Creates clear guides and improves areas they touch',
          'Sets the standard for documentation and reduces technical debt system-wide'
        ]
      }
    ]
  },
  {
    key: 'communication',
    label: 'Communication & Alignment',
    weight: 20,
    sub: 'Written clarity, meeting clarity, proactive updates, feedback handling, stakeholder communication, and cross-team alignment.',
    badge: 'bp',
    questions: [
      {
        id: 'c1',
        text: 'Are their written messages, tickets, and documentation clear on the first read?',
        opts: [
          'Written communication is unclear and creates confusion',
          'Often too long, too short, or poorly structured',
          'Mixed quality; sometimes clear, sometimes hard to follow',
          'Generally clear with minor ambiguity sometimes',
          'Consistently clear, structured, and complete',
          'Their written communication is the team reference standard'
        ]
      },
      {
        id: 'c2',
        text: 'How clearly do they communicate updates, blockers, and plan changes?',
        opts: [
          'Rarely communicates; status is usually unknown',
          'Updates are disorganized or only shared after being chased',
          'Provides updates sometimes but not consistently or not early enough',
          'Keeps relevant people informed with clear updates',
          'Proactive and clear; the team knows what changed and why',
          'Sets the team rhythm with transparent, timely, and useful updates'
        ]
      },
      {
        id: 'c3',
        text: 'How useful are they in meetings, standups, and real-time discussions?',
        opts: [
          'Silent, off-topic, unprepared, or slows the group down',
          'Often vague, rambling, or unclear',
          'Adequate but inconsistent depending on topic or setting',
          'Usually prepared, concise, and helpful',
          'Consistently clear, confident, and productive',
          'Elevates meeting quality and helps the team reach decisions'
        ]
      },
      {
        id: 'c4',
        text: 'How responsive are they to messages, questions, and feedback?',
        opts: [
          'Unresponsive for long periods and blocks progress',
          'Slow to respond and often needs multiple follow-ups',
          'Responds, but answers can be vague or incomplete',
          'Prompt and professional in communication',
          'Highly proactive and anticipates information needs',
          'Extremely helpful and sets the standard for availability'
        ]
      },
      {
        id: 'c5',
        text: 'When they receive feedback, do they apply it or repeat the same mistakes?',
        opts: [
          'Dismisses feedback or repeats the same mistakes again and again',
          'Accepts feedback but does not retain it across future work',
          'Applies feedback only in the immediate context',
          'Takes feedback well and usually applies it going forward',
          'Internalizes feedback and rarely needs the same point repeated',
          'Actively seeks feedback and systematically improves from it'
        ]
      },
      {
        id: 'c6',
        text: 'Can they communicate clearly with stakeholders, non-technical people, and other teams?',
        opts: [
          'Communication confuses or surprises stakeholders',
          'Uses too much jargon or rarely aligns with external teams',
          'Sometimes communicates well but alignment is inconsistent',
          'Usually explains clearly and keeps affected people informed',
          'Trusted by stakeholders and adjacent teams for clear alignment',
          'Acts as a bridge between technical and business teams'
        ]
      },
      {
        id: 'c7',
        text: 'How well do they handle difficult or uncomfortable conversations?',
        opts: [
          'Avoids difficult conversations or becomes defensive',
          'Creates tension or confusion during conflict',
          'Handles difficult topics awkwardly but tries',
          'Approaches difficult topics professionally and honestly',
          'Resolves conflict smoothly while maintaining respect',
          'De-escalates tension and helps people find common ground'
        ]
      }
    ]
  },
  {
    key: 'ownership_growth',
    label: 'Ownership, Teamwork & Growth',
    weight: 20,
    sub: 'Accountability, production ownership, collaboration, initiative, learning, process improvement, and team contribution.',
    badge: 'bg',
    questions: [
      {
        id: 'og1',
        text: 'Do they take ownership after shipping and care whether their work works in production?',
        opts: [
          'Disengages after merging; production issues are treated as someone else’s problem',
          'Rarely follows up unless explicitly asked',
          'Checks occasionally but not consistently',
          'Usually monitors their work after release and acts when needed',
          'Tracks real-world outcomes and takes action when something is wrong',
          'Treats production issues in their area as personally important and follows through fully'
        ]
      },
      {
        id: 'og2',
        text: 'When something goes wrong, do they take accountability?',
        opts: [
          'Blames others, disappears, or avoids responsibility',
          'Accepts responsibility slowly or only when undeniable',
          'Takes some ownership but inconsistently',
          'Takes clear responsibility and focuses on the solution',
          'Owns problems fully and helps prevent recurrence',
          'Models strong accountability and turns failures into team learning'
        ]
      },
      {
        id: 'og3',
        text: 'Do they help unblock, guide, and support others?',
        opts: [
          'Ignores others’ struggles and focuses only on self',
          'Only helps when formally required',
          'Helpful when asked but not proactive',
          'Proactively notices when others are stuck and offers help',
          'Makes people around them better through regular support',
          'Prioritizes team flow and acts like a servant leader'
        ]
      },
      {
        id: 'og4',
        text: 'How well do they collaborate across roles and contribute to team environment?',
        opts: [
          'Creates friction or negatively affects morale',
          'Avoids collaboration outside their immediate silo',
          'Neutral; collaborates only when needed',
          'Positive, collaborative, and reliable as a team member',
          'Builds trust and works smoothly across functions',
          'Unifies people and improves the overall team culture'
        ]
      },
      {
        id: 'og5',
        text: 'Do they flag risks or problems outside their assigned task?',
        opts: [
          'Only works on assigned tasks and ignores wider problems',
          'Rarely raises issues outside their own scope',
          'Occasionally spots and raises issues',
          'Usually flags visible risks and suggests a possible fix',
          'Frequently identifies risks before they affect others',
          'Creates ways to prevent recurring problems before they happen'
        ]
      },
      {
        id: 'og6',
        text: 'How do they handle ambiguity, setbacks, and unclear instructions?',
        opts: [
          'Freezes, panics, or stops without clear instructions',
          'Struggles significantly and either waits or guesses recklessly',
          'Can move forward sometimes but needs heavy guidance',
          'Usually makes safe assumptions and communicates them clearly',
          'Creates clarity for themselves and helps recovery during setbacks',
          'Turns ambiguity or setbacks into clear plans for the wider team'
        ]
      },
      {
        id: 'og7',
        text: 'Do they improve processes and learn new skills for the team’s benefit?',
        opts: [
          'Learning has stalled and they resist workflow improvement',
          'Learns only when forced and ignores inefficiencies',
          'Open to learning but rarely drives improvement',
          'Self-learns relevant skills and suggests useful improvements',
          'Implements improvements that save team time and shares new knowledge',
          'Continuously raises the team’s capability through learning and process innovation'
        ]
      },
      {
        id: 'og8',
        text: 'Do they seek additional responsibility or high-impact work?',
        opts: [
          'Avoids work beyond the bare minimum',
          'Only does exactly what is assigned',
          'Takes extra work only when directly asked',
          'Regularly volunteers for helpful team tasks',
          'Identifies and takes on high-impact work proactively',
          'Relentlessly seeks challenges that move the team or company forward'
        ]
      }
    ]
  }
]