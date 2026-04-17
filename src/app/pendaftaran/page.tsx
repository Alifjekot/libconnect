"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, 
  ArrowLeft, 
  User, 
  School, 
  Calendar, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { registerStudent, submitAttendance } from "../actions";

function RegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const icFromUrl = searchParams.get("ic") || "";
  const purposeFromUrl = searchParams.get("purpose") || "";

  const [formData, setFormData] = useState({
    ic: icFromUrl,
    name: "",
    kelas: "",
    umur: "",
    role: "MURID",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [assignedNo, setAssignedNo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (formData.role === "MURID" && (!formData.kelas || !formData.umur))) {
      setError("Sila lengkapkan semua maklumat.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await registerStudent({
      ic: formData.ic,
      name: formData.name,
      kelas: formData.role === "GURU" ? "STAF" : formData.kelas,
      umur: formData.role === "GURU" ? 0 : parseInt(formData.umur),
      role: formData.role,
    });

    if (result.success) {
      setAssignedNo(result.student?.noAhli || null);
      // Auto-submit attendance if purpose exists
      if (purposeFromUrl) {
        await submitAttendance(formData.ic, purposeFromUrl);
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 5000); // Give more time to read the No. Ahli
    } else {
      setError(result.error || "Gagal mendaftar pelajar.");
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-slate-50 dark:bg-[#020617]">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      
      {/* Noise Filter Overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="pendaftaran-form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            className="z-10 w-full max-w-lg space-y-8"
          >
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ x: -5 }}
                onClick={() => router.push("/")}
                className="p-3 rounded-2xl glass text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              >
                <ArrowLeft size={24} />
              </motion.button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  Pendaftaran <span className="text-primary italic">Pelajar Baru</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Sila lengkapkan profil anda untuk meneruskan.</p>
              </div>
            </div>

            <motion.form 
              onSubmit={handleSubmit}
              className="glass p-8 rounded-4xl border-white/40 dark:border-slate-800/50 shadow-2xl space-y-6"
            >
              <motion.div variants={itemVariants} className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Saya Adalah...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['MURID', 'GURU'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${
                        formData.role === r 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : "bg-white/50 dark:bg-slate-900/50 text-slate-400 border-white/20 dark:border-slate-800/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                  <User size={16} /> No. Kad Pengenalan
                </label>
                <input
                  type="text"
                  value={formData.ic}
                  readOnly
                  className="w-full px-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800 text-slate-500 dark:text-slate-500 font-bold tracking-widest cursor-not-allowed outline-none"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                  <UserPlus size={16} /> Nama Penuh
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Fitri"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-4 rounded-2xl bg-white/70 dark:bg-slate-950/70 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                />
              </motion.div>

              <AnimatePresence>
                {formData.role === 'MURID' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4 overflow-hidden"
                  >
                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        <School size={16} /> Kelas
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 5 Bijak"
                        value={formData.kelas}
                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                        className="w-full px-4 py-4 rounded-2xl bg-white/70 dark:bg-slate-950/70 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        <Calendar size={16} /> Umur
                      </label>
                      <input
                        type="number"
                        placeholder="17"
                        value={formData.umur}
                        onChange={(e) => setFormData({ ...formData, umur: e.target.value })}
                        className="w-full px-4 py-4 rounded-2xl bg-white/70 dark:bg-slate-950/70 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-rose-500 flex items-center gap-1 font-bold"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white rounded-3xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Mendaftar..." : "Daftar Sekarang"}
              </motion.button>
            </motion.form>
          </motion.div>
        ) : (
          <motion.div
            key="success-pendaftaran"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 text-center space-y-6"
          >
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-emerald-500/20 text-emerald-500">
              <CheckCircle2 size={80} />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">Pendaftaran Berjaya!</h2>
              <div className="py-6 px-10 bg-primary/10 rounded-3xl border border-primary/20 inline-block">
                <p className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-1">No. Ahli Anda</p>
                <p className="text-6xl font-black text-primary">#{assignedNo}</p>
              </div>
              <p className="text-xl text-slate-500 dark:text-slate-400 mt-6">Selamat datang, {formData.name}. Sila gunakan No. Ahli ini untuk kunjungan akan datang.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PendaftaranPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegistrationForm />
    </Suspense>
  );
}
