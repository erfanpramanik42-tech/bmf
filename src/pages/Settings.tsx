import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { AppSettings, User, Investment, Expense } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { cn } from '../lib/utils';
import { Settings as SettingsIcon, Plus, Trash2, Edit2 } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface SettingsProps {
  currentUser: User;
  showToast: (msg: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, showToast }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'main'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as AppSettings);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/main'));

    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snap) => {
      setAdmins(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'admins'));

    const unsubInv = onSnapshot(collection(db, 'investments'), (snap) => {
      setInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Investment)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'investments'));

    const unsubExp = onSnapshot(collection(db, 'expenses'), (snap) => {
      setExpenses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'expenses'));

    setLoading(false);
    return () => {
      unsubSettings(); unsubAdmins(); unsubInv(); unsubExp();
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await updateDoc(doc(db, 'settings', 'main'), {
        monthly_deposit: Number(settings.monthly_deposit),
        interest_rate: Number(settings.interest_rate),
        excel_link: settings.excel_link
      });
      showToast('✅ সেটিংস সংরক্ষিত হয়েছে');
    } catch (e) {
      showToast('❌ সেভ করতে সমস্যা হয়েছে');
    }
  };

  const fmt = (num: number) => Math.round(num).toLocaleString('en-IN');

  return (
    <div className="space-y-4 pb-10">
      <h3 className="font-serif text-base font-bold flex items-center gap-2">
        ⚙️ সেটিংস
      </h3>

      <Card>
        <div className="text-sm font-bold mb-4 flex items-center gap-2">
          💰 ফান্ড সেটিংস
        </div>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">মাসিক জমার পরিমাণ (৳)</label>
            <input 
              type="number" 
              value={settings?.monthly_deposit || ''}
              onChange={(e) => setSettings(s => s ? { ...s, monthly_deposit: Number(e.target.value) } : null)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ডিফল্ট সুদের হার (%)</label>
            <input 
              type="number" 
              value={settings?.interest_rate || ''}
              onChange={(e) => setSettings(s => s ? { ...s, interest_rate: Number(e.target.value) } : null)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="10"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">Excel শিট লিংক</label>
            <input 
              type="url" 
              value={settings?.excel_link || ''}
              onChange={(e) => setSettings(s => s ? { ...s, excel_link: e.target.value } : null)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="https://docs.google.com/spreadsheets/..."
            />
          </div>
          <Button type="submit" className="w-full">💾 সংরক্ষণ করুন</Button>
        </form>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold">👑 অ্যাডমিন তালিকা</div>
          <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]">
            <Plus className="w-3 h-3" /> যোগ করুন
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 bg-app-bg-secondary rounded-xl">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">স</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">সুপার অ্যাডমিন <span className="text-[8px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full ml-1">সুপার</span></div>
              <div className="text-[10px] text-app-text-muted">📞 {settings?.super_admin_phone || '(যেকোনো ফোন)'}</div>
            </div>
          </div>
          {admins.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-2 bg-app-bg-secondary rounded-xl">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm">{a.name[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{a.name} {a.id === currentUser.id && <span className="text-[8px] bg-green-100 text-primary px-1.5 py-0.5 rounded-full ml-1">আমি</span>}</div>
                <div className="text-[10px] text-app-text-muted">📞 {a.phone}</div>
              </div>
              {currentUser.isSuperAdmin && (
                <button className="p-2 text-danger active:scale-90 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold">📈 বিনিয়োগ ব্যবস্থাপনা</div>
          <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]">
            <Plus className="w-3 h-3" /> যোগ করুন
          </Button>
        </div>
        <div className="space-y-2">
          {investments.length === 0 ? (
            <div className="text-center py-4 text-app-text-muted text-xs italic">কোনো বিনিয়োগ নেই</div>
          ) : (
            investments.map(i => (
              <div key={i.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs font-bold">{i.title}</div>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                    {i.status === 'active' ? '🔵 চলমান' : '✅ সম্পন্ন'}
                  </span>
                </div>
                <div className="text-[10px] text-app-text-muted mb-2">📅 {i.invest_date}</div>
                <div className="flex gap-4 text-[11px]">
                  <span>বিনিয়োগ: <b>৳{fmt(i.amount)}</b></span>
                  <span>লাভ: <b className="text-blue-600">৳{fmt(i.profit)}</b></span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
