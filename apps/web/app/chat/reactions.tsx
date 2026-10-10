import { Check, Frown, Heart, Laugh, Sparkles, ThumbsUp, type LucideIcon } from "lucide-react";
import type { ReactionKey } from "./chat-lib";

/** Reactions are icons, never emoji characters. */
export const REACTIONS: { key: ReactionKey; label: string; Icon: LucideIcon }[] = [
  { key: "up", label: "Thumbs up", Icon: ThumbsUp },
  { key: "love", label: "Love", Icon: Heart },
  { key: "laugh", label: "Haha", Icon: Laugh },
  { key: "wow", label: "Wow", Icon: Sparkles },
  { key: "sad", label: "Sad", Icon: Frown },
  { key: "ack", label: "Got it", Icon: Check },
];

export function reactionMeta(key: ReactionKey) {
  return REACTIONS.find((reaction) => reaction.key === key) ?? REACTIONS[0];
}
