"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PASS_TYPES = [
  "Walk-in / General Admission",
  "Explorer Pass - 30 min",
  "All-Access Pass - 60 min",
  "Party Package - 90 min",
  "Birthday Party Package",
  "Corporate / Group Event",
  "School Field Trip",
  "University Student Special",
];

const HEALTH_CONDITIONS = [
  "Not Applicable",
  "Asthma",
  "Allergies",
  "Heart condition",
  "Epilepsy / seizures",
  "Diabetes",
  "Mobility limitation",
  "Recent injury or surgery",
  "Pregnancy",
  "Other",
];

const MONTHS = [
  ["01", "January"],
  ["02", "February"],
  ["03", "March"],
  ["04", "April"],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "August"],
  ["09", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"],
];

const CURRENT_YEAR = new Date().getFullYear();
const DOB_YEARS = Array.from({ length: CURRENT_YEAR - 1919 }, (_, index) =>
  String(CURRENT_YEAR - index),
);

const EMPTY_PRIMARY = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  email: "",
  phone: "",
  city: "",
  healthCondition: "Not Applicable",
  medicalNotes: "",
};

const EMPTY_VISIT = {
  partyId: "",
  partyName: "",
  passType: "",
  visitDate: "",
  visitTime: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
  printName: "",
  signDate: today(),
};

const EMPTY_CHECKS = {
  risk: false,
  liability: false,
  rules: false,
  medical: false,
  guardian: false,
  photo: false,
  privacy: false,
  final: false,
};

function createFamilyMember(type) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
    healthCondition: "Not Applicable",
    medicalNotes: "",
  };
}

