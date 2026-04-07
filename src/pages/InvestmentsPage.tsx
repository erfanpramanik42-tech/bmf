import React, { useState, useMemo } from 'react';
import { Investment } from '../types';
import { ArrowLeft, Briefcase, Calendar, CheckCircle2, History, Filter, DollarSign, PieChart, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';

interface InvestmentsPageProps {
  investments: Investment[];
  onBack: () => void;
}

export const InvestmentsPage: React.FC<InvestmentsPageProps> = ({ investments, onBack }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    investments.forEach(inv => {
      const year = inv.invest_date.split('-')[0];
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    if (selectedYear === 'all') return investments;
    return investments.filter(inv => inv.invest_date.startsWith(selectedYear));
  }, [investments, selectedYear]);

  const stats = useMemo(() => {
    const total = filteredInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const profit = filteredInvestments.reduce((sum, inv) => sum + inv.profit, 0);
    return { total, profit };
  }, [filteredInvestments]);

  return (
    <div className="space-y-4 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm border border-app-border active:scale-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </button>
        <h3 className="font-serif text-base font-bold text-app-text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> বিনিয়োগের বিস্তারিত
        </h3>
      </div>

      {/* Stats Summary - Medium Compact */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white rounded-2xl border border-app-border shadow-sm flex flex-col gap-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-[8px] text-app-text-muted font-bold uppercase tracking-wider mb-0.5">মোট বিনিয়োগ</div>
            <div className="text-sm font-bold text-app-text-primary">
              ৳{stats.total.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-app-border shadow-sm flex flex-col gap-1">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="text-[8px] text-app-text-muted font-bold uppercase tracking-wider mb-0.5">মোট লাভ</div>
            <div className="text-sm font-bold text-green-600">
              ৳{stats.profit.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Filter - Medium Compact */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex-shrink-0 p-1.5 bg-app-bg-secondary rounded-lg">
          <Filter className="w-3 h-3 text-app-text-muted" />
        </div>
        <button
          onClick={() => setSelectedYear('all')}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap border",
            selectedYear === 'all' 
              ? "bg-primary text-white border-primary shadow-md" 
              : "bg-white text-app-text-secondary border-app-border"
          )}
        >
          সব সময়
        </button>
        {years.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap border",
              selectedYear === year 
                ? "bg-primary text-white border-primary shadow-md" 
                : "bg-white text-app-text-secondary border-app-border"
            )}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Investment List - Medium Compact */}
      <div className="space-y-3">
        {filteredInvestments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-app-bg-secondary rounded-2xl border border-dashed border-app-border">
            <p className="text-xs text-app-text-muted italic">কোনো বিনিয়োগ পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredInvestments.map(inv => (
            <div 
              key={inv.id} 
              className={cn(
                "relative bg-white p-3.5 rounded-2xl border-2 transition-all hover:shadow-md",
                inv.status === 'active' ? "border-blue-100" : "border-green-100"
              )}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    inv.status === 'active' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                  )}>
                    {inv.status === 'active' ? <History className="w-4.5 h-4.5" /> : <CheckCircle2 className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-app-text-primary leading-tight">{inv.title}</h4>
                    <div className="flex items-center gap-1 text-[9px] text-app-text-muted mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {inv.invest_date}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider",
                  inv.status === 'active' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                )}>
                  {inv.status === 'active' ? 'চলমান' : 'সম্পন্ন'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-app-bg-secondary rounded-xl">
                <div>
                  <div className="text-[8px] text-app-text-muted font-bold uppercase mb-0.5">বিনিয়োগকৃত টাকা</div>
                  <div className="text-xs font-bold text-app-text-primary">৳{inv.amount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-[8px] text-app-text-muted font-bold uppercase mb-0.5">অর্জিত লাভ</div>
                  <div className="text-xs font-bold text-blue-600">৳{inv.profit.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {inv.status === 'received' && inv.received_amount && (
                <div className="mt-2.5 pt-2.5 border-t border-green-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[10px] font-bold text-green-700">মোট ফেরত পেয়েছেন</span>
                  </div>
                  <div className="text-[11px] font-bold text-green-700">
                    ৳{inv.received_amount.toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
