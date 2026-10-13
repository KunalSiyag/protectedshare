import type { FaqItem } from "../_components/tool-content";

export const WIFI_FAQ: FaqItem[] = [
  {
    question: "Is this WiFi QR code generator free and private?",
    answer:
      "Yes. There's no account and no limit. The code is drawn in your browser, and the network name and password are never sent to our server or anyone else's. The page loads from our server like any website; after that the tool makes no network requests, and it keeps working offline.",
  },
  {
    question: "Do WiFi QR codes expire?",
    answer:
      "No. The code simply holds your network name and password, so it works until you change either of them. When you change the password, make a new code and replace any printed cards.",
  },
  {
    question: "Why won't my phone join after scanning?",
    answer:
      "Usually the name or password differs from the router's by a capital letter or a space, or the security type is wrong. Compare the text under \"What the code says\" with your router's settings. Hidden networks and networks on a band the phone can't use cause the rest.",
  },
  {
    question: "Which security type should I choose?",
    answer:
      "WPA/WPA2/WPA3 for nearly every network with a password. WEP only for a very old router, and consider replacing it, because WEP can be broken in minutes. None for an open network with no password.",
  },
  {
    question: "Does it work with WPA3?",
    answer:
      "Yes. The code says T:WPA, the value phone cameras read for every personal WPA version, and a phone that supports WPA3 uses it when the router offers it. Enterprise networks that ask for a username as well as a password aren't supported.",
  },
  {
    question: "Can someone get my password from the QR code?",
    answer:
      "Yes, if they can scan it or a photo of it. A WiFi QR code is the password in another form, not an encrypted copy. Put printed cards where only your guests see them, and give guests their own network if your router can.",
  },
  {
    question: "Can I print the card without the password showing?",
    answer:
      "Yes. Turn off \"Print the password on the card\". The password is still inside the QR code itself, so the card still deserves the same care as the password.",
  },
];
