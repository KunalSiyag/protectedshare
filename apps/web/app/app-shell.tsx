import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import PageFrame from "./page-frame";
import { ToastProvider } from "../components/toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen w-full flex-col overflow-x-clip bg-bg">
        <SiteHeader />
        <PageFrame>{children}</PageFrame>
        <SiteFooter />
      </div>
    </ToastProvider>
  );
}
