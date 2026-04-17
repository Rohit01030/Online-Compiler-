"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { socket } from "../lib/socket";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../hooks/useTheme";

const Editor = dynamic(()=>import("@monaco-editor/react"),{ssr:false});

const LANGUAGES = {
  cpp: { name: "C++", icon: "⊕", compiler: "GCC" },
  c: { name: "C", icon: "⊕", compiler: "GCC" },
  python: { name: "Python", icon: "🐍", compiler: "Python 3" },
  java: { name: "Java", icon: "☕", compiler: "OpenJDK" }
};

export default function Home(){
  // Theme Management
  const { theme, toggleTheme, mounted } = useTheme();

  // Editor State
  const [code, setCode] = useState("// Start coding here...");
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState("");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [room] = useState("room1");
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState("python");
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("output");

  // Get editor theme based on current theme
  const editorTheme = theme === "light" ? "vs" : "vs-dark";

  // Socket initialization
  useEffect(() => {
    socket.emit("join", room);
    socket.on("code_update", (newCode) => setCode(newCode));
  }, []);

  // User authentication and history loading
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadHistory(data.user.id);
    });
  }, []);

  const loadHistory = async (uid) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/history/${uid}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleChange = (val) => {
    setCode(val);
    socket.emit("code_change", { room, code: val });
  };

  const run = async () => {
    setRunning(true);
    setOutput("");
    setErrors("");

    // Use socket for interactive execution if available
    if (socket.connected) {
      socket.emit("run_code", {
        code,
        language,
        user_id: user?.id
      });

      // Listen for output
      const handleOutput = (data) => {
        setOutput(prev => prev + data.data);
      };

      const handleInputRequired = () => {
        console.log("Input required from user");
      };

      const handleExecutionComplete = () => {
        setRunning(false);
        if (user?.id) loadHistory(user.id);
      };

      socket.off("output").on("output", handleOutput);
      socket.off("input_required").on("input_required", handleInputRequired);
      socket.off("execution_complete").on("execution_complete", handleExecutionComplete);
    } else {
      // Fallback to HTTP API
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language: language,
            input: input,
            user_id: user?.id
          })
        });
        const data = await res.json();
        setOutput(data.output || "");
        if (data.error) {
          setErrors(data.error);
        }
        if (user?.id) loadHistory(user.id);
      } catch (err) {
        setErrors("Failed to run code: " + err.message);
      } finally {
        setRunning(false);
      }
    }
  };

  const handleInputSubmit = (e) => {
    if (e.key === "Enter" && running) {
      if (socket.connected) {
        socket.emit("send_input", { input });
        setInput("");
      }
    }
  };

  const langInfo = LANGUAGES[language] || LANGUAGES.python;

  return (
    <div 
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif"
      }}
      suppressHydrationWarning
    >
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        zIndex: 10,
        gap: "16px"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "fit-content" }}>
          <div style={{ fontSize: "24px" }}>💻</div>
          <div style={{ fontSize: "16px", fontWeight: "600", whiteSpace: "nowrap" }}>
            CodeForge Online IDE
          </div>
        </div>

        {/* Language Tabs - Centered */}
        <div style={{ display: "flex", gap: "4px", flex: 1, justifyContent: "center" }}>
          {Object.entries(LANGUAGES).map(([key, lang]) => (
            <button
              key={key}
              onClick={() => {
                setLanguage(key);
                setCode("");
                setOutput("");
                setErrors("");
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: language === key ? "var(--accent-color)" : "transparent",
                color: language === key ? "white" : "var(--text-secondary)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title={`Switch to ${lang.name}`}
            >
              <span>{lang.icon}</span> {lang.name}
            </button>
          ))}
        </div>

        {/* Run Button - Right Aligned */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", minWidth: "fit-content" }}>
          <button
            onClick={run}
            disabled={running}
            className="btn-primary"
            style={{
              padding: "8px 24px",
              backgroundColor: "var(--accent-bg)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: running ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: running ? 0.7 : 1,
              transition: "opacity 0.3s ease"
            }}
          >
            ▶ Run {langInfo.name} ({langInfo.compiler})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden"
      }}>
        {/* Editor Panel */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border-color)"
        }}>
          {/* File Tab */}
          <div style={{
            padding: "8px 12px",
            backgroundColor: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "12px",
            color: "var(--text-secondary)"
          }}>
            <span>● main.{language === "java" ? "java" : language === "cpp" ? "cpp" : language === "c" ? "c" : "py"}</span>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={handleChange}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 20,
                padding: "12px 0"
              }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div style={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid var(--border-color)"
        }}>
          {/* Output Tabs */}
          <div style={{
            display: "flex",
            gap: "24px",
            padding: "12px 20px",
            backgroundColor: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-color)"
          }}>
            <button
              onClick={() => setActiveTab("output")}
              className={`tab ${activeTab === "output" ? "active" : ""}`}
              style={{
                background: "none",
                border: "none",
                color: activeTab === "output" ? "var(--accent-color)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                padding: "0",
                borderBottom: activeTab === "output" ? "2px solid var(--accent-color)" : "none",
                paddingBottom: "8px"
              }}
            >
              ▹ Output
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={`tab ${activeTab === "errors" ? "active" : ""}`}
              style={{
                background: "none",
                border: "none",
                color: activeTab === "errors" ? "var(--accent-color)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                padding: "0",
                borderBottom: activeTab === "errors" ? "2px solid var(--accent-color)" : "none",
                paddingBottom: "8px"
              }}
            >
              ⊘ Errors
            </button>
          </div>

          {/* Tab Content */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            padding: "20px",
            backgroundColor: "var(--bg-primary)"
          }}>
            {activeTab === "output" ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                {output ? (
                  <pre style={{
                    textAlign: "left",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}>{output}</pre>
                ) : (
                  <>
                    <div style={{ marginTop: "60px", fontSize: "24px" }}>▹_</div>
                    <div style={{ marginTop: "16px" }}>No output yet</div>
                    <div style={{ fontSize: "12px", marginTop: "8px" }}>Press Run to execute your code</div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                {errors ? (
                  <pre className="error-text" style={{
                    textAlign: "left",
                    color: "var(--error-color)",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}>{errors}</pre>
                ) : (
                  <>
                    <div style={{ marginTop: "60px", fontSize: "24px" }}>✓</div>
                    <div style={{ marginTop: "16px" }}>No errors</div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Input Section */}
          <div style={{
            borderTop: "1px solid var(--border-color)",
            padding: "12px 20px",
            backgroundColor: "var(--bg-secondary)"
          }}>
            <div style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginBottom: "8px"
            }}>
              ▹ Standard input (stdin) {running ? "- Press Enter to submit" : ""}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleInputSubmit}
              placeholder={running ? "Type input here and press Enter..." : "Enter input here..."}
              disabled={false}
              style={{
                width: "100%",
                height: "80px",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                border: running ? "1px solid var(--accent-color)" : "1px solid var(--border-color)",
                borderRadius: "4px",
                padding: "8px",
                fontSize: "12px",
                fontFamily: "monospace",
                resize: "none",
                outline: "none",
                opacity: running ? 1 : 0.7,
                transition: "border-color 0.3s ease"
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 20px",
        backgroundColor: "var(--bg-primary)",
        borderTop: "1px solid var(--border-color)",
        fontSize: "12px",
        color: "var(--text-secondary)"
      }}>
        <div>● {running ? "Running..." : "Ready"}</div>
        <div>{langInfo.name} ({langInfo.compiler})</div>
      </div>
    </div>
  );
}
