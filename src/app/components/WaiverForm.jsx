"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

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

const REQUIRED_TERM_CHECKS = [
  "risk",
  "liability",
  "rules",
  "medical",
  "guardian",
  "privacy",
  "final",
];

const DEFAULT_COPY = {
  legalIntro:
    "<strong>Read carefully before signing.</strong> Pixel Pulse Play operates next-generation interactive physical gaming attractions in Vaughan, Ontario including Laser Maze, Edge Climb, Hexa Quest, Shoot It Out, T-Rex Heist, Tile Hunt, Maze Gate, Soccer Challenge, and more.",
  legalRelease:
    "All attractions involve active physical movement. This waiver is a release of liability, assumption of risk, indemnity, medical authorization, and consent agreement. Participants under 18 require a parent or legal guardian to complete this form on their behalf.",
  primarySectionTitle: "Primary Participant",
  familySectionTitle: "Additional Family Members",
  familySectionNote:
    "Your single signature covers everyone listed. Add every adult and minor entering the active play zones today.",
  visitSectionTitle: "Visit Details",
  emergencySectionTitle: "Emergency Contact",
  termsSectionTitle: "Terms & Acknowledgements",
  signatureSectionTitle: "Signature",
  firstNameLabel: "First name *",
  lastNameLabel: "Last name *",
  dobLabel: "Date of birth *",
  genderLabel: "Gender",
  emailLabel: "Email address *",
  memberEmailLabel: "Email optional",
  phoneLabel: "Phone number *",
  cityLabel: "City / Town *",
  healthConditionLabel: "Common health condition",
  medicalNotesLabel: "Medical notes",
  partyIdLabel: "Party ID",
  partyIdPlaceholder: "Optional booking or party ID",
  partyNameLabel: "Party / guest of honor",
  partyNamePlaceholder: "Optional party name",
  passTypeLabel: "Pass / Visit type *",
  passTypePlaceholder: "Select your pass",
  visitDateLabel: "Visit date *",
  visitTimeLabel: "Party time",
  emergencyNameLabel: "Full name *",
  emergencyRelationLabel: "Relationship *",
  emergencyRelationPlaceholder: "Select",
  emergencyPhoneLabel: "Phone number *",
  signatureLabel: "Draw your signature *",
  signaturePlaceholder: "Draw signature here",
  signatureHelp: "Your signature legally covers yourself and all named family members.",
  clearSignatureButton: "Clear",
  printNameLabel: "Print full legal name *",
  signDateLabel: "Date signed *",
  addAdultButton: "+ Add adult (18+)",
  addMinorButton: "+ Add minor (under 18)",
  familySummaryLabel: "Additional participants:",
  emptyFamilySummary: "No additional family members added yet.",
  memberTitle: "Member",
  removeMemberButton: "Remove",
  linkedPartyPrefix: "This waiver is linked to",
  linkedPartyFallback: "your party",
  linkedPartyIdText: "with Party ID",
  resetButton: "Reset Form",
  submitButton: "Submit Waiver & Start Playing",
  updateSubmitButton: "Update Waiver",
  submittingButton: "Saving Waiver...",
  submitFootnote: "Securely recorded · Vaughan, Ontario · pixelpulseplay.ca",
  signatureRequiredError: "Please draw your signature before submitting.",
  pastVisitDateError: "Visit date cannot be in the past.",
  submitError: "Unable to submit waiver. Please check your connection and try again.",
  saveSuccessPrefix: "Waiver saved. Confirmation:",
  updateSuccessPrefix: "Waiver updated. Confirmation:",
  loadExistingButton: "Load existing waiver",
  loadingExistingButton: "Loading waiver...",
  loadExistingHelp:
    "Already submitted? Enter the same email or phone number, then load your waiver to make changes.",
  loadExistingMissingError: "Enter the email or phone number used on the original waiver first.",
  riskAcknowledgement:
    "I understand Pixel Pulse Play attractions involve inherent and other risks, including slips, trips, falls, collisions, equipment contact, fast movement, climbing, jumping, running, aiming, sensory stimulation, and the acts or omissions of other participants. I voluntarily assume these risks for myself and all named participants.",
  liabilityAcknowledgement:
    "To the fullest extent permitted by applicable law, I release, waive, and discharge Pixel Pulse Play, its owners, directors, officers, employees, contractors, landlords, agents, insurers, successors, and assigns from claims, losses, damages, costs, and expenses arising from participation, including ordinary negligence, on behalf of myself and all named participants.",
  rulesAcknowledgement:
    "I agree that all named participants will follow posted rules, attraction guidelines, staff instructions, age/height/weight restrictions, and safety directions. I confirm each participant is physically and medically fit for active gameplay and will stop participating if unsafe, unwell, or instructed by staff.",
  medicalAcknowledgement:
    "I authorize Pixel Pulse Play staff to seek emergency medical assistance for myself or any named participant if needed, and I accept responsibility for medical, ambulance, transportation, or related costs not covered by insurance or public health coverage.",
  guardianAcknowledgement:
    "I confirm I am the parent, legal guardian, or authorized adult for every participant under 18 listed in this form and have legal authority to sign this waiver, release, and consent on their behalf.",
  privacyAcknowledgement:
    "I understand that Pixel Pulse Play needs the information in this form to manage my waiver, keep players safe, contact me if needed, and meet legal and insurance requirements.",
  photoAcknowledgement:
    "<strong>OPTIONAL</strong> - I consent to Pixel Pulse Play capturing photos and videos of myself and family members during our visit for marketing, social media, and promotional materials.",
  finalAcknowledgement:
    "<strong>I have read, understood, and voluntarily agree</strong> to all terms in this waiver and release of liability, on behalf of myself and every family member listed above. I confirm I am 18 years of age or older, legally competent to enter this agreement, and signing of my own free will. I understand this agreement is intended to be governed by the laws of Ontario and applicable Canadian law.",
};

