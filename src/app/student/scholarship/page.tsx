"use client";

// Removed: import { Card } from "@/components/ui/card";
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";

interface Period {
  period_id: number;
  period: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_open: boolean;
  is_registered?: boolean;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function Upload() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const periodsResponse = await fetch("/api/periods");
      if (!periodsResponse.ok) {
        throw new Error(`Failed to fetch periods: ${periodsResponse.statusText}`);
      }
      const periodsData: Period[] = await periodsResponse.json();

      const updatedPeriods = await Promise.all(
        periodsData.map(async (period) => {
          const response = await fetch("/api/status/check-registration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ period_id: period.period_id }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error("Check registration error body:", errorBody);
            throw new Error(`Failed to check registration status for period ${period.period_id}. Status: ${response.status}`);
          }

          const result = await response.json();
          return { ...period, is_registered: result.exists };
        })
      );

      setPeriods(updatedPeriods);
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data periode.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (periodId: number) => {
    try {
      setLoading(true);

      const response = await fetch("/api/status/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period_id: periodId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register.");
      }

      toast.success("Pendaftaran berhasil!");
      await fetchData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error(error.message || "Pendaftaran mengalami error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="bottom-right" richColors />
      <div className="w-1/4 m-8 flex-shrink-0">
        <SidebarMahasiswa activeTab="scholarship" />
      </div>

      <div className="my-8 mr-8 w-full flex-grow">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Beasiswa</h1>

        <div className="w-full"> {/* Replaces the Card component */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <svg className="animate-spin h-10 w-10 text-[#003793]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg text-slate-600 font-medium">Memuat periode beasiswa...</p>
            </div>
          ) : (
            <>
              {periods.length > 0 ? (
                <div> {/* Container for the list of periods */}
                  {periods.map((p: Period) => (
                    <div
                      key={p.period_id}
                      className="rounded-md bg-slate-100 flex flex-col sm:flex-row items-center justify-between py-6 px-4 border-b border-slate-200 last:border-b-0 hover:bg-slate-200 transition-colors duration-150"
                    >
                      <div className="flex-grow mb-4 sm:mb-0 sm:mr-6 w-full sm:w-auto">
                        <h2 className="text-xl font-semibold text-slate-700 mb-1">{p.period}</h2>
                        <p className="text-sm text-slate-500">
                          Periode: {formatDate(p.start_date)} - {formatDate(p.end_date)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                        {p.is_registered ? (
                          <span className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-emerald-700 bg-emerald-100 whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.06 0l4-5.5z" clipRule="evenodd" />
                            </svg>
                            Anda Telah Mendaftar
                          </span>
                        ) : p.is_open ? (
                          <button
                            className="w-full sm:w-auto flex items-center justify-center bg-[#003793] hover:bg-[#002a70] text-white font-semibold py-2 px-5 rounded-md shadow-sm hover:shadow transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#003793] focus:ring-opacity-50 text-sm"
                            onClick={() => handleRegister(p.period_id)}
                          >
                            Daftar Beasiswa
                          </button>
                        ) : (
                          <span className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 bg-slate-200 whitespace-nowrap">
                            Pendaftaran Tidak Dibuka
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-400 mx-auto mb-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-slate-600 text-xl font-semibold mb-1">Tidak Ada Periode Beasiswa</p>
                  <p className="text-slate-400 text-sm">Saat ini belum ada periode pendaftaran beasiswa yang aktif. Silakan periksa kembali di lain waktu.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}