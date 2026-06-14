import React, { useState, useMemo } from 'react';
import { X, Check, RefreshCw, Shuffle, Camera } from 'lucide-react';
import { cn } from '../utils/cn';

const DICEBEAR_OPTIONS = {
  skinColor: ['pale', 'light', 'brown', 'darkBrown', 'black', 'yellow', 'tanned'],
  top: ['noHair', 'hat', 'hijab', 'turban', 'longHairBigHair', 'longHairBob', 'longHairCurly', 'longHairCurvy', 'longHairDreads', 'longHairFrida', 'longHairFro', 'longHairFroBand', 'longHairNotTooLong', 'longHairShavedSides', 'longHairMiaWallace', 'longHairStraight', 'longHairStraight2', 'longHairStraightStrand', 'shortHairDreads01', 'shortHairDreads02', 'shortHairFrizzle', 'shortHairShaggyMullet', 'shortHairShortCurly', 'shortHairShortFlat', 'shortHairShortRound', 'shortHairShortWaved', 'shortHairSides', 'shortHairTheCaesar', 'shortHairTheCaesarSidePart'],
  hairColor: ['auburn', 'black', 'blonde', 'blondeGolden', 'brown', 'brownDark', 'pastelPink', 'platinum', 'red', 'silverGray'],
  facialHair: ['default', 'beardMedium', 'beardLight', 'beardMagestic', 'moustaceFancy', 'moustacheMagnum'],
  clothes: ['blazerShirt', 'blazerSweater', 'collarSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'],
  clothesColor: ['black', 'blue01', 'blue02', 'blue03', 'gray01', 'gray02', 'heather', 'pastelBlue', 'pastelGreen', 'pastelOrange', 'pastelRed', 'pastelYellow', 'pink', 'red', 'white'],
  eyes: ['default', 'close', 'cry', 'dizzy', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky'],
  eyebrows: ['default', 'defaultNatural', 'angry', 'angryNatural', 'flatNatural', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural'],
  mouth: ['default', 'concerned', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'smirk', 'tongue', 'twinkle', 'vomit'],
  accessories: ['default', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers']
};

const TABS = [
  { id: 'skin', label: 'لون البشرة' },
  { id: 'hair', label: 'تصفيفة الشعر' },
  { id: 'hairColor', label: 'لون الشعر' },
  { id: 'face', label: 'الوجه' },
  { id: 'facialHair', label: 'اللحية والشارب' },
  { id: 'accessories', label: 'النظارات' },
  { id: 'clothes', label: 'الملابس' }
];

export const AvatarCreator = ({ onSave, onClose }: { onSave: (url: string) => void, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState('skin');
  const [options, setOptions] = useState({
    skinColor: 'light',
    top: 'shortHairShortFlat',
    hairColor: 'black',
    facialHair: 'default',
    facialHairColor: 'black',
    clothes: 'hoodie',
    clothesColor: 'black',
    eyes: 'default',
    eyebrows: 'default',
    mouth: 'smile',
    accessories: 'default'
  });

  const generateUrl = (opts: any) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=Mentora&backgroundColor=b6e3f4&skinColor=${opts.skinColor}&top=${opts.top}&hairColor=${opts.hairColor}&facialHair=${opts.facialHair}&facialHairColor=${opts.facialHairColor}&clothing=${opts.clothes}&clothingColor=${opts.clothesColor}&eyes=${opts.eyes}&eyebrows=${opts.eyebrows}&mouth=${opts.mouth}&accessories=${opts.accessories}&accessoriesProbability=100&facialHairProbability=100`;
  };

  const avatarUrl = useMemo(() => generateUrl(options), [options]);

  const handleRandomize = () => {
    setOptions({
      skinColor: DICEBEAR_OPTIONS.skinColor[Math.floor(Math.random() * DICEBEAR_OPTIONS.skinColor.length)],
      top: DICEBEAR_OPTIONS.top[Math.floor(Math.random() * DICEBEAR_OPTIONS.top.length)],
      hairColor: DICEBEAR_OPTIONS.hairColor[Math.floor(Math.random() * DICEBEAR_OPTIONS.hairColor.length)],
      facialHair: DICEBEAR_OPTIONS.facialHair[Math.floor(Math.random() * DICEBEAR_OPTIONS.facialHair.length)],
      facialHairColor: DICEBEAR_OPTIONS.hairColor[Math.floor(Math.random() * DICEBEAR_OPTIONS.hairColor.length)],
      clothes: DICEBEAR_OPTIONS.clothes[Math.floor(Math.random() * DICEBEAR_OPTIONS.clothes.length)],
      clothesColor: DICEBEAR_OPTIONS.clothesColor[Math.floor(Math.random() * DICEBEAR_OPTIONS.clothesColor.length)],
      eyes: DICEBEAR_OPTIONS.eyes[Math.floor(Math.random() * DICEBEAR_OPTIONS.eyes.length)],
      eyebrows: DICEBEAR_OPTIONS.eyebrows[Math.floor(Math.random() * DICEBEAR_OPTIONS.eyebrows.length)],
      mouth: DICEBEAR_OPTIONS.mouth[Math.floor(Math.random() * DICEBEAR_OPTIONS.mouth.length)],
      accessories: DICEBEAR_OPTIONS.accessories[Math.floor(Math.random() * DICEBEAR_OPTIONS.accessories.length)]
    });
  };

  const handleReset = () => {
    setOptions({
      skinColor: 'light',
      top: 'shortHairShortFlat',
      hairColor: 'black',
      facialHair: 'default',
      facialHairColor: 'black',
      clothes: 'hoodie',
      clothesColor: 'black',
      eyes: 'default',
      eyebrows: 'default',
      mouth: 'smile',
      accessories: 'default'
    });
  };

  const OptionGrid = ({ type, items, value, onChange, isColor = false }: any) => (
    <div className={`grid ${isColor ? 'grid-cols-5' : 'grid-cols-3'} gap-2`}>
      {items.map((item: string) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={cn(
            "aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 flex items-center justify-center",
            value === item ? "border-emerald-500 bg-emerald-500/10" : "border-white/5 bg-white/5 hover:border-white/20"
          )}
        >
          {isColor ? (
            <div 
              className="w-full h-full rounded-lg" 
              style={{ 
                backgroundColor: item === 'black' ? '#262e33' : 
                                item === 'pale' ? '#ffdbb4' : 
                                item === 'light' ? '#edb98a' : 
                                item === 'brown' ? '#d08b5b' : 
                                item === 'darkBrown' ? '#ae5d29' : 
                                item === 'auburn' ? '#a55728' : 
                                item === 'blonde' ? '#b58143' : 
                                item === 'blondeGolden' ? '#e6cea8' : 
                                item === 'brownDark' ? '#724133' : 
                                item === 'platinum' ? '#5e481e' : 
                                item === 'red' ? '#c93305' : 
                                item === 'silverGray' ? '#e8e1e1' : 
                                item === 'blue01' ? '#65c9ff' :
                                item === 'blue02' ? '#5199e4' :
                                item === 'blue03' ? '#25557c' :
                                item === 'gray01' ? '#e6e6e6' :
                                item === 'gray02' ? '#929598' :
                                item === 'heather' ? '#3c4f5c' :
                                item === 'pastelBlue' ? '#b1e2ff' :
                                item === 'pastelGreen' ? '#a7ffc4' :
                                item === 'pastelOrange' ? '#ffdeb5' :
                                item === 'pastelRed' ? '#ffafaf' :
                                item === 'pastelYellow' ? '#ffffb1' :
                                item === 'pink' ? '#ff488e' :
                                item === 'white' ? '#ffffff' :
                                item === 'yellow' ? '#f6d000' :
                                item === 'tanned' ? '#fd9841' :
                                '#262e33' 
              }} 
            />
          ) : (
            <img 
              src={generateUrl({ ...options, [type]: item })} 
              className="w-full h-full object-cover" 
              alt={item} 
              loading="lazy"
            />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70000] bg-[#0a0a0f] flex flex-col md:flex-row font-sans" dir="rtl">
      {/* Header Mobile / Right Panel Desktop */}
      <div className="w-full md:w-64 bg-[#111116] border-b md:border-b-0 md:border-l border-white/5 flex flex-row md:flex-col shrink-0">
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5">
          <h2 className="text-white font-black text-lg">انشئ افاتار خاص بك</h2>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-x-auto md:overflow-y-auto no-scrollbar flex md:flex-col p-2 md:p-4 gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 rounded-xl font-bold text-sm text-right whitespace-nowrap transition-all border",
                activeTab === tab.id ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-transparent text-gray-400 border-transparent hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Preview Area */}
        <div className="w-full md:w-[45%] flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#111116] to-[#0a0a0f]">
          <div className="relative w-48 h-48 md:w-72 md:h-72 bg-white/5 rounded-full shadow-2xl border-4 border-white/10 mb-8 flex items-center justify-center overflow-hidden">
            <img src={avatarUrl} alt="Preview" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 font-bold transition-all text-sm border border-white/5">
              <RefreshCw size={16} /> إعادة ضبط
            </button>
            <button onClick={handleRandomize} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 font-bold transition-all text-sm border border-white/5">
              <Shuffle size={16} /> عشوائي
            </button>
          </div>
          <button 
            onClick={() => onSave(avatarUrl)}
            className="mt-8 w-full max-w-xs py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <Check size={20} /> حفظ الافاتار
          </button>
        </div>

        {/* Options Area */}
        <div className="flex-1 bg-[#0a0a0f] p-4 md:p-8 overflow-y-auto custom-scrollbar border-t md:border-t-0 md:border-r border-white/5">
          {activeTab === 'skin' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">لون البشرة</h3>
              <OptionGrid type="skinColor" items={DICEBEAR_OPTIONS.skinColor} value={options.skinColor} onChange={(v: string) => setOptions({ ...options, skinColor: v })} isColor={true} />
            </div>
          )}
          
          {activeTab === 'hair' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">تصفيفة الشعر</h3>
              <OptionGrid type="top" items={DICEBEAR_OPTIONS.top} value={options.top} onChange={(v: string) => setOptions({ ...options, top: v })} />
            </div>
          )}

          {activeTab === 'hairColor' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">لون الشعر</h3>
              <OptionGrid type="hairColor" items={DICEBEAR_OPTIONS.hairColor} value={options.hairColor} onChange={(v: string) => setOptions({ ...options, hairColor: v })} isColor={true} />
            </div>
          )}

          {activeTab === 'face' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-4">العيون</h3>
                <OptionGrid type="eyes" items={DICEBEAR_OPTIONS.eyes} value={options.eyes} onChange={(v: string) => setOptions({ ...options, eyes: v })} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">الحواجب</h3>
                <OptionGrid type="eyebrows" items={DICEBEAR_OPTIONS.eyebrows} value={options.eyebrows} onChange={(v: string) => setOptions({ ...options, eyebrows: v })} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">الفم</h3>
                <OptionGrid type="mouth" items={DICEBEAR_OPTIONS.mouth} value={options.mouth} onChange={(v: string) => setOptions({ ...options, mouth: v })} />
              </div>
            </div>
          )}

          {activeTab === 'facialHair' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-4">اللحية والشارب</h3>
                <OptionGrid type="facialHair" items={DICEBEAR_OPTIONS.facialHair} value={options.facialHair} onChange={(v: string) => setOptions({ ...options, facialHair: v })} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">لون اللحية</h3>
                <OptionGrid type="facialHairColor" items={DICEBEAR_OPTIONS.facialHairColor} value={options.facialHairColor} onChange={(v: string) => setOptions({ ...options, facialHairColor: v })} isColor={true} />
              </div>
            </div>
          )}

          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">النظارات</h3>
              <OptionGrid type="accessories" items={DICEBEAR_OPTIONS.accessories} value={options.accessories} onChange={(v: string) => setOptions({ ...options, accessories: v })} />
            </div>
          )}

          {activeTab === 'clothes' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-4">الملابس</h3>
                <OptionGrid type="clothes" items={DICEBEAR_OPTIONS.clothes} value={options.clothes} onChange={(v: string) => setOptions({ ...options, clothes: v })} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">لون الملابس</h3>
                <OptionGrid type="clothesColor" items={DICEBEAR_OPTIONS.clothesColor} value={options.clothesColor} onChange={(v: string) => setOptions({ ...options, clothesColor: v })} isColor={true} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
