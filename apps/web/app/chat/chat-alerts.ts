"use client";

let audioContext: AudioContext | null = null;

/** A short two-note blip made with WebAudio. No audio file. */
export function playBlip(): void {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    audioContext ??= new Context();
    const context = audioContext;
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime + 0.01;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    gain.connect(context.destination);
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, start);
    oscillator.frequency.setValueAtTime(1175, start + 0.07);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + 0.24);
  } catch {
    // audio blocked
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Shows the sender's name only. Message text never goes to the OS notification center. */
export function showNotification(roomId: string, name: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    const notification = new Notification("New encrypted message", {
      body: `${name} sent a message. Open the tab to read it.`,
      tag: `ps-chat-${roomId}`,
      silent: true,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // some browsers only allow notifications from a service worker
  }
}
