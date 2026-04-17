"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  CheckSquare, 
  Square, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { getStudentsByClass, submitBulkAttendance } from "../actions";

interface Student {
  id: string;
  name: string | null;
  noAhli: number | null;
  kelas: string | null;
}

export default function GuruPage() {
  const router = useRouter();
  const [kelas, setKelas] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    if (!kelas) return;
    setLoading(true);
    const data = await getStudentsByClass(kelas);
    setStudents(data as any);
    setSelectedIds(data.map(s => s.id)); // Default all selected
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.length === 0) {
      setError("Sila pilih sekurang-kurangnya seorang pelajar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await submitBulkAttendance(selectedIds, "Sesi Pembelajaran (Pukal)");

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } else {
      setError(result.error || "Gagal merekod kehadiran pukal.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="p-3 rounded-2xl glass text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Portal <span className="text-primary italic">Guru</span></h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Pengurusan kehadiran pukal mengikut kelas.</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div 
              key="guru-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Class Search */}
              <div className="glass p-6 rounded-3xl border-white/40 dark:border-slate-800/50 shadow-xl flex gap-4">
                <div className="flex-grow relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama kelas (cth: 5 Bijak)..."
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/70 dark:bg-slate-950/70 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                  />
                </div>
                <button 
                  onClick={fetchStudents}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                  Cari
                </button>
              </div>

              {/* Student List */}
              {loading ? (
                <div className="py-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : students.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
                      Senarai Pelajar: <span className="text-primary">{kelas}</span>
                    </h3>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setSelectedIds(students.map(s => s.id))}
                        className="text-[10px] font-black uppercase text-primary hover:underline"
                       >
                        Pilih Semua
                       </button>
                       <button 
                        onClick={() => setSelectedIds([])}
                        className="text-[10px] font-black uppercase text-slate-400 hover:underline"
                       >
                        Kosongkan
                       </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {students.map((student) => {
                      const isSelected = selectedIds.includes(student.id);
                      return (
                        <motion.button
                          key={student.id}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleSelect(student.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${
                            isSelected 
                            ? "bg-white dark:bg-slate-900 border-primary shadow-lg shadow-primary/5" 
                            : "bg-white/40 dark:bg-slate-950/40 border-white/20 dark:border-slate-800/50 opacity-60"
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${isSelected ? "bg-primary/20 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{student.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{student.noAhli} • {student.kelas}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {error && (
                    <p className="text-xs text-rose-500 font-bold flex items-center gap-1 justify-center">
                      <AlertCircle size={14} /> {error}
                    </p>
                  )}

                  <div className="pt-6">
                    <button 
                      onClick={handleBulkSubmit}
                      disabled={isSubmitting || selectedIds.length === 0}
                      className="w-full py-5 bg-primary text-white rounded-3xl font-black text-xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      <GraduationCap size={24} />
                      {isSubmitting ? "Mendaftarkan..." : `Daftar Kehadiran (${selectedIds.length} Pelajar)`}
                    </button>
                  </div>
                </div>
              ) : kelas && !loading ? (
                <div className="py-20 glass rounded-4xl text-center space-y-4">
                   <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                     <Users size={40} />
                   </div>
                   <p className="text-lg font-bold text-slate-500">Tiada pelajar dijumpai untuk kelas "{kelas}".</p>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 italic">
                  Sila masukkan nama kelas untuk bermula.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="guru-success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-20"
            >
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-emerald-500/20 text-emerald-500 mb-4">
                <CheckCircle2 size={80} />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Berjaya!</h2>
                <p className="text-xl text-emerald-500 font-black uppercase tracking-widest">
                  {selectedIds.length} Rekod Kehadiran Didaftarkan
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-4 underline underline-offset-8 decoration-primary/30">Kembali ke laman utama...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
