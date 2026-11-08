import React, { useState } from 'react';
import { Athlete, SportType, PhysicalStatus } from '../types/athlete';
import { UserPlus, X } from 'lucide-react';

interface AddAthleteModalProps {
  onClose: () => void;
  onAddAthlete: (athlete: Athlete) => void;
}

export const AddAthleteModal: React.FC<AddAthleteModalProps> = ({ onClose, onAddAthlete }) => {
  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportType>('Sepak Bola');
  const [position, setPosition] = useState('');
  const [age, setAge] = useState<number>(20);
  const [gender, setGender] = useState<'Putra' | 'Putri'>('Putra');
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(70);
  const [bodyFat, setBodyFat] = useState<number>(12);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(54);
  const [status, setStatus] = useState<PhysicalStatus>('Fit');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAthlete: Athlete = {
      id: `atl-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      sport,
      position: position.trim() || 'Umum',
      age,
      gender,
      height,
      weight,
      bodyFat,
      restingHeartRate,
      status,
      readinessScore: 85,
      acwr: 1.05,
      acuteLoad: 2400,
      chronicLoad: 2300,
      notes: notes.trim() || 'Atlet baru didaftarkan ke sistem pemantauan fisik.',
    };

    onAddAthlete(newAthlete);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daftarkan Atlet Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Atlet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pratama Arhan"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cabang Olahraga
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value as SportType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Sepak Bola">Sepak Bola</option>
                <option value="Atletik (Sprint)">Atletik (Sprint)</option>
                <option value="Bola Basket">Bola Basket</option>
                <option value="Bulutangkis">Bulutangkis</option>
                <option value="Renang">Renang</option>
                <option value="Bola Voli">Bola Voli</option>
                <option value="Futsal">Futsal</option>
                <option value="Pencak Silat">Pencak Silat</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Posisi / Nomor
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Bek Kiri / 100m"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Usia (Tahun)
              </label>
              <input
                type="number"
                min="14"
                max="45"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Putra">Putra</option>
                <option value="Putri">Putri</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tinggi (cm)
              </label>
              <input
                type="number"
                min="130"
                max="230"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 170)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Berat (kg)
              </label>
              <input
                type="number"
                min="35"
                max="160"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 65)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Body Fat (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="5"
                max="35"
                value={bodyFat}
                onChange={(e) => setBodyFat(parseFloat(e.target.value) || 12)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resting Heart Rate (bpm)
              </label>
              <input
                type="number"
                min="40"
                max="95"
                value={restingHeartRate}
                onChange={(e) => setRestingHeartRate(parseInt(e.target.value) || 55)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Fisik
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PhysicalStatus)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Fit">Fit (Siap Penuh)</option>
                <option value="Observasi">Observasi (Pengawasan)</option>
                <option value="Modifikasi">Modifikasi (Beban Ringan)</option>
                <option value="Pemulihan">Pemulihan (Rehabilitasi)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Khusus Pelatih / Medis
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Memiliki riwayat dislokasi bahu 2 tahun lalu"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
            >
              Simpan Atlet
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
