import { useEffect, useRef, useState } from "react";
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
  region,
  extractData,
}: {
  formId: string;
  period?: string;
  region?: string;
  extractData: (payload: ReportResponse<T>["data"]) => Record<string, any>;
}) {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const initialLoadRef = useRef(false);

  const { data, isLoading } = useQuery<ReportResponse<T>>({
    queryKey: ["/api/reports", formId, period, region],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("form", formId);
      if (period) {
        params.set("period", period);
      }
      if (region) {
        params.set("region", region);
      }
      console.log("[useReportForm] Fetching:", `/api/reports?${params.toString()}`);
      const response = await fetch(`/api/reports?${params.toString()}`);
      const json = await response.json();
      console.log("[useReportForm] Response:", json);
      return json;
    },
    enabled: Boolean(period),
  });

  useEffect(() => {
    setLoaded(false);
    setReportData({});
    initialLoadRef.current = false;
  }, [formId, period, region]);

  useEffect(() => {
    console.log("[useReportForm] useEffect data:", data);
    if (!data?.data) {
      console.log("[useReportForm] No data.data, returning");
      return;
    }
    console.log("[useReportForm] Extracting data from:", data.data);
    const computed = extractData(data.data);
    console.log("[useReportForm] Computed data:", computed);
    setReportData(computed);
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
    return payload;
  };

  return { reportData, setReportData, isLoading, saveReport };
}
