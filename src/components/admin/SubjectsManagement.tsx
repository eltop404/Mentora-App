import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, BookOpen, Filter, ChevronDown } from 'lucide-react';
import { DB, DEFAULT_SUBJECTS } from '../../services/db';

interface SubjectsManagementProps {
  theme: any;
}

const STAGES = ['اعمال دوليه IB', 'نظم المعلومات BIS'];
const YEARS = ['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'];
const SPECIALIZATIONS_IB = ['', 'محاسبة', 'تمويل'];
const SPECIALIZATIONS_BIS = ['', 'نظم المعلومات'];

export const SubjectsManagement: React.FC<SubjectsManagementProps> = ({ theme }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filterStage, setFilterStage] = useState('اعمال دوليه IB');
  const [filterYear, setFilterYear] = useState('الفرقة الأولى');
  const [filterSpec, setFilterSpec] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [newName, setNewName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const reload = () => setSubjects(DB.getSubjectsRaw());

  useEffect(() => {
    reload();
    window.addEventListener('nt-subjects-change', reload);
    return () => window.removeEventListener('nt-subjects-change', reload);
  }, []);

  const specs = filterStage === 'اعمال دوليه IB' ? SPECIALIZATIONS_IB : SPECIALIZATIONS_BIS;
  const isUpperYear = filterYear === 'الفرقة الثالثة' || filterYear === 'الفرقة الرابعة';

  const filtered = subjects.filter(s => {
    const matchStage = s.stage === filterStage;
    const matchYear = s.year === filterYear;
    const matchSpec = isUpperYear
      ? s.specialization === filterSpec
      : !s.specialization || s.specialization === '';
    return matchStage && matchYear && matchSpec;
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    const spec = isUpperYear ? filterSpec : '';
    DB.addSubjectRaw({
      id: `sub_${Date.now()}`,
      stage: filterStage,
      year: filterYear,
      specialization: spec,
      name: newName.trim(),
    });
    setNewName('');
    setShowAddForm(false);
    reload();
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`هل تريد حذف مادة "${name}"؟`)) return;
    DB.deleteSubjectRaw(id);
    reload();
  };

  const handleStartEdit = (sub: any) => {
    setEditingId(sub.id);
    setEditName(sub.name);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    DB.updateSubjectRaw(editingId, { name: editName.trim() });
    setEditingId(null);
    setEditName('');
    reload();
  };

  const handleReset = () => {
    if (!window.confirm('⚠️ هل تريد إعادة ضبط جميع المواد إلى الافتراضية؟')) return;
    DB.saveSubjectsRaw(DEFAULT_SUBJECTS);
    reload();
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="text-[10px] font-black text-gray-500 hover:text-red-400 transition-colors border border-white/5 px-3 py-1.5 rounded-xl hover:border-red-500/20"
          >
            إعادة الضبط الافتراضي
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white flex items-center justify-end gap-3">
            إدارة المواد الدراسية
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
              <BookOpen size={22} />
            </div>
          </h2>
          <p className="text-[10px] text-gray-500 font-bold mt-1">
            إضافة وتعديل وحذف المواد لكل فرقة وشعبة وتخصص
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-[2.5rem] border border-white/5 p-6">
        <div className="flex items-center justify-end gap-2 mb-5">
          <h3 className="text-sm font-black text-white">تصفية المواد</h3>
          <Filter size={16} style={{ color: theme.primary }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stage */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">الشعبة</label>
            <div className="relative">
              <select
                value={filterStage}
                onChange={e => { setFilterStage(e.target.value); setFilterSpec(''); }}
                className="w-full appearance-none bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm font-bold text-white outline-none focus:border-cyan-500/50 transition-all"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">الفرقة</label>
            <div className="relative">
              <select
                value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setFilterSpec(''); }}
                className="w-full appearance-none bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm font-bold text-white outline-none focus:border-cyan-500/50 transition-all"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Specialization (only for year 3) */}
          {isUpperYear && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">التخصص</label>
              <div className="relative">
                <select
                  value={filterSpec}
                  onChange={e => setFilterSpec(e.target.value)}
                  className="w-full appearance-none bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm font-bold text-white outline-none focus:border-cyan-500/50 transition-all"
                >
                  {specs.filter(s => s !== '').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subject List */}
      <div className="glass rounded-[2.5rem] border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${theme.primary}20`, color: theme.primary, border: `1px solid ${theme.primary}30` }}
          >
            <Plus size={16} />
            إضافة مادة جديدة
          </button>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black px-3 py-1 rounded-full"
              style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
            >
              {filtered.length} مادة
            </span>
            <h3 className="text-sm font-black text-white">
              {filterStage} — {filterYear}
              {filterYear === 'الفرقة الثالثة' || filterYear === 'الفرقة الرابعة' ? ` — ${filterSpec}` : ''}
            </h3>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm transition-all hover:opacity-90 flex-shrink-0"
              style={{ backgroundColor: theme.primary, color: '#000' }}
            >
              <Check size={14} />
              حفظ
            </button>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
              autoFocus
              placeholder="اسم المادة الجديدة..."
              className="flex-1 bg-transparent text-sm font-bold text-white outline-none text-right placeholder:text-gray-600"
            />
          </div>
        )}

        {/* Empty */}
        {filtered.length === 0 && !showAddForm && (
          <div className="py-16 flex flex-col items-center gap-4 opacity-30">
            <BookOpen size={40} />
            <p className="text-sm font-black">لا توجد مواد لهذا الاختيار</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {filtered.map((sub, idx) => (
            <div
              key={sub.id}
              className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all group"
            >
              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => handleDelete(sub.id, sub.name)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  title="حذف"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => handleStartEdit(sub)}
                  className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-white transition-all"
                  title="تعديل"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              {/* Name / Edit inline */}
              <div className="flex-1 text-right">
                {editingId === sub.id ? (
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditingId(null); }} className="p-1 text-gray-400 hover:text-red-400"><X size={14} /></button>
                    <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:text-green-300"><Check size={14} /></button>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      autoFocus
                      className="bg-black/40 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-sm font-bold text-white outline-none text-right w-64"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-bold text-white">{sub.name}</span>
                    <span className="text-[10px] font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded-lg tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
