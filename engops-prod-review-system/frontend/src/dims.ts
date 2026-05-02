export type DimQuestion = { id: string; text: string; opts: string[] };
export type DimensionDef = { key: string; label: string; weight: number; sub: string; badge: string; questions: DimQuestion[] };

export const DIMS = [
  {
    key:'delivery', label:'Delivery', weight:22,
    sub:'sprint commitment, estimation, scope, dependencies, recovery',
    badge:'bp',
    questions:[
      {id:'d1', text:'Does this person deliver what they promised in the sprint?',
       opts:['Almost never — the team cannot count on their commitments','Often misses — slippage is the norm, not the exception','Hit or miss — no one knows what to expect','Usually delivers; minor delays occasionally','Delivers what was agreed, consistently, sprint after sprint','Always on time — others plan around their word']},
      {id:'d2', text:'How accurate are their time or effort estimates before starting a task?',
       opts:['Almost always wrong — usually by a lot','Frequently way off; the team has to adjust plans around this','Inconsistent — sometimes right, sometimes far off','Usually in the right range; small misses are common','Reliable estimates — plans built on them work out','Sets the estimation benchmark for the team']},
      {id:'d3', text:'Do they stick to the agreed scope, or do they quietly change it — adding things or cutting things — without telling anyone?',
       opts:['Adds or removes things without informing anyone — discovered late','Often drifts from scope; changes are only found at the end','Sometimes goes off-scope with no clear reason','Usually stays in scope; raises any changes before acting on them','Always works in agreed scope; flags any proposed change before touching it','Treats scope like a contract — nothing changes without a reason and agreement']},
      {id:'d4', text:'Do they spot dependencies on other teams or systems before those dependencies turn into blockers?',
       opts:['Never checks — gets blocked by things they could have seen coming','Rarely looks ahead; blockers show up at the worst possible moment','Sometimes catches dependencies early; misses the less obvious ones','Usually maps dependencies before starting; catches most risks','Consistently identifies and resolves dependencies before they can block delivery','Catches risks others miss entirely — coordinates with other teams before the sprint even starts']},
      {id:'d5', text:'When they fall behind, how do they handle it?',
       opts:['Says nothing until it can no longer be hidden','Slow to react; recovery is disorganised and communication is delayed','Eventually adjusts, but the communication is vague and late','Usually catches slippage early and shares a clear revised plan','Flags it fast, gives a concrete new plan, keeps the impact small','Rarely slips — and when they do, the team barely notices']},
      {id:'d6', text:'Do they know when their own work is actually ready to ship — or do they call it done too early (or hold it too long)?',
       opts:['Frequently says done when it is not — others find the gaps in review or production','Often ships work that needs significant fixes after merging','Judgment is inconsistent — sometimes too early, sometimes over-polished for no reason','Usually judges release readiness correctly','Consistently ships at the right time — not before, not late','Their definition of done is the team standard']},
    ]
  },
  {
    key:'quality', label:'Quality', weight:20,
    sub:'code readability, bug rate, reviews, non-functional concerns, tests, tech debt',
    badge:'bt',
    questions:[
      {id:'q1', text:'Is their code easy for others to read, follow, and maintain?',
       opts:['Code is messy and unclear — others have to rewrite or heavily fix it to maintain it','Often hard to follow; requires significant cleanup','Inconsistent — some areas clean, others a mess','Generally readable with occasional structure issues','Consistently clean, logical, and easy to follow','Their code is the team\'s example of how it should look']},
      {id:'q2', text:'How often do bugs in their work get caught in review, staging, or production — instead of by themselves?',
       opts:['Frequent production bugs trace back to their code — trust in their output is low','Several bugs per cycle escape their hands','Occasional bugs slip through — about average for the team','Rare bugs; catches most issues themselves before review','Almost never introduces bugs that reach review','Zero-escape track record — catches everything before it leaves their hands']},
      {id:'q3', text:'How useful are the code reviews they give to others?',
       opts:['Rubber-stamps PRs without looking — reviews add no value','Only surface-level comments; misses logic errors and real issues','Catches some things but misses important ones','Good reviews — catches most real issues, gives useful and clear feedback','Thorough and educational — improves both the code and the author\'s understanding','Best reviewer on the team — their comments make everyone better']},
      {id:'q4', text:'Do they think about performance, security, and scalability — not just whether the feature works?',
       opts:['No awareness — writes code that works functionally but ignores everything else','Rarely thinks about it; issues get caught in review by others','Thinks about it when reminded but does not do it consistently on their own','Usually considers these for the context they are working in','Consistently applies performance, security, and scalability thinking as part of normal implementation','Catches these gaps in others\' code too — raises the whole team\'s awareness']},
      {id:'q5', text:'Do they write tests that actually catch real bugs — or skip testing, or write tests that pass but miss real issues?',
       opts:['No tests written','Tests are rare or too shallow to catch anything real','Sometimes writes useful tests; inconsistent and often misses critical paths','Usually writes meaningful tests that cover the main flows','Consistently writes tests that catch real issues; coverage is reliable','Their tests are the team\'s safety net — others rely on what they cover']},
      {id:'q6', text:'When they work in an existing codebase, do they leave it in better shape than they found it?',
       opts:['Always leaves it worse — adds shortcuts, skips cleanup, creates new problems','Often creates new debt without flagging it; code degrades in areas they touch','Neutral — leaves things roughly the same as they found them','Usually leaves things slightly better; cleans up obvious issues they encounter','Consistently improves the areas they touch — cleaner naming, less duplication, better structure','Actively reduces tech debt beyond their own task; raises code quality system-wide']},
    ]
  },
  {
    key:'execution', label:'Execution Discipline', weight:18,
    sub:'ticket hygiene, WIP control, planning, follow-through, context switching, standup',
    badge:'ba',
    questions:[
      {id:'e1', text:'Do they keep their tickets and task status up to date in the project tracker?',
       opts:['Tracker is almost never updated — no one can trust it to reflect reality','Rarely updates; the team is surprised by the real state of their work','Updates inconsistently — tracker is a rough guess at best','Usually current with occasional lags of a day or two','Consistently accurate; the tracker is always trustworthy for their tasks','Real-time and granular — the tracker is the source of truth for their work at all times']},
      {id:'e2', text:'Do they finish what they started before picking up something new?',
       opts:['Constantly picks up new tasks mid-stream; trails of unfinished work pile up every sprint','Frequently starts new work before finishing existing tasks — WIP is out of control','Sometimes leaves tasks hanging to start new ones','Usually completes before taking on new work','Rarely overloads themselves; strong finish-before-start habit','Single-focus execution — also helps others finish before they pick up anything new']},
      {id:'e3', text:'Do they think through a task before jumping into it — or do they start coding and figure it out as they go?',
       opts:['Dives in immediately with no thinking; frequently needs to restart after hitting foreseeable problems','Minimal upfront planning; figures out the approach mid-implementation','Some planning, but occasionally skips it on familiar work and gets burned','Usually spends appropriate time thinking before coding','Consistently thinks through a task before starting — prevents mid-task pivots','Their pre-task thinking is so thorough it eliminates surprises for everyone working with them']},
      {id:'e4', text:'Do they close tasks on their own — or do they need to be reminded or chased?',
       opts:['Needs multiple reminders for the same thing — work stalls unless someone follows up','Often forgets or delays commitments without being nudged','Sometimes follows through alone; needs reminders for anything longer-horizon','Rarely needs reminders; mostly manages their own work','Fully self-managing — tracks and closes all commitments without any prompting','Zero follow-up needed — closes loops before anyone thinks to ask']},
      {id:'e5', text:'When priorities shift and they have to switch to something else, do they keep their existing work in good shape?',
       opts:['Context switches derail everything — prior tasks are abandoned or forgotten','Frequent drops when priorities change; resuming prior work takes significant re-onboarding','Can switch but the prior task usually suffers or stalls','Handles priority shifts reasonably; picks prior work back up cleanly','Manages context switches well; documents state before switching, resumes efficiently','Switches without losing anything — keeps all active tracks moving at the same time']},
      {id:'e6', text:'Do they come to standups prepared and give updates that are useful and to the point?',
       opts:['Unprepared or absent — contributions are rambling, off-topic, or slow the whole group down','Often vague or unnecessarily long; team has to dig for the real update','Adequate most of the time; occasionally unprepared or unfocused','Usually prepared with a clear, concise update that gives the team useful signal','Consistently clear, brief, and accurate — flags anything cross-team that matters','Their standup update is the model the rest of the team tries to match']},
    ]
  },
  {
    key:'decision', label:'Decision Making', weight:12,
    sub:'tradeoff thinking, knowing when to ask, evidence use, ambiguity, escalation',
    badge:'bb',
    questions:[
      {id:'dm1', text:'When there are two valid ways to do something, do they think through the tradeoffs — or just pick one and go?',
       opts:['Picks the first option without thinking through alternatives','Rarely explains tradeoffs; decisions feel arbitrary or based on habit','Sometimes evaluates tradeoffs, but needs significant prompting on harder calls','Usually reasons through tradeoffs and makes a clearly justified choice','Consistently thinks through tradeoffs and explains the reasoning clearly','Their tradeoff thinking is referenced by the team as the way it should be done']},
      {id:'dm2', text:'Do they know when to make a decision themselves — and when to check with others before proceeding?',
       opts:['Gets it wrong consistently — decides things that needed alignment, or asks permission for trivial things','Poor calibration; causes friction by either over-escalating or going solo when they should not','Inconsistent — misjudges often enough to create problems','Usually calibrates well; rare misjudgments either way','Consistently knows which decisions are theirs to make vs which need sign-off','Team fully trusts their independence — knows they will pull others in when it actually matters']},
      {id:'dm3', text:'Do they back their decisions with reasoning or data — or mostly go on gut and say "I think this is right"?',
       opts:['Almost entirely gut-based — reasoning is rarely shared or available','Rarely backs decisions with evidence; hard to understand why they chose what they did','Sometimes brings reasoning; defaults to instinct when it is inconvenient to look into it','Usually supports decisions with relevant evidence or clear reasoning','Consistently makes their thinking visible and challengeable; brings data or structured reasoning','Rigorously evidence-based — surfaces data others do not think to look for']},
      {id:'dm4', text:'When the requirements are incomplete or unclear, can they move forward — without freezing up or making reckless guesses?',
       opts:['Cannot proceed without full clarity — any ambiguity stops the work entirely','Struggles significantly; either freezes or makes assumptions that cause major rework','Sometimes finds a path forward; depends heavily on how familiar the domain is','Usually finds a safe path forward and flags their assumptions clearly','Comfortable moving forward under ambiguity; assumptions are explicit and validated early','Thrives in ambiguity — creates structure where there was none and unblocks others around them']},
      {id:'dm5', text:'Do they know what to bring to their manager versus what to handle themselves?',
       opts:['Frequently escalates trivial decisions, or sits on serious issues that needed escalation','Poor calibration — makes the wrong call often in both directions','Sometimes escalates correctly; pattern is unpredictable','Usually escalates at the right level; brings problems with enough context','Consistently well-calibrated — escalates with a problem statement and a proposed solution','Sets the escalation standard for the team; helps others understand what should and should not go up the chain']},
    ]
  },
  {
    key:'ownership', label:'Ownership', weight:15,
    sub:'outcome care, true completion, accountability, proactive spotting, knowledge sharing',
    badge:'bg',
    questions:[
      {id:'o1', text:'Do they care whether what they built actually works in production — or do they move on the moment the PR is merged?',
       opts:['Completely disengages after merging — production issues in their features are someone else\'s problem','Rarely follows up after shipping; only engages when explicitly asked to look into something','Checks in occasionally but not in any consistent way','Usually monitors their features after release and acts when something is off','Consistently tracks real-world outcomes and takes action when something is not working','Treats a production bug in their feature as personally unacceptable — long after it shipped']},
      {id:'o2', text:'When they say something is done, can the team trust that it is actually, fully done?',
       opts:['"Done" means the happy path works — edge cases, docs, and cleanup are left for others to find','Frequently leaves loose ends — missing states, unhandled errors, or known issues left as follow-ups','Sometimes fully complete; sometimes requires a follow-up to close what was left hanging','Usually fully complete with only minor loose ends','Their "done" is reliable — when they close a ticket, it is fully handled','Their definition of done is the team gold standard — nothing is ever half-finished']},
      {id:'o3', text:'When something goes wrong in their area, do they own it — or find reasons it was not their fault?',
       opts:['Deflects, disappears, or shifts blame when their work causes issues','Reluctant to own mistakes; accepts responsibility slowly and only when it is undeniable','Takes some ownership but inconsistently — depends on the situation','Usually takes clear responsibility and works to fix and prevent the issue','Consistently owns problems in their area and leads the resolution with full accountability','Takes ownership before anyone assigns it; does a full review of what went wrong and how to prevent it happening again']},
      {id:'o4', text:'Do they flag problems or risks they notice — even if it is not their assigned task and no one asked them to look?',
       opts:['Only works on explicitly assigned tasks — does not notice or raise problems outside their own work','Rarely raises issues outside their assigned scope','Occasionally spots and raises issues; initiative is inconsistent','Usually acts when a problem is clearly visible; good initiative when something is obviously wrong','Frequently identifies and flags risks before they escalate or affect others','Creates ways to prevent recurring problems; acts on things others scroll past']},
      {id:'o5', text:'Do they document and share what they know — or keep it to themselves, making them a knowledge bottleneck?',
       opts:['Knowledge is completely siloed — no documentation or sharing; others must reverse-engineer their work','Rarely documents or shares; does it only when they have spare time, which is never','Occasionally documents or shares but inconsistently','Usually leaves reasonable documentation and shares relevant learnings with the team','Consistently documents decisions, writes clear handoff notes, and proactively shares knowledge','Goes out of their way to raise the team\'s understanding — the knowledge they produce outlives the features they built']},
    ]
  },
  {
    key:'technical', label:'Technical Judgment', weight:6,
    sub:'scope boundaries, constraints, failure paths, technical depth, system flow, flagging bad requirements',
    badge:'br',
    questions:[
      {id:'tj1', text:'When given a task, do they understand not just what to build — but what they should NOT build or include?',
       opts:['Builds whatever seems relevant without reading the requirements; frequent wrong additions or missing pieces','Often misreads the boundaries; builds things not asked for or skips things that were clearly required','Sometimes reads scope correctly but misses the less obvious exclusions or constraints','Usually maps scope correctly, including most "do not do" constraints','Consistently identifies the full picture — what to build, what to exclude, and what is implied','Defines scope so precisely it becomes the team reference; spots missing constraints in the ticket before anyone else']},
      {id:'tj2', text:'Before committing to an approach, do they check what the system or stack can and cannot do — or do they commit and then hit avoidable dead ends?',
       opts:['Commits to approaches without checking whether they are feasible — hits avoidable dead ends regularly','Often ignores system limits until they block implementation mid-task','Sometimes checks upfront but not consistently; mid-task surprises are common','Usually verifies the key constraints before committing; rare avoidable blockers','Consistently checks what the system can and cannot do before designing a solution','Surfaces hidden limits others miss — platform limits, rate limits, integration constraints']},
      {id:'tj3', text:'Do they think about what happens when things go wrong — errors, timeouts, partial failures — or only about when things go right?',
       opts:['Only handles the success case — errors either crash silently or are not handled at all','Adds minimal error handling; misses important failure scenarios','Handles the common failure cases; misses less obvious ones like timeouts or partial writes','Usually thinks through failure paths appropriate to the context','Consistently designs for failure — error paths are as well thought through as the success path','Failure-first mindset — thinks about what breaks, how it breaks, and how to recover before writing the first line']},
      {id:'tj4', text:'Do they have the technical knowledge expected for their role and level — or do they have gaps that slow them or others down?',
       opts:['Missing foundational knowledge — knowledge gaps regularly block their own progress','Below the expected level; relies heavily on others for concepts they should know well','Adequate for straightforward tasks; gaps appear on complex or unfamiliar problems','Good foundation; handles most role-level problems independently and reliably','Strong, broad technical depth; handles complex and novel problems without leaning on others','Expert level — the go-to person for hard technical questions; actively raises the team\'s technical knowledge']},
      {id:'tj5', text:'Before changing something shared, do they trace how it connects to the rest of the system — or do they make isolated changes and cause unexpected breakages elsewhere?',
       opts:['Makes changes without understanding how they affect other parts — unintended breakages are frequent','Often makes isolated changes without thinking about downstream impact','Has a surface-level understanding; occasionally causes unintended side effects','Usually traces the relevant connections before changing shared code','Consistently maps how components interact before implementing; changes are safe and predictable','Deep system intuition — traces multi-layer interactions quickly and catches side effects others would only find in production']},
      {id:'tj6', text:'When a requirement is unclear, won\'t technically work, or will cause problems — do they say so early, or stay quiet and build it anyway?',
       opts:['Does not ask when blocked or confused — just proceeds on wrong assumptions or silently stops','Raises concerns very late, after significant work is already done and sunk','Sometimes flags issues early but inconsistently; may proceed on guesses when it feels uncomfortable to push back','Usually raises unclear or risky requirements early and comes with a proposed alternative','Consistently flags problems before starting — with a concrete alternative ready','Stress-tests requirements before writing any code; regularly uncovers gaps and contradictions others only find mid-implementation']},
      {id:'tj7', text:'Do they understand what the feature must reject or prevent — the inputs, states, and flows it should NOT allow?',
       opts:['No awareness — builds systems that accept inputs or allow states that should clearly be rejected','Rarely thinks about rejection logic or guard conditions until a bug surfaces','Handles obvious cases like empty input or null, but misses product-level constraints and business rules','Usually identifies what the feature must reject and builds appropriate guards','Consistently models both the happy path and the explicit rejection boundaries','Treats constraints as core design — defines what the system must not allow as rigorously as what it should do']},
    ]
  },
  {
    key:'communication', label:'Communication', weight:7,
    sub:'async writing, sync clarity, proactive updates, receiving feedback, cross-team alignment',
    badge:'bp',
    questions:[
      {id:'c1', text:'Are their written messages — Slack, tickets, docs — clear and easy to understand on the first read?',
       opts:['Written messages are consistently unclear or so brief they create more confusion than they resolve','Often too long, too short, or poorly structured; people regularly have to ask for clarification','Mixed — sometimes clear, sometimes hard to follow; quality varies','Generally clear; occasional ambiguity but rarely causes real problems','Consistently clear, well-structured, and complete across all channels','Their tickets and docs are the team\'s reference for how written communication should look']},
      {id:'c2', text:'Are they clear and useful in meetings and real-time discussions — or do they ramble, stay silent, or go off-topic?',
       opts:['Does not contribute meaningfully — silent, off-topic, or actively slows the group down','Contributions are often unclear or confusing in group settings','Sometimes effective in meetings; inconsistent depending on the topic or setting','Usually articulate and on-point; adds clear value in group discussions','Consistently communicates with clarity and confidence in real-time; keeps discussions productive','Elevates meeting quality — their contributions unstick discussions and move the team forward']},
      {id:'c3', text:'Do they share progress, blockers, and plan changes without being asked — or does the team have to chase them for updates?',
       opts:['Almost never gives updates without being asked; the team is routinely left guessing','Rarely updates proactively; only shares information after being directly asked','Sometimes shares updates without prompting; inconsistent, and often after the relevant moment has passed','Usually keeps the team informed without being nudged','Consistently proactive — the team always knows what they are doing, what changed, and why','Their updates set the team\'s rhythm; pre-empt questions before they are asked']},
      {id:'c4', text:'When they receive feedback — in code review, a 1:1, or a retro — do they actually apply it, or repeat the same mistake next time?',
       opts:['Dismisses or argues against feedback; the exact same issues come up again and again','Accepts feedback in the moment but does not retain it — patterns repeat across multiple reviews','Sometimes applies feedback to the immediate context but forgets it when the same situation comes up elsewhere','Takes feedback well and usually applies it going forward; occasional regressions','Consistently internalises feedback and applies it broadly; the same point rarely needs to be raised twice','Actively seeks feedback, applies it systematically, and flags when they have addressed a recurring issue — makes reviewers\' lives easier']},
      {id:'c5', text:'Do they keep other teams and stakeholders in the loop when something affects them — or do they cause surprises?',
       opts:['Does not coordinate cross-team; other teams are regularly surprised by decisions or changes that affect them','Rarely aligns with external teams; coordination gaps show up as integration or timeline problems','Sometimes coordinates effectively; external teams cannot fully rely on them for alignment','Usually keeps adjacent teams and stakeholders informed when it matters','Consistently ensures cross-team alignment before it becomes a problem; trusted by external teams','Proactive cross-team coordinator — identifies alignment needs others miss and ensures all relevant parties are in sync']},
    ]
  },
];;
