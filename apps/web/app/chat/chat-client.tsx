"use client";

import { useState, useEffect, useRef } from "react";
import { encrypt, decrypt, generateRandomPassword } from "@protectedshare/crypto";
import type { CreateChatMessageRequest, GetChatMessagesResponse, ChatMessageResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, Input } from "@protectedshare/ui";
import { Loader2, Send, Lock, ShieldCheck, User } from "lucide-react";
import { apiUrl } from "../../lib/api";

type Message = {
  id: string;
  text: string;
  createdAt: number;
  isSelf: boolean;
};

const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_-";

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
  const lastMessageTimeRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inviteUrl =
    typeof window !== "undefined" && roomId && password
      ? buildInviteUrl(window.location.origin, roomId, password)
      : "";

  // Parse hash and path to auto-join if provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const invite = parseInviteHash(window.location.hash);
      if (invite) {
        setRoomId(invite.roomId);
        setPassword(invite.password);
        setMode("join");
      }
    }
  }, []);

  useEffect(() => {
    if (isJoined) {
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
        } catch (decErr) {
          console.warn("Failed to decrypt message", msg.id, decErr);
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
          if (!res.ok) {
            throw new Error("Failed to fetch messages");
          }
          const data: GetChatMessagesResponse = await res.json();
          await applyIncomingMessages(data.messages ?? []);
        } catch (err) {
          console.error("Polling error:", err);
        } finally {
          if (!cancelled) {
            fallbackTimeoutId = setTimeout(poll, 2000);
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
          } catch (err) {
            console.error("Stream parsing error:", err);
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

    // Update URL hash for sharing
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

  const handleCreateRoom = () => {
    setError(null);
    try {
      const nextRoomId = generateRoomId();
      const nextPassword = generateRandomPassword(24);
      const inviteUrl = buildInviteUrl(window.location.origin, nextRoomId, nextPassword);
      setRoomId(nextRoomId);
      setPassword(nextPassword);
      setMode("create");
      window.location.hash = `${encodeURIComponent(nextRoomId)}:${encodeURIComponent(nextPassword)}`;
      void navigator.clipboard.writeText(inviteUrl);
      setCopiedField("invite");
      setIsJoined(true);
      alert("New room created and invite link copied to clipboard.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create a new room.";
      setError(message);
    }
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
                  pattern="[A-Za-z0-9_\\-]+"
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Room: <span className="font-mono text-xs">{roomId}</span>
          </h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
            <Lock className="w-3 h-3" /> End-to-end encrypted
          </p>
        </div>
        <Button variant="outline" onClick={generateInviteLink} className="text-xs h-8 px-2">
          {copiedField === "invite" ? "Invite Copied" : "Copy Invite"}
        </Button>
      </div>

      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Room ID</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">{roomId}</code>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(roomId, "room")}
                className="h-8 px-2 text-xs shrink-0"
              >
                {copiedField === "room" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Password</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">{password}</code>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(password, "password")}
                className="h-8 px-2 text-xs shrink-0"
              >
                {copiedField === "password" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Invite Link</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">
                {inviteUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(inviteUrl, "invite")}
                className="h-8 px-2 text-xs shrink-0"
              >
                {copiedField === "invite" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
          Live status: {connectionState === "live" ? "server-push stream" : connectionState === "fallback" ? "polling fallback" : "connecting"}
        </p>
        <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
          Share the invite link for easy access, or send the room ID and password separately for a split-channel handoff.
        </p>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/30">
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
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-1 flex items-center gap-1.5">
                {!msg.isSelf && <User className="w-3 h-3" />}
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
