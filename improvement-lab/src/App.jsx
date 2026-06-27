import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle,
  ClipboardText,
  Lightbulb,
  Plus,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react";

const stages = [
  { name: "Change Idea", prompt: "What small change could we test?" },
  { name: "Plan", prompt: "What change can we test?" },
  { name: "Do", prompt: "What will we observe?" },
  { name: "Study", prompt: "What did we learn?" },
  { name: "Act", prompt: "What should happen next?" },
];

const checks = [
  ["evidence", "Evidence", "Is this claim supported by credible data?"],
  ["context", "Context", "Does it fit this school and these learners?"],
  ["ethics", "Ethics", "Could it harm fairness, privacy, or wellbeing?"],
  ["feasibility", "Feasibility", "Can a small, realistic test be run?"],
];

const defaultCheckState = Object.fromEntries(checks.map(([key]) => [key, false]));

const researchBackedPatterns = [
  {
    id: "attendance",
    match: [
      "attendance",
      "absent",
      "absence",
      "absentee",
      "chronic",
      "late",
      "lateness",
      "belonging",
      "dropout",
      "engagement",
      "disengaged",
      "retention",
      "school refusal",
    ],
    title: "Attendance and belonging",
    source: "IES What Works Clearinghouse dropout-prevention guidance and CASEL schoolwide SEL implementation guidance",
    sourceUrl: "https://ies.ed.gov/ncee/wwc/practiceguide/24",
    recommendation: (topic) => `For ${topic}, test a two-week belonging-and-attendance routine with one cohort: identify students showing early attendance risk, assign each student a named adult check-in, use a short learner voice prompt to understand barriers, and coordinate one practical family contact focused on support rather than compliance.`,
    adaptedRecommendation: (topic, constraint) => {
      const signals = getConstraintSignals(constraint);
      if (signals.noFamilyContact || signals.existingTime || signals.lowWorkload) {
        return `For ${topic}, revise the test into a two-week in-school belonging routine: use existing mentor or advisory time for a named adult check-in, ask one brief learner-voice question about barriers to attendance, and agree on one support action that can be completed during the normal school day. Do not add family outreach or a new workload requirement during this first cycle.`;
      }
      return `For ${topic}, revise the test around the practitioner constraint: keep the named adult check-in and learner-voice prompt, but replace any step that does not fit the setting with one support action the team can complete inside current routines.`;
    },
    rationale: "Research-based dropout-prevention guidance emphasizes early identification, adult advocacy, engagement, and targeted supports. SEL implementation guidance also treats belonging and relationships as conditions for learning, not as side issues.",
    test: "Run the routine with one grade/team for 10 school days before expanding.",
    data: "Track daily attendance, late arrivals, check-in completion, student belonging pulse responses, and staff workload.",
  },
  {
    id: "writing",
    match: ["writing", "essay", "paragraph", "composition", "argument", "literacy", "reading response", "explain", "revision"],
    title: "Writing and literacy",
    source: "IES What Works Clearinghouse practice guide: Teaching Secondary Students to Write Effectively",
    sourceUrl: "https://ies.ed.gov/ncee/wwc/practiceguide/22",
    recommendation: (topic) => `For ${topic}, test an explicit Model-Practice-Reflect writing cycle: model one target strategy, let students practise with a shared rubric or exemplar, then use a short reflection to help them explain what improved in their writing and what still needs revision.`,
    rationale: "WWC writing guidance highlights explicit strategy instruction and structured practice/reflection as evidence-based ways to improve secondary writing.",
    test: "Try one writing strategy in one unit or with one class section before scaling.",
    data: "Compare a short pre/post writing sample, rubric evidence on the target skill, student reflection quality, and teacher notes on misconceptions.",
  },
  {
    id: "math",
    match: ["math", "mathematics", "numeracy", "algebra", "fractions", "problem solving", "word problem", "calculation", "number"],
    title: "Mathematics learning",
    source: "IES What Works Clearinghouse math practice guides",
    sourceUrl: "https://ies.ed.gov/ncee/wwc/PracticeGuide/16",
    recommendation: (topic) => `For ${topic}, test a structured mathematical talk routine: choose one routine and one non-routine problem, pre-teach the essential vocabulary, ask students to represent their thinking visually, and close with a reflection on which strategy worked and why.`,
    rationale: "WWC math guidance points to systematic instruction, mathematical language, visual representations, and student monitoring/reflection as research-supported practices.",
    test: "Use the routine in two lessons with one class or intervention group.",
    data: "Collect exit tickets, samples of visual representations, student explanation notes, and which misconceptions remain.",
  },
  {
    id: "behavior",
    match: ["behavior", "behaviour", "disruption", "discipline", "classroom management", "off task", "defiance", "expectation", "climate"],
    title: "Behavior and classroom climate",
    source: "IES What Works Clearinghouse behavior practice guides",
    sourceUrl: "https://ies.ed.gov/ncee/wwc/practiceguide/31",
    recommendation: (topic) => `For ${topic}, test a prevention-first classroom routine: define the specific behavior and its trigger, co-teach one clear replacement expectation, reinforce the desired behavior immediately, and adjust the environment before escalating consequences.`,
    rationale: "WWC behavior guidance emphasizes identifying the specific behavior and conditions around it, modifying the environment, and teaching/reinforcing replacement skills.",
    test: "Test one routine in one setting for two weeks, with teacher reflection after each lesson block.",
    data: "Track frequency/context of the target behavior, positive reinforcement counts, student response, and teacher perception of classroom climate.",
  },
  {
    id: "sel",
    match: ["wellbeing", "well-being", "sel", "social emotional", "anxiety", "stress", "confidence", "motivation", "relationship", "belong"],
    title: "Wellbeing and learner voice",
    source: "CASEL schoolwide SEL framework and continuous-improvement guidance",
    sourceUrl: "https://schoolguide.casel.org/focus-area-4/continuously-improve-schoolwide-sel-implementation/",
    recommendation: (topic) => `For ${topic}, test a learner-voice and relationship routine: use a three-question pulse check, identify one common barrier, co-design one support with students, and review whether the support improves participation or confidence after two weeks.`,
    rationale: "CASEL describes SEL as schoolwide, relationship-centered work that should be improved through iterative cycles such as PDSA.",
    test: "Start with one advisory group, class, or grade-level team.",
    data: "Track pulse-check patterns, student comments, participation changes, and any unintended wellbeing or workload effects.",
  },
  {
    id: "assessment",
    match: ["assessment", "feedback", "grading", "grade", "rubric", "formative", "misconception", "mastery", "progress"],
    title: "Feedback and formative assessment",
    source: "Research-informed formative assessment practice: clear criteria, timely feedback, and evidence of student response",
    sourceUrl: "https://ies.ed.gov/ncee/wwc/practiceguides",
    recommendation: (topic) => `For ${topic}, test a feedback-for-action cycle: clarify one success criterion, give students one focused piece of feedback, require a visible revision or response, and check whether the next attempt improves on that criterion.`,
    rationale: "Formative assessment is most useful when evidence changes teaching or learning action. A small test should examine whether feedback is understood and used, not just delivered.",
    test: "Use one criterion with one task before applying it across a full unit.",
    data: "Compare first and revised attempts, student explanation of the feedback, teacher reteaching notes, and time required.",
  },
];

