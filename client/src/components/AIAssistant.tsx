import { useState } from "react";
import { Bot, Send } from "lucide-react";

export function AIAssistant() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "¿Cuántos leads pendientes tengo?",
    "Muéstrame las llamadas de hoy",
    "¿Qué casos están sin asignar?",
    "Resumen de conversiones esta semana",
  ];

  const sendMessage = async (customMessage?: string) => {
    const finalMessage = customMessage || message;
    if (!finalMessage.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: finalMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error consultando la IA." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* === EMPTY STATE === */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-6">

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Bot className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-semibold mb-2">
            ¿Cómo puedo ayudarte?
          </h3>

          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Consulta leads, llamadas, métricas o cualquier información
            relacionada con tu CRM.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="px-4 py-2 rounded-xl text-sm border border-border bg-muted hover:bg-muted/70 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === CHAT MESSAGES === */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-xs text-muted-foreground">
              La IA está analizando la información...
            </div>
          )}
        </div>
      )}

      {/* === INPUT AREA === */}
      <div className="border-t border-border p-4 bg-background">
        <div className="flex items-center gap-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Escribe tu consulta..."
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}