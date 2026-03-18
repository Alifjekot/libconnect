"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { getMonthlyRanking } from "@/app/actions";

interface Ranking {
  ic: string;
  name: string;
  count: number;
}

export default function RankingList() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const data = await getMonthlyRanking();
      if (isMounted) {
        setRankings(data);
        setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const maskIC = (ic: string) => {
    if (ic.length < 6) return ic;
    return `${ic.slice(0, 6)}-XX-${ic.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="glass p-6 rounded-4xl h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="glass p-8 md:p-10 rounded-4xl h-full space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-500 shadow-lg shadow-amber-500/10">
            <Trophy size={28} />
          </div>
          <div>
            <h3 className="font-black text-2xl dark:text-white leading-tight">Anugerah NILAM Bulanan</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Status: Terkini</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full uppercase tracking-widest border border-emerald-500/20">
          <TrendingUp size={14} />
          <span>LIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        {rankings.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-20 italic font-medium">Tiada data pendaftaran bulan ini.</p>
        ) : (
          rankings.map((rank, index) => (
            <motion.div
              key={rank.ic}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-6 p-5 rounded-3xl transition-all border-2 ${
                index === 0 
                  ? "bg-linear-to-r from-amber-500/30 to-amber-500/5 border-amber-500/30 shadow-2xl shadow-amber-500/10 scale-105" 
                  : index === 1 
                  ? "bg-linear-to-r from-slate-400/20 to-transparent border-slate-400/20 shadow-xl" 
                  : index === 2 
                  ? "bg-linear-to-r from-orange-400/20 to-transparent border-orange-400/20 shadow-xl" 
                  : "hover:bg-white/50 dark:hover:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              }`}
            >
              <div className="shrink-0 w-12 flex justify-center">
                {index === 0 && <Medal className="text-amber-500" size={32} />}
                {index === 1 && <Medal className="text-slate-400" size={28} />}
                {index === 2 && <Award className="text-orange-400" size={26} />}
                {index > 2 && <span className="text-lg font-black text-slate-400">#{index + 1}</span>}
              </div>
              
              <div className="grow">
                <p className={`font-black dark:text-white leading-none mb-2 ${index === 0 ? 'text-xl' : 'text-lg'}`}>
                  {rank.name || maskIC(rank.ic)}
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest leading-none">
                    {maskIC(rank.ic)}
                  </p>
                  <span className="text-xs text-slate-400 opacity-30">•</span>
                  <p className="text-xs text-primary uppercase font-black tracking-widest leading-none flex items-center gap-1.5">
                     {rank.count === 1 ? '1 Kunjungan' : `${rank.count} Kunjungan`}
                  </p>
                </div>
              </div>

              {index === 0 && (
                <div className="px-4 py-2 bg-amber-500 rounded-xl text-xs font-black text-white shadow-xl shadow-amber-500/40 ring-4 ring-amber-500/10 uppercase tracking-tighter">
                  JUARA
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
      
      <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center font-black italic uppercase tracking-[0.2em] pt-4">
        * Penyata rasmi diproses secara automatik.
      </p>
    </div>
  );
}
