import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import PageFrame from "./page-frame";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col w-full overflow-x-hidden bg-zinc-50 dark:bg-[#09090b]">
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
      <div className="absolute top-[8%] left-[-8%] w-[42%] h-[28%] rounded-full bg-blue-500/10 dark:bg-emerald-500/10 pointer-events-none -z-10" />
      <div className="absolute bottom-[18%] right-[-10%] w-[38%] h-[26%] rounded-full bg-indigo-500/10 dark:bg-teal-500/10 pointer-events-none -z-10" />

      <SiteHeader />
      <PageFrame>{children}</PageFrame>
      <SiteFooter />
    </div>
  );
}
