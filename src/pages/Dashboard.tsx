import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Deposit, Loan, Installment, Investment, Expense, User } from '../types';
import { Card } from '../components/Card';
import { cn } from '../lib/utils';

import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface DashboardProps {
  currentUser: User;
  onAction: (action: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onAction }) => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [membersCount, setMembersCount] = useState(0);

  useEffect(() => {
    const unsubDeps = onSnapshot(collection(db, 'deposits'), (snap) => {
      setDeposits(snap.docs.map(d => ({ ...d.data(), id: d.id } as Deposit)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'deposits'));

    const unsubLoans = onSnapshot(collection(db, 'loans'), (snap) => {
      setLoans(snap.docs.map(d => ({ ...d.data(), id: d.id } as Loan)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'loans'));

    const unsubInst = onSnapshot(collection(db, 'installments'), (snap) => {
      setInstallments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Installment)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'installments'));

    const unsubInv = onSnapshot(collection(db, 'investments'), (snap) => {
      setInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Investment)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'investments'));

    const unsubExp = onSnapshot(collection(db, 'expenses'), (snap) => {
      setExpenses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'expenses'));

    const unsubMem = onSnapshot(collection(db, 'members'), (snap) => {
      setMembersCount(snap.size);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'members'));

    return () => {
      unsubDeps(); unsubLoans(); unsubInst(); unsubInv(); unsubExp(); unsubMem();
    };
  }, []);

  const n = (v: any) => Number(v) || 0;
  const fmt = (num: number) => Math.round(num).toLocaleString('en-IN');

  const totalDeposits = deposits.reduce((s, d) => s + n(d.amount), 0);
  const totalInstPaid = installments.reduce((s, i) => s + n(i.amount), 0);
  const totalLoanGiven = loans.reduce((s, l) => s + n(l.amount), 0);
  const totalActiveInv = investments.filter(i => i.status === 'active').reduce((s, i) => s + n(i.amount), 0);
  const totalReceivedProfit = investments.filter(i => i.status === 'received')
    .reduce((s, i) => s + n(i.received_amount) - n(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + n(e.amount), 0);

  const totalFund = totalDeposits + totalInstPaid + totalReceivedProfit - totalLoanGiven - totalActiveInv - totalExpenses;

  const activeLoans = loans.filter(l => l.status === 'active');
  const activeLoanPrincipalTotal = activeLoans.reduce((s, l) => s + n(l.amount), 0);
  const activeLoanInterestTotal = activeLoans.reduce((s, l) => s + n(l.total_interest), 0);

  const interestEarned = installments.reduce((s, i) => {
    const l = loans.find(ln => ln.id === i.loan_id);
    if (!l || !l.total_payable || !l.total_interest) return s;
    return s + n(i.amount) * (n(l.total_interest) / n(l.total_payable));
  }, 0);

  const totalFine = deposits.filter(d => d.fine).reduce((s, d) => s + n(d.amount), 0);

  return (
    <div className="space-y-4">
      <div className="bg-linear-to-br from-primary-dark to-primary rounded-app p-5 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-[-8px] top-[-16px] text-[120px] opacity-[0.06] font-bold">৳</div>
        <div className="text-xs opacity-80 mb-1">মোট ফান্ড ব্যালেন্স</div>
        <div className="text-3xl font-bold tracking-tight">
          <small className="text-base font-medium">৳</small> {fmt(totalFund)}
        </div>
        
        {activeLoans.length > 0 && (
          <div className="text-[11px] opacity-75 mt-1.5 flex items-center gap-1.5">
            <span>সক্রিয় ঋণ: ৳{fmt(activeLoanPrincipalTotal)}</span>
            <span className="opacity-60">+</span>
            <span className="text-accent font-bold">মুনাফা: ৳{fmt(activeLoanInterestTotal)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="space-y-0.5">
            <div className="text-[13px] font-bold">৳{fmt(interestEarned)}</div>
            <div className="text-[11px] opacity-85">আদায় মুনাফা</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[13px] font-bold">৳{fmt(totalFine)}</div>
            <div className="text-[11px] opacity-85">জরিমানা</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[13px] font-bold">৳{fmt(totalActiveInv)}</div>
            <div className="text-[11px] opacity-85">বিনিয়োগ চলমান</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[13px] font-bold">৳{fmt(totalExpenses)}</div>
            <div className="text-[11px] opacity-85">ব্যয় হয়েছে</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {currentUser.role === 'admin' ? (
          <>
            <QuickAction icon="👤" label="সদস্য যোগ" onClick={() => onAction('add_member')} />
            <QuickAction icon="💰" label="জমা" onClick={() => onAction('add_deposit')} />
            <QuickAction icon="🏦" label="ঋণ দিন" onClick={() => onAction('add_loan')} />
            <QuickAction icon="📲" label="কিস্তি" onClick={() => onAction('add_installment')} />
          </>
        ) : (
          <>
            <QuickAction icon="💰" label="জমা রিকোয়েস্ট" onClick={() => onAction('req_deposit')} />
            <QuickAction icon="🏦" label="ঋণ রিকোয়েস্ট" onClick={() => onAction('req_loan')} />
            <QuickAction icon="📲" label="কিস্তি রিকোয়েস্ট" onClick={() => onAction('req_installment')} />
            <QuickAction icon="👤" label="আমার তথ্য" onClick={() => onAction('goto_mypage')} />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard icon="👥" value={membersCount} label="মোট সদস্য" color="primary" />
        <StatCard icon="💰" value={`৳${fmt(totalDeposits)}`} label="মোট জমা" color="accent" />
        <StatCard icon="⏳" value={activeLoans.length} label="সক্রিয় ঋণ" color="danger" />
        <StatCard icon="✅" value={loans.filter(l => l.status === 'completed').length} label="সম্পন্ন ঋণ" color="blue" />
      </div>

      <div className="space-y-3">
        <h3 className="font-serif text-base font-bold flex items-center gap-2">
          🕐 সাম্প্রতিক লেনদেন
        </h3>
        <div className="space-y-2">
          {/* Recent transactions list would go here */}
          <div className="text-center py-8 text-app-text-muted text-sm italic">
            লেনদেন লোড হচ্ছে...
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-1 p-3 bg-app-card rounded-app-sm shadow-app active:scale-95 transition-all"
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] font-bold text-app-text-secondary text-center leading-tight">{label}</span>
  </button>
);

const StatCard = ({ icon, value, label, color }: { icon: string, value: string | number, label: string, color: string }) => (
  <div className={cn(
    "p-3.5 rounded-app border-1.5 flex flex-col gap-1 shadow-app bg-app-card",
    color === 'primary' && "border-primary/25",
    color === 'accent' && "border-accent/25",
    color === 'danger' && "border-danger/25",
    color === 'blue' && "border-blue-500/25"
  )}>
    <div className="text-lg mb-1">{icon}</div>
    <div className={cn(
      "text-xl font-extrabold tracking-tight leading-none",
      color === 'primary' && "text-primary",
      color === 'accent' && "text-amber-600",
      color === 'danger' && "text-danger",
      color === 'blue' && "text-blue-600"
    )}>{value}</div>
    <div className="text-[10px] text-app-text-muted font-medium">{label}</div>
  </div>
);
