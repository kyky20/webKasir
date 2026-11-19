import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  targetPhase: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
  icon: Icon,
  targetPhase,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E5EAE6] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F0EA] text-[#477A60] flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#202923]">{title}</h2>
            <p className="text-xs text-[#5F6B62] mt-0.5">{description}</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#E8F0EA] text-[#477A60]">
          {targetPhase}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5EAE6] p-10 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#F8FAF8] border border-[#E5EAE6] text-[#5F6B62] flex items-center justify-center mx-auto mb-3">
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#202923]">Modul {title}</h3>
        <p className="text-xs text-[#5F6B62] max-w-md mx-auto mt-1 mb-4">
          Modul ini dijadwalkan pada pengembangan bertahap {targetPhase} sesuai panduan PRD Kasirku.
          Struktur rute, otorisasi role Owner, dan layout telah aktif.
        </p>
      </div>
    </div>
  );
};