function configuredText(content = {}, key, fallback = "") {
  return content[key] || DEFAULT_COPY[key] || fallback;
}

function configuredList(content = {}, key, fallback = []) {
  const raw = content[key];
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : fallback;
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
    healthCondition: "Not Applicable",
    medicalNotes: "",
  };
}

function createLoadedFamilyMember(member = {}, index = 0) {
  const type = member.type === "minor" ? "minor" : "adult";
  return {
    id: member.id || `${type}-${Date.now()}-${index}`,
    type,
    firstName: member.firstName || "",
    lastName: member.lastName || "",
    dob: member.dob || "",
    gender: member.gender || "",
    email: member.email || "",
    healthCondition: member.healthCondition || "Not Applicable",
    medicalNotes: member.medicalNotes || "",
  };
}

function today() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateNumber(value = "") {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return 0;
  return year * 10000 + month * 100 + day;
}

function isPastDate(value = "") {
  return Boolean(value && dateNumber(value) < dateNumber(today()));
}

export default function WaiverForm({ initialPrimary = {}, initialVisit = {}, waiverContent = {} }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [toast, setToast] = useState("");
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [editingWaiverId, setEditingWaiverId] = useState("");
  const [editingVerification, setEditingVerification] = useState(null);
  const [primary, setPrimary] = useState({ ...EMPTY_PRIMARY, ...initialPrimary });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [visit, setVisit] = useState({
    ...EMPTY_VISIT,
    ...initialVisit,
    visitDate: initialVisit.visitDate || today(),
  });
  const [checks, setChecks] = useState(EMPTY_CHECKS);
  const [hasHealthDetails, setHasHealthDetails] = useState(false);
  const healthConditions = useMemo(
    () => configuredList(waiverContent, "healthConditions", HEALTH_CONDITIONS),
    [waiverContent],
  );
  const showFamilyMembers = configuredBoolean(waiverContent, "showFamilyMembers", true);
  const showMedicalFields = configuredBoolean(waiverContent, "showMedicalFields", true);
  const showVisitDateField = configuredBoolean(
    waiverContent,
    "showVisitDateField",
    configuredBoolean(waiverContent, "showVisitDate", true),
  );
  const showPhotoConsent = configuredBoolean(waiverContent, "showPhotoConsent", true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    function resizeCanvas() {
      const rect = box.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const nextWidth = Math.round(rect.width * ratio);
      const nextHeight = Math.round(rect.height * ratio);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = getComputedStyle(box).color;
    }

    const frame = window.requestAnimationFrame(resizeCanvas);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setVisit((current) => ({
      ...current,
      partyId: initialVisit.partyId || current.partyId,
      partyName: initialVisit.partyName || current.partyName,
      passType: initialVisit.passType || current.passType,
      visitDate: initialVisit.visitDate || current.visitDate,
      visitTime: initialVisit.visitTime || current.visitTime,
    }));
  }, [
    initialVisit.partyId,
    initialVisit.partyName,
    initialVisit.passType,
    initialVisit.visitDate,
    initialVisit.visitTime,
  ]);

  useEffect(() => {
    if (!completed) return undefined;

    const resetTimer = window.setTimeout(() => {
      setToast("");
      setCompleted(false);
    }, 10000);

    return () => window.clearTimeout(resetTimer);
  }, [completed]);

  function pointFromEvent(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startSignature(event) {
    event.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(event.pointerId);
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

  function endSignature(event) {
    drawingRef.current = false;
    if (event?.pointerId != null && event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) {
      setHasSignature(false);
      return;
    }
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

  function updateFamilyMemberName(id, value) {
    const parts = value.trim().split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");
    setFamilyMembers((current) => current.map((member) =>
      member.id === id ? { ...member, nameInput: value, firstName, lastName } : member,
    ));
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

  function toggleRequiredTerms() {
    setChecks((current) => {
      const nextValue = !REQUIRED_TERM_CHECKS.every((key) => current[key]);
      return REQUIRED_TERM_CHECKS.reduce(
        (nextChecks, key) => ({ ...nextChecks, [key]: nextValue }),
        { ...current },
      );
    });
  }

  function resetWaiverForm() {
    setPrimary({ ...EMPTY_PRIMARY, ...initialPrimary });
    setFamilyMembers([]);
    setVisit({
      ...EMPTY_VISIT,
      ...initialVisit,
      visitDate: initialVisit.visitDate || today(),
      signDate: today(),
    });
    setChecks({ ...EMPTY_CHECKS });
    setHasHealthDetails(false);
    setEditingWaiverId("");
    setEditingVerification(null);
    setError("");
    setToast("");
    setCompleted(false);
    clearSignature();
  }

  async function loadExistingWaiver() {
    setError("");
    setToast("");

    if (!primary.email && !primary.phone) {
      setError(configuredText(waiverContent, "loadExistingMissingError"));
      return;
    }

    setLoadingExisting(true);

    try {
      const params = new URLSearchParams();
      if (primary.email) params.set("email", primary.email);
      if (primary.phone) params.set("phone", primary.phone);
      if (visit.groupId) params.set("groupId", visit.groupId);
      else if (visit.partyId) params.set("partyId", visit.partyId);

      const response = await fetch(`/api/waivers?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || configuredText(waiverContent, "submitError"));
        return;
      }

      const waiver = data.waiver || {};
      setEditingWaiverId(waiver.id || "");
      setEditingVerification(waiver.updateVerification || null);
      const loadedPrimary = { ...EMPTY_PRIMARY, ...(waiver.primary || {}) };
      setPrimary(loadedPrimary);
      setHasHealthDetails(Boolean(
        loadedPrimary.medicalNotes ||
          (loadedPrimary.healthCondition && loadedPrimary.healthCondition !== "Not Applicable"),
      ));
      setFamilyMembers(
        Array.isArray(waiver.familyMembers)
          ? waiver.familyMembers.map(createLoadedFamilyMember)
          : [],
      );
      setVisit({
        ...EMPTY_VISIT,
        ...initialVisit,
        ...(waiver.visit || {}),
        signDate: today(),
      });
      setChecks({ ...EMPTY_CHECKS, ...(waiver.checks || {}) });
      clearSignature();
      setToast("Waiver loaded. Review your details, sign again, and save changes.");
    } catch (lookupError) {
      setError(configuredText(waiverContent, "submitError"));
    } finally {
      setLoadingExisting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setToast("");

    if (!hasSignature) {
      setError(configuredText(waiverContent, "signatureRequiredError"));
      return;
    }

    if (!editingWaiverId && showVisitDateField && isPastDate(visit.visitDate)) {
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
          visit: {
            ...visit,
            printName: visit.printName || [primary.firstName, primary.lastName].filter(Boolean).join(" "),
            signDate: visit.signDate || today(),
          },
          checks,
          signatureDataUrl: canvasRef.current?.toDataURL("image/png"),
          updateWaiverId: editingWaiverId,
          updateVerification: editingVerification,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || configuredText(waiverContent, "submitError"));
        return;
      }

      const successMessage = `${configuredText(
        waiverContent,
        data.updated ? "updateSuccessPrefix" : "saveSuccessPrefix",
      )} ${data.waiverId}`;
      resetWaiverForm();
      setToast(successMessage);
      setCompleted(true);
    } catch (submitError) {
      setError(configuredText(waiverContent, "submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="ppp-waiver-done">
        <h1>You&apos;re all set</h1>
        <p>Show your name at the front desk and start playing.</p>
        {toast ? <small>{toast}</small> : null}
        <p className="ppp-waiver-done__reset-note">A blank waiver will appear automatically in 10 seconds.</p>
        <button type="button" onClick={resetWaiverForm}>Sign another waiver</button>
      </div>
    );
  }

  return (
    <form
      className="ppp-waiver-form"
      onSubmit={handleSubmit}
    >
      <div className="ppp-waiver-heading">
        <div className="ppp-waiver-heading__title">
          <Image
            src="/assets/images/logo.png"
            alt="Pixel Pulse Play"
            width={48}
            height={48}
            priority
          />
          <h1>Sign your waiver</h1>
        </div>
        <p>One signature covers your whole group. Takes about two minutes.</p>
        {visit.groupId ? <p><strong>{visit.partyName || "Group event"}</strong> · Group ID: {visit.groupId}</p> : null}
      </div>

      <section className="ppp-waiver-section">
        <h2>You</h2>
        <div className="ppp-waiver-field-grid">
          <div className="ppp-waiver-field-grid__wide">
            <label>
              <span>{configuredText(waiverContent, "emailLabel")}</span>
              <input required type="email" autoComplete="email" value={primary.email} onChange={(event) => updatePrimary("email", event.target.value)} />
            </label>
            <div className="ppp-waiver-returning">
              <span>Already signed before?</span>
              <button type="button" onClick={loadExistingWaiver} disabled={loadingExisting || submitting}>
                {loadingExisting ? "Finding waiver..." : "Find my waiver"}
              </button>
            </div>
          </div>
          <label>
            <span>{configuredText(waiverContent, "firstNameLabel")}</span>
            <input required autoComplete="given-name" value={primary.firstName} onChange={(event) => updatePrimary("firstName", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "lastNameLabel")}</span>
            <input required autoComplete="family-name" value={primary.lastName} onChange={(event) => updatePrimary("lastName", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "phoneLabel")}</span>
            <input required type="tel" autoComplete="tel" inputMode="tel" value={primary.phone} onChange={(event) => updatePrimary("phone", event.target.value)} />
          </label>
          <label>
            <span>{configuredText(waiverContent, "dobLabel")}</span>
            <input required type="date" autoComplete="bday" value={primary.dob} max={today()} onChange={(event) => updatePrimary("dob", event.target.value)} />
          </label>
        </div>
      </section>

      {showFamilyMembers ? <section className="ppp-waiver-section">
        <h2>Who else is playing?</h2>
        <ul className="ppp-waiver-people">
          {familyMembers.map((member, index) => (
            <li key={member.id}>
              <input
                required
                aria-label={`Person ${index + 1} full name`}
                placeholder="Full name"
                value={member.nameInput ?? [member.firstName, member.lastName].filter(Boolean).join(" ")}
                onChange={(event) => updateFamilyMemberName(member.id, event.target.value)}
              />
              <select
                aria-label={`Person ${index + 1} age group`}
                value={member.type}
                onChange={(event) => updateFamilyMember(member.id, "type", event.target.value)}
              >
                <option value="adult">Adult (18+)</option>
                <option value="minor">Minor (under 18)</option>
              </select>
              <button type="button" aria-label={`Remove person ${index + 1}`} onClick={() => removeFamilyMember(member.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="ppp-waiver-add-row">
          <button type="button" onClick={() => addFamilyMember("adult")}>
            + Add a person
          </button>
        </div>
      </section> : null}

      <section className="ppp-waiver-section">
        <h2>Health</h2>
        {showMedicalFields ? (
          <div className="ppp-waiver-health-disclosure">
            <label className="ppp-waiver-inline-check">
              <input
                type="checkbox"
                checked={hasHealthDetails}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setHasHealthDetails(checked);
                  if (checked && primary.healthCondition === "Not Applicable") {
                    updatePrimary(
                      "healthCondition",
                      healthConditions.find((condition) => condition !== "Not Applicable") || "Other",
                    );
                  } else if (!checked) {
                    updatePrimary("healthCondition", "Not Applicable");
                    updatePrimary("medicalNotes", "");
                  }
                }}
              />
              <span>Someone in our group has a condition staff should know about</span>
            </label>
            {hasHealthDetails ? (
              <div className="ppp-waiver-health-fields">
                <label>
                  <span>{configuredText(waiverContent, "healthConditionLabel")}</span>
                  <select value={primary.healthCondition} onChange={(event) => updatePrimary("healthCondition", event.target.value)}>
                    {healthConditions.filter((condition) => condition !== "Not Applicable").map((condition) => <option key={condition}>{condition}</option>)}
                  </select>
                </label>
                <label>
                  <span>Who, and anything staff should do</span>
                  <textarea rows="3" value={primary.medicalNotes} onChange={(event) => updatePrimary("medicalNotes", event.target.value)} />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="ppp-waiver-section">
        <h2>Agreement</h2>
        <ul className="ppp-waiver-terms-summary">
          <li>Active play has real risks, like falls and collisions. We take them on for everyone listed.</li>
          <li>We release Pixel Pulse Play from claims, including ordinary negligence, as far as Ontario law allows.</li>
          <li>We follow staff instructions and posted rules, and stop if unwell.</li>
          <li>Staff may call emergency help, and we cover costs insurance doesn&apos;t.</li>
          <li>I&apos;m 18+ and the parent or guardian of every minor listed.</li>
        </ul>
        <details className="ppp-waiver-terms-details">
          <summary>Read the full legal terms</summary>
          <div>
            <p><HtmlText html={configuredText(waiverContent, "legalIntro")} /></p>
            <p><HtmlText html={configuredText(waiverContent, "legalRelease")} /></p>
            <p>{configuredText(waiverContent, "riskAcknowledgement")}</p>
            <p>{configuredText(waiverContent, "liabilityAcknowledgement")}</p>
            <p>{configuredText(waiverContent, "rulesAcknowledgement")}</p>
            <p>{configuredText(waiverContent, "medicalAcknowledgement")}</p>
            <p>{configuredText(waiverContent, "guardianAcknowledgement")}</p>
            <p>{configuredText(waiverContent, "privacyAcknowledgement")}</p>
            <p><HtmlText html={configuredText(waiverContent, "finalAcknowledgement")} /></p>
          </div>
        </details>
        <div className="ppp-waiver-checks">
          <label className={REQUIRED_TERM_CHECKS.every((key) => checks[key]) ? "is-checked" : ""}>
            <input
              required
              type="checkbox"
              checked={REQUIRED_TERM_CHECKS.every((key) => checks[key])}
              onChange={toggleRequiredTerms}
            />
            <span>
              <strong>I have read and agree to the terms for myself and everyone listed.</strong>
            </span>
          </label>
          {showPhotoConsent ? <label className={checks.photo ? "is-checked" : ""}>
            <input type="checkbox" checked={checks.photo} onChange={() => toggleCheck("photo")} />
            <HtmlText html={configuredText(waiverContent, "photoAcknowledgement")} />
          </label> : null}
        </div>
      </section>

      <section className="ppp-waiver-section">
        <h2>Sign</h2>
        <div className="ppp-waiver-field-grid ppp-waiver-field-grid--full">
          <div className="ppp-waiver-signature-field">
            <span>{configuredText(waiverContent, "signatureLabel")}</span>
            <div className="ppp-waiver-signature" ref={boxRef}>
              <canvas
                ref={canvasRef}
                onPointerDown={startSignature}
                onPointerMove={drawSignature}
                onPointerUp={endSignature}
                onPointerCancel={endSignature}
              />
              {!hasSignature && <em>{configuredText(waiverContent, "signaturePlaceholder")}</em>}
              <button type="button" className="ppp-waiver-signature-clear" onClick={clearSignature}>
                {configuredText(waiverContent, "clearSignatureButton")}
              </button>
            </div>
          </div>
          <div className="ppp-waiver-signature-foot">
            <span>{configuredText(waiverContent, "signatureHelp")}</span>
          </div>
          <label>
            <span>Full legal name</span>
            <input required autoComplete="name" value={visit.printName} onChange={(event) => updateVisit("printName", event.target.value)} />
          </label>
          <div className="ppp-waiver-field-grid">
            <label>
              <span>Signed on</span>
              <input readOnly value={visit.signDate || today()} />
            </label>
            {showVisitDateField ? (
              <label>
                <span>{configuredText(waiverContent, "visitDateLabel")}</span>
                <input required type="date" value={visit.visitDate} min={today()} onChange={(event) => updateVisit("visitDate", event.target.value)} />
              </label>
            ) : null}
          </div>
          <input type="hidden" name="partyId" value={visit.partyId} />
          <input type="hidden" name="partyName" value={visit.partyName} />
          <input type="hidden" name="passType" value={visit.passType} />
          <input type="hidden" name="visitTime" value={visit.visitTime} />
        </div>
      </section>

      <div className="ppp-waiver-submit">
        {error ? <p className="ppp-waiver-error">{error}</p> : null}
        <div className="ppp-waiver-submit-actions">
          <small>
            {familyMembers.length === 0
              ? "Just you"
              : `${familyMembers.length + 1} people covered`}
          </small>
          <button type="submit" disabled={submitting}>
            {submitting
              ? configuredText(waiverContent, "submittingButton")
              : editingWaiverId ? "Update waiver" : "Sign and play"}
          </button>
        </div>
      </div>

      {toast && <div className="ppp-waiver-toast">{toast}</div>}
    </form>
  );
}
