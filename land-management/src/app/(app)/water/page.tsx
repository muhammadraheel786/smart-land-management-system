import { Suspense } from "react";
import ClientPage from "./ClientPage";

export default function WaterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[400px] items-center justify-center text-theme-muted">Loading water management�</div>}>
      <ClientPage />
    </Suspense>
  );
}


