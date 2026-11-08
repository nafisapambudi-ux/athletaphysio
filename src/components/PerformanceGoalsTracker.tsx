import React, { useState } from 'react';
import { Athlete, PerformanceGoal, GoalMetricType } from '../types/athlete';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
  Activity,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  ArrowRight,
  Flame,
  Award,
  ChevronDown,
  X,
  Gauge,
} from 'lucide-react';

interface PerformanceGoalsTrackerProps {
  athletes: Athlete[];
  goals: PerformanceGoal[];
  onAddGoal: (newGoal: Omit<PerformanceGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (updatedGoal: PerformanceGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onSelectAthleteDetail?: (athlete: Athlete) => void;
}

export const PerformanceGoalsTracker: React.FC<PerformanceGoalsTrackerProps> = ({
  athletes,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onSelectAthleteDetail,
}) => {
  const [selectedAthleteFilter, setSelectedAthleteFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

  // Form state for creating/editing goals
  const [formAthleteId, setFormAthleteId] = useState<string>(athletes[0]?.id || '');
  const [formMetricType, setFormMetricType] = useState<GoalMetricType>('jump_height');
  const [formTitle, setFormTitle] = useState<string>('Target Vertical Jump (CMJ)');
  const [formExerciseName, setFormExerciseName] = useState<string>('');
  const [formBaselineValue, setFormBaselineValue] = useState<number>(55);
  const [formTargetValue, setFormTargetValue] = useState<number>(65);
  const [formCurrentValue, setFormCurrentValue] = useState<number>(58);
  const [formUnit, setFormUnit] = useState<string>('cm');
  const [formHigherIsBetter, setFormHigherIsBetter] = useState<boolean>(true);
  const [formDeadlineDate, setFormDeadlineDate] = useState<string>('2026-12-31');
  const [formNotes, setFormNotes] = useState<string>('');

  // Filtering
  const filteredGoals = goals.filter((g) => {
    if (selectedAthleteFilter !== 'all' && g.athleteId !== selectedAthleteFilter) return false;
    if (selectedCategoryFilter !== 'all' && g.category !== selectedCategoryFilter) return false;
    if (selectedStatusFilter !== 'all' && g.status !== selectedStatusFilter) return false;
    return true;
  });

  // Calculate high-level KPI metrics
  const totalGoals = goals.length;
  const achievedGoals = goals.filter((g) => g.status === 'Achieved').length;
  const inProgressGoals = goals.filter((g) => g.status === 'In Progress').length;
  const needsAttentionGoals = goals.filter((g) => g.status === 'Needs Attention').length;

  // Calculate team progress percentage
  const averageProgress = totalGoals > 0
    ? Math.round(
        goals.reduce((acc, g) => {
          let progress = 0;
          if (g.higherIsBetter) {
            const range = g.targetValue - g.baselineValue;
            progress = range > 0 ? ((g.currentValue - g.baselineValue) / range) * 100 : 100;
          } else {
            // Lower is better (e.g. sprint time)
            const range = g.baselineValue - g.targetValue;
            progress = range > 0 ? ((g.baselineValue - g.currentValue) / range) * 100 : 100;
          }
          return acc + Math.max(0, Math.min(120, progress));
        }, 0) / totalGoals
      )
    : 0;

  // Handler for Metric Type switch to auto-populate sensible defaults
  const handleMetricTypeChange = (type: GoalMetricType) => {
    setFormMetricType(type);
    switch (type) {
      case 'jump_height':
        setFormTitle('Target Vertical Jump (CMJ)');
        setFormExerciseName('');
        setFormUnit('cm');
        setFormHigherIsBetter(true);
        setFormBaselineValue(55);
        setFormTargetValue(65);
        setFormCurrentValue(58);
        break;
      case 'vbt_velocity':
        setFormTitle('Target Kecepatan Konsentris VBT');
        setFormExerciseName('Barbell Back Squat @ 80kg');
        setFormUnit('m/s');
        setFormHigherIsBetter(true);
        setFormBaselineValue(0.70);
        setFormTargetValue(0.85);
        setFormCurrentValue(0.76);
        break;
      case 'vo2_max':
        setFormTitle('Target VO2 Max Kebugaran Aerobik');
        setFormExerciseName('');
        setFormUnit('ml/kg/min');
        setFormHigherIsBetter(true);
        setFormBaselineValue(52);
        setFormTargetValue(60);
        setFormCurrentValue(55);
        break;
      case 'sprint_speed':
        setFormTitle('Target Waktu Lari Sprint 30m');
        setFormExerciseName('');
        setFormUnit('detik');
        setFormHigherIsBetter(false);
        setFormBaselineValue(4.20);
        setFormTargetValue(3.95);
        setFormCurrentValue(4.10);
        break;
      case 'squat_1rm':
        setFormTitle('Target Estimasi 1RM Kekuatan Maksimal');
        setFormExerciseName('Barbell Back Squat');
        setFormUnit('kg');
        setFormHigherIsBetter(true);
        setFormBaselineValue(110);
        setFormTargetValue(135);
        setFormCurrentValue(120);
        break;
      case 'readiness_target':
        setFormTitle('Target Konsistensi Kesiapan Harian');
        setFormExerciseName('');
        setFormUnit('%');
        setFormHigherIsBetter(true);
        setFormBaselineValue(75);
        setFormTargetValue(90);
        setFormCurrentValue(84);
        break;
    }
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormAthleteId(athletes[0]?.id || '');
    handleMetricTypeChange('jump_height');
    setFormDeadlineDate('2026-12-31');
    setFormNotes('');
    setModalOpen(true);
  };

  const openEditModal = (goal: PerformanceGoal) => {
    setEditingGoal(goal);
    setFormAthleteId(goal.athleteId);
    setFormMetricType(goal.metricType);
    setFormTitle(goal.title);
    setFormExerciseName(goal.exerciseName || '');
    setFormBaselineValue(goal.baselineValue);
    setFormTargetValue(goal.targetValue);
    setFormCurrentValue(goal.currentValue);
    setFormUnit(goal.unit);
    setFormHigherIsBetter(goal.higherIsBetter);
    setFormDeadlineDate(goal.deadlineDate || '');
    setFormNotes(goal.notes || '');
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let category: PerformanceGoal['category'] = 'Daya Ledak & Lompatan';
    if (formMetricType === 'jump_height') category = 'Daya Ledak & Lompatan';
    else if (formMetricType === 'vbt_velocity') category = 'Kecepatan & VBT';
    else if (formMetricType === 'vo2_max') category = 'Kapasitas Kardio';
    else if (formMetricType === 'sprint_speed') category = 'Kecepatan & VBT';
    else if (formMetricType === 'squat_1rm') category = 'Kekuatan Beban';
    else if (formMetricType === 'readiness_target') category = 'Kesiapan & Wellness';

    // Auto-compute status
    let status: PerformanceGoal['status'] = 'In Progress';
    if (formHigherIsBetter) {
      if (formCurrentValue >= formTargetValue) status = 'Achieved';
      else if (formCurrentValue < formBaselineValue) status = 'Needs Attention';
    } else {
      if (formCurrentValue <= formTargetValue) status = 'Achieved';
      else if (formCurrentValue > formBaselineValue) status = 'Needs Attention';
    }

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        athleteId: formAthleteId,
        metricType: formMetricType,
        title: formTitle,
        exerciseName: formExerciseName || undefined,
        baselineValue: Number(formBaselineValue),
        targetValue: Number(formTargetValue),
        currentValue: Number(formCurrentValue),
        unit: formUnit,
        higherIsBetter: formHigherIsBetter,
        deadlineDate: formDeadlineDate,
        category,
        status,
        notes: formNotes,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddGoal({
        athleteId: formAthleteId,
        metricType: formMetricType,
        title: formTitle,
        exerciseName: formExerciseName || undefined,
        baselineValue: Number(formBaselineValue),
        targetValue: Number(formTargetValue),
        currentValue: Number(formCurrentValue),
        unit: formUnit,
        higherIsBetter: formHigherIsBetter,
        deadlineDate: formDeadlineDate,
        category,
        status,
        notes: formNotes,
      });
    }

    setModalOpen(false);
  };

  const getAthlete = (id: string) => athletes.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      {/* Top Banner and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Target Performa Individual Atlet (Goal Setting)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tetapkan target capaian terukur (Tinggi Lompatan VJ/CMJ, Kecepatan VBT, VO2 Max, Sprint) dan pantau progres akumulatif setiap atlet.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tetapkan Target Baru</span>
        </button>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Target Aktif</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalGoals}</div>
          <div className="text-[11px] text-slate-500">Mencakup {athletes.length} atlet skuat</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Target Tercapai</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{achievedGoals}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-500 font-medium">Melampaui benchmark</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Dalam Progres</span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{inProgressGoals}</div>
          <div className="text-[11px] text-slate-500">Adaptasi microcycle berjalan</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Perlu Perhatian</span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{needsAttentionGoals}</div>
          <div className="text-[11px] text-amber-700 dark:text-amber-500 font-medium">Tertinggal &lt; baseline</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Capaian Tim</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{averageProgress}%</div>
          <div className="text-[11px] text-slate-500">Tingkat efektivitas latihan</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          {/* Athlete Filter */}
          <select
            value={selectedAthleteFilter}
            onChange={(e) => setSelectedAthleteFilter(e.target.value)}
            className="px-3 py-1.5 font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Atlet ({goals.length} Target)</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.sport})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-1.5 font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="Daya Ledak & Lompatan">Daya Ledak & Lompatan</option>
            <option value="Kecepatan & VBT">Kecepatan & VBT</option>
            <option value="Kapasitas Kardio">Kapasitas Kardio</option>
            <option value="Kekuatan Beban">Kekuatan Beban</option>
            <option value="Kesiapan & Wellness">Kesiapan & Wellness</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="In Progress">Dalam Progres</option>
            <option value="Achieved">Tercapai</option>
            <option value="Needs Attention">Perlu Perhatian</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Menampilkan {filteredGoals.length} dari {goals.length} target
        </div>
      </div>

      {/* Performance Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((goal) => {
          const athlete = getAthlete(goal.athleteId);

          // Calculate Progress percentage
          let progressPct = 0;
          let deltaValue = 0;
          let gapToTarget = 0;

          if (goal.higherIsBetter) {
            const range = goal.targetValue - goal.baselineValue;
            progressPct = range > 0 ? Math.round(((goal.currentValue - goal.baselineValue) / range) * 100) : 100;
            deltaValue = +(goal.currentValue - goal.baselineValue).toFixed(2);
            gapToTarget = +(goal.targetValue - goal.currentValue).toFixed(2);
          } else {
            // Lower is better (e.g. Sprint)
            const range = goal.baselineValue - goal.targetValue;
            progressPct = range > 0 ? Math.round(((goal.baselineValue - goal.currentValue) / range) * 100) : 100;
            deltaValue = +(goal.baselineValue - goal.currentValue).toFixed(2);
            gapToTarget = +(goal.currentValue - goal.targetValue).toFixed(2);
          }

          const isAchieved = goal.status === 'Achieved' || progressPct >= 100;
          const isWarning = goal.status === 'Needs Attention' || progressPct < 40;

          return (
            <div
              key={goal.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-4.5 space-y-3.5 transition-all shadow-xs hover:border-slate-400 dark:hover:border-slate-600 ${
                isAchieved
                  ? 'border-emerald-500/50 dark:border-emerald-700/50'
                  : isWarning
                  ? 'border-amber-500/40 dark:border-amber-700/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Card Header: Athlete identity and Action buttons */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {athlete?.avatarUrl ? (
                    <img
                      src={athlete.avatarUrl}
                      alt={athlete.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                      {athlete?.name.slice(0, 2).toUpperCase() || 'AT'}
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => athlete && onSelectAthleteDetail?.(athlete)}
                      className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-left transition-colors cursor-pointer"
                    >
                      {athlete?.name || 'Atlet'}
                    </button>
                    <div className="text-[10px] text-slate-400">
                      {athlete?.sport} &bull; {athlete?.position}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(goal)}
                    title="Edit Target"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    title="Hapus Target"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Goal Title & Exercise Name */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {goal.title}
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono shrink-0 ${
                      isAchieved
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    }`}
                  >
                    {isAchieved ? 'Tercapai' : isWarning ? 'Perlu Dorongan' : 'Dalam Progres'}
                  </span>
                </div>
                {goal.exerciseName && (
                  <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {goal.exerciseName}
                  </p>
                )}
              </div>

              {/* Target & Current Metrics Display */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Capaian Terkini</span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                      {goal.currentValue} <span className="text-xs font-normal text-slate-500">{goal.unit}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sasaran Target</span>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {goal.targetValue} <span className="text-xs font-normal text-emerald-600/70">{goal.unit}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar with target marker */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Baseline: {goal.baselineValue} {goal.unit}</span>
                    <span className={`font-bold tabular-nums ${isAchieved ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {progressPct}% Tercapai
                    </span>
                  </div>

                  <div className="relative h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                      className={`h-full rounded-full transition-all ${
                        isAchieved
                          ? 'bg-emerald-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Delta and Gap metrics */}
                <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-500">
                    Progres: <strong className={deltaValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {deltaValue >= 0 ? `+${deltaValue}` : deltaValue} {goal.unit}
                    </strong>
                  </span>
                  <span className="text-slate-500">
                    {gapToTarget <= 0 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Target Selesai
                      </span>
                    ) : (
                      <span>Gap: <strong>{gapToTarget} {goal.unit}</strong></span>
                    )}
                  </span>
                </div>
              </div>

              {/* Coach Notes & Deadline */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 pt-0.5">
                {goal.notes && (
                  <p className="line-clamp-2 italic">
                    &ldquo;{goal.notes}&rdquo;
                  </p>
                )}
                {goal.deadlineDate && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Target Evaluasi: {goal.deadlineDate}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredGoals.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Belum ada target yang cocok dengan filter
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Gunakan tombol di atas untuk menetapkan target performa individual (Vertical Jump, VBT, VO2 Max) untuk atlet Anda.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            + Tetapkan Target Pertama
          </button>
        </div>
      )}

      {/* Modal: Create or Edit Performance Goal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingGoal ? 'Perbarui Target Performa' : 'Tetapkan Target Performa Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parameter objektif berbasis biomekanika dan sains olahraga
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Athlete Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Atlet Binaan
                </label>
                <select
                  value={formAthleteId}
                  onChange={(e) => setFormAthleteId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.sport} - {a.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Metric Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kategori Biomotorik & Jenis Pengukuran
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleMetricTypeChange('jump_height')}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      formMetricType === 'jump_height'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      Vertical Jump (CMJ)
                    </div>
                    <span className="text-[10px] text-slate-500">Tinggi lompatan (cm)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMetricTypeChange('vbt_velocity')}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      formMetricType === 'vbt_velocity'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-blue-600" />
                      Kecepatan VBT (m/s)
                    </div>
                    <span className="text-[10px] text-slate-500">Mean Concentric Vel.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMetricTypeChange('vo2_max')}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      formMetricType === 'vo2_max'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-600" />
                      VO2 Max (Kardio)
                    </div>
                    <span className="text-[10px] text-slate-500">ml/kg/min</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMetricTypeChange('sprint_speed')}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      formMetricType === 'sprint_speed'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Sprint Akselerasi
                    </div>
                    <span className="text-[10px] text-slate-500">Waktu tempuh (detik)</span>
                  </button>
                </div>
              </div>

              {/* Title & Exercise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Judul Sasaran Target
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Spesifikasi Latihan / Beban (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Back Squat @ 80kg"
                    value={formExerciseName}
                    onChange={(e) => setFormExerciseName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Values: Baseline, Target, Current */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    Nilai Awal (Baseline)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={formBaselineValue}
                      onChange={(e) => setFormBaselineValue(Number(e.target.value))}
                      required
                      className="w-full px-2.5 py-1.5 text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">{formUnit}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    Nilai Saat Ini
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={formCurrentValue}
                      onChange={(e) => setFormCurrentValue(Number(e.target.value))}
                      required
                      className="w-full px-2.5 py-1.5 text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">{formUnit}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    Target Sasaran
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={formTargetValue}
                      onChange={(e) => setFormTargetValue(Number(e.target.value))}
                      required
                      className="w-full px-2.5 py-1.5 text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="text-[11px] text-emerald-600 font-mono">{formUnit}</span>
                  </div>
                </div>
              </div>

              {/* Deadline & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Batas Waktu Evaluasi Target
                  </label>
                  <input
                    type="date"
                    value={formDeadlineDate}
                    onChange={(e) => setFormDeadlineDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Orientasi Nilai
                  </label>
                  <div className="flex items-center gap-3 pt-2 text-xs">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={formHigherIsBetter}
                        onChange={() => setFormHigherIsBetter(true)}
                        className="text-emerald-600"
                      />
                      <span>Makin Tinggi Makin Baik</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formHigherIsBetter}
                        onChange={() => setFormHigherIsBetter(false)}
                        className="text-emerald-600"
                      />
                      <span>Makin Rendah Makin Baik (Waktu)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan Program Pelatih
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan periodisasi latihan atau tujuan taktis..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingGoal ? 'Simpan Perubahan' : 'Tetapkan Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
