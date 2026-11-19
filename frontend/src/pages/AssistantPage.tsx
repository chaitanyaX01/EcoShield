import React, { useEffect, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  CornerDownLeft,
} from "lucide-react";
import { api } from "../services/api";
import { Zone } from "../types";

interface ChatEntry {
  id: string;
  sender: "user" | "assistant";
  text: string;
  evidence?: any;
  suggestedAction?: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  "Hi, how are you?",
  "What is the live weather in Pune?",
  "Which area has the highest risk?",
  "Where is the safest shelter?",
  "What resources are available?",
  "What are the emergency helplines?",
];

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "init",
      sender: "assistant",
      text: "Hello! How are you doing today? What help can I do for you? I am EcoShield AI, your flood intelligence and disaster assistance system. You can ask me about live rainfall, safe evacuation shelters, emergency contact numbers, or field rescue status!",
      suggestedAction: "Type a question or click any quick prompt below to start.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("all");
  const [isThinking, setIsThinking] = useState<boolean>(false);

  useEffect(() => {
    async function loadZones() {
      try {
        const zList = await api.getZones();
        setZones(zList);
      } catch (err) {
        console.error(err);
      }
    }
    loadZones();
  }, []);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userEntry: ChatEntry = {
      id: "u-" + Date.now(),
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userEntry]);
    setInputQuery("");
    setIsThinking(true);

    try {
      const res = await api.askAssistant(q, selectedZoneId !== "all" ? selectedZoneId : undefined);
      const botEntry: ChatEntry = {
        id: "b-" + Date.now(),
        sender: "assistant",
        text: res.answer,
        evidence: res.evidence,
        suggestedAction: res.suggested_action,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botEntry]);
    } catch (err: any) {
      const errorEntry: ChatEntry = {
        id: "err-" + Date.now(),
        sender: "assistant",
        text: "Error retrieving local telemetry: " + err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorEntry]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Local Grounded Decision Intelligence
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
            EcoShield AI Assistant
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Zero third-party API exposure: operates on local SQLite telemetry, Extra Trees predictions, and Pune shelter logs.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Target Catchment Context:</span>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="select-control"
            style={{ width: 180, fontSize: 12, padding: "4px 8px" }}
          >
            <option value="all">District Wide (All Zones)</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="eco-card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  background: msg.sender === "user" ? "linear-gradient(135deg, var(--green-500) 0%, var(--green-600) 100%)" : "var(--bg-subtle)",
                  color: msg.sender === "user" ? "#ffffff" : "var(--text-primary)",
                  padding: "12px 18px",
                  borderRadius: "var(--radius-md)",
                  border: msg.sender === "user" ? "none" : "1px solid var(--border-subtle)",
                  boxShadow: msg.sender === "user" ? "0 4px 14px rgba(16, 185, 129, 0.25)" : "var(--shadow-subtle)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {/* Header for assistant message */}
                {msg.sender === "assistant" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 700, color: "var(--green-400)" }}>
                    <Bot size={14} />
                    <span>EcoShield Tactical Assistant</span>
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>• {msg.timestamp}</span>
                  </div>
                )}

                <div>{msg.text}</div>

                {/* Evidence Card if present */}
                {msg.evidence && (
                  <div style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background: "var(--bg-surface)",
                    borderRadius: 6,
                    border: "1px solid var(--border-medium)",
                    fontSize: 11,
                    color: "var(--text-secondary)"
                  }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                      Ground Telemetry Evidence:
                    </div>
                    {Object.entries(msg.evidence).map(([key, val]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                        <span style={{ textTransform: "capitalize" }}>{key.replace(/_/g, " ")}:</span>
                        <strong>{Array.isArray(val) ? val.join(", ") : String(val)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Tactical Action Badge */}
                {msg.suggestedAction && (
                  <div style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border-subtle)",
                    fontSize: 11,
                    color: "var(--teal-900)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <CheckCircle2 size={13} color="var(--teal-700)" />
                    <span><strong>Directive: </strong>{msg.suggestedAction}</span>
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, paddingRight: 4 }}>
                  {msg.timestamp}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12, paddingLeft: 8 }}>
              <div className="pulse-dot animated" style={{ background: "var(--teal-600)" }}></div>
              <span>Grounding response against active Pune hydrology records...</span>
            </div>
          )}
        </div>

        {/* Quick Questions Chips */}
        <div style={{
          padding: "10px 16px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto"
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Quick Inquiries:
          </span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 9999,
                padding: "5px 12px",
                fontSize: 11,
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--green-400)";
                e.currentTarget.style.color = "var(--green-400)";
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "var(--bg-subtle)";
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: "14px 18px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
          display: "flex",
          gap: 12,
          borderBottomLeftRadius: "var(--radius-lg)",
          borderBottomRightRadius: "var(--radius-lg)",
        }}>
          <input
            type="text"
            className="input-control"
            placeholder="Ask about flood probability, rescue boats, shelter vacancies, or protocol in Katraj..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ fontSize: 13 }}
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isThinking}
            className="btn btn-primary"
            style={{ padding: "8px 20px", gap: 6 }}
          >
            <span>Query</span>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
