import type { Metadata } from "next";
import ToolGuide, { GuideLink } from "../../components/tool-guide";
import { pageMetadata } from "../../lib/seo";
import type { FaqItem } from "../tools/_components/tool-content";
import ChatClient from "./chat-client";

const DESCRIPTION =
  "Open an encrypted chat room and share the link. Messages, photos and files are encrypted in your browser; the server only relays ciphertext. No signup.";

export const metadata: Metadata = pageMetadata({
  title: "Anonymous Encrypted Chat Room, No Signup",
  description: DESCRIPTION,
  path: "/chat",
  keywords: [
    "anonymous encrypted chat",
    "encrypted chat room",
    "private chat room no signup",
    "end-to-end encrypted chat",
    "secure chat link",
    "disappearing messages",
  ],
});

const FAQ: FaqItem[] = [
  {
    question: "Is this chat anonymous?",
    answer:
      "There's no account, phone number or email, and your display name is optional and travels encrypted. But like any website, our hosts see IP addresses and request times. If you need to hide where you're connecting from, use a tool built for that, such as Tor.",
  },
  {
    question: "Can ProtectedShare read the messages?",
    answer:
      "No. Messages are encrypted in each browser with a key that lives after the # in the invite link, which browsers don't send to servers. The server stores and relays ciphertext it can't decrypt.",
  },
  {
    question: "What are the safety words?",
    answer:
      "Five words derived from the room key. If everyone in the room sees the same five words, you all hold the same key and nobody swapped the invite. Compare them on a call or in person.",
  },
  {
    question: "How long are messages kept?",
    answer:
      "Until everyone has left the room, a disappearing timer runs out, or someone burns the room, whichever comes first. Cleanup happens on the room's next request or within 30 minutes, not to the second.",
  },
  {
    question: "Can people in the room save messages?",
    answer:
      "Yes. Anyone in the room can copy, screenshot or save what they see, and nothing on a web page can stop that. Disappearing messages and burning the room control the copy on our server only.",
  },
  {
    question: "What does burning the room do?",
    answer:
      "It deletes every message and the room itself from the server, for everyone, straight away. People still in the room see that it was burned. It can't be undone.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. It runs in the browser on desktop and mobile. You can turn on browser notifications, which show the sender's name only, never the message.",
  },
];

export default function ChatPage() {
  return (
    <ChatClient
      guide={
        <ToolGuide
          anchors={false}
          appName="ProtectedShare Encrypted Chat"
          path="/chat"
          description="An encrypted chat room in the browser: messages, photos and files are encrypted before they're sent, and the room needs no signup."
          features={[
            "AES-256-GCM encryption in each browser",
            "Room key carried in the invite link's fragment",
            "Safety words to confirm everyone has the same key",
            "Disappearing messages from 30 seconds to 1 week",
            "Encrypted photos and files up to 800 KB",
            "Burn the room for everyone",
            "No account, phone number or email",
          ]}
          breadcrumb="Encrypted chat"
          how={{
            title: "How the encrypted chat works",
            steps: [
              {
                title: "Open a room",
                body: "Your browser makes a random room ID and a 256-bit key. The invite link carries both, with the key after the #.",
              },
              {
                title: "Share the invite",
                body: "Anyone with the full link can join. Messages, photos and files are encrypted in each browser before they're sent.",
              },
              {
                title: "Check, talk, leave",
                body: "Compare the five safety words to confirm you share the key. When everyone leaves, the messages are deleted.",
              },
            ],
          }}
          uses={{
            title: "For conversations that shouldn't leave a trail",
            items: [
              {
                title: "A quick private talk",
                body: "Talk with someone who doesn't use your messaging app, without swapping phone numbers or usernames.",
              },
              {
                title: "Incidents and handoffs",
                body: "Pass credentials and details during an incident in a room you burn when it's over.",
              },
              {
                title: "A short-lived group",
                body: "Bring a few people together for one task, with messages that disappear on a timer.",
              },
              {
                title: "Screenshots and files",
                body: "Share a photo or a small file inside the encrypted message instead of a cloud link.",
              },
            ],
          }}
          limits={{
            title: "What the server sees, and when it forgets",
            items: [
              {
                label: "Encryption",
                value: "AES-256-GCM in each browser with the key from the invite link. The server gets a hash to check membership, never the key.",
              },
              {
                label: "Server keeps",
                value: "Encrypted messages with their times and timers, the room's auth hash and default timer, a hash of each message's delete token, and presence: a random per-tab ID, a typing flag and when it was last seen.",
              },
              {
                label: "Never sent",
                value: "Message text, photos, files, the room key, and your display name, which travels inside the encrypted messages.",
              },
              { label: "Attachments", value: "Photos and files up to 800 KB each, encrypted inside the message." },
              {
                label: "Timers",
                value: "Disappearing messages are off by default, or from 30 seconds to 1 week. The server deletes each message when its timer ends.",
              },
              {
                label: "Deletion",
                value: "Messages go once nobody is left in the room, when their timer ends, or when anyone burns the room. An idle room is forgotten after 7 days.",
              },
            ],
            footnote: (
              <>
                Older rooms opened with a password still work. Every stored field is listed on the{" "}
                <GuideLink href="/privacy">privacy page</GuideLink>.
              </>
            ),
          }}
          faq={{ title: "Encrypted chat questions", items: FAQ }}
          related={[
            { href: "/notes", title: "Secure note", body: "One message that burns after reading." },
            { href: "/files", title: "File drop", body: "Send encrypted files up to 25 MB." },
            { href: "/notepad", title: "Encrypted notepad", body: "Private notes that stay encrypted." },
            { href: "/request", title: "Secret request", body: "Ask someone to send you a password." },
            { href: "/vs/privatebin", title: "ProtectedShare vs PrivateBin", body: "How it compares with PrivateBin." },
            { href: "/blog/anonymous-chat-room-no-signup-how-it-works", title: "Anonymous chat rooms, explained", body: "How a no-signup chat room works." },
          ]}
        />
      }
    />
  );
}
