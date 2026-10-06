import type { ReactNode } from "react";

export type HeroBannerStat = {
  label: string;
  value: ReactNode;
};

export type HeroBannerProps = {
  badgeIcon?: ReactNode;
  badgeText?: string;
  badgeSlot?: ReactNode;
  title: string;
  description: string;
  stats?: HeroBannerStat[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * HeroBanner - Reusable unified header banner for Hibah Kesbangpol
 * Memastikan ukuran (padding, typography, dimensi stat card) dan warna (gradasi merah khas Kesbangpol)
 * selalu konsisten di seluruh halaman aplikasi sekaligus mengurangi duplikasi kode.
 */
export default function HeroBanner({
  badgeIcon,
  badgeText,
  badgeSlot,
  title,
  description,
  stats,
  actions,
  children,
  className = "",
}: HeroBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-6 py-5 text-white shadow-lg shadow-red-700/25 ${className}`}
    >
      {/* Dekorasi visual lingkaran cahaya kaca (glass specular glows) */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 right-24 h-28 w-28 rounded-full bg-white/5" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Kolom Kiri: Badge, Judul, dan Subtitle Deskripsi */}
        <div>
          {badgeSlot ? (
            badgeSlot
          ) : badgeText ? (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-xs">
              {badgeIcon}
              <span>{badgeText}</span>
            </div>
          ) : null}

          <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            {title}
          </h1>

          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-red-100/90 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Kolom Kanan: Stat Cards / Quick Actions */}
        {(stats && stats.length > 0) || actions || children ? (
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-3">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="min-w-[100px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md shadow-xs"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-100">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
            {actions}
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
