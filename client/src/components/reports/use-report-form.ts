import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ReportResponse<T> {
  ok: boolean;
  data?: {
    form: string;
    period?: string;
    rows?: T[];
    steppeRows?: T[];
    ignitionRows?: T[];
  };
}

type SaveStatus = "draft" | "submitted";

export function useReportForm<T>({
  formId,
  period,
  extractData,
}: {
  formId: string;
  period?: string;
  extractData: (payload: ReportResponse<T>["data"]) => Record<string, any>;
}) {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const initialLoadRef = useRef(false);
  const lastSavedSignatureRef = useRef<string | null>(null);
  const latestSignatureRef = useRef<string>("");

  const { data, isLoading } = useQuery<ReportResponse<T>>({
    queryKey: ["/api/reports", formId, period],
    queryFn: async () => {
      const response = await fetch(`/api/reports?form=${formId}&period=${period}`);
      return response.json();
    },
    enabled: Boolean(period),
  });

  useEffect(() => {
    setLoaded(false);
    setReportData({});
    initialLoadRef.current = false;
  }, [formId, period]);

  useEffect(() => {
    if (!data?.data) {
      return;
    }
    const computed = extractData(data.data);
    setReportData(computed);
    lastSavedSignatureRef.current = stableSignature(computed);
    setLoaded(true);
    initialLoadRef.current = true;
  }, [data, extractData]);

  const saveReport = async (status: SaveStatus, options?: { silent?: boolean }) => {
    if (!period) {
      return null;
    }
    const response = await fetch("/api/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: formId,
        period,
        status,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      if (!options?.silent) {
        toast({
          title: "Ошибка сохранения",
          description: payload?.msg || "Не удалось сохранить форму",
          variant: "destructive",
        });
      }
      throw new Error(payload?.msg || "Failed to save report");
    }
    if (!options?.silent) {
      toast({
        title: status === "submitted" ? "Форма отправлена" : "Черновик сохранен",
        description:
          status === "submitted"
            ? "Данные формы успешно отправлены"
            : "Данные формы сохранены",
      });
    }
    lastSavedSignatureRef.current = stableSignature(reportData);
    return payload;
  };

  const reportSignature = useMemo(() => stableSignature(reportData), [reportData]);
  useEffect(() => {
    latestSignatureRef.current = reportSignature;
  }, [reportSignature]);
  const debounceMs = useMemo(() => {
    const length = reportSignature.length;
    if (length > 20000) {
      return 4000;
    }
    if (length > 10000) {
      return 2500;
    }
    if (length > 5000) {
      return 1500;
    }
    return 800;
  }, [reportSignature]);

  useEffect(() => {
    if (!period || !loaded || !initialLoadRef.current) {
      return;
    }
    if (reportSignature === lastSavedSignatureRef.current) {
      return;
    }
    const scheduledSignature = reportSignature;
    const timeout = window.setTimeout(() => {
      if (scheduledSignature !== latestSignatureRef.current) {
        return;
      }
      if (scheduledSignature === lastSavedSignatureRef.current) {
        return;
      }
      saveReport("draft", { silent: true }).catch(() => undefined);
    }, debounceMs);
    return () => window.clearTimeout(timeout);
  }, [debounceMs, period, loaded, reportSignature, saveReport]);

  return { reportData, setReportData, isLoading, saveReport };
}

function stableSignature(value: unknown) {
  return (
    JSON.stringify(value, (_key, val) => {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        return Object.keys(val as Record<string, unknown>)
          .sort()
          .reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = (val as Record<string, unknown>)[key];
            return acc;
          }, {});
      }
      return val;
    }) ?? ""
  );
}
