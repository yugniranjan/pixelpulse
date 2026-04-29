"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  healthCondition: "",
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

function configuredText(content = {}, key, fallback = "") {
  return content[key] || fallback;
}

function configuredList(content = {}, key) {
  const raw = content[key];
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return raw
      .split(/\r?\n|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function configuredBoolean(content = {}, key, fallback = true) {
  const raw = content[key];
  if (raw === undefined || raw === "") return fallback;
  return !["false", "0", "no", "hide", "hidden"].includes(String(raw).trim().toLowerCase());
}

function backgroundImageValue(value = "") {
  const image = String(value || "").replace(/["\\]/g, "");
  return image ? `url("${image}")` : "";
}

function HtmlText({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function createFamilyMember(type) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
    healthCondition: "",
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

function isBeforeToday(parts = {}) {
  return isCompleteDate(parts) && isPastDate(formatDob(parts));
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
  const todayParts = datePartsFromDate();

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

  function isMonthDisabled(month) {
    return Boolean(
      dateParts.year &&
        dateParts.year === todayParts.year &&
        Number(month) < Number(todayParts.month),
    );
  }

  function isDayDisabled(day) {
    return isBeforeToday({
      year: dateParts.year,
      month: dateParts.month,
      day,
    });
  }

  function isYearDisabled(year) {
    return Number(year) < Number(todayParts.year);
  }

  return (
    <label>
      <span>{label}</span>
      <div className="ppp-waiver-dob-row ppp-waiver-date-row">
        <select required aria-label={`${label} month`} value={dateParts.month} onChange={(event) => updateDate("month", event.target.value)}>
          <option value="">Month</option>
          {MONTHS.map(([value, name]) => (
            <option value={value} key={value} disabled={isMonthDisabled(value)}>
              {name}
            </option>
          ))}
        </select>
        <select required aria-label={`${label} day`} value={dateParts.day} onChange={(event) => updateDate("day", event.target.value)}>
          <option value="">Day</option>
          {days.map((day) => (
            <option value={day} key={day} disabled={isDayDisabled(day)}>
              {Number(day)}
            </option>
          ))}
        </select>
        <select required aria-label={`${label} year`} value={dateParts.year} onChange={(event) => updateDate("year", event.target.value)}>
          <option value="">Year</option>
          {yearOptions.map((year) => (
            <option value={year} key={year} disabled={isYearDisabled(year)}>
              {year}
            </option>
          ))}
        </select>
        <button type="button" className="ppp-waiver-date-today" onClick={setToday}>
          Today
        </button>
      </div>
    </label>
  );
}

export default function WaiverForm({ initialPrimary = {}, initialVisit = {}, waiverContent = {} }) {
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
  const passTypes = useMemo(
    () => configuredList(waiverContent, "passTypes"),
    [waiverContent],
  );
  const healthConditions = useMemo(
    () => configuredList(waiverContent, "healthConditions"),
    [waiverContent],
  );
  const genderOptions = useMemo(
    () => configuredList(waiverContent, "genderOptions"),
    [waiverContent],
  );
  const emergencyRelationOptions = useMemo(
    () => configuredList(waiverContent, "emergencyRelationOptions"),
    [waiverContent],
  );
  const showFamilyMembers = configuredBoolean(waiverContent, "showFamilyMembers", true);
  const showGenderField = configuredBoolean(waiverContent, "showGenderField", true);
  const showMedicalFields = configuredBoolean(waiverContent, "showMedicalFields", true);
  const showPartyFields = configuredBoolean(waiverContent, "showPartyFields", true);
  const showVisitTimeField = configuredBoolean(waiverContent, "showVisitTimeField", true);
  const showPhotoConsent = configuredBoolean(waiverContent, "showPhotoConsent", true);
  const waiverBackgroundImage = configuredText(waiverContent, "waiverBackgroundImage");

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
      setError(configuredText(waiverContent, "signatureRequiredError"));
      return;
    }

    if (isPastDate(visit.visitDate)) {
      setError(configuredText(waiverContent, "pastVisitDateError"));
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
        setError(data.error || configuredText(waiverContent, "submitError"));
        return;
      }

      setToast(`${configuredText(waiverContent, "saveSuccessPrefix")} ${data.waiverId}`);
    } catch (submitError) {
      setError(configuredText(waiverContent, "submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="ppp-waiver-form"
      style={{ "--waiver-form-background-image": backgroundImageValue(waiverBackgroundImage) }}
      onSubmit={handleSubmit}
    >
      <div className="ppp-waiver-legal">
        <p>
          <HtmlText html={configuredText(waiverContent, "legalIntro")} />
        </p>
        <p>
          <HtmlText html={configuredText(waiverContent, "legalRelease")} />
        </p>
      </div>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>01</span>
          <h2>{configuredText(waiverContent, "primarySectionTitle")}</h2>
        </div>
        <div className="ppp-waiver-field-grid">
          <label>
            <span>{configuredText(waiverContent, "firstNameLabel")}</span>
            <input required value={primary.firstName} onChange={(event) => updatePrimary("firstName", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "lastNameLabel")}</span>
            <input required value={primary.lastName} onChange={(event) => updatePrimary("lastName", event.target.value)} />
          </label>
          <DobField label={configuredText(waiverContent, "dobLabel")} value={primary.dob} onChange={(value) => updatePrimary("dob", value)} />
          {showGenderField ? (
            <label>
              <span>{configuredText(waiverContent, "genderLabel")}</span>
              <select value={primary.gender} onChange={(event) => updatePrimary("gender", event.target.value)}>
                <option value="">{genderOptions[0] || ""}</option>
                {genderOptions.slice(1).map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          ) : null}
          <label className="ppp-waiver-wide">
            <span>{configuredText(waiverContent, "emailLabel")}</span>
            <input required type="email" value={primary.email} onChange={(event) => updatePrimary("email", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "phoneLabel")}</span>
            <input required type="tel" value={primary.phone} onChange={(event) => updatePrimary("phone", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "cityLabel")}</span>
            <input required value={primary.city} onChange={(event) => updatePrimary("city", event.target.value)} />
          </label>
          {showMedicalFields ? <div className="ppp-waiver-wide ppp-waiver-medical-row">
            <label>
              <span>{configuredText(waiverContent, "healthConditionLabel")}</span>
              <select value={primary.healthCondition} onChange={(event) => updatePrimary("healthCondition", event.target.value)}>
                {healthConditions.map((condition) => <option key={condition}>{condition}</option>)}
              </select>
            </label>
            <label>
              <span>{configuredText(waiverContent, "medicalNotesLabel")}</span>
              <textarea value={primary.medicalNotes} onChange={(event) => updatePrimary("medicalNotes", event.target.value)} />
            </label>
          </div> : null}
        </div>
      </section>

      {showFamilyMembers ? <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>02</span>
          <h2>{configuredText(waiverContent, "familySectionTitle")}</h2>
        </div>
        <p className="ppp-waiver-section-note">
          {configuredText(waiverContent, "familySectionNote")}
        </p>

        <div className="ppp-waiver-family-list">
          {familyMembers.map((member, index) => (
            <article className={`ppp-waiver-family-card ppp-waiver-family-card--${member.type}`} key={member.id}>
              <div className="ppp-waiver-family-card__head">
                <strong>{configuredText(waiverContent, "memberTitle")} {index + 1}</strong>
                <div>
                  <span>{memberLabel(member.type)}</span>
                  <button type="button" onClick={() => removeFamilyMember(member.id)}>
                    {configuredText(waiverContent, "removeMemberButton")}
                  </button>
                </div>
              </div>
              <div className="ppp-waiver-field-grid">
                <label>
                  <span>{configuredText(waiverContent, "firstNameLabel")}</span>
                  <input required value={member.firstName} onChange={(event) => updateFamilyMember(member.id, "firstName", event.target.value)} />
                </label>
                <label>
                  <span>{configuredText(waiverContent, "lastNameLabel")}</span>
                  <input required value={member.lastName} onChange={(event) => updateFamilyMember(member.id, "lastName", event.target.value)} />
                </label>
                <DobField label={configuredText(waiverContent, "dobLabel")} value={member.dob} onChange={(value) => updateFamilyMember(member.id, "dob", value)} />
                {showGenderField ? (
                  <label>
                    <span>{configuredText(waiverContent, "genderLabel")}</span>
                    <select value={member.gender} onChange={(event) => updateFamilyMember(member.id, "gender", event.target.value)}>
                      <option value="">{genderOptions[0] || ""}</option>
                      {genderOptions.slice(1).map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                ) : null}
                {member.type === "adult" && (
                  <label className="ppp-waiver-wide">
                    <span>{configuredText(waiverContent, "memberEmailLabel")}</span>
                    <input type="email" value={member.email} onChange={(event) => updateFamilyMember(member.id, "email", event.target.value)} />
                  </label>
                )}
                {showMedicalFields ? <div className="ppp-waiver-wide ppp-waiver-medical-row">
                  <label>
                    <span>{configuredText(waiverContent, "healthConditionLabel")}</span>
                    <select value={member.healthCondition} onChange={(event) => updateFamilyMember(member.id, "healthCondition", event.target.value)}>
                      {healthConditions.map((condition) => <option key={condition}>{condition}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>{configuredText(waiverContent, "medicalNotesLabel")}</span>
                    <textarea value={member.medicalNotes} onChange={(event) => updateFamilyMember(member.id, "medicalNotes", event.target.value)} />
                  </label>
                </div> : null}
              </div>
            </article>
          ))}
        </div>

        <div className="ppp-waiver-add-row">
          <button type="button" className="ppp-waiver-add-row__adult" onClick={() => addFamilyMember("adult")}>
            {configuredText(waiverContent, "addAdultButton")}
          </button>
          <button type="button" className="ppp-waiver-add-row__minor" onClick={() => addFamilyMember("minor")}>
            {configuredText(waiverContent, "addMinorButton")}
          </button>
        </div>

        <div className="ppp-waiver-family-summary" aria-live="polite">
          {namedFamily.length > 0 ? (
            <>
              <small>{configuredText(waiverContent, "familySummaryLabel")}</small>
              {namedFamily.map((member) => (
                <span key={member.id}>
                  {[member.firstName, member.lastName].filter(Boolean).join(" ")}
                  <em>{memberLabel(member.type)}</em>
                </span>
              ))}
            </>
          ) : (
            <small>{configuredText(waiverContent, "emptyFamilySummary")}</small>
          )}
        </div>
      </section> : null}

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>03</span>
          <h2>{configuredText(waiverContent, "visitSectionTitle")}</h2>
        </div>
        {visit.partyId || visit.partyName ? (
          <p className="ppp-waiver-section-note ppp-waiver-party-note">
            {configuredText(waiverContent, "linkedPartyPrefix")}{" "}
            {visit.partyName ? <strong>{visit.partyName}</strong> : configuredText(waiverContent, "linkedPartyFallback")}
            {visit.partyId ? <> {configuredText(waiverContent, "linkedPartyIdText")} <strong>{visit.partyId}</strong></> : null}.
          </p>
        ) : null}
        <div className="ppp-waiver-field-grid">
          {showPartyFields ? (
            <>
              <label>
                <span>{configuredText(waiverContent, "partyIdLabel")}</span>
                <input value={visit.partyId} onChange={(event) => updateVisit("partyId", event.target.value)} placeholder={configuredText(waiverContent, "partyIdPlaceholder")} />
              </label>
              <label>
                <span>{configuredText(waiverContent, "partyNameLabel")}</span>
                <input value={visit.partyName} onChange={(event) => updateVisit("partyName", event.target.value)} placeholder={configuredText(waiverContent, "partyNamePlaceholder")} />
              </label>
            </>
          ) : null}
          <label>
            <span>{configuredText(waiverContent, "passTypeLabel")}</span>
            <select required value={visit.passType} onChange={(event) => updateVisit("passType", event.target.value)}>
              <option value="">{configuredText(waiverContent, "passTypePlaceholder")}</option>
              {passTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <DatePartsField label={configuredText(waiverContent, "visitDateLabel")} value={visit.visitDate} yearOptions={visitYears} onChange={(value) => updateVisit("visitDate", value)} />
          {showVisitTimeField ? <label>
            <span>{configuredText(waiverContent, "visitTimeLabel")}</span>
            <input type="time" value={visit.visitTime} onChange={(event) => updateVisit("visitTime", event.target.value)} />
          </label> : null}
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>04</span>
          <h2>{configuredText(waiverContent, "emergencySectionTitle")}</h2>
        </div>
        <div className="ppp-waiver-field-grid">
          <label>
            <span>{configuredText(waiverContent, "emergencyNameLabel")}</span>
            <input required value={visit.emergencyName} onChange={(event) => updateVisit("emergencyName", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "emergencyRelationLabel")}</span>
            <select required value={visit.emergencyRelation} onChange={(event) => updateVisit("emergencyRelation", event.target.value)}>
              <option value="">{configuredText(waiverContent, "emergencyRelationPlaceholder")}</option>
              {emergencyRelationOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="ppp-waiver-wide">
            <span>{configuredText(waiverContent, "emergencyPhoneLabel")}</span>
            <input required type="tel" value={visit.emergencyPhone} onChange={(event) => updateVisit("emergencyPhone", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>05</span>
          <h2>{configuredText(waiverContent, "termsSectionTitle")}</h2>
        </div>
        <div className="ppp-waiver-checks">
          {[
            ["risk", configuredText(waiverContent, "riskAcknowledgement")],
            ["liability", configuredText(waiverContent, "liabilityAcknowledgement")],
            ["rules", configuredText(waiverContent, "rulesAcknowledgement")],
            ["medical", configuredText(waiverContent, "medicalAcknowledgement")],
            ["guardian", configuredText(waiverContent, "guardianAcknowledgement")],
            ["privacy", configuredText(waiverContent, "privacyAcknowledgement")],
          ].map(([key, label]) => (
            <label className={checks[key] ? "is-checked" : ""} key={key}>
              <input required type="checkbox" checked={checks[key]} onChange={() => toggleCheck(key)} />
              <span>{label}</span>
            </label>
          ))}
          {showPhotoConsent ? <label className={checks.photo ? "is-checked" : ""}>
            <input type="checkbox" checked={checks.photo} onChange={() => toggleCheck("photo")} />
            <span>{configuredText(waiverContent, "photoAcknowledgement")}</span>
          </label> : null}
        </div>
      </section>

      <section className="ppp-waiver-section">
        <div className="ppp-waiver-section-head">
          <span>06</span>
          <h2>{configuredText(waiverContent, "signatureSectionTitle")}</h2>
        </div>
        <div className="ppp-waiver-field-grid ppp-waiver-field-grid--full">
          <label>
            <span>{configuredText(waiverContent, "signatureLabel")}</span>
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
              {!hasSignature && <em>{configuredText(waiverContent, "signaturePlaceholder")}</em>}
            </div>
          </label>
          <div className="ppp-waiver-signature-foot">
            <span>{configuredText(waiverContent, "signatureHelp")}</span>
            <button type="button" onClick={clearSignature}>{configuredText(waiverContent, "clearSignatureButton")}</button>
          </div>
          <label>
            <span>{configuredText(waiverContent, "printNameLabel")}</span>
            <input required value={visit.printName} onChange={(event) => updateVisit("printName", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "signDateLabel")}</span>
            <input required type="date" value={visit.signDate} onChange={(event) => updateVisit("signDate", event.target.value)} />
          </label>
        </div>
      </section>

      <div className="ppp-waiver-final">
        <label className={checks.final ? "is-checked" : ""}>
          <input required type="checkbox" checked={checks.final} onChange={() => toggleCheck("final")} />
          <span>
            <HtmlText html={configuredText(waiverContent, "finalAcknowledgement")} />
          </span>
        </label>
      </div>

      <div className="ppp-waiver-submit">
        {error ? <p className="ppp-waiver-error">{error}</p> : null}
        <div className="ppp-waiver-submit-actions">
          <button type="button" className="ppp-waiver-reset" onClick={resetWaiverForm} disabled={submitting}>
            {configuredText(waiverContent, "resetButton")}
          </button>
          <button type="submit" disabled={submitting}>
            {submitting
              ? configuredText(waiverContent, "submittingButton")
              : configuredText(waiverContent, "submitButton")}
          </button>
        </div>
        <p>{configuredText(waiverContent, "submitFootnote")}</p>
      </div>

      {toast && <div className="ppp-waiver-toast">{toast}</div>}
    </form>
  );
}
