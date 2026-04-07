import React from 'react';
import { Terms } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface TermsPageProps {
  terms: Terms | null;
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ terms, onBack }) => {
  if (!terms) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-app-text-muted animate-pulse">
        <div className="text-4xl mb-4">📜</div>
        <p className="text-sm">লোড হচ্ছে...</p>
      </div>
    );
  }

  const sections = [
    { id: 'membership', title: '👥 সদস্যপদ', items: terms.membership, color: 'border-blue-500 bg-blue-50/30' },
    { id: 'deposit', title: '💰 সঞ্চয় ও আমানত', items: terms.deposit, color: 'border-green-500 bg-green-50/30' },
    { id: 'loan', title: '💸 ঋণ গ্রহণ ও পরিশোধ', items: terms.loan, color: 'border-amber-500 bg-amber-50/30' },
    { id: 'governance', title: '⚖️ পরিচালনা ও সিদ্ধান্ত', items: terms.governance, color: 'border-purple-500 bg-purple-50/30' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 mb-2">
        <button 
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-app-border active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <h3 className="font-serif text-lg font-bold text-app-text-primary">
          📜 ফাউন্ডেশনের শর্তাবলী
        </h3>
      </div>

      <div className="space-y-5">
        {sections.map(section => (
          <div 
            key={section.id} 
            className={cn(
              "p-4 rounded-2xl border-2 shadow-sm transition-all hover:shadow-md",
              section.color
            )}
          >
            <h4 className="text-sm font-bold text-app-text-primary flex items-center gap-2 mb-3">
              <span className="w-1.5 h-4 bg-current rounded-full opacity-50" />
              {section.title}
            </h4>
            <ul className="space-y-3">
              {section.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-[13px] text-app-text-secondary leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-primary shrink-0 shadow-xs border border-app-border/50">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        
        {terms.special && (
          <div className="p-4 bg-danger/5 border-2 border-danger/20 rounded-2xl border-dashed">
            <div className="text-[12px] font-bold text-danger mb-2 flex items-center gap-2">
              <span className="animate-pulse">⚠️</span> বিশেষ দ্রষ্টব্য:
            </div>
            <p className="text-[12px] text-danger/80 leading-relaxed italic font-medium">
              {terms.special}
            </p>
          </div>
        )}
      </div>

      <div className="pt-6 text-center border-t border-app-border/50">
        <p className="text-[11px] text-app-text-muted font-medium">
          সর্বশেষ আপডেট: {new Date().toLocaleDateString('bn-BD')}
        </p>
        <p className="text-[10px] text-app-text-muted mt-1">© বন্ধুমহল ফাউন্ডেশন</p>
      </div>
    </div>
  );
};
