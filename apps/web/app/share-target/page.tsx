import type { Metadata } from "next";
import ShareTargetClient from "./share-target-client";

export const metadata: Metadata = {
  title: "Shared to ProtectedShare",
  description: "Text or files shared to the installed app, waiting on this device to be sealed into an encrypted link.",
  robots: { index: false, follow: false },
};

/** Where "Share to ProtectedShare" lands (manifest share_target, via public/sw.js). */
export default function ShareTargetPage() {
  return <ShareTargetClient />;
}
