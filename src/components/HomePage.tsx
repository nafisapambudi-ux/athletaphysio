import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  ClipboardPlus,
  Dumbbell,
  HeartPulse,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UsersRound,
  Zap,
} from 'lucide-react';
import heroImage from '../assets/images/hero_athlete_training_1793984142408.jpg';

interface HomePageProps {
  demoMode: boolean;
  onNavigateTab: (tab: string) => void;
  onOpenQuickLog: () => void;
}

const features = [
  {
    icon: BarChart3,
    title: 'Beban latihan & ACWR',
    description: 'Lihat tren beban latihan untuk membantu mengenali perubahan beban dan merencanakan latihan dengan lebih terukur.',
    tab: 'acwr',
    label: 'Lihat pemantauan beban',
  },
  {
    icon: HeartPulse,
    title: 'Wellness & kesiapan',
    description: 'Catat tidur, kelelahan, nyeri otot, dan stres untuk mendapat gambaran kesiapan atlet dari hari ke hari.',
    tab: 'wellness',
    label: 'Lihat wellness',
  },
  {
    icon: Dumbbell,
    title: 'Tes fisik & performa',
    description: 'Simpan hasil tes kebugaran, vertical jump, serta pengukuran velocity-based training dalam satu tempat.',
    tab: 'fitness',
    label: 'Lihat tes fisik',
  },
  {
    icon: Activity,
    title: 'Pemantauan keluhan',
    description: 'Catat lokasi dan tingkat nyeri agar perubahan kondisi fisik atlet lebih mudah ditinjau.',
    tab: 'injuries',
    label: 'Lihat peta nyeri',
  },
];

