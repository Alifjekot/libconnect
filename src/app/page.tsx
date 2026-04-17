"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, 
  Users, 
  Library, 
  Search, 
  GraduationCap, 
  LayoutGrid, 
  User,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  BarChart3,
  Settings,
  ShieldCheck
} from "lucide-react";
import RankingList from "@/components/RankingList";
import { submitAttendance, getAttendanceStats } from "./actions";

const actions = [
  { id: "pinjam", label: "Pinjaman Buku", icon: Library, color: "bg-blue-600" },
  { id: "mesyuarat", label: "Sesi Perbincangan", icon: Users, color: "bg-indigo-600" },
  { id: "membaca", label: "Pendaftaran NILAM", icon: Book, color: "bg-emerald-600" },
  { id: "rujukan", label: "Cari Bahan Rujukan", icon: Search, color: "bg-amber-600" },
  { id: "belajar", label: "Sesi Pembelajaran", icon: GraduationCap, color: "bg-rose-600" },
  { id: "lain", label: "Lain-lain Urusan", icon: LayoutGrid, color: "bg-slate-600" },
];

export default function Home() {
  const [ic, setIc] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ dailyCount: 0, monthlyCount: 0 });
  const router = useRouter();

  useEffect(() => {
    const loadStats = async () => {
      const data = await getAttendanceStats();
      setStats(data);
    };
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleActionClick = async (actionId: string) => {
    if (isSubmitting) return;
    if (!ic) {
      setError("Sila masukkan No. KP terlebih dahulu.");
      return;
    }
    
    setSelectedAction(actionId);
    setIsSubmitting(true);
    setError(null);

    const actionLabel = actions.find(a => a.id === actionId)?.label || actionId;
    const result = await submitAttendance(ic, actionLabel);

    if (result.success) {
      setIsSubmitted(true);
      const newStats = await getAttendanceStats();
      setStats(newStats);

      setTimeout(() => {
        setIsSubmitted(false);
        setIc("");
        setSelectedAction(null);
        setIsSubmitting(false);
      }, 2000);
    } else {
      if (result.needsRegistration) {
        router.push(`/pendaftaran?ic=${ic}&purpose=${actionLabel}`);
        return;
      }
      setError(result.error || "Gagal merekod kehadiran.");
      setIsSubmitting(false);
      setSelectedAction(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="relative min-h-screen h-screen flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-blob"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.98 }}
            className="z-10 w-full max-w-7xl flex flex-col gap-6"
          >
            {/* COMPACT HEADER */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                  <GraduationCap size={28} />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">
                    Pusat Sumber Sekolah
                  </h2>
                  <p className="text-xs font-bold text-primary tracking-widest uppercase">
                    SK BANDAR
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-xl glass border-emerald-500/20 flex items-center gap-2">
                    <CalendarDays size={14} className="text-emerald-500" />
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">{stats.dailyCount}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl glass border-primary/20 flex items-center gap-2">
                    <BarChart3 size={14} className="text-primary" />
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">{stats.monthlyCount}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => router.push("/guru")}
                    className="p-2 text-slate-300 dark:text-slate-700 hover:text-primary transition-colors flex items-center gap-1 group"
                    title="Kehadiran Pukal (Guru)"
                  >
                    <Users size={16} />
                  </button>
                  <button 
                    onClick={() => router.push("/admin")}
                    className="p-2 text-slate-300 dark:text-slate-700 hover:text-primary transition-colors"
                    title="Dashboard Admin"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* IDENTITY INPUT */}
                <motion.div variants={itemVariants} className="glass p-5 md:p-6 rounded-3xl border-white/40 dark:border-slate-800/50 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <User size={80} />
                  </div>
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <User className="text-primary" size={18} /> No. Ahli Perpustakaan
                      </h3>
                      <span className="text-[9px] font-black text-primary/30 uppercase tracking-[0.2em]">Masukkan No. 1 - 300</span>
                    </div>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/40 group-focus-within/input:text-primary transition-colors">
                        <div className="font-black text-sm">#</div>
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: 1"
                        value={ic}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d+$/.test(val)) {
                            setIc(val);
                            if (error) setError(null);
                          }
                        }}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white/40 dark:bg-slate-950/40 focus:ring-4 focus:ring-primary/20 outline-none transition-all text-2xl md:text-3xl font-black tracking-normal placeholder:tracking-normal placeholder:font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <AlertCircle size={10} /> {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* ACTIONS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {actions.map((action) => (
                    <motion.button
                      key={action.id}
                      variants={itemVariants}
                      whileHover={!isSubmitting ? { y: -2, backgroundColor: "rgba(255,255,255,0.9)" } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      onClick={() => handleActionClick(action.id)}
                      disabled={isSubmitting}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-3xl glass transition-all border-2 group md:h-28 ${
                        selectedAction === action.id 
                        ? "border-primary ring-2 ring-primary/10 bg-white/90 dark:bg-slate-900/90 shadow-lg shadow-primary/5" 
                        : "border-white/20 dark:border-slate-800/50 hover:border-primary/40"
                      }`}
                    >
                      <div className={`p-2 rounded-xl mb-2 ${action.color} bg-opacity-20 transition-all group-hover:scale-110 shadow-inner`}>
                        <action.icon className="w-5 h-5 text-slate-900 dark:text-white" strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px] text-center leading-tight truncate w-full px-1">
                        {isSubmitting && selectedAction === action.id ? "..." : action.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* SIDEBAR: RANKING + QUOTE */}
              <div className="lg:col-span-5 flex flex-col gap-6 h-full max-h-[500px]">
                <div className="flex-grow overflow-hidden">
                  <RankingList />
                </div>
                
                {/* QUOTE */}
                <motion.div variants={itemVariants} className="glass p-4 rounded-3xl border-primary/20 flex flex-col gap-1.5 relative overflow-hidden group bg-primary/5 shadow-inner border">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                    Petikan Hari Ini
                  </p>
                  <p className="text-[13px] italic font-bold text-slate-700 dark:text-slate-300 leading-tight">
                    &ldquo;Membaca adalah jambatan ilmu. Mulakan hari anda dengan sebuah buku.&rdquo;
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            className="text-center space-y-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative inline-block">
              <div className="absolute -inset-8 bg-emerald-500/20 blur-3xl animate-pulse"></div>
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 text-white shadow-2xl border-4 border-white dark:border-slate-950 mx-auto">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Berjaya!</h2>
              <p className="text-xl text-emerald-500 font-black uppercase tracking-widest">Kunjungan Didaftarkan</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em] z-10 pointer-events-none no-print">
        &copy; 2026 PUSAT SUMBER SK BANDAR
      </footer>

      {/* FLOAT BUTTON */}
      <motion.button
        animate={{ opacity: 0.1 }}
        whileHover={{ opacity: 1 }}
        onClick={() => router.push("/admin")}
        className="fixed bottom-4 right-4 p-3 rounded-full glass border-primary/20 text-slate-400 hover:text-primary transition-all no-print z-50 group flex items-center gap-2"
      >
        <span className="text-[9px] font-black uppercase tracking-widest w-0 overflow-hidden group-hover:w-20 transition-all duration-300 whitespace-nowrap">Dashboard</span>
        <ShieldCheck size={16} />
      </motion.button>
    </div>
  );
}
