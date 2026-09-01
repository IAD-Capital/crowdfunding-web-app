"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Mail, ArrowLeft, Loader2 } from "lucide-react";

type Question = {
  id: number;
  parent_id: number | null;
  question: string;
  answer: string | null;
  source?: "chatbot" | "faq";
};
type View = "list" | "node" | "other" | "other-sent";

type Props = { userEmail: string | null };

export default function ChatbotWidget({ userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const hasFetched = useRef(false);

  const [path, setPath] = useState<Question[]>([]);
  const current = path.length > 0 ? path[path.length - 1] : null;

  function childrenOf(parentId: number | null) {
    return (questions ?? []).filter((q) => q.parent_id === parentId);
  }

  const [emailInput, setEmailInput] = useState(userEmail ?? "");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [otherText, setOtherText] = useState("");
  const [otherEmail, setOtherEmail] = useState(userEmail ?? "");
  const [submittingOther, setSubmittingOther] = useState(false);
  const [otherError, setOtherError] = useState("");

  async function handleOpen() {
    setOpen(true);
    if (!hasFetched.current) {
      hasFetched.current = true;
      setLoadingQuestions(true);
      try {
        const res = await fetch("/api/public/chatbot/questions");
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } catch {
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    }
  }

  function close() {
    setOpen(false);
  }

  // Lets other components (e.g. the unit page's "Cómo funciona" button) open
  // the widget without prop drilling — it's mounted once in PublicShell, far
  // from most of the pages that want to trigger it.
  useEffect(() => {
    window.addEventListener("iad:open-chatbot", handleOpen);
    return () => window.removeEventListener("iad:open-chatbot", handleOpen);
  }, []);

  function selectQuestion(q: Question) {
    setPath((prev) => [...prev, q]);
    setEmailSent(false);
    setEmailError("");
    setEmailInput(userEmail ?? "");
    setView("node");
  }

  function goBack() {
    if (path.length <= 1) {
      setPath([]);
      setView("list");
    } else {
      setPath((prev) => prev.slice(0, -1));
      setView("node");
    }
  }

  function backToList() {
    setPath([]);
    setView("list");
  }

  function openOther() {
    setOtherText("");
    setOtherEmail(userEmail ?? "");
    setOtherError("");
    setView("other");
  }

  async function sendEmail() {
    if (!current) return;
    setEmailError("");

    if (!emailInput.trim()) {
      setEmailError("Ingresá un email.");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch("/api/public/chatbot/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          email: emailInput.trim(),
          source: current.source ?? "chatbot",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error ?? "No se pudo enviar el email.");
        return;
      }
      setEmailSent(true);
    } catch {
      setEmailError("No se pudo enviar el email.");
    } finally {
      setSendingEmail(false);
    }
  }

  async function submitOther() {
    setOtherError("");

    if (!otherText.trim()) {
      setOtherError("Escribí tu pregunta.");
      return;
    }
    if (!userEmail && !otherEmail.trim()) {
      setOtherError("Ingresá un email.");
      return;
    }

    setSubmittingOther(true);
    try {
      const body: Record<string, string> = { question: otherText.trim() };
      if (!userEmail) body.email = otherEmail.trim();

      const res = await fetch("/api/public/chatbot/other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtherError(data.error ?? "No se pudo enviar la pregunta.");
        return;
      }
      setView("other-sent");
    } catch {
      setOtherError("No se pudo enviar la pregunta.");
    } finally {
      setSubmittingOther(false);
    }
  }

  return (
    <div>
      <style>{`
        @keyframes chatbot-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .chatbot-panel {
            position: fixed !important;
            inset: 12px !important;
            width: auto !important;
            height: auto !important;
            bottom: 12px !important;
            right: 12px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      {!open && (
        <button type="button" onClick={handleOpen} style={trigger} aria-label="Abrir chat">
          <Bot size={26} color="#fff" />
        </button>
      )}

      {open && (
        <div className="chatbot-panel" style={panel}>
          <div style={panelHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bot size={18} />
              <span style={panelTitle}>Asistente</span>
            </div>
            <button type="button" onClick={close} style={closeBtn} aria-label="Cerrar chat">
              <X size={20} />
            </button>
          </div>

          <div style={panelBody}>
            {view === "list" && (
              <div style={optionsList}>
                {loadingQuestions && (
                  <div style={centerRow}>
                    <Loader2 size={20} style={spinStyle} />
                  </div>
                )}
                {!loadingQuestions && childrenOf(null).length === 0 && (
                  <p style={hintText}>Todavía no hay preguntas cargadas.</p>
                )}
                {!loadingQuestions &&
                  childrenOf(null).map((q) => (
                    <button key={q.id} type="button" style={optionBtn} onClick={() => selectQuestion(q)}>
                      {q.question}
                    </button>
                  ))}
                <button type="button" style={{ ...optionBtn, ...otherOptionBtn }} onClick={openOther}>
                  Otra
                </button>
              </div>
            )}

            {view === "node" && current && (
              <div style={detailWrap}>
                <button type="button" style={backBtn} onClick={goBack}>
                  <ArrowLeft size={15} /> Volver
                </button>
                <p style={answerQuestion}>{current.question}</p>

                {current.answer && (
                  <>
                    <p style={answerText}>{current.answer}</p>
                    <div style={emailBox}>
                      {emailSent ? (
                        <p style={successText}>¡Listo! Te enviamos la respuesta por email.</p>
                      ) : (
                        <>
                          <p style={emailLabel}>
                            <Mail size={14} /> Enviarme esto por email
                          </p>
                          <div style={emailRow}>
                            <input
                              type="email"
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              readOnly={!!userEmail}
                              placeholder="tu@email.com"
                              style={{ ...emailInputStyle, ...(userEmail ? emailInputReadonly : {}) }}
                            />
                            <button type="button" style={sendBtn} onClick={sendEmail} disabled={sendingEmail}>
                              {sendingEmail ? <Loader2 size={15} style={spinStyle} /> : <Send size={15} />}
                            </button>
                          </div>
                          {emailError && <p style={errorText}>{emailError}</p>}
                        </>
                      )}
                    </div>
                  </>
                )}

                {childrenOf(current.id).length > 0 && (
                  <div style={optionsList}>
                    {childrenOf(current.id).map((q) => (
                      <button key={q.id} type="button" style={optionBtn} onClick={() => selectQuestion(q)}>
                        {q.question}
                      </button>
                    ))}
                    <button type="button" style={{ ...optionBtn, ...otherOptionBtn }} onClick={openOther}>
                      Otra
                    </button>
                  </div>
                )}
              </div>
            )}

            {view === "other" && (
              <div style={detailWrap}>
                <button type="button" style={backBtn} onClick={() => setView(current ? "node" : "list")}>
                  <ArrowLeft size={15} /> Volver
                </button>
                <p style={otherPrompt}>Contanos tu pregunta y la vamos a revisar.</p>
                <textarea
                  style={textarea}
                  rows={4}
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Escribí tu pregunta…"
                />
                {!userEmail && (
                  <input
                    type="email"
                    value={otherEmail}
                    onChange={(e) => setOtherEmail(e.target.value)}
                    placeholder="tu@email.com"
                    style={emailInputStyle}
                  />
                )}
                {otherError && <p style={errorText}>{otherError}</p>}
                <button type="button" style={submitBtn} onClick={submitOther} disabled={submittingOther}>
                  {submittingOther ? "Enviando…" : "Enviar pregunta"}
                </button>
              </div>
            )}

            {view === "other-sent" && (
              <div style={detailWrap}>
                <p style={successText}>¡Gracias! Recibimos tu pregunta y la vamos a revisar.</p>
                <button type="button" style={submitBtn} onClick={backToList}>
                  Volver al inicio
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const trigger: React.CSSProperties = {
  position: "fixed", bottom: 24, right: 24, width: 58, height: 58, borderRadius: "50%",
  background: "#1b4de0", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 8px 24px rgba(27,77,224,0.35)", zIndex: 300,
};

const panel: React.CSSProperties = {
  position: "fixed", bottom: 92, right: 24, width: 380, height: 520,
  background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 300,
  border: "1px solid #e5e7eb",
};

const panelHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "0.9rem 1rem", borderBottom: "1px solid #f3f4f6", flexShrink: 0,
};
const panelTitle: React.CSSProperties = { fontSize: "0.9rem", fontWeight: 700, color: "#111" };
const closeBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: "#6b7280",
  display: "flex", alignItems: "center", justifyContent: "center", padding: "0.25rem",
};

const panelBody: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "1rem" };

const optionsList: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const optionBtn: React.CSSProperties = {
  textAlign: "left", padding: "0.65rem 0.85rem", borderRadius: 10,
  border: "1px solid #e5e7eb", background: "#f8fafc", cursor: "pointer",
  fontSize: "0.85rem", color: "#111", fontWeight: 500,
};
const otherOptionBtn: React.CSSProperties = { background: "#eff3ff", color: "#1b4de0", fontWeight: 700, borderColor: "#c7d7ff" };
const centerRow: React.CSSProperties = { display: "flex", justifyContent: "center", padding: "1.5rem 0" };
const hintText: React.CSSProperties = { fontSize: "0.82rem", color: "#9ca3af" };
const spinStyle: React.CSSProperties = { animation: "chatbot-spin 0.8s linear infinite" };

const detailWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const backBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.35rem", alignSelf: "flex-start",
  background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.8rem", fontWeight: 600, padding: 0,
};
const answerQuestion: React.CSSProperties = { fontWeight: 700, fontSize: "0.92rem", color: "#111" };
const answerText: React.CSSProperties = { fontSize: "0.85rem", color: "#374151", lineHeight: 1.5, whiteSpace: "pre-wrap" };

const emailBox: React.CSSProperties = { marginTop: "0.5rem", paddingTop: "0.9rem", borderTop: "1px solid #f3f4f6" };
const emailLabel: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem",
};
const emailRow: React.CSSProperties = { display: "flex", gap: "0.5rem" };
const emailInputStyle: React.CSSProperties = {
  flex: 1, padding: "0.5rem 0.7rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", outline: "none",
};
const emailInputReadonly: React.CSSProperties = { background: "#f3f4f6", color: "#6b7280" };
const sendBtn: React.CSSProperties = {
  width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#111", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
};

const otherPrompt: React.CSSProperties = { fontSize: "0.85rem", color: "#374151" };
const textarea: React.CSSProperties = {
  padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", outline: "none",
};
const submitBtn: React.CSSProperties = {
  padding: "0.6rem 1rem", background: "#1b4de0", color: "#fff", border: "none",
  borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: "0.85rem",
};

const errorText: React.CSSProperties = { color: "#dc2626", fontSize: "0.78rem" };
const successText: React.CSSProperties = { color: "#0e9f6e", fontSize: "0.85rem", fontWeight: 600 };
