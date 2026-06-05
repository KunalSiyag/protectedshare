import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — ProtectedShare",
  description: "Get in touch with the ProtectedShare support team for inquiries, bug reports, or enterprise hosting.",
  alternates: {
    canonical: "https://protectedshare.me/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-zinc-800 dark:text-zinc-300">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">Contact Us</h1>
      <p className="text-sm text-zinc-500 mb-8 font-mono">We value your inquiries and feedback</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <p>
          Have questions about our zero-knowledge architecture, want to report a security bug, or need help? 
          We are committed to responding to our users and community.
        </p>

        <section className="space-y-3 p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Primary Support &amp; Inquiries</h2>
          <p className="text-sm">
            For support requests, bug reports, and general feedback:
          </p>
          <p className="font-mono font-bold text-lg">
            <a href="mailto:admin@protectedshare.me" className="text-blue-600 dark:text-emerald-400 hover:underline">
              admin@protectedshare.me
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Enterprise Hosting</h2>
          <p>
            If your organization needs a fully isolated, dedicated zero-knowledge instance (custom domains, isolated storage, full administrative logging controls, compliance auditing support), reach out via our email. We deploy dedicated environments on Cloudflare Workers and global edge nodes.
          </p>
        </section>
      </div>
    </main>
  );
}