function memberLabel(type) {
  return type === "adult" ? "Adult 18+" : "Minor under 18";
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isPastDate(value = "") {
  return Boolean(value && value < today());
}

function datePartsFromDate(date = new Date()) {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function parseDob(value = "") {
  const [year = "", month = "", day = ""] = String(value || "").split("-");
  return { year, month, day };
}

function formatDob({ year, month, day }) {
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function isCompleteDate({ year, month, day }) {
  return Boolean(year && month && day);
}

function DobField({ label, value, onChange }) {
  const [dob, setDob] = useState(() => parseDob(value));
  const dayCount = daysInMonth(dob.year, dob.month);
  const days = Array.from({ length: dayCount }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  useEffect(() => {
    setDob(parseDob(value));
  }, [value]);

  function updateDob(field, nextValue) {
    const nextDob = { ...dob, [field]: nextValue };
    const nextDayCount = daysInMonth(nextDob.year, nextDob.month);

    if (nextDob.day && Number(nextDob.day) > nextDayCount) {
      nextDob.day = String(nextDayCount).padStart(2, "0");
    }

    setDob(nextDob);
    onChange(isCompleteDate(nextDob) ? formatDob(nextDob) : "");
  }

  return (
    <label>
      <span>{label}</span>
      <div className="ppp-waiver-dob-row">
        <select required aria-label={`${label} month`} value={dob.month} onChange={(event) => updateDob("month", event.target.value)}>
          <option value="">Month</option>
          {MONTHS.map(([value, name]) => <option value={value} key={value}>{name}</option>)}
        </select>
        <select required aria-label={`${label} day`} value={dob.day} onChange={(event) => updateDob("day", event.target.value)}>
          <option value="">Day</option>
          {days.map((day) => <option value={day} key={day}>{Number(day)}</option>)}
        </select>
        <select required aria-label={`${label} year`} value={dob.year} onChange={(event) => updateDob("year", event.target.value)}>
          <option value="">Year</option>
          {DOB_YEARS.map((year) => <option value={year} key={year}>{year}</option>)}
        </select>
      </div>
    </label>
  );
}

function DatePartsField({ label, value, onChange, yearOptions = DOB_YEARS }) {
  const [dateParts, setDateParts] = useState(() => parseDob(value));
  const dayCount = daysInMonth(dateParts.year, dateParts.month);
  const days = Array.from({ length: dayCount }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  useEffect(() => {
    const nextValue = isPastDate(value) ? today() : value;
    setDateParts(parseDob(nextValue));
    if (value && nextValue !== value) {
      onChange(nextValue);
    }
  }, [value]);

  function updateDate(field, nextValue) {
    const nextDate = { ...dateParts, [field]: nextValue };
    const nextDayCount = daysInMonth(nextDate.year, nextDate.month);

    if (nextDate.day && Number(nextDate.day) > nextDayCount) {
      nextDate.day = String(nextDayCount).padStart(2, "0");
    }

    const formattedDate = isCompleteDate(nextDate) ? formatDob(nextDate) : "";

    if (formattedDate && isPastDate(formattedDate)) {
      const todayParts = datePartsFromDate();
      setDateParts(todayParts);
      onChange(formatDob(todayParts));
      return;
    }

    setDateParts(nextDate);
    onChange(formattedDate);
  }

  function setToday() {
    const nextDate = datePartsFromDate();
    setDateParts(nextDate);
    onChange(formatDob(nextDate));
  }

  return (
    <label>
      <span>{label}</span>
      <div className="ppp-waiver-dob-row ppp-waiver-date-row">
        <select required aria-label={`${label} month`} value={dateParts.month} onChange={(event) => updateDate("month", event.target.value)}>
          <option value="">Month</option>
          {MONTHS.map(([value, name]) => <option value={value} key={value}>{name}</option>)}
        </select>
        <select required aria-label={`${label} day`} value={dateParts.day} onChange={(event) => updateDate("day", event.target.value)}>
          <option value="">Day</option>
          {days.map((day) => <option value={day} key={day}>{Number(day)}</option>)}
        </select>
        <select required aria-label={`${label} year`} value={dateParts.year} onChange={(event) => updateDate("year", event.target.value)}>
          <option value="">Year</option>
          {yearOptions.map((year) => <option value={year} key={year}>{year}</option>)}
        </select>
        <button type="button" className="ppp-waiver-date-today" onClick={setToday}>
          Today
        </button>
      </div>
    </label>
  );
}

export default function WaiverForm({ initialPrimary = {}, initialVisit = {} }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [primary, setPrimary] = useState({ ...EMPTY_PRIMARY, ...initialPrimary });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [visit, setVisit] = useState({ ...EMPTY_VISIT, ...initialVisit });
  const [checks, setChecks] = useState(EMPTY_CHECKS);

  const namedFamily = useMemo(
    () => familyMembers.filter((member) => member.firstName || member.lastName),
    [familyMembers],
  );
  const visitYears = useMemo(
    () => Array.from({ length: 3 }, (_, index) => String(CURRENT_YEAR + index)),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    function resizeCanvas() {
      const rect = box.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const context = canvas.getContext("2d");
      context.scale(ratio, ratio);
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#a4cf5f";
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  function pointFromEvent(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  }

  function startSignature(event) {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = pointFromEvent(event);
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function drawSignature(event) {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = pointFromEvent(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasSignature(true);
  }

  function endSignature() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  function updatePrimary(field, value) {
    setPrimary((current) => ({ ...current, [field]: value }));
  }

  function updateVisit(field, value) {
    setVisit((current) => ({ ...current, [field]: value }));
  }

  function updateFamilyMember(id, field, value) {
    setFamilyMembers((current) =>
      current.map((member) =>
        member.id === id ? { ...member, [field]: value } : member,
      ),
    );
  }

  function addFamilyMember(type) {
    setFamilyMembers((current) => [...current, createFamilyMember(type)]);
  }

  function removeFamilyMember(id) {
    setFamilyMembers((current) => current.filter((member) => member.id !== id));
  }

  function toggleCheck(name) {
    setChecks((current) => ({ ...current, [name]: !current[name] }));
  }

  function resetWaiverForm() {
    setPrimary({ ...EMPTY_PRIMARY, ...initialPrimary });
    setFamilyMembers([]);
    setVisit({ ...EMPTY_VISIT, ...initialVisit, signDate: today() });
    setChecks({ ...EMPTY_CHECKS });
    setError("");
    setToast("");
    clearSignature();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setToast("");

    if (!hasSignature) {
      setError("Please draw your signature before submitting.");
      return;
    }

    if (isPastDate(visit.visitDate)) {
      setError("Visit date cannot be in the past.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary,
          familyMembers,
          visit,
          checks,
          signatureDataUrl: canvasRef.current?.toDataURL("image/png"),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to submit waiver. Please try again.");
        return;
      }

      setToast(`Waiver saved. Confirmation: ${data.waiverId}`);
    } catch (submitError) {
      setError("Unable to submit waiver. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ppp-waiver-form" onSubmit={handleSubmit}>
      <div className="ppp-waiver-legal">
        <p>
          <strong>Read carefully before signing.</strong> Pixel Pulse Play
          operates next-generation interactive physical gaming attractions in
          Vaughan, Ontario including Laser Maze, Edge Climb, Hexa Quest, Shoot It
          Out, T-Rex Heist, Tile Hunt, Maze Gate, Soccer Challenge, and more.
        </p>
        <p>
          All attractions involve active physical movement. This waiver is a
          release of liability, assumption of risk, indemnity, medical
          authorization, and consent agreement. Participants under 18 require a
          parent or legal guardian to complete this form on their behalf.
        </p>
      </div>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>01</span>
          <h2>Primary Participant</h2>
        </div>
        <div className="ppp-waiver-field-grid">
          <label>
            <span>First name *</span>
            <input required value={primary.firstName} onChange={(event) => updatePrimary("firstName", event.target.value)} />
          </label>
          <label>
            <span>Last name *</span>
            <input required value={primary.lastName} onChange={(event) => updatePrimary("lastName", event.target.value)} />
          </label>
          <DobField label="Date of birth *" value={primary.dob} onChange={(value) => updatePrimary("dob", value)} />
          <label>
            <span>Gender</span>
            <select value={primary.gender} onChange={(event) => updatePrimary("gender", event.target.value)}>
              <option value="">Prefer not to say</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Other</option>
            </select>
          </label>
          <label className="ppp-waiver-wide">
            <span>Email address *</span>
            <input required type="email" value={primary.email} onChange={(event) => updatePrimary("email", event.target.value)} />
          </label>
          <label>
            <span>Phone number *</span>
            <input required type="tel" value={primary.phone} onChange={(event) => updatePrimary("phone", event.target.value)} />
          </label>
          <label>
            <span>City / Town *</span>
            <input required value={primary.city} onChange={(event) => updatePrimary("city", event.target.value)} />
          </label>
          <div className="ppp-waiver-wide ppp-waiver-medical-row">
            <label>
              <span>Common health condition</span>
              <select value={primary.healthCondition} onChange={(event) => updatePrimary("healthCondition", event.target.value)}>
                {HEALTH_CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
              </select>
            </label>
            <label>
              <span>Medical notes</span>
              <textarea value={primary.medicalNotes} onChange={(event) => updatePrimary("medicalNotes", event.target.value)} />
            </label>
          </div>
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>02</span>
          <h2>Additional Family Members</h2>
        </div>
        <p className="ppp-waiver-section-note">
          Your single signature covers everyone listed. Add every adult and
          minor entering the active play zones today.
        </p>

        <div className="ppp-waiver-family-list">
          {familyMembers.map((member, index) => (
            <article className={`ppp-waiver-family-card ppp-waiver-family-card--${member.type}`} key={member.id}>
              <div className="ppp-waiver-family-card__head">
                <strong>Member {index + 1}</strong>
                <div>
                  <span>{memberLabel(member.type)}</span>
                  <button type="button" onClick={() => removeFamilyMember(member.id)}>Remove</button>
                </div>
              </div>
              <div className="ppp-waiver-field-grid">
                <label>
                  <span>First name *</span>
                  <input required value={member.firstName} onChange={(event) => updateFamilyMember(member.id, "firstName", event.target.value)} />
                </label>
                <label>
                  <span>Last name *</span>
                  <input required value={member.lastName} onChange={(event) => updateFamilyMember(member.id, "lastName", event.target.value)} />
                </label>
                <DobField label="Date of birth *" value={member.dob} onChange={(value) => updateFamilyMember(member.id, "dob", value)} />
                <label>
                  <span>Gender</span>
                  <select value={member.gender} onChange={(event) => updateFamilyMember(member.id, "gender", event.target.value)}>
                    <option value="">Prefer not to say</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Other</option>
                  </select>
                </label>
                {member.type === "adult" && (
                  <label className="ppp-waiver-wide">
                    <span>Email optional</span>
                    <input type="email" value={member.email} onChange={(event) => updateFamilyMember(member.id, "email", event.target.value)} />
                  </label>
                )}
                <div className="ppp-waiver-wide ppp-waiver-medical-row">
                  <label>
                    <span>Common health condition</span>
                    <select value={member.healthCondition} onChange={(event) => updateFamilyMember(member.id, "healthCondition", event.target.value)}>
                      {HEALTH_CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Medical notes</span>
                    <textarea value={member.medicalNotes} onChange={(event) => updateFamilyMember(member.id, "medicalNotes", event.target.value)} />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="ppp-waiver-add-row">
          <button type="button" className="ppp-waiver-add-row__adult" onClick={() => addFamilyMember("adult")}>+ Add adult (18+)</button>
          <button type="button" className="ppp-waiver-add-row__minor" onClick={() => addFamilyMember("minor")}>+ Add minor (under 18)</button>
        </div>

        <div className="ppp-waiver-family-summary" aria-live="polite">
          {namedFamily.length > 0 ? (
            <>
              <small>Party:</small>
              {namedFamily.map((member) => (
                <span key={member.id}>
                  {[member.firstName, member.lastName].filter(Boolean).join(" ")}
                  <em>{memberLabel(member.type)}</em>
                </span>
              ))}
            </>
          ) : (
            <small>No additional family members added yet.</small>
          )}
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>03</span>
          <h2>Visit Details</h2>
        </div>
        {visit.partyId || visit.partyName ? (
          <p className="ppp-waiver-section-note ppp-waiver-party-note">
            This waiver is linked to {visit.partyName ? <strong>{visit.partyName}</strong> : "your party"}
            {visit.partyId ? <> with Party ID <strong>{visit.partyId}</strong></> : null}.
          </p>
        ) : null}
        <div className="ppp-waiver-field-grid">
          <label>
            <span>Party ID</span>
            <input value={visit.partyId} onChange={(event) => updateVisit("partyId", event.target.value)} placeholder="Optional booking or party ID" />
          </label>
          <label>
            <span>Party / guest of honor</span>
            <input value={visit.partyName} onChange={(event) => updateVisit("partyName", event.target.value)} placeholder="Optional party name" />
          </label>
          <label>
            <span>Pass / Visit type *</span>
            <select required value={visit.passType} onChange={(event) => updateVisit("passType", event.target.value)}>
              <option value="">Select your pass</option>
              {PASS_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <DatePartsField label="Visit date *" value={visit.visitDate} yearOptions={visitYears} onChange={(value) => updateVisit("visitDate", value)} />
          <label>
            <span>Party time</span>
            <input type="time" value={visit.visitTime} onChange={(event) => updateVisit("visitTime", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>04</span>
          <h2>Emergency Contact</h2>
        </div>
        <div className="ppp-waiver-field-grid">
          <label>
            <span>Full name *</span>
            <input required value={visit.emergencyName} onChange={(event) => updateVisit("emergencyName", event.target.value)} />
          </label>
          <label>
            <span>Relationship *</span>
            <select required value={visit.emergencyRelation} onChange={(event) => updateVisit("emergencyRelation", event.target.value)}>
              <option value="">Select</option>
              <option>Spouse / Partner</option>
              <option>Parent</option>
              <option>Sibling</option>
              <option>Friend</option>
              <option>Other</option>
            </select>
          </label>
          <label className="ppp-waiver-wide">
            <span>Phone number *</span>
            <input required type="tel" value={visit.emergencyPhone} onChange={(event) => updateVisit("emergencyPhone", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>05</span>
          <h2>Terms & Acknowledgements</h2>
        </div>
        <div className="ppp-waiver-checks">
          {[
            ["risk", "I understand Pixel Pulse Play attractions involve inherent and other risks, including slips, trips, falls, collisions, equipment contact, fast movement, climbing, jumping, running, aiming, sensory stimulation, and the acts or omissions of other participants. I voluntarily assume these risks for myself and all named participants."],
            ["liability", "To the fullest extent permitted by applicable law, I release, waive, and discharge Pixel Pulse Play, its owners, directors, officers, employees, contractors, landlords, agents, insurers, successors, and assigns from claims, losses, damages, costs, and expenses arising from participation, including ordinary negligence, on behalf of myself and all named participants."],
            ["rules", "I agree that all named participants will follow posted rules, attraction guidelines, staff instructions, age/height/weight restrictions, and safety directions. I confirm each participant is physically and medically fit for active gameplay and will stop participating if unsafe, unwell, or instructed by staff."],
            ["medical", "I authorize Pixel Pulse Play staff to seek emergency medical assistance for myself or any named participant if needed, and I accept responsibility for medical, ambulance, transportation, or related costs not covered by insurance or public health coverage."],
            ["guardian", "I confirm I am the parent, legal guardian, or authorized adult for every participant under 18 listed in this form and have legal authority to sign this waiver, release, and consent on their behalf."],
            ["privacy", "I consent to Pixel Pulse Play collecting, using, storing, and disclosing the information in this form as reasonably needed to administer waivers, operate the venue, manage safety incidents, contact guardians or emergency contacts, and comply with legal or insurance requirements."],
          ].map(([key, label]) => (
            <label className={checks[key] ? "is-checked" : ""} key={key}>
              <input required type="checkbox" checked={checks[key]} onChange={() => toggleCheck(key)} />
              <span>{label}</span>
            </label>
          ))}
          <label className={checks.photo ? "is-checked" : ""}>
            <input type="checkbox" checked={checks.photo} onChange={() => toggleCheck("photo")} />
            <span>Optional - I consent to Pixel Pulse Play capturing photos and videos of myself and family members during our visit for marketing, social media, and promotional materials.</span>
          </label>
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>06</span>
          <h2>Signature</h2>
        </div>
        <div className="ppp-waiver-field-grid ppp-waiver-field-grid--full">
          <label>
            <span>Draw your signature *</span>
            <div className="ppp-waiver-signature" ref={boxRef}>
              <canvas
                ref={canvasRef}
                onMouseDown={startSignature}
                onMouseMove={drawSignature}
                onMouseUp={endSignature}
                onMouseLeave={endSignature}
                onTouchStart={startSignature}
                onTouchMove={drawSignature}
                onTouchEnd={endSignature}
              />
              {!hasSignature && <em>Draw signature here</em>}
            </div>
          </label>
          <div className="ppp-waiver-signature-foot">
            <span>Your signature legally covers yourself and all named family members.</span>
            <button type="button" onClick={clearSignature}>Clear</button>
          </div>
          <label>
            <span>Print full legal name *</span>
            <input required value={visit.printName} onChange={(event) => updateVisit("printName", event.target.value)} />
          </label>
          <label>
            <span>Date signed *</span>
            <input required type="date" value={visit.signDate} onChange={(event) => updateVisit("signDate", event.target.value)} />
          </label>
        </div>
      </section>

      <div className="ppp-waiver-final">
        <label className={checks.final ? "is-checked" : ""}>
          <input required type="checkbox" checked={checks.final} onChange={() => toggleCheck("final")} />
          <span>
            <strong>I have read, understood, and voluntarily agree</strong> to all
            terms in this waiver and release of liability, on behalf of myself
            and every family member listed above. I confirm I am 18 years of age
            or older, legally competent to enter this agreement, and signing of
            my own free will. I understand this agreement is intended to be
            governed by the laws of Ontario and applicable Canadian law.
          </span>
        </label>
      </div>

      <div className="ppp-waiver-submit">
        {error ? <p className="ppp-waiver-error">{error}</p> : null}
        <div className="ppp-waiver-submit-actions">
          <button type="button" className="ppp-waiver-reset" onClick={resetWaiverForm} disabled={submitting}>
            Reset Form
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving Waiver..." : "Submit Waiver & Start Playing"}
          </button>
        </div>
        <p>Securely recorded · Vaughan, Ontario · pixelpulseplay.ca</p>
      </div>

      {toast && <div className="ppp-waiver-toast">{toast}</div>}
    </form>
  );
}
