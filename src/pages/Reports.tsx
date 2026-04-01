import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Deposit, Loan, Installment, User, AppSettings } from '../types';
import { Card } from '../components/Card';
import { cn } from '../lib/utils';

import { doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

export const Reports: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    const unsubDeps = onSnapshot(collection(db, 'deposits'), (snap) => {
      setDeposits(snap.docs.map(d => d.data() as Deposit));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'deposits'));

    const unsubMem = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'members'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'main'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as AppSettings);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/main'));

    return () => {
      unsubDeps(); unsubMem(); unsubSettings();
    };
  }, []);

  const fmt = (num: number) => Math.round(num).toLocaleString('en-IN');
  const mn = ['জানু', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

  const years = [...new Set(deposits.filter(d => d.month).map(d => d.month.slice(0, 4)))].sort().reverse();
  if (years.length === 0) years.push(new Date().getFullYear().toString());

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-base font-bold flex items-center gap-2">
        📊 রিপোর্ট
      </h3>

      {/* Excel Sheet Embed */}
      <Card className="p-0 overflow-hidden">
        <div className="p-3 px-4 bg-linear-to-r from-primary to-primary-light text-white flex items-center justify-between">
          <div className="text-sm font-bold">📊 ফান্ডের Excel শিট</div>
          {settings?.excel_link && (
            <a 
              href={settings.excel_link} 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] bg-white/20 px-2 py-1 rounded-md font-bold"
            >
              ↗ পূর্ণ সাইটে দেখুন
            </a>
          )}
        </div>
        <div className="min-h-[200px] flex items-center justify-center p-6 text-center text-app-text-muted">
          {settings?.excel_link ? (
            <iframe 
              src={settings.excel_link.replace(/\/(edit|pub).*$/, '/preview')} 
              className="w-full h-[400px] border-none"
              title="Excel Sheet"
            />
          ) : (
            <div>
              <div className="text-4xl mb-2">📋</div>
              <div className="text-sm font-bold mb-1 text-app-text-secondary">Excel শিটের লিংক যোগ করা হয়নি</div>
              <div className="text-xs">সেটিংস থেকে লিংক যোগ করুন</div>
            </div>
          )}
        </div>
      </Card>

      {/* Member-wise Deposit */}
      <Card className="p-0 overflow-hidden">
        <div className="p-3 px-4 bg-linear-to-br from-primary-dark to-primary text-white">
          <div className="text-sm font-bold mb-2">👤 সদস্য-ভিত্তিক জমা</div>
          <div className="flex gap-2">
            <select 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="flex-1 bg-white/20 border border-white/30 rounded-md px-2 py-1.5 text-xs outline-none"
            >
              {years.map(y => <option key={y} value={y} className="text-black">{y} সাল</option>)}
            </select>
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="flex-1 bg-white/20 border border-white/30 rounded-md px-2 py-1.5 text-xs outline-none"
            >
              <option value="card" className="text-black">📋 কার্ড ভিউ</option>
              <option value="table" className="text-black">📊 টেবিল ভিউ</option>
            </select>
          </div>
        </div>

        <div className="p-2 space-y-2">
          {members.length === 0 ? (
            <div className="text-center py-10 text-app-text-muted italic text-sm">কোনো সদস্য নেই</div>
          ) : viewMode === 'card' ? (
            members.map(m => {
              const mDeps = months.map(mo => deposits.filter(d => d.member_id === m.id && d.month === mo && !d.fine).reduce((s, d) => s + Number(d.amount), 0));
              const total = mDeps.reduce((s, v) => s + v, 0);
              const paidCount = mDeps.filter(v => v > 0).length;
              const pct = Math.round(paidCount / 12 * 100);
              const color = pct === 100 ? 'text-primary' : pct >= 50 ? 'text-amber-600' : 'text-danger';

              return (
                <div key={m.id} className="bg-app-bg-secondary rounded-xl overflow-hidden border border-app-border/50">
                  <div className="flex items-center gap-2.5 p-2.5 border-b border-app-border/50">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary-dark to-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{m.name}</div>
                      <div className="text-[10px] text-app-text-muted">{m.phone}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-primary">৳{fmt(total)}</div>
                      <div className={cn("text-[9px] font-bold", color)}>{paidCount}/12 মাস</div>
                    </div>
                  </div>
                  <div className="p-2 grid grid-cols-6 gap-1">
                    {mDeps.map((v, i) => {
                      const isPaid = v > 0;
                      return (
                        <div key={i} className={cn(
                          "text-center py-1.5 rounded-md",
                          isPaid ? "bg-green-50" : "bg-red-50"
                        )}>
                          <div className="text-[8px] text-app-text-muted mb-0.5">{mn[i]}</div>
                          <div className={cn("text-[9px] font-bold", isPaid ? "text-primary" : "text-danger/40")}>
                            {isPaid ? '৳'+fmt(v) : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-width-[600px]">
                <thead>
                  <tr>
                    <th className="bg-primary text-white p-2 text-[10px] sticky left-0 z-10 text-left">নাম</th>
                    {mn.map(m => <th key={m} className="bg-primary text-white p-2 text-[10px]">{m}</th>)}
                    <th className="bg-primary text-white p-2 text-[10px]">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, ri) => {
                    const mDeps = months.map(mo => deposits.filter(d => d.member_id === m.id && d.month === mo && !d.fine).reduce((s, d) => s + Number(d.amount), 0));
                    const total = mDeps.reduce((s, v) => s + v, 0);
                    return (
                      <tr key={m.id} className={ri % 2 === 0 ? '' : 'bg-app-bg-secondary'}>
                        <td className="p-2 text-[10px] font-bold sticky left-0 bg-inherit border-b border-app-border">{m.name}</td>
                        {mDeps.map((v, i) => (
                          <td key={i} className={cn("p-2 text-[10px] text-center border-b border-app-border", v > 0 ? "text-primary font-bold" : "text-app-text-muted")}>
                            {v > 0 ? '৳'+fmt(v) : '—'}
                          </td>
                        ))}
                        <td className="p-2 text-[10px] font-black text-primary border-b border-app-border text-center">৳{fmt(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
