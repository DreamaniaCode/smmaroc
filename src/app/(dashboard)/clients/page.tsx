"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/crm");
  }, [router]);

  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Redirection vers le CRM Clients SMMaroc...
    </div>
  );
}
