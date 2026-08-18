import { useEffect, useState } from "react";
import { Shell } from "./components/Shell";
import { ToastProvider } from "./components/ui";
import { pagesFor, StoreProvider, useStore, type PageId } from "./lib/store";
import { ChecklistsPage } from "./pages/Checklists";
import { Dashboard } from "./pages/Dashboard";
import { EquipmentPage } from "./pages/Equipment";
import { Inspection } from "./pages/Inspection";
import { Login } from "./pages/Login";
import { ReportsPage } from "./pages/Reports";
import { SystemPage } from "./pages/System";
import { UsersPage } from "./pages/Users";

function Root() {
  const { me } = useStore();
  const [page, setPage] = useState<PageId>("dashboard");
  const [payload, setPayload] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (me) {
      const allowed = pagesFor(me);
      if (payload && allowed.includes("inspection")) {
        setPage("inspection");
      } else if (!payload) {
        const target: PageId = me.role === "technician" ? "inspection" : "dashboard";
        setPage(allowed.includes(target) ? target : allowed[0] ?? "dashboard");
      }
    }
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me) return <Login onDone={(code) => { setPayload(code); if (code) setPage("inspection"); }} />;

  const allowed = pagesFor(me);
  const current: PageId = allowed.includes(page) ? page : allowed[0] ?? "dashboard";

  const go = (p: PageId, pl?: string) => { setPage(p); setPayload(pl); window.scrollTo({ top: 0 }); };

  return (
    <Shell page={current} onNav={go}>
      {current === "dashboard" && <Dashboard go={go} />}
      {current === "inspection" && <Inspection initialCode={payload} go={go} />}
      {current === "equipment" && <EquipmentPage />}
      {current === "checklists" && <ChecklistsPage />}
      {current === "reports" && <ReportsPage />}
      {current === "users" && <UsersPage />}
      {current === "system" && <SystemPage />}
    </Shell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </StoreProvider>
  );
}