const defaultPattern = {
  id: "general",
  title: "General improvement inquiry",
  source: "IES What Works Clearinghouse practice-guide approach and improvement-science PDSA logic",
  sourceUrl: "https://ies.ed.gov/ncee/wwc/practiceguides",
  recommendation: (topic) => `For ${topic}, test one research-informed change with the people closest to the work: define the specific learner need, identify the likely barrier, choose one evidence-aligned practice, and run a short PDSA cycle before making any wider decision.`,
  rationale: "WWC practice guides translate research and practitioner expertise into actionable recommendations; improvement science keeps the first step small enough to learn from local evidence.",
  test: "Run a two-week test with one cohort, team, or classroom before scaling.",
  data: "Collect one outcome measure, one process measure, learner/practitioner feedback, and a note about unintended effects.",
};

function getConstraintSignals(constraint) {
  const normalized = constraint.toLowerCase();
  return {
    noFamilyContact: /(no|not|cannot|can't|avoid|without).{0,35}(family|parent|guardian|home|caregiver)|family contact/.test(normalized),
    noNewTool: /(no|not|cannot|can't|avoid|without).{0,35}(new tool|technology|platform|app|software)/.test(normalized),
    existingTime: /(existing|current|already|mentor|advisory|homeroom|lesson time|class time)/.test(normalized),
    lowWorkload: /(workload|capacity|time|busy|burden|extra staff|additional staff|too much)/.test(normalized),
    studentVoice: /(student voice|learner voice|student feedback|learner feedback|survey|interview)/.test(normalized),
  };
}

function getResearchRecommendation(topic, practitionerConstraint = "") {
  const normalized = `${topic} ${practitionerConstraint}`.toLowerCase();
  const pattern = researchBackedPatterns.find((item) => item.match.some((term) => normalized.includes(term))) || defaultPattern;
  const constraint = practitionerConstraint.trim();
  const baseRecommendation = constraint && pattern.adaptedRecommendation
    ? pattern.adaptedRecommendation(topic, constraint)
    : pattern.recommendation(topic);
  const genericAdaptation = constraint && !pattern.adaptedRecommendation
    ? ` Revised for local fit: ${constraint}. Keep the evidence-based core, but reduce the test to the smallest version that practitioners can run safely in their context.`
    : "";
  return {
    ...pattern,
    constraint,
    recommendationText: `${baseRecommendation}${genericAdaptation}`,
  };
}

export function App() {
  const [stage, setStage] = useState(0);
  const [checksState, setChecksState] = useState(defaultCheckState);
  const [reflection, setReflection] = useState("");
  const [plan, setPlan] = useState("");
  const [feedback, setFeedback] = useState("");
  const [topicDraft, setTopicDraft] = useState("");
  const [topic, setTopic] = useState("");
  const [revisionDraft, setRevisionDraft] = useState("");
  const [appliedRevision, setAppliedRevision] = useState("");
  const [recommendationVersion, setRecommendationVersion] = useState(1);
  const [dataEntry, setDataEntry] = useState({ measure: "", result: "", source: "", note: "" });
  const [dataLog, setDataLog] = useState([]);
  const [learning, setLearning] = useState("");
  const [actionDecision, setActionDecision] = useState("");
  const [actionReason, setActionReason] = useState("");

  const selectedCount = Object.values(checksState).filter(Boolean).length;
  const canAdvance = stage === 0
    ? selectedCount >= 3
    : stage === 1
      ? plan.trim().length >= 24
      : stage === 2
        ? dataLog.length >= 1
        : stage === 3
          ? learning.trim().length >= 20
          : true;
  const summary = useMemo(
    () => `${selectedCount}/4 decision checks completed`,
    [selectedCount],
  );
  const tailoredRecommendation = useMemo(
    () => (topic ? getResearchRecommendation(topic, appliedRevision) : null),
    [topic, appliedRevision],
  );

  function toggleCheck(key) {
    setChecksState((current) => ({ ...current, [key]: !current[key] }));
    setFeedback("");
  }

  function tailorRecommendation() {
    const cleanedTopic = topicDraft.trim();
    if (!cleanedTopic) {
      setFeedback("Describe a problem of practice first so the recommendation can be tailored to your context.");
      return;
    }
    setTopic(cleanedTopic);
    setChecksState(defaultCheckState);
    setRevisionDraft("");
    setAppliedRevision("");
    setRecommendationVersion(1);
    setFeedback("Tailored recommendation ready. Now test it against evidence, context, ethics, and feasibility.");
  }

  function reviseRecommendation() {
    const cleanedRevision = revisionDraft.trim();
    if (!topic) {
      setFeedback("Describe your problem of practice before revising a recommendation.");
      return;
    }
    if (!cleanedRevision) {
      setFeedback("Explain what does not fit or what you need to change before revising the recommendation.");
      return;
    }
    setAppliedRevision(cleanedRevision);
    setRecommendationVersion((current) => current + 1);
    setChecksState(defaultCheckState);
    setFeedback("Revised recommendation ready. Re-check it against evidence, context, ethics, and feasibility.");
  }

  function updateDataEntry(field, value) {
    setDataEntry((current) => ({ ...current, [field]: value }));
  }

  function addDataPoint() {
    if (!dataEntry.measure.trim() || !dataEntry.result.trim()) {
      setFeedback("Add a measure and an observation or result before saving the data point.");
      return;
    }
    setDataLog((current) => [...current, { ...dataEntry, id: `${Date.now()}-${current.length}` }]);
    setDataEntry({ measure: "", result: "", source: "", note: "" });
    setFeedback("Data point saved. You can add more observations or move to Study when ready.");
  }

  function nextStage() {
    if (stage === 0 && !topic) {
      setFeedback("Generate a tailored recommendation before moving to the PDSA plan.");
      return;
    }
    if (!canAdvance) {
      const prompts = [
        "Choose at least three decision checks before moving on.",
        "Write a concise PDSA test before moving on.",
        "Save at least one data point before moving on to Study.",
        "Record what you learned from the data before choosing an action.",
      ];
      setFeedback(prompts[stage]);
      return;
    }
    setFeedback("");
    setStage((current) => Math.min(current + 1, stages.length - 1));
  }

  function backStage() {
    setFeedback("");
    setStage((current) => Math.max(current - 1, 0));
  }

  function complete() {
    if (stage === 4 && (!actionDecision || actionReason.trim().length < 16)) {
      setFeedback("Choose Adopt, Adapt, or Abandon, then explain why before completing the decision lab.");
      return;
    }
    setFeedback("Reflection saved. Your decision notes are ready to take into an Improvement Leadership Brief.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Learning progress">
        <div className="brand">
          <div className="brand-mark"><Sparkle size={20} weight="fill" /></div>
          <div>
            <p className="brand-title">Improvement Lab</p>
            <p className="brand-subtitle">Responsible AI for school leaders</p>
          </div>
        </div>

        <div className="side-intro">
          <p className="eyebrow">LEARNING JOURNEY</p>
          <h1>From AI suggestion to responsible decision.</h1>
          <p>Use improvement science to test an AI recommendation before acting on it.</p>
        </div>

        <ol className="stage-list">
          {stages.map((item, index) => (
            <li className={`stage ${index === stage ? "active" : ""} ${index < stage ? "done" : ""}`} key={item.name}>
              <button type="button" onClick={() => setStage(index)} aria-current={index === stage ? "step" : undefined}>
                <span className="stage-number">{index < stage ? <Check size={16} weight="bold" /> : index + 1}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.prompt}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="progress-wrap">
          <div className="progress-copy"><span>Progress</span><span>Step {stage + 1} of 5</span></div>
          <div className="progress-track"><span style={{ width: `${((stage + 1) / 5) * 100}%` }} /></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="lesson-label"><ShieldCheck size={19} weight="fill" /> Decision lab</div>
          <button className="save-button" type="button" onClick={complete}>Save reflection</button>
        </header>

        {stage === 0 && (
          <section className="content-grid" aria-labelledby="aim-heading">
            <div className="main-column">
              <p className="eyebrow blue">STEP 1 · CHANGE IDEA</p>
              <h2 id="aim-heading">Begin with your own problem of practice.</h2>
              <p className="lead">Responsible improvement starts with local context. Describe the challenge you want to investigate, then generate a recommendation designed for that situation.</p>

              <section className="topic-builder" aria-labelledby="topic-heading">
                <div className="topic-builder-copy">
                  <span className="topic-icon"><Sparkle size={18} weight="fill" /></span>
                  <div><h3 id="topic-heading">What do you want to improve?</h3><p>Name a learner outcome, leadership challenge, or school-based concern.</p></div>
                </div>
                <div className="topic-controls">
                  <label className="sr-only" htmlFor="topic">Problem of practice</label>
                  <input id="topic" value={topicDraft} onChange={(event) => setTopicDraft(event.target.value)} placeholder="e.g., Grade 9 attendance and student belonging" />
                  <button className="tailor-button" type="button" onClick={tailorRecommendation}>Tailor with AI <Sparkle size={17} weight="fill" /></button>
                </div>
                {topic && <p className="topic-confirmation"><CheckCircle size={17} weight="fill" /> Recommendation tailored to: <strong>{topic}</strong></p>}
              </section>

              <article className="ai-recommendation">
                <div className="recommendation-topline"><span><Sparkle size={17} weight="fill" /> AI-GENERATED RECOMMENDATION</span><span>Version {recommendationVersion}</span></div>
                {topic ? (
                  <>
                    <div className="recommendation-domain">{tailoredRecommendation.title}</div>
                    <blockquote>“{tailoredRecommendation.recommendationText}”</blockquote>
                    {tailoredRecommendation.constraint && <p className="revision-applied"><strong>Revision applied:</strong> {tailoredRecommendation.constraint}</p>}
                    <div className="recommendation-evidence">
                      <p><strong>Research basis:</strong> {tailoredRecommendation.rationale}</p>
                      <p><strong>Source:</strong> <a href={tailoredRecommendation.sourceUrl} target="_blank" rel="noreferrer">{tailoredRecommendation.source}</a></p>
                      <p><strong>Small test:</strong> {tailoredRecommendation.test}</p>
                      <p><strong>Data to collect:</strong> {tailoredRecommendation.data}</p>
                    </div>
                    <p className="recommendation-note">Before acting, validate this proposal with local evidence, human judgement, privacy safeguards, and the people affected.</p>
                  </>
                ) : (
                  <>
                    <blockquote className="placeholder-recommendation">Your tailored recommendation will appear here.</blockquote>
                    <p className="recommendation-note">It will be grounded in the problem of practice you enter above—not a one-size-fits-all solution.</p>
                  </>
                )}
              </article>

              {topic && <section className="revision-builder" aria-labelledby="revision-heading">
                <div><p className="eyebrow">PRACTITIONER JUDGEMENT</p><h3 id="revision-heading">Not applicable? Change the recommendation.</h3><p>Explain what does not fit your setting, who needs to be involved, or what constraint the recommendation missed.</p></div>
                <label className="sr-only" htmlFor="revision">What should change?</label>
                <textarea id="revision" value={revisionDraft} onChange={(event) => setRevisionDraft(event.target.value)} placeholder="e.g., We cannot add a new tool this term; the intervention must use existing mentor time and include student voice." />
                <button className="revision-button" type="button" onClick={reviseRecommendation}>Revise recommendation <Sparkle size={16} weight="fill" /></button>
              </section>}

              <div className="question-block">
                <div>
                  <h3>What should be examined first?</h3>
                  <p>Select the checks that would help you make a responsible decision.</p>
                </div>
                <span className="selection-count">{summary}</span>
              </div>

              <div className={`check-grid ${topic ? "" : "inactive"}`}>
                {checks.map(([key, label, description]) => (
                  <button className={`check-card ${checksState[key] ? "selected" : ""}`} type="button" key={key} onClick={() => toggleCheck(key)} aria-pressed={checksState[key]} disabled={!topic}>
                    <span className="check-box">{checksState[key] && <Check size={16} weight="bold" />}</span>
                    <span><strong>{label}</strong><small>{description}</small></span>
                  </button>
                ))}
              </div>

              <div className="reflection-row">
                <label htmlFor="reflection"><span>Quick reflection</span>Which question matters most in your context, and why?</label>
                <textarea id="reflection" maxLength="300" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Write one observation from your school context…" />
                <p className="character-count">{reflection.length}/300</p>
              </div>
            </div>

            <aside className="insight-panel">
              <div className="insight-icon"><Lightbulb size={25} weight="fill" /></div>
              <p className="eyebrow">IMPROVEMENT SCIENCE LENS</p>
              <h3>Start small. Learn quickly.</h3>
              <p>A promising idea is not yet an improvement. A responsible leader asks what evidence is needed, whose experience matters, and what can safely be tested.</p>
              <div className="aim-card">
                <span>Suggested change idea</span>
                <strong>{tailoredRecommendation ? tailoredRecommendation.test : "Your tailored change idea will appear here after you describe a local problem of practice."}</strong>
              </div>
            </aside>
          </section>
        )}

        {stage === 1 && (
          <section className="single-stage" aria-labelledby="plan-heading">
            <p className="eyebrow blue">STEP 2 · PLAN</p>
            <h2 id="plan-heading">Design a small, ethical PDSA test.</h2>
            <p className="lead">Instead of implementing the AI recommendation school-wide, define one test that protects learner wellbeing and generates useful evidence.</p>
            <div className="plan-canvas">
              <div className="plan-card"><span>WHO?</span><strong>One small cohort and the practitioners closest to {topic || "the problem"}</strong></div>
              <div className="plan-card"><span>WHAT?</span><strong>Test one human-led change informed by the tailored AI inquiry</strong></div>
              <div className="plan-card"><span>MEASURE?</span><strong>Relevant outcomes, practitioner workload, and learner or stakeholder feedback</strong></div>
              <div className="plan-card"><span>SAFEGUARD?</span><strong>Teacher oversight, consent, and no student data upload</strong></div>
            </div>
            <label className="large-field" htmlFor="plan"><span>Your PDSA test</span>Describe one small change you would test, what you would measure, and how you would protect people.</label>
            <textarea id="plan" value={plan} onChange={(event) => setPlan(event.target.value)} placeholder="For two weeks, I would test…" />
          </section>
        )}

        {stage === 2 && <DoStage dataEntry={dataEntry} dataLog={dataLog} topic={topic} onChange={updateDataEntry} onAdd={addDataPoint} />}
        {stage === 3 && <StudyStage dataLog={dataLog} learning={learning} onLearningChange={setLearning} topic={topic} />}
        {stage === 4 && <ActStage decision={actionDecision} reason={actionReason} onDecision={setActionDecision} onReasonChange={setActionReason} topic={topic} />}

        <footer className="action-footer">
          <div>
            {feedback && <p className="feedback" role="status"><CheckCircle size={18} weight="fill" /> {feedback}</p>}
          </div>
          <div className="footer-actions">
            {stage > 0 && <button className="secondary-button" type="button" onClick={backStage}>Back</button>}
            {stage < stages.length - 1 ? <button className="primary-button" type="button" onClick={nextStage}>Continue to {stages[stage + 1].name}<ArrowRight size={19} weight="bold" /></button> : <button className="primary-button" type="button" onClick={complete}>Complete decision lab<Check size={19} weight="bold" /></button>}
          </div>
        </footer>
      </section>
    </main>
  );
}

function DoStage({ dataEntry, dataLog, topic, onChange, onAdd }) {
  return (
    <section className="single-stage data-stage" aria-labelledby="do-heading">
      <p className="eyebrow blue">STEP 3 · DO</p>
      <h2 id="do-heading">Collect small, useful pieces of data.</h2>
      <p className="lead">Record what happens during the test. Capture both measurable signals and the human experience around {topic || "your problem of practice"}.</p>

      <section className="data-form" aria-labelledby="data-form-heading">
        <div className="data-form-heading"><div><p className="eyebrow">DATA COLLECTION</p><h3 id="data-form-heading">Add an observation</h3></div><span>{dataLog.length} saved</span></div>
        <div className="data-grid">
          <label>Measure or question<input value={dataEntry.measure} onChange={(event) => onChange("measure", event.target.value)} placeholder="e.g., Attendance rate" /></label>
          <label>Observation or result<input value={dataEntry.result} onChange={(event) => onChange("result", event.target.value)} placeholder="e.g., 87% this week" /></label>
          <label>Source of evidence<input value={dataEntry.source} onChange={(event) => onChange("source", event.target.value)} placeholder="e.g., Attendance dashboard" /></label>
          <label>Context note<input value={dataEntry.note} onChange={(event) => onChange("note", event.target.value)} placeholder="e.g., Learners asked for check-ins" /></label>
        </div>
        <button className="add-data-button" type="button" onClick={onAdd}><Plus size={17} weight="bold" /> Save data point</button>
      </section>

      <section className="data-log" aria-live="polite" aria-labelledby="data-log-heading">
        <div className="data-log-header"><h3 id="data-log-heading">Collected data</h3><p>Keep it small, contextual, and connected to the test.</p></div>
        {dataLog.length ? (
          <div className="data-list">
            {dataLog.map((item) => <article className="data-item" key={item.id}><strong>{item.measure}</strong><span>{item.result}</span><small>{item.source || "Source not specified"}{item.note ? ` · ${item.note}` : ""}</small></article>)}
          </div>
        ) : <p className="empty-data">No data has been recorded yet. Start with one observation; improvement starts with what you can learn, not with perfect data.</p>}
      </section>
    </section>
  );
}

function StudyStage({ dataLog, learning, onLearningChange, topic }) {
  return (
    <section className="single-stage study-stage" aria-labelledby="study-heading">
      <p className="eyebrow blue">STEP 4 · STUDY</p>
      <h2 id="study-heading">Turn data into learning.</h2>
      <p className="lead">Study the evidence before deciding what to do next. Look for patterns, unintended consequences, and perspectives that need more attention in {topic || "your test"}.</p>

      <section className="study-evidence" aria-labelledby="study-evidence-heading">
        <div className="data-log-header"><h3 id="study-evidence-heading">Evidence to study</h3><p>{dataLog.length ? `${dataLog.length} data point${dataLog.length === 1 ? "" : "s"} collected during Do.` : "Return to Do to collect evidence first."}</p></div>
        {dataLog.length ? <div className="data-list">{dataLog.map((item) => <article className="data-item" key={item.id}><strong>{item.measure}</strong><span>{item.result}</span><small>{item.source || "Source not specified"}{item.note ? ` · ${item.note}` : ""}</small></article>)}</div> : <p className="empty-data">No data points are available yet.</p>}
      </section>

      <label className="learning-field" htmlFor="learning"><span>What did you learn from the data?</span>What pattern did you notice? What surprised you? Whose experience should shape the next decision?</label>
      <textarea id="learning" value={learning} onChange={(event) => onLearningChange(event.target.value)} placeholder="For example: Attendance improved slightly, but learner comments show that the weekly check-in matters more than the AI-generated reminder…" />
      <p className="character-count">{learning.length} characters</p>
    </section>
  );
}

function ActStage({ decision, reason, onDecision, onReasonChange, topic }) {
  const choices = [
    ["Adopt", "Use this approach more widely because the evidence is promising and the safeguards are in place."],
    ["Adapt", "Change the approach, then test again because the evidence or context suggests a better version is needed."],
    ["Abandon", "Stop this approach because the evidence, ethics, workload, or learner experience does not justify continuing."],
  ];
  return (
    <section className="single-stage act-stage" aria-labelledby="act-heading">
      <p className="eyebrow blue">STEP 5 · ACT</p>
      <h2 id="act-heading">Choose the next responsible step.</h2>
      <p className="lead">Based on the evidence and what you learned about {topic || "your improvement test"}, decide whether to adopt, adapt, or abandon the approach.</p>
      <section className="action-choices" aria-labelledby="action-choice-heading">
        <div className="data-log-header"><h3 id="action-choice-heading">What will you do next?</h3><p>There is no “correct” answer—only a decision you can justify with evidence and care.</p></div>
        <div className="choice-grid">
          {choices.map(([name, description]) => <button key={name} type="button" onClick={() => onDecision(name)} aria-pressed={decision === name} className={`action-choice ${decision === name ? "selected" : ""}`}><strong>{name}</strong><span>{description}</span></button>)}
        </div>
      </section>
      <label className="learning-field" htmlFor="action-reason"><span>Why is this the right next step?</span>Refer to the data, learner or practitioner experience, and any ethical or practical consideration shaping your decision.</label>
      <textarea id="action-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="For example: Adapt. Attendance improved, but learner feedback shows that the mentor check-in matters more than the reminder. We will test a stronger mentor-led approach next." />
      <p className="character-count">{reason.length} characters</p>
    </section>
  );
}

function StagePanel({ stage, title, copy, final = false }) {
  return (
    <section className="single-stage stage-panel" aria-labelledby={`${stage}-heading`}>
      <p className="eyebrow blue">STEP {stages.findIndex((item) => item.name === stage) + 1} · {stage.toUpperCase()}</p>
      <h2 id={`${stage}-heading`}>{title}</h2>
      <p className="lead">{copy}</p>
      <div className="stage-message">
        <ClipboardText size={32} weight="duotone" />
        <div><h3>{final ? "Your leadership brief is taking shape." : "A practical checkpoint."}</h3><p>{final ? "Capture your decision and the rationale behind it. This reflection becomes evidence of ethical, context-sensitive leadership." : "Use this stage to make your next decision visible, testable, and open to learning."}</p></div>
      </div>
    </section>
  );
}
