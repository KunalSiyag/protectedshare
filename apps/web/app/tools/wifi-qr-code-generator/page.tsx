import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import JsonLd from "../../../components/json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import { ContentSection, Faq, PointList, RelatedTools } from "../_components/tool-content";
import { WIFI_FAQ } from "./faq";
import WifiQrClient from "./wifi-qr-client";

const PATH = "/tools/wifi-qr-code-generator";
const DESCRIPTION =
  "Make a QR code that joins your WiFi in one scan. It's drawn in your browser, so the password is never sent. Download PNG or SVG, or print a card.";

export const metadata: Metadata = pageMetadata({
  title: "Free WiFi QR Code Generator",
  description: DESCRIPTION,
  path: PATH,
  keywords: [
    "wifi qr code generator",
    "wifi qr code",
    "qr code for wifi",
    "wifi password qr code",
    "share wifi password",
    "printable wifi card",
  ],
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ProtectedShare WiFi QR Code Generator",
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser with JavaScript.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "WPA, WPA2 and WPA3, WEP and open networks",
    "Hidden networks",
    "PNG and SVG download",
    "Printable scan-to-join card",
    "Runs in the browser; nothing is sent",
  ],
};

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";
const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";

export default function WifiQrCodePage() {
  return (
    <main className="w-full">
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(WIFI_FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: "WiFi QR code generator", path: PATH },
        ])}
      />

      <WifiQrClient />

      <div className="mt-16 md:mt-20">
        <ContentSection eyebrow="How to use it" title="From password to scan in four steps">
          <PointList
            items={[
              {
                title: "Type the network name",
                body: "Exactly as your phone lists it. Network names are case-sensitive, and a space at the end counts.",
              },
              {
                title: "Pick the security type",
                body: "Almost every router with a password uses WPA2 or WPA3, so leave it on WPA/WPA2/WPA3. Pick None only for an open network.",
              },
              {
                title: "Add the password",
                body: "The one you'd type on a laptop. It goes inside the code, so the code is exactly as secret as the password.",
              },
              {
                title: "Scan, save or print",
                body: "Point a phone camera at the screen, download a PNG or SVG for a sign, or print a card for the fridge or the front desk.",
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="Under the hood" title="What's inside a WiFi QR code">
          <p>
            A WiFi QR code is a short line of text in a format phone cameras understand. For a network called{" "}
            <span className={code}>Home</span> with the password <span className={code}>correct-horse</span>, it reads:
          </p>
          <pre className="mt-4 whitespace-pre-wrap break-all rounded-field border border-line bg-surface px-4 py-3.5 font-mono text-[12.5px] leading-5 text-ink-2">
            WIFI:T:WPA;S:Home;P:correct-horse;H:false;;
          </pre>
          <p className="mt-4">
            <span className={code}>T</span> is the security type, <span className={code}>S</span> the network name,{" "}
            <span className={code}>P</span> the password and <span className={code}>H</span> whether the network is hidden. Semicolons separate
            the fields, so a semicolon, comma, colon, double quote or backslash inside the name or password needs a backslash in front of it: a
            password of <span className={code}>tea;biscuits</span> is written <span className={code}>tea\;biscuits</span>. Getting that wrong
            is the usual reason a home-made code says it can&apos;t join. This tool escapes every one of them and shows you the exact text.
          </p>
          <p className="mt-4">
            Nothing in the code is encrypted. Anyone who scans it, or zooms into a photo of it, can read the password in plain text. That&apos;s
            fine for a guest network on the fridge. It isn&apos;t fine for the network your work laptop uses.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Phones" title="Who can scan it">
          <p>
            Current iPhones and most Android phones read WiFi codes with the built-in camera: point, tap the banner, join. Many Android phones
            also have a QR scanner in their WiFi settings. Older phones may need a QR app. Laptops usually can&apos;t scan at all, which is why
            the printed card can show the password as text too.
          </p>
          <p className="mt-4">
            For a hidden network the code says <span className={code}>H:true</span>, which tells the phone to look for a network that
            doesn&apos;t announce its name. Some phones still struggle with hidden networks; if one does, add the network by name in its WiFi
            settings. WPA3 networks use the same <span className={code}>T:WPA</span> value, and a phone that supports WPA3 uses it when the
            router offers it.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Privacy" title="Why it's drawn in your browser">
          <p>
            Many online QR generators draw the image on their server, so the password you type passes through someone else&apos;s computer and
            perhaps their logs. This page draws the code with JavaScript in your tab. There&apos;s no upload: the PNG and SVG files are built
            on your device, and once the page has loaded the tool works with the network switched off. The code is open source under the MIT
            license, so you can check.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Without a code" title="When the guest isn't in the room">
          <p>
            A QR code is for people standing next to it. To get the password to someone elsewhere, don&apos;t paste it into a group chat where
            it stays in every member&apos;s history. Put it in a{" "}
            <AppLink href="/notes" className={linkClass}>
              secure note
            </AppLink>{" "}
            instead: it&apos;s encrypted in your browser, and the link can delete the note after one read. Our guide on{" "}
            <AppLink href="/blog/how-to-share-wifi-password-safely" className={linkClass}>
              how to share a WiFi password safely
            </AppLink>{" "}
            covers guest networks and the other options.
          </p>
        </ContentSection>

        <ContentSection eyebrow="FAQ" title="Questions">
          <Faq items={WIFI_FAQ} />
        </ContentSection>

        <ContentSection title="Related tools">
          <RelatedTools
            items={[
              { href: "/notes", title: "Secure note", body: "Send the password as a link that can burn after one read." },
              { href: "/tools/password-generator", title: "Password generator", body: "A long WiFi password that's still easy to type." },
              { href: "/tools/breached-password-checker", title: "Breached password checker", body: "See if your current password is in a known breach." },
              {
                href: "/blog/how-to-share-wifi-password-safely",
                title: "How to share a WiFi password safely",
                body: "Guest networks, notes that burn, and what to avoid.",
              },
            ]}
          />
        </ContentSection>
      </div>
    </main>
  );
}
