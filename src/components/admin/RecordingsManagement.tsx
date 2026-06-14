import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Video, Mic, RefreshCw, StopCircle, X } from 'lucide-react';
import { DB } from '../../services/db';
import { supabase, isSupabaseConnected } from '../../services/supabaseClient';

interface RecordingMeta {
    id: string;
    participants: string;
    type: 'Video' | 'Audio';
    date: string;
    time: string;
    timestamp: number;
}

interface Props {
    isDarkMode: boolean;
    theme: any;
}

export const RecordingsManagement: React.FC<Props> = ({ isDarkMode, theme }) => {
    const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
    const [playingRec, setPlayingRec] = useState<{ id: string, base64: string, type: 'Video' | 'Audio' } | null>(null);
    const [isLoadingData, setIsLoadingData] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            let combined: RecordingMeta[] = [];

            if (isSupabaseConnected) {
                try {
                    // Fetch new distributed metadata
                    const { data: newMeta, error: err1 } = await supabase.from('site_data').select('value').like('key', 'nt_rec_meta_%');
                    if (!err1 && newMeta) {
                        const parsed = newMeta.map((d: any) => JSON.parse(d.value));
                        combined = [...parsed];
                    }
                    // Fetch legacy monolithic array
                    const { data: oldMeta, error: err2 } = await supabase.from('site_data').select('value').eq('key', 'nt_recordings_meta').single();
                    if (!err2 && oldMeta) {
                        try {
                            const parsedOld = JSON.parse(oldMeta.value);
                            if (Array.isArray(parsedOld)) {
                                combined = [...combined, ...parsedOld];
                            }
                        } catch (e) {
                            console.error('Failed to parse old record metadata', e);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch cloud recordings:", e);
                }
            } else {
                const data = DB._getRecordingsMeta ? DB._getRecordingsMeta() : [];
                combined = [...data];
            }

            // Deduplicate by ID and sort newest first
            const uniqueMap = new Map();
            combined.forEach(item => uniqueMap.set(item.id, item));
            const finalData = Array.from(uniqueMap.values());
            finalData.sort((a: any, b: any) => b.timestamp - a.timestamp);

            setRecordings(finalData);
        };
        load();
        window.addEventListener('nt-recordings-meta-change', load);
        return () => window.removeEventListener('nt-recordings-meta-change', load);
    }, []);

    const fetchRecordingData = async (recId: string) => {
        setIsLoadingData(recId);
        try {
            if (!isSupabaseConnected) throw new Error("No cloud connection.");
            const { data, error } = await supabase.from('site_data').select('value').eq('key', `nt_recordings_chunk_${recId}`).single();
            if (error || !data) throw error || new Error("Not found");
            return data.value;
        } catch (err: any) {
            alert("تعذر جلب بيانات التسجيل (قد يكون تم حذفه أو لم يكتمل رفعه).");
            return null;
        } finally {
            setIsLoadingData(null);
        }
    };

    const handlePlay = async (rec: RecordingMeta) => {
        if (playingRec?.id === rec.id) return;
        const b64 = await fetchRecordingData(rec.id);
        if (b64) setPlayingRec({ id: rec.id, base64: b64, type: rec.type });
    };

    const handleDownload = async (rec: RecordingMeta) => {
        const b64 = await fetchRecordingData(rec.id);
        if (!b64) return;

        try {
            const a = document.createElement('a');
            a.href = b64;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const ext = rec.type === 'Video' ? (isIOS ? 'mp4' : 'webm') : 'webm';
            a.download = `تسجيل-${rec.participants.replace(/\s+/g, '-')}-${rec.date}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            alert('فشل التنزيل');
        }
    };

    const handleDelete = async (recId: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا التسجيل نهائياً؟")) return;

        const updated = recordings.filter(r => r.id !== recId);
        setRecordings(updated);
        if (DB._saveRecordingsMeta) DB._saveRecordingsMeta(updated);

        // Delete from cloud to save space
        if (isSupabaseConnected) {
            // Delete actual chunk
            supabase.from('site_data').delete().eq('key', `nt_recordings_chunk_${recId}`).then();
            // Delete individual metadata if exists
            supabase.from('site_data').delete().eq('key', `nt_rec_meta_${recId}`).then();
        }

        if (playingRec?.id === recId) setPlayingRec(null);
        alert("تم حذف التسجيل.");
    };

    return (
        <div className={`p-6 rounded-2xl shadow-xl border overflow-hidden ${isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6 border-b pb-4" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                    <StopCircle size={28} />
                </div>
                <div>
                    <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>أرشيف التسجيلات</h2>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>سجل المكالمات الخاصة (فيديو / صوت) التي تمت في المنصة</p>
                </div>
            </div>

            {playingRec && (
                <div className={`mb-6 p-4 rounded-2xl border flex flex-col items-center gap-3 ${isDarkMode ? 'bg-black/50 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                    <div className="w-full flex justify-between items-center mb-2 px-2">
                        <span className="font-bold text-red-500 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                            تشغيل التسجيل
                        </span>
                        <button onClick={() => setPlayingRec(null)} className="text-gray-500 hover:text-red-500 bg-white/5 p-1 rounded-full"><X size={20} /></button>
                    </div>
                    {playingRec.type === 'Video' ? (
                        <video src={playingRec.base64} controls autoPlay className="w-full max-w-2xl rounded-xl shadow-lg border border-white/10" />
                    ) : (
                        <audio src={playingRec.base64} controls autoPlay className="w-full max-w-2xl" />
                    )}
                </div>
            )}

            {recordings.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-50">
                    <StopCircle size={64} className="mb-4 text-gray-400" />
                    <p className="text-xl font-bold">لا يوجد أي تسجيلات حالياً</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {recordings.map((rec) => (
                        <div key={rec.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-[#0f172a] border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>

                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rec.type === 'Video' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {rec.type === 'Video' ? <Video size={24} /> : <Mic size={24} />}
                                </div>
                                <div>
                                    <div className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                        مكالمة {rec.participants}
                                    </div>
                                    <div className="flex gap-4 text-xs font-bold text-gray-500 mt-1">
                                        <span>{rec.date}</span>
                                        <span>{rec.time}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    onClick={() => handlePlay(rec)}
                                    disabled={isLoadingData === rec.id || playingRec?.id === rec.id}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg ${isLoadingData === rec.id ? 'bg-blue-400 opacity-70' : playingRec?.id === rec.id ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                                >
                                    {isLoadingData === rec.id ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                                    تشغيل
                                </button>

                                <button
                                    onClick={() => handleDownload(rec)}
                                    disabled={isLoadingData === rec.id}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                                >
                                    {isLoadingData === rec.id ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                                </button>

                                <button
                                    onClick={() => handleDelete(rec.id)}
                                    className="flex items-center justify-center w-10 h-10 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
