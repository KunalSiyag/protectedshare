"use client";

import { useState, useEffect, useRef } from "react";
import { encrypt, decrypt, generateRandomPassword } from "@protectedshare/crypto";
import type {
  CreateChatMessageRequest,
  GetChatMessagesResponse,
  ChatMessageResponse,
  GetChatPresenceResponse,
  UpdateChatPresenceRequest,
} from "@protectedshare/contracts";
import { Button, Card, CardContent, Input } from "@protectedshare/ui";
import { Loader2, Send, Lock, ShieldCheck, Users, LogOut, RotateCcw, Signal, ChevronDown, Eye, EyeOff } from "lucide-react";
import { apiUrl } from "../../lib/api";

type Message = {
  id: string;
  text: string;
  createdAt: number;
  isSelf: boolean;
};

const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_-";
const CHAT_CLIENT_ID_STORAGE_KEY = "protectedshare-chat-client-id";
const CHAT_SESSION_STORAGE_KEY = "protectedshare-chat-session";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

type ChatSession = { roomId: string; password: string; savedAt: number };

function saveChatSession(roomId: string, password: string): void {
  if (typeof window === "undefined") return;
  const session: ChatSession = { roomId, password, savedAt: Date.now() };
  window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function loadChatSession(): ChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ChatSession;
    if (Date.now() - session.savedAt > SESSION_TTL_MS) {
      window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

function clearChatSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
}

function generateRoomId(length = 12): string {
  if (typeof globalThis.crypto === "undefined") {
    throw new Error("Secure random generation is unavailable.");
  }

  const randomValues = globalThis.crypto.getRandomValues(new Uint32Array(length));
  let roomId = "";

  for (let index = 0; index < randomValues.length; index += 1) {
    roomId += ROOM_ID_ALPHABET[randomValues[index] % ROOM_ID_ALPHABET.length];
  }

  return roomId;
}

function parseInviteHash(hash: string): { roomId: string; password: string } | null {
  const normalizedHash = hash.replace(/^#/, "");
  if (!normalizedHash) {
    return null;
  }

  const separatorIndex = normalizedHash.indexOf(":");
  if (separatorIndex === -1) {
    try {
      return { roomId: decodeURIComponent(normalizedHash), password: "" };
    } catch {
      return { roomId: normalizedHash, password: "" };
    }
  }

  const rawRoomId = normalizedHash.slice(0, separatorIndex);
  const rawPassword = normalizedHash.slice(separatorIndex + 1);

  try {
    return {
      roomId: decodeURIComponent(rawRoomId),
      password: decodeURIComponent(rawPassword),
    };
  } catch {
    return {
      roomId: rawRoomId,
      password: rawPassword,
    };
  }
}

function buildInviteUrl(origin: string, nextRoomId: string, nextPassword: string): string {
  return `${origin}/chat#${encodeURIComponent(nextRoomId)}:${encodeURIComponent(nextPassword)}`;
}

function createChatClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getChatClientId(): string {
  if (typeof window === "undefined") {
    return createChatClientId();
  }

  const existing = window.sessionStorage.getItem(CHAT_CLIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = createChatClientId();
  window.sessionStorage.setItem(CHAT_CLIENT_ID_STORAGE_KEY, next);
  return next;
}

async function updateChatPresence(
  roomId: string,
  clientId: string,
  nextState: UpdateChatPresenceRequest["state"],
  isTyping = false,
): Promise<GetChatPresenceResponse | null> {
  try {
    const res = await fetch(apiUrl(`/api/chat/${roomId}/presence`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        isTyping,
        state: nextState,
      } satisfies UpdateChatPresenceRequest),
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as GetChatPresenceResponse;
  } catch {
    return null;
  }
}

async function leaveChatPresence(roomId: string, clientId: string): Promise<GetChatPresenceResponse | null> {
  try {
    const res = await fetch(apiUrl(`/api/chat/${roomId}/presence?clientId=${encodeURIComponent(clientId)}`), {
      method: "DELETE",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as GetChatPresenceResponse;
  } catch {
    return null;
  }
}

export default function ChatClient() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [copiedField, setCopiedField] = useState<"room" | "password" | "invite" | null>(null);
  const [connectionState, setConnectionState] = useState<"idle" | "live" | "fallback">("idle");
  const [presence, setPresence] = useState<GetChatPresenceResponse | null>(null);
  const [clientId] = useState(() => getChatClientId());
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const lastMessageTimeRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const typingStateRef = useRef(false);
  const userScrolledUpRef = useRef(false);
  const inviteUrl =
    typeof window !== "undefined" && roomId && password
      ? buildInviteUrl(window.location.origin, roomId, password)
      : "";

  const clearTransientState = () => {
    setMessages([]);
    setDraft("");
    setError(null);
    setIsSending(false);
    setLastMessageTime(0);
    setConnectionState("idle");
    setPresence(null);
    setCopiedField(null);
    lastMessageTimeRef.current = 0;
    typingStateRef.current = false;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Parse hash or restore session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const invite = parseInviteHash(window.location.hash);
    if (invite && invite.roomId && invite.password) {
      setRoomId(invite.roomId);
      setPassword(invite.password);
      setMode("join");
      saveChatSession(invite.roomId, invite.password);
      setIsJoined(true);
      return;
    }
    // No hash — try restoring saved session
    const session = loadChatSession();
    if (session) {
      setRoomId(session.roomId);
      setPassword(session.password);
      setMode("join");
      window.location.hash = `${encodeURIComponent(session.roomId)}:${encodeURIComponent(session.password)}`;
      setIsJoined(true);
    }
  }, []);

  // Smart scroll: only auto-scroll if user is near the bottom
  useEffect(() => {
    if (!isJoined) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (!userScrolledUpRef.current || distFromBottom < 120) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isJoined]);

  // Polling for new messages
  useEffect(() => {
    if (!isJoined || !roomId || !password) return;

    let cancelled = false;
    let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;

    const applyIncomingMessages = async (incomingMessages: ChatMessageResponse[]) => {
      if (incomingMessages.length === 0) return;

      const newMsgs: Message[] = [];
      for (const msg of incomingMessages) {
        try {
          const text = await decrypt(msg.payload.encryptedBlob, password, msg.payload.iv, msg.payload.salt);
          newMsgs.push({
            id: msg.id,
            text,
            createdAt: msg.createdAt,
            isSelf: false,
          });
        } catch {
          // Decryption failed — message was likely encrypted with a different key
        }
      }

      if (newMsgs.length === 0) return;

      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        for (const msg of newMsgs) {
          if (!map.has(msg.id)) {
            map.set(msg.id, msg);
          }
        }
        const updated = Array.from(map.values());
        updated.sort((a, b) => a.createdAt - b.createdAt);
        return updated;
      });

      const maxTime = Math.max(...newMsgs.map((m) => m.createdAt));
      if (maxTime > lastMessageTimeRef.current) {
        lastMessageTimeRef.current = maxTime;
        setLastMessageTime(maxTime);
      }
    };

    const startPollingFallback = () => {
      setConnectionState("fallback");

      const poll = async () => {
        if (cancelled) return;

        try {
          const res = await fetch(apiUrl(`/api/chat/${roomId}?since=${lastMessageTimeRef.current}`));
          if (!res.ok) throw new Error("fetch");
          const data: GetChatMessagesResponse = await res.json();
          await applyIncomingMessages(data.messages ?? []);
        } catch {
          // Polling failed — will retry
        } finally {
          if (!cancelled) {
            fallbackTimeoutId = setTimeout(poll, 800);
          }
        }
      };

      poll();
    };

    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        setConnectionState("live");
        const streamUrl = apiUrl(`/api/chat/${roomId}/stream?since=${lastMessageTimeRef.current}`);
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener("ready", () => {
          if (!cancelled) {
            setConnectionState("live");
          }
        });

        eventSource.addEventListener("messages", async (event) => {
          if (cancelled) return;

          try {
            const payload = JSON.parse((event as MessageEvent).data) as { messages?: ChatMessageResponse[] };
            await applyIncomingMessages(payload.messages ?? []);
          } catch {
            // Stream parse error
          }
        });

        eventSource.addEventListener("error", () => {
          if (cancelled) return;
          eventSource?.close();
          eventSource = null;
          startPollingFallback();
        });
      } catch (err) {
        console.warn("EventSource unavailable, using polling fallback.", err);
        startPollingFallback();
      }
    } else {
      startPollingFallback();
    }

    return () => {
      cancelled = true;
      eventSource?.close();
      if (fallbackTimeoutId) {
        clearTimeout(fallbackTimeoutId);
      }
    };
  }, [isJoined, roomId, password]);

  useEffect(() => {
    if (!isJoined || !roomId) {
      return;
    }

    let cancelled = false;

    const syncPresence = async (nextState: UpdateChatPresenceRequest["state"], isTyping = false) => {
      const response = await updateChatPresence(roomId, clientId, nextState, isTyping);
      if (!cancelled && response) {
        setPresence(response);
      }
    };

    void syncPresence("active", typingStateRef.current);

    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = window.setInterval(() => {
      void syncPresence("active", typingStateRef.current);
    }, 5000);

    return () => {
      cancelled = true;
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isJoined, roomId]);

  useEffect(() => {
    if (!isJoined || !roomId) {
      return;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      if (typingStateRef.current) {
        typingStateRef.current = false;
        void updateChatPresence(roomId, clientId, "active", false).then((response) => {
          if (response) {
            setPresence(response);
          }
        });
      }
      return;
    }

    if (!typingStateRef.current) {
      typingStateRef.current = true;
      void updateChatPresence(roomId, clientId, "active", true).then((response) => {
        if (response) {
          setPresence(response);
        }
      });
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      typingStateRef.current = false;
      void updateChatPresence(roomId, clientId, "active", false).then((response) => {
        if (response) {
          setPresence(response);
        }
      });
      typingTimeoutRef.current = null;
    }, 1200);
  }, [draft, isJoined, roomId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isJoined || !roomId) {
      return;
    }

    const handleBeforeUnload = () => {
      void fetch(apiUrl(`/api/chat/${roomId}/presence?clientId=${encodeURIComponent(clientId)}`), {
        method: "DELETE",
        keepalive: true,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isJoined, roomId]);


  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!roomId.trim() || !password.trim()) {
      setError("Room ID and Encryption Password are required.");
      return;
    }

    // Validate Room ID format (must match backend BASE64_URL_PATTERN)
    if (!/^[A-Za-z0-9_-]+$/.test(roomId)) {
      setError("Room ID can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    clearTransientState();
    saveChatSession(roomId, password);
    window.location.hash = `${encodeURIComponent(roomId)}:${encodeURIComponent(password)}`;
    setIsJoined(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !isJoined || isSending) return;

    setIsSending(true);
    const textToSend = draft;
    setDraft(""); // Optimistic UI clear

    try {
      const encryptedPayload = await encrypt(textToSend, password);

      const payload: CreateChatMessageRequest = {
        payload: encryptedPayload
      };

      const res = await fetch(apiUrl(`/api/chat/${roomId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data: ChatMessageResponse = await res.json();

      // Optimistically add to UI
      const newMsg: Message = {
        id: data.id,
        text: textToSend,
        createdAt: data.createdAt,
        isSelf: true
      };

      setMessages((prev) => {
        const updated = [...prev, newMsg];
        updated.sort((a, b) => a.createdAt - b.createdAt);
        return updated;
      });

      if (data.createdAt > lastMessageTimeRef.current) {
        lastMessageTimeRef.current = data.createdAt;
        setLastMessageTime(data.createdAt);
      }

    } catch (err: any) {
      console.error("Send error:", err);
      setError(err.message || "Failed to send message. Please try again.");
      setDraft(textToSend); // Restore draft on failure
    } finally {
      setIsSending(false);
    }
  };

  const generateInviteLink = () => {
    const url = inviteUrl;
    void navigator.clipboard.writeText(url);
    setCopiedField("invite");
    alert("Invite link copied to clipboard. Share it via a secure channel.");
  };

  const copyToClipboard = async (value: string, field: "room" | "password" | "invite") => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => {
      setCopiedField((current) => (current === field ? null : current));
    }, 1800);
  };

  const openRoomSession = (nextRoomId: string, nextPassword: string) => {
    clearTransientState();
    setError(null);
    setRoomId(nextRoomId);
    setPassword(nextPassword);
    setMode("create");
    saveChatSession(nextRoomId, nextPassword);
    window.location.hash = `${encodeURIComponent(nextRoomId)}:${encodeURIComponent(nextPassword)}`;
    setIsJoined(true);
  };

  const handleCreateRoom = () => {
    setError(null);
    try {
      const nextRoomId = generateRoomId();
      const nextPassword = generateRandomPassword(24);
      const nextInviteUrl = buildInviteUrl(window.location.origin, nextRoomId, nextPassword);
      openRoomSession(nextRoomId, nextPassword);
      void navigator.clipboard.writeText(nextInviteUrl);
      setCopiedField("invite");
      alert("New room created and invite link copied to clipboard.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create a new room.";
      setError(message);
    }
  };

  const handleRegenerateRoom = () => {
    setError(null);
    try {
      void leaveChatPresence(roomId, clientId);
      const nextRoomId = generateRoomId();
      const nextPassword = generateRandomPassword(24);
      const nextInviteUrl = buildInviteUrl(window.location.origin, nextRoomId, nextPassword);
      openRoomSession(nextRoomId, nextPassword);
      void navigator.clipboard.writeText(nextInviteUrl);
      setCopiedField("invite");
      alert("Room regenerated and invite link copied to clipboard.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to regenerate the room.";
      setError(message);
    }
  };

  const handleLeaveRoom = () => {
    setError(null);
    if (roomId) {
      void leaveChatPresence(roomId, clientId);
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    typingStateRef.current = false;
    clearTransientState();
    clearChatSession();
    setRoomId("");
    setPassword("");
    setMode("join");
    setIsJoined(false);
    window.location.hash = "";
  };

  if (!isJoined) {
    return (
      <div className="max-w-md mx-auto w-full pt-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4 ring-4 ring-white dark:ring-zinc-950">
            <Lock className="w-6 h-6 text-zinc-900 dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Anonymous Chatroom</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Join or create an end-to-end encrypted chatroom. Your password never leaves your device.
          </p>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="pt-6">
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-1">
              <Button
                type="button"
                variant={mode === "create" ? "default" : "ghost"}
                onClick={() => {
                  setMode("create");
                  setError(null);
                }}
                className="w-full"
              >
                Create Room
              </Button>
              <Button
                type="button"
                variant={mode === "join" ? "default" : "ghost"}
                onClick={() => {
                  setMode("join");
                  setError(null);
                }}
                className="w-full"
              >
                Join Room
              </Button>
            </div>

            {mode === "create" ? (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                    {error}
                  </div>
                )}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] font-semibold text-zinc-500 dark:text-zinc-400">
                      One-click room creation
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      We generate a random room ID and password, open the room, and copy the invite link so you can share it instantly.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateRoom}
                    className="w-full font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
                  >
                    Create New Room
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    Room ID
                  </label>
                  <Input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. secure-project-x"
                    className="bg-zinc-50 dark:bg-zinc-900/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    Encryption Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Shared secret key"
                    className="bg-zinc-50 dark:bg-zinc-900/50"
                  />
                </div>

                <Button type="submit" className="w-full font-bold">
                  Join Encrypted Room
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Internal SEO Links */}
        <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto pb-8">
          <p>Looking for a different tool?</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
            <a href="/notes" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Secure Notes</a>
            <a href="/secrets" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">EnvShare (Dev Keys)</a>
            <a href="/notepad" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Encrypted Notepad</a>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
            <a href="/vs/privnote" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Privnote alternative</a>
            <a href="/vs/protectedtext" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">ProtectedText alternative</a>
            <a href="/blog" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Security blog</a>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-200px)] -mx-3 sm:mx-0">
      {/* Header — compact row */}
      <div className="px-4 py-2.5 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">{roomId}</span>
            <Lock className="w-3 h-3 text-zinc-400 shrink-0" />
            {presence && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
                <Users className="inline w-3 h-3 mr-0.5" />{presence.onlineCount}
              </span>
            )}
            {presence?.typingCount ? (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 animate-pulse shrink-0">typing…</span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsInfoExpanded(v => !v)}
              className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-0.5 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={isInfoExpanded ? "Hide room info" : "Show room info"}
            >
              {isInfoExpanded ? "Hide" : "Info"}
              <ChevronDown className={`w-3 h-3 transition-transform ${isInfoExpanded ? "rotate-180" : ""}`} />
            </button>
            <Button variant="outline" onClick={generateInviteLink} className="text-[10px] h-7 px-2">
              {copiedField === "invite" ? "✓ Copied" : "Invite"}
            </Button>
            <Button variant="outline" onClick={handleRegenerateRoom} className="text-[10px] h-7 px-2">
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleLeaveRoom}
              className="text-[10px] h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Collapsible room info */}
        {isInfoExpanded && (
          <div className="mt-2 grid gap-2 sm:grid-cols-3 border-t border-zinc-100 dark:border-zinc-800 pt-2">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Room ID</p>
              <div className="flex items-center gap-1">
                <code className="flex-1 font-mono text-xs truncate text-zinc-800 dark:text-zinc-100">{roomId}</code>
                <button type="button" onClick={() => copyToClipboard(roomId, "room")} className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0">{copiedField === "room" ? "✓" : "Copy"}</button>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Password</p>
              <div className="flex items-center gap-1">
                <code className="flex-1 font-mono text-xs truncate text-zinc-800 dark:text-zinc-100">{'•'.repeat(Math.min(password.length, 20))}</code>
                <button type="button" onClick={() => copyToClipboard(password, "password")} className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0">{copiedField === "password" ? "✓" : "Copy"}</button>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Invite Link</p>
              <div className="flex items-center gap-1">
                <code className="flex-1 font-mono text-xs truncate text-zinc-800 dark:text-zinc-100">{inviteUrl.replace(/^https?:\/\//, '')}</code>
                <button type="button" onClick={() => copyToClipboard(inviteUrl, "invite")} className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0">{copiedField === "invite" ? "✓" : "Copy"}</button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Message List */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/30"
        onScroll={() => {
          const el = messagesContainerRef.current;
          if (!el) return;
          const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
          userScrolledUpRef.current = dist > 120;
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col text-zinc-400 dark:text-zinc-500 space-y-3">
            <Lock className="w-8 h-8 opacity-50" />
            <p className="text-sm font-medium">Waiting for messages...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                  msg.isSelf
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {msg.text}
                </div>
              </div>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type an encrypted message..."
            className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-transparent focus-visible:ring-blue-500 dark:focus-visible:ring-emerald-500 rounded-full px-4 h-10"
            disabled={isSending}
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!draft.trim() || isSending}
            className="rounded-full h-10 w-10 p-0 shrink-0 bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </Button>
        </form>
        {error && (
          <p className="text-[10px] text-red-500 mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