const steps = [
  {
    number: '01',
    title: 'Catat kondisi atlet',
    description: 'Mulai dari profil, sesi latihan, wellness harian, hingga hasil tes fisik.',
    icon: ClipboardPlus,
  },
  {
    number: '02',
    title: 'Pantau perubahan',
    description: 'Tinjau ringkasan tim, grafik performa, beban latihan, dan peringatan yang muncul.',
    icon: BarChart3,
  },
  {
    number: '03',
    title: 'Gunakan sebagai bahan evaluasi',
    description: 'Gunakan data sebagai konteks untuk berdiskusi dan menyesuaikan program latihan.',
    icon: Target,
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  demoMode,
  onNavigateTab,
  onOpenQuickLog,
}) => (
  <div className="space-y-12 pb-8 sm:space-y-16">
    {demoMode && (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <span className="font-bold">Versi demo publik.</span> Data yang Anda catat hanya
          tersimpan di browser ini dan tidak disinkronkan dengan perangkat lain.
        </p>
      </div>
    )}

    <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-xl shadow-slate-900/10">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt="Atlet berlatih di lintasan"
          className="h-full w-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
      </div>

      <div className="relative grid min-h-[31rem] items-end gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center lg:px-14">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
            Athlete performance monitoring
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Pahami kondisi atlet.
            <span className="mt-1 block text-red-300">Rencanakan langkah berikutnya.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
            PERFORMIQ membantu pelatih dan fisioterapis mencatat, memantau, dan meninjau
            kondisi fisik atlet melalui data latihan, wellness, tes kebugaran, serta keluhan
            tubuh dalam satu dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            >
              Buka dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenQuickLog}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ClipboardPlus className="h-4 w-4" />
              Catat data
            </button>
          </div>
          <a
            href="#fitur"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-white"
          >
            Kenali fitur PERFORMIQ
            <ArrowDownRight className="h-3.5 w-3.5" />
          </a>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-red-300" />
              Beban latihan dan ACWR
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-red-300" />
              Wellness dan kesiapan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-red-300" />
              Tes dan keluhan fisik
            </span>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Ruang kerja performa</span>
              <span className="rounded-full bg-red-300/10 px-2 py-1 text-[10px] font-semibold text-red-200">
                SPORT SCIENCE
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/15 text-red-200">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">Beban & performa</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">Tren dalam satu pandangan</div>
                </div>
                <ArrowDownRight className="ml-auto h-4 w-4 text-slate-500" />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/15 text-sky-200">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">Kesiapan harian</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">Wellness dan pemulihan</div>
                </div>
                <ArrowDownRight className="ml-auto h-4 w-4 text-slate-500" />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200">
                  <UsersRound className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">Profil atlet</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">Catatan yang tertata</div>
                </div>
                <ArrowDownRight className="ml-auto h-4 w-4 text-slate-500" />
              </div>
            </div>
            <div className="mt-4 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-400">
              Informasi untuk mendukung evaluasi pelatih dan tenaga pendamping atlet.
            </div>
          </div>
        </div>
      </div>
    </section>

    <section aria-labelledby="about-title" className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700 dark:text-red-400">
          Tentang platform
        </p>
        <h2 id="about-title" className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Data yang lebih rapi untuk evaluasi yang lebih terarah.
        </h2>
      </div>
      <div className="space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
        <p>
          Memantau atlet sering berarti mengumpulkan banyak jenis catatan yang tersebar.
          PERFORMIQ menyatukan informasi tersebut agar pelatih dan fisioterapis dapat
          meninjau perkembangan tim dengan alur yang lebih jelas.
        </p>
        <p>
          Platform ini bukan alat diagnosis medis atau pengganti penilaian profesional.
          Data dan ringkasan yang ditampilkan digunakan sebagai bahan pendukung evaluasi
          kondisi dan perencanaan latihan.
        </p>
      </div>
    </section>

    <section id="fitur" aria-labelledby="features-title" className="scroll-mt-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700 dark:text-red-400">
            Dalam satu platform
          </p>
          <h2 id="features-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Informasi penting, tersusun rapi.
          </h2>
        </div>
        <p className="max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
          Jelajahi fitur sesuai kebutuhan pemantauan atlet dan program latihan Anda.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {features.map(({ icon: Icon, title, description, tab, label }) => (
          <article
            key={title}
            className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-red-800"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-2 flex-1 text-xs leading-6 text-slate-600 dark:text-slate-400">{description}</p>
            <button
              onClick={() => onNavigateTab(tab)}
              className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-red-800 transition group-hover:gap-2.5 dark:text-red-300"
            >
              {label}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
      </div>
    </section>

    <section aria-labelledby="workflow-title" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700 dark:text-red-400">
          Alur penggunaan
        </p>
        <h2 id="workflow-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Dari catatan harian ke bahan evaluasi.
        </h2>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
        {steps.map(({ number, title, description, icon: Icon }) => (
          <div key={number} className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-semibold tracking-widest text-red-700 dark:text-red-400">
                {number}
              </span>
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-2 max-w-sm text-xs leading-6 text-slate-600 dark:text-slate-400">{description}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="flex flex-col gap-6 rounded-[1.75rem] bg-red-950 px-6 py-8 text-white sm:px-9 sm:py-9 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-red-300">
          <Sparkles className="h-4 w-4" />
          Mulai dari gambaran tim
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Siap meninjau kondisi atlet Anda?
        </h2>
        <p className="mt-2 text-sm leading-6 text-red-100/75">
          Buka ringkasan tim untuk melihat kondisi, catatan, dan indikator pemantauan atlet.
        </p>
      </div>
      <button
        onClick={() => onNavigateTab('dashboard')}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-red-950 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Buka dashboard
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>

    <div className="flex items-start gap-3 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <Smartphone className="mt-1 h-4 w-4 shrink-0" />
      <p>
        Tampilan dirancang untuk desktop dan ponsel. Pada versi demo publik, data hanya
        tersimpan pada browser dan perangkat yang Anda gunakan.
      </p>
      <Zap className="mt-1 hidden h-4 w-4 shrink-0 sm:block" />
    </div>
  </div>
);
