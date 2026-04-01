import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { Request, Member, Loan } from '../types';
import { CheckCircle2, XCircle, Clock, User, Info, Calendar, Wallet, Landmark } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/Button';

interface RequestsProps {
  showToast: (msg: string) => void;
}

export const Requests: React.FC<RequestsProps> = ({ showToast }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    const unsubReqs = onSnapshot(query(collection(db, 'requests'), orderBy('created_at', 'desc')), (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'requests'));

    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'members'));

    const unsubLoans = onSnapshot(collection(db, 'loans'), (snap) => {
      setLoans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'loans'));

    return () => {
      unsubReqs();
      unsubMembers();
      unsubLoans();
    };
  }, []);

  const handleApprove = async (req: Request) => {
    setProcessingId(req.id);
    setConfirmingId(null);
    try {
      // 1. Create the actual transaction record
      if (req.type === 'deposit') {
        await addDoc(collection(db, 'deposits'), {
          member_id: req.member_id,
          amount: req.data.amount,
          month: req.data.month,
          date: new Date().toISOString().split('T')[0],
          fine: false,
          note: req.data.note || 'অনুরোধ থেকে অনুমোদিত'
        });
      } else if (req.type === 'loan') {
        // For loans, we might need more info, but we'll use defaults or what's in data
        await addDoc(collection(db, 'loans'), {
          member_id: req.member_id,
          amount: req.data.amount,
          interest: 10, // Default interest
          installments: 10, // Default installments
          date: new Date().toISOString().split('T')[0],
          status: 'active',
          purpose: req.data.note || 'অনুরোধ থেকে অনুমোদিত',
          total_interest: req.data.amount * 0.1,
          total_payable: req.data.amount * 1.1,
          monthly_installment: (req.data.amount * 1.1) / 10
        });
      } else if (req.type === 'installment') {
        // Find an active loan for this member
        const memberLoan = loans.find(l => l.member_id === req.member_id && l.status === 'active');
        if (!memberLoan) {
          showToast('❌ এই সদস্যের কোনো সক্রিয় ঋণ পাওয়া যায়নি।');
          setProcessingId(null);
          return;
        }
        await addDoc(collection(db, 'installments'), {
          member_id: req.member_id,
          loan_id: memberLoan.id,
          amount: req.data.amount,
          date: new Date().toISOString().split('T')[0],
          note: req.data.note || 'অনুরোধ থেকে অনুমোদিত'
        });
      }

      // 2. Update request status
      await updateDoc(doc(db, 'requests', req.id), {
        status: 'approved',
        approved_at: new Date().toISOString()
      });
      showToast('✅ অনুরোধটি অনুমোদিত হয়েছে');

    } catch (e) {
      console.error(e);
      showToast('❌ অনুমোদন ব্যর্থ হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reqId: string) => {
    setProcessingId(reqId);
    setConfirmingId(null);
    try {
      await updateDoc(doc(db, 'requests', reqId), {
        status: 'rejected'
      });
      showToast('✅ অনুরোধটি বাতিল করা হয়েছে');
    } catch (e) {
      showToast('❌ বাতিলকরণ ব্যর্থ হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'অজানা সদস্য';

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="bg-white p-4 sticky top-0 z-10 border-b border-app-border">
        <h1 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
          <Clock className="w-6 h-6" /> অনুরোধসমূহ
        </h1>
        <p className="text-xs text-app-text-muted mt-1">সদস্যদের পাঠানো জমা ও ঋণের অনুরোধ</p>
      </header>

      <main className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-app-text-muted">অনুরোধ লোড হচ্ছে...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-app-border">
            <div className="text-5xl mb-4 opacity-20">📝</div>
            <p className="text-app-text-muted">কোনো অনুরোধ পাওয়া যায়নি</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className={cn(
              "p-4 rounded-2xl bg-white border border-app-border shadow-sm transition-all",
              req.status === 'pending' ? "border-l-4 border-l-accent" : 
              req.status === 'approved' ? "border-l-4 border-l-primary opacity-75" : 
              "border-l-4 border-l-destructive opacity-75"
            )}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm",
                    req.type === 'deposit' ? "bg-primary" : 
                    req.type === 'loan' ? "bg-accent" : "bg-blue-500"
                  )}>
                    {req.type === 'deposit' ? <Wallet className="w-5 h-5" /> : 
                     req.type === 'loan' ? <Landmark className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-app-text-primary">{getMemberName(req.member_id)}</h3>
                    <p className="text-[10px] text-app-text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(req.created_at).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  req.status === 'pending' ? "bg-accent/10 text-accent" : 
                  req.status === 'approved' ? "bg-primary/10 text-primary" : 
                  "bg-destructive/10 text-destructive"
                )}>
                  {req.status === 'pending' ? 'অপেক্ষমান' : 
                   req.status === 'approved' ? 'অনুমোদিত' : 'বাতিল'}
                </span>
              </div>

              <div className="bg-app-bg rounded-xl p-3 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-app-text-muted">ধরন:</span>
                  <span className="font-bold">
                    {req.type === 'deposit' ? 'মাসিক জমা' : 
                     req.type === 'loan' ? 'ঋণ' : 'কিস্তি'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-app-text-muted">পরিমাণ:</span>
                  <span className="font-bold text-primary">৳{req.data.amount.toLocaleString('en-IN')}</span>
                </div>
                {req.data.month && (
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">মাস:</span>
                    <span className="font-bold">{req.data.month}</span>
                  </div>
                )}
                {req.data.note && (
                  <div className="pt-2 border-t border-app-border/50">
                    <p className="text-[11px] text-app-text-muted italic flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" /> {req.data.note}
                    </p>
                  </div>
                )}
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2">
                  {confirmingId === req.id ? (
                    <>
                      <Button 
                        variant="gray" 
                        className="flex-1 h-10 text-[10px]" 
                        onClick={() => { setConfirmingId(null); setConfirmAction(null); }}
                        disabled={!!processingId}
                      >
                        না
                      </Button>
                      <Button 
                        variant={confirmAction === 'reject' ? 'destructive' : 'primary'}
                        className="flex-2 h-10 text-[10px]" 
                        onClick={() => confirmAction === 'reject' ? handleReject(req.id) : handleApprove(req)}
                        loading={processingId === req.id}
                        disabled={!!processingId}
                      >
                        হ্যাঁ, {confirmAction === 'reject' ? 'বাতিল করুন' : 'অনুমোদন দিন'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="gray" 
                        className="flex-1 h-10 text-xs" 
                        onClick={() => { setConfirmingId(req.id); setConfirmAction('reject'); }}
                        disabled={!!processingId}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> বাতিল করুন
                      </Button>
                      <Button 
                        className="flex-1 h-10 text-xs" 
                        onClick={() => { setConfirmingId(req.id); setConfirmAction('approve'); }}
                        loading={processingId === req.id}
                        disabled={!!processingId}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> অনুমোদন দিন
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
};
