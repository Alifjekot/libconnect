"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  FileUp, 
  Printer, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Check, 
  AlertCircle,
  ArrowLeft,
  Download,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getStudentsWithStats, updateStudent, deleteStudent, importStudents } from "../actions";

interface Student {
  id: string;
  noAhli: number | null;
  ic: string;
  name: string | null;
  kelas: string | null;
  umur: number | null;
  role: string | null;
  _count?: {
    attendances: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MURID' | 'GURU'>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadStudents = async (selectedPeriod: typeof period = period) => {
    setLoading(true);
    const data = await getStudentsWithStats(selectedPeriod);
    setStudents(data as any);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const result = await updateStudent(editingStudent.id, {
      name: editingStudent.name || "",
      kelas: editingStudent.kelas || "",
      umur: editingStudent.umur || 0,
    });

    if (result.success) {
      setMessage({ type: 'success', text: "Maklumat pelajar berjaya dikemaskini." });
      setEditingStudent(null);
      loadStudents();
    } else {
      setMessage({ type: 'error', text: result.error || "Gagal mengemaskini." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Adakah anda pasti mahu memadam pelajar ini? Semua data kehadiran juga akan dipadam.")) return;

    const result = await deleteStudent(id);
    if (result.success) {
      setMessage({ type: 'success', text: "Pelajar berjaya dipadam." });
      loadStudents();
    } else {
      setMessage({ type: 'error', text: result.error || "Gagal memadam." });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      // Basic CSV parser logic (IC, Name, Class, Age)
      const lines = importData.split('\n').filter(line => line.trim());
      // Handle potential header row
      const firstLine = lines[0]?.toLowerCase() || "";
      const startIndex = (firstLine.includes("ic") || firstLine.includes("nama") || firstLine.includes("name")) ? 1 : 0;
      
      const studentsToImport = lines.slice(startIndex).map(line => {
        const [ic, name, kelas, umur] = line.split(',').map(s => s.trim());
        return { ic, name, kelas, umur: parseInt(umur) || 0 };
      }).filter(s => s.ic && s.name);

      if (studentsToImport.length === 0) {
        alert("Data tidak sah atau kosong. Sila guna format: IC, Nama, Kelas, Umur");
        return;
      }

      const result = await importStudents(studentsToImport);
      if (result.success) {
        setMessage({ type: 'success', text: `${result.count} pelajar berjaya diimport.` });
        setIsImportModalOpen(false);
        setImportData("");
        setImportFileName("");
        loadStudents();
      } else {
        setMessage({ type: 'error', text: result.error || "Gagal import." });
      }
    } catch {
      alert("Ralat memproses data import.");
    }
  };

  const downloadTemplate = () => {
    const csvContent = "IC, Nama, Kelas, Umur\n000101010000, Ahmad Bin Ali, 5 Cekap, 17\n010202021111, Siti Aminah, 4 Bestari, 16";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Templat_Data_Pelajar_SK_Bandar.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      s.ic.includes(search) ||
      (s.noAhli?.toString() || "").includes(search) ||
      (s.kelas?.toLowerCase() || "").includes(search.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-8">
      {/* Print Overlay Hide */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .glass { background: white !important; color: black !important; border: 1px solid #ccc !important; box-shadow: none !important; }
          body { background: white !important; padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; text-align: left !important; color: black !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/")}
              className="p-3 rounded-2xl glass text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white">Admin <span className="text-primary italic">Dashboard</span></h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Pengurusan data pelajar dan perpustakaan.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <FileUp size={20} /> Import CSV
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all cursor-pointer"
            >
              <Printer size={20} /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* Message Alert */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-2xl flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} font-bold no-print`}
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
              <button onClick={() => setMessage(null)}><X size={20} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Stats */}
        {/* Search & Stats & Filters */}
        <div className="grid lg:grid-cols-12 gap-6 no-print">
          {/* Search Bar */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Cari nama, No. Ahli, IC atau kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-3xl glass border-white/20 dark:border-slate-800/50 outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
            />
          </div>

          {/* Role Filter */}
          <div className="lg:col-span-2 glass p-1.5 rounded-3xl border-white/20 dark:border-slate-800/50 flex gap-1 no-print">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'MURID', label: 'Murid' },
              { id: 'GURU', label: 'Guru' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id as any)}
                className={`flex-1 py-3 px-1 rounded-2xl text-[10px] uppercase font-black tracking-tight transition-all ${
                  roleFilter === r.id 
                  ? "bg-primary text-white" 
                  : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Period Selector (Filter) */}
          <div className="lg:col-span-4 glass p-1.5 rounded-3xl border-white/20 dark:border-slate-800/50 flex gap-1 no-print">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'daily', label: 'Harian' },
              { id: 'weekly', label: 'Mingguan' },
              { id: 'monthly', label: 'Bulanan' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as typeof period)}
                className={`flex-1 py-3 px-1 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
                  period === p.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Stats Card */}
          <div className="lg:col-span-2 glass p-4 rounded-3xl flex items-center justify-between border-white/20 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <Users size={20} />
              </div>
              <div className="truncate">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah</p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{students.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="glass rounded-4xl border-white/40 dark:border-slate-800/50 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">
                  <th className="px-8 py-5"># ID</th>
                  <th className="px-8 py-5">Nama Penuh</th>
                  <th className="px-8 py-5">Peranan</th>
                  <th className="px-8 py-5">Kelas</th>
                  <th className="px-8 py-5 text-center flex items-center justify-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <span>Kunjungan</span>
                  </th>
                  <th className="px-8 py-5 text-right no-print">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic">Tiada data dijumpai.</td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-8 py-4 font-mono font-black text-primary bg-primary/5">#{s.noAhli}</td>
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{s.name || "-"}</p>
                        <p className="text-[10px] font-mono text-slate-400">IC: {s.ic}</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          s.role === 'GURU' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {s.role}
                        </span>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-600 dark:text-slate-400">{s.kelas || "-"}</td>
                      <td className="px-8 py-4 text-center">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black">
                          {s._count?.attendances || 0}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right no-print">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingStudent(s)}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStudent(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass bg-white dark:bg-slate-900 p-8 rounded-4xl shadow-2xl border-white/40 dark:border-slate-800/50"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Edit <span className="text-primary italic">Profil</span></h3>
                <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-bold ml-1 uppercase tracking-wider">No. IC & No. Ahli (Tidak boleh diubah)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={editingStudent.ic} readOnly className="w-full px-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none font-mono font-bold" />
                    <input type="text" value={`#${editingStudent.noAhli}`} readOnly className="w-full px-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none font-mono font-bold text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 uppercase tracking-wider text-slate-500">Nama Penuh</label>
                  <input 
                    type="text" 
                    value={editingStudent.name || ""} 
                    onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-700 outline-none focus:ring-2 focus:ring-primary font-bold" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 uppercase tracking-wider text-slate-500">Kelas</label>
                    <input 
                      type="text" 
                      value={editingStudent.kelas || ""} 
                      onChange={(e) => setEditingStudent({...editingStudent, kelas: e.target.value})}
                      className="w-full px-4 py-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-700 outline-none focus:ring-2 focus:ring-primary font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 uppercase tracking-wider text-slate-500">Umur</label>
                    <input 
                      type="number" 
                      value={editingStudent.umur || ""} 
                      onChange={(e) => setEditingStudent({...editingStudent, umur: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-700 outline-none focus:ring-2 focus:ring-primary font-bold" 
                    />
                  </div>
                </div>
                <button className="w-full py-4 bg-primary text-white rounded-3xl font-black text-lg shadow-xl shadow-primary/30 mt-4 flex items-center justify-center gap-2">
                  <Save size={20} /> Simpan Perubahan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl glass bg-white dark:bg-slate-900 p-8 rounded-4xl shadow-2xl border-white/40 dark:border-slate-800/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Import <span className="text-primary italic">Data Pelajar</span></h3>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-500/10 p-4 rounded-2xl text-blue-500 text-sm font-medium border border-blue-500/20">
                  <p className="font-bold flex items-center gap-2 mb-1"><AlertCircle size={16} /> Cara Import:</p>
                  <p>1. <b>Muat naik fail .csv</b> atau <b>tampal data</b> dalam format: <b>IC, Nama, Kelas, Umur</b></p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="opacity-70 italic text-xs leading-relaxed">Tiada fail? Sila gunakan templat ini:</p>
                    <button 
                      onClick={downloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Download size={12} /> Muat Turun Templat (.csv)
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-500 ml-1">Pilih Fail CSV:</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileChange}
                      className="hidden" 
                      id="csv-upload"
                    />
                    <label 
                      htmlFor="csv-upload"
                      className="flex items-center justify-between w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:border-primary transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-500 truncate pr-4">
                        {importFileName || "Klik untuk pilih fail .csv..."}
                      </span>
                      <FileUp size={20} className="text-primary" />
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                    Atau Tampal Data
                  </div>
                  <textarea 
                    rows={6}
                    placeholder="Contoh: 000101010000, Ahmad Ali, 5 Bijak, 17"
                    value={importData}
                    onChange={(e) => {
                      setImportData(e.target.value);
                      if (importFileName) setImportFileName("");
                    }}
                    className="w-full p-6 pt-10 rounded-3xl bg-slate-100/50 dark:bg-slate-800/50 border-none ring-1 ring-slate-200 dark:ring-slate-700 outline-none focus:ring-2 focus:ring-primary font-mono text-sm leading-relaxed"
                  />
                </div>

                <button 
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="w-full py-4 bg-primary text-white rounded-3xl font-black text-lg shadow-xl shadow-primary/30 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={20} /> Mulakan Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
