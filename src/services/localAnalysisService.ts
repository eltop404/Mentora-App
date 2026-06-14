
import { Question } from '../types';

export const LocalAnalysisService = {
    detectLanguage(text: string): 'ar' | 'en' {
        const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
        const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
        return arabicCount > englishCount ? 'ar' : 'en';
    },

    cleanAndFixArabic(text: string): string {
        if (!text) return "";
        let cleaned = text
            .replace(/[^\u0600-\u06FFa-zA-Z0-9\s،؛؟.!]/g, " ") 
            .replace(/\s+/g, " ") 
            .replace(/\n+/g, "\n")
            .replace(/([،؛؟])\s*/g, "$1 ")
            .replace(/(\r\n|\n|\r)/gm, " ");

        // Fix Disjointed Arabic (e.g., ا ل ت ا ر ي خ -> التاريخ)
        // This is a common issue with some PDF encodings
        cleaned = cleaned.replace(/([\u0600-\u06FF])\s(?=[\u0600-\u06FF])/g, "$1");

        return cleaned.replace(/\s+/g, " ").trim();
    },

    normalizeArabicText(text: string): string {
        if (!text) return "";
        return text
            .replace(/[\u064B-\u0652]/g, "") // Diacritics
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/ئ/g, "ي")
            .replace(/ؤ/g, "و")
            .replace(/گ/g, "ك")
            .replace(/چ/g, "ج")
            .replace(/\s+/g, " ")
            .trim();
    },

    splitIntoSentences(text: string, lang: 'ar' | 'en'): string[] {
        const pattern = lang === 'ar' ? /[.؟!\n|]+/ : /[.?! \n|]+/;
        return text.split(pattern).map(s => s.trim()).filter(s => s.length > 20); // More lenient
    }
};
