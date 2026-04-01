import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { User, AppSettings, Loan } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { hashPin } from '../lib/crypto';
import { Phone, FileText, Info, TrendingUp, UserCheck, Clipboard } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalsProps {
  isAddMemberOpen: boolean;
  setIsAddMemberOpen: (open: boolean) => void;
  isAddDepositOpen: boolean;
  setIsAddDepositOpen: (open: boolean) => void;
  isAddLoanOpen: boolean;
  setIsAddLoanOpen: (open: boolean) => void;
  isAddInstallmentOpen: boolean;
  setIsAddInstallmentOpen: (open: boolean) => void;
  isRequestOpen: boolean;
  setIsRequestOpen: (open: boolean) => void;
  isTermsOpen: boolean;
  setIsTermsOpen: (open: boolean) => void;
  isAboutOpen: boolean;
  setIsAboutOpen: (open: boolean) => void;
  isInvestDetailsOpen: boolean;
  setIsInvestDetailsOpen: (open: boolean) => void;
  isContactsOpen: boolean;
  setIsContactsOpen: (open: boolean) => void;
  isDocsOpen: boolean;
  setIsDocsOpen: (open: boolean) => void;
  currentUser: User;
  settings: AppSettings | null;
  showToast: (msg: string) => void;
  editMember?: User | null;
  investments?: any[];
  contacts?: any[];
}

export const Modals: React.FC<ModalsProps> = ({
  isAddMemberOpen, setIsAddMemberOpen,
  isAddDepositOpen, setIsAddDepositOpen,
  isAddLoanOpen, setIsAddLoanOpen,
  isAddInstallmentOpen, setIsAddInstallmentOpen,
  isRequestOpen, setIsRequestOpen,
  isTermsOpen, setIsTermsOpen,
  isAboutOpen, setIsAboutOpen,
  isInvestDetailsOpen, setIsInvestDetailsOpen,
  isContactsOpen, setIsContactsOpen,
  isDocsOpen, setIsDocsOpen,
  currentUser, settings, showToast,
  editMember,
  investments = [],
  contacts = []
}) => {
  const [members, setMembers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    if (isAddDepositOpen || isAddLoanOpen || isAddInstallmentOpen) {
      getDocs(collection(db, 'members')).then(snap => {
        setMembers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
      });
    }
    if (isAddInstallmentOpen) {
      getDocs(query(collection(db, 'loans'), where('status', '==', 'active'))).then(snap => {
        setLoans(snap.docs.map(d => ({ ...d.data(), id: d.id } as Loan)));
      });
    }
  }, [isAddDepositOpen, isAddLoanOpen, isAddInstallmentOpen]);

  // --- Add Member ---
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mPin, setMPin] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mPhoto, setMPhoto] = useState('');
  const [mFather, setMFather] = useState('');
  const [mMother, setMMother] = useState('');
  const [mNid, setMNid] = useState('');
  const [mOccupation, setMOccupation] = useState('');
  const [mNomineeName, setMNomineeName] = useState('');
  const [mNomineeRelation, setMNomineeRelation] = useState('');
  const [mLoading, setMLoading] = useState(false);

  useEffect(() => {
    if (editMember) {
      setMName(editMember.name);
      setMPhone(editMember.phone);
      setMAddress(editMember.address || '');
      setMPhoto(editMember.photo || '');
      setMFather(editMember.father_name || '');
      setMMother(editMember.mother_name || '');
      setMNid(editMember.nid || '');
      setMOccupation(editMember.occupation || '');
      setMNomineeName(editMember.nominee_name || '');
      setMNomineeRelation(editMember.nominee_relation || '');
      setMPin(''); // Don't show hashed pin
    } else {
      setMName('');
      setMPhone('');
      setMAddress('');
      setMPhoto('');
      setMFather('');
      setMMother('');
      setMNid('');
      setMOccupation('');
      setMNomineeName('');
      setMNomineeRelation('');
      setMPin('');
    }
  }, [editMember, isAddMemberOpen]);

  const handleAddMember = async () => {
    if (!mName || !mPhone || (!mPin && !editMember)) { showToast('⚠️ নাম, ফোন ও পিন আবশ্যক'); return; }
    setMLoading(true);
    try {
      const pin_hash = mPin ? await hashPin(mPhone, mPin) : (editMember?.pin_hash || '');
      
      const memberData = {
        name: mName, 
        phone: mPhone, 
        pin_hash, 
        address: mAddress, 
        photo: mPhoto,
        father_name: mFather,
        mother_name: mMother,
        nid: mNid,
        occupation: mOccupation,
        nominee_name: mNomineeName,
        nominee_relation: mNomineeRelation
      };

      if (editMember) {
        await updateDoc(doc(db, 'members', editMember.id), memberData);
        showToast('✅ সদস্য তথ্য আপডেট করা হয়েছে');
      } else {
        await addDoc(collection(db, 'members'), {
          ...memberData,
          role: 'member', 
          join_date: new Date().toISOString().split('T')[0]
        });
        showToast('✅ সদস্য যোগ করা হয়েছে');
      }
      setIsAddMemberOpen(false);
    } catch (e) { showToast('❌ ব্যর্থ হয়েছে'); }
    finally { setMLoading(false); }
  };

  // --- Add Deposit ---
  const [depMemberId, setDepMemberId] = useState('');
  const [depMonth, setDepMonth] = useState('');
  const [depAmount, setDepAmount] = useState(settings?.monthly_deposit || 500);
  const [depFine, setDepFine] = useState(0);
  const [depLoading, setDepLoading] = useState(false);

  const handleAddDeposit = async () => {
    if (!depMemberId || !depMonth || !depAmount) { showToast('⚠️ সব ঘর পূরণ করুন'); return; }
    setDepLoading(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'deposits'), {
        member_id: depMemberId, month: depMonth, amount: Number(depAmount),
        fine: false, date
      });
      if (depFine > 0) {
        await addDoc(collection(db, 'deposits'), {
          member_id: depMemberId, month: depMonth, amount: Number(depFine),
          fine: true, date, note: 'জরিমানা'
        });
      }
      showToast('✅ জমা যোগ করা হয়েছে');
      setIsAddDepositOpen(false);
    } catch (e) { showToast('❌ ব্যর্থ হয়েছে'); }
    finally { setDepLoading(false); }
  };

  // --- Add Loan ---
  const [lMemberId, setLMemberId] = useState('');
  const [lAmount, setLAmount] = useState(0);
  const [lProfit, setLProfit] = useState(0);
  const [lInst, setLInst] = useState(12);
  const [lPurpose, setLPurpose] = useState('');
  const [lLoading, setLLoading] = useState(false);

  const handleAddLoan = async () => {
    if (!lMemberId || !lAmount || !lInst) { showToast('⚠️ সব ঘর পূরণ করুন'); return; }
    setLLoading(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      const tp = Number(lAmount) + Number(lProfit);
      const rate = lAmount > 0 ? (lProfit / lAmount) * 100 : 0;
      await addDoc(collection(db, 'loans'), {
        member_id: lMemberId, amount: Number(lAmount), interest: rate,
        installments: Number(lInst), date, purpose: lPurpose,
        total_interest: Number(lProfit), total_payable: tp,
        monthly_installment: tp / Number(lInst), status: 'active'
      });
      showToast('✅ ঋণ অনুমোদন হয়েছে');
      setIsAddLoanOpen(false);
    } catch (e) { showToast('❌ ব্যর্থ হয়েছে'); }
    finally { setLLoading(false); }
  };

  // --- Add Installment ---
  const [iMemberId, setIMemberId] = useState('');
  const [iLoanId, setILoanId] = useState('');
  const [iAmount, setIAmount] = useState(0);
  const [iLoading, setILoading] = useState(false);

  const handleAddInstallment = async () => {
    if (!iMemberId || !iLoanId || !iAmount) { showToast('⚠️ সব ঘর পূরণ করুন'); return; }
    setILoading(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'installments'), {
        member_id: iMemberId, loan_id: iLoanId, amount: Number(iAmount), date
      });
      showToast('✅ কিস্তি যোগ হয়েছে');
      setIsAddInstallmentOpen(false);
    } catch (e) { showToast('❌ ব্যর্থ হয়েছে'); }
    finally { setILoading(false); }
  };

  const fmt = (num: number) => Math.round(num).toLocaleString('en-IN');

  // --- Request ---
  const [reqType, setReqType] = useState<'deposit' | 'loan' | 'installment'>('deposit');
  const [reqAmount, setReqAmount] = useState(0);
  const [reqMonth, setReqMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reqNote, setReqNote] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  const handleAddRequest = async () => {
    if (!reqAmount) { showToast('⚠️ পরিমাণ লিখুন'); return; }
    setReqLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        member_id: currentUser.id,
        type: reqType,
        data: { 
          amount: Number(reqAmount), 
          note: reqNote,
          month: reqType === 'deposit' ? reqMonth : null
        },
        status: 'pending',
        created_at: new Date().toISOString()
      });
      showToast('✅ অনুরোধ পাঠানো হয়েছে');
      setIsRequestOpen(false);
      setReqAmount(0);
      setReqNote('');
    } catch (e) { showToast('❌ ব্যর্থ হয়েছে'); }
    finally { setReqLoading(false); }
  };

  return (
    <>
      {/* Request Modal */}
      <Modal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} title="📝 অনুরোধ পাঠান">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">অনুরোধের ধরন *</label>
            <select value={reqType} onChange={(e) => setReqType(e.target.value as any)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all bg-white">
              <option value="deposit">মাসিক জমা</option>
              <option value="loan">ঋণ</option>
              <option value="installment">কিস্তি</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পরিমাণ (৳) *</label>
            <input type="number" value={reqAmount} onChange={(e) => setReqAmount(Number(e.target.value))} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="৳০০০" />
          </div>
          {reqType === 'deposit' && (
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">মাস *</label>
              <input type="month" value={reqMonth} onChange={(e) => setReqMonth(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all bg-white" />
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নোট (ঐচ্ছিক)</label>
            <textarea value={reqNote} onChange={(e) => setReqNote(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="বিস্তারিত লিখুন..." rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsRequestOpen(false)}>বাতিল</Button>
            <Button className="flex-2" onClick={handleAddRequest} loading={reqLoading}>✅ অনুরোধ পাঠান</Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title={editMember ? "👤 সদস্য তথ্য এডিট করুন" : "👤 নতুন সদস্য যোগ করুন"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নাম *</label>
              <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="সদস্যের নাম" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফোন নম্বর *</label>
              <input type="tel" value={mPhone} onChange={(e) => setMPhone(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="০১XXXXXXXXX" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পিন কোড {editMember && '(ঐচ্ছিক)'}</label>
              <input type="password" value={mPin} onChange={(e) => setMPin(e.target.value)} maxLength={4} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="৪ সংখ্যার পিন" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পিতার নাম</label>
              <input type="text" value={mFather} onChange={(e) => setMFather(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="পিতার নাম" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">মাতার নাম</label>
              <input type="text" value={mMother} onChange={(e) => setMMother(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="মাতার নাম" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">এনআইডি নম্বর</label>
              <input type="text" value={mNid} onChange={(e) => setMNid(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="NID Number" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পেশা</label>
              <input type="text" value={mOccupation} onChange={(e) => setMOccupation(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="পেশা" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ঠিকানা</label>
              <input type="text" value={mAddress} onChange={(e) => setMAddress(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="বর্তমান ঠিকানা" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নমিনীর নাম</label>
              <input type="text" value={mNomineeName} onChange={(e) => setMNomineeName(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="নমিনীর নাম" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নমিনীর সাথে সম্পর্ক</label>
              <input type="text" value={mNomineeRelation} onChange={(e) => setMNomineeRelation(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="সম্পর্ক" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">প্রোফাইল ছবি (URL)</label>
              <input type="text" value={mPhoto} onChange={(e) => setMPhoto(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddMemberOpen(false)}>বাতিল</Button>
            <Button className="flex-2" onClick={handleAddMember} loading={mLoading}>{editMember ? "✅ আপডেট করুন" : "✅ সদস্য যোগ করুন"}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Deposit Modal */}
      <Modal isOpen={isAddDepositOpen} onClose={() => setIsAddDepositOpen(false)} title="💰 মাসিক জমা যোগ করুন">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">সদস্য *</label>
            <select value={depMemberId} onChange={(e) => setDepMemberId(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all bg-white">
              <option value="">বেছে নিন...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">মাস *</label>
            <input type="month" value={depMonth} onChange={(e) => setDepMonth(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">জমার পরিমাণ (৳) *</label>
              <input type="number" value={depAmount} onChange={(e) => setDepAmount(Number(e.target.value))} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">জরিমানা (৳)</label>
              <input type="number" value={depFine} onChange={(e) => setDepFine(Number(e.target.value))} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="০" />
            </div>
          </div>
          {(depAmount > 0 || depFine > 0) && (
            <div className="bg-green-50 p-3 rounded-xl text-center text-primary font-bold text-sm">
              💰 মোট ফান্ডে যাবে: ৳{fmt(depAmount + depFine)}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddDepositOpen(false)}>বাতিল</Button>
            <Button className="flex-2" onClick={handleAddDeposit} loading={depLoading}>✅ জমা যোগ করুন</Button>
          </div>
        </div>
      </Modal>

      {/* Add Loan Modal */}
      <Modal isOpen={isAddLoanOpen} onClose={() => setIsAddLoanOpen(false)} title="🏦 ঋণ প্রদান করুন">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">সদস্য *</label>
            <select value={lMemberId} onChange={(e) => setLMemberId(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all bg-white">
              <option value="">বেছে নিন...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ঋণের পরিমাণ (৳) *</label>
              <input type="number" value={lAmount} onChange={(e) => setLAmount(Number(e.target.value))} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">মুনাফা (৳) *</label>
              <input type="number" value={lProfit} onChange={(e) => setLProfit(Number(e.target.value))} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">কিস্তির সংখ্যা *</label>
            <input type="number" value={lInst} onChange={(e) => setLInst(Number(e.target.value))} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" />
          </div>
          {lAmount > 0 && (
            <div className="bg-blue-50 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between"><span>মূল ঋণ:</span> <b>৳{fmt(lAmount)}</b></div>
              <div className="flex justify-between text-blue-600"><span>মুনাফা:</span> <b>৳{fmt(lProfit)}</b></div>
              <div className="flex justify-between border-t border-blue-200 pt-1 font-bold text-sm"><span>মোট পরিশোধযোগ্য:</span> <b>৳{fmt(lAmount + lProfit)}</b></div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddLoanOpen(false)}>বাতিল</Button>
            <Button className="flex-2" onClick={handleAddLoan} loading={lLoading}>✅ ঋণ অনুমোদন করুন</Button>
          </div>
        </div>
      </Modal>

      {/* Add Installment Modal */}
      <Modal isOpen={isAddInstallmentOpen} onClose={() => setIsAddInstallmentOpen(false)} title="📲 কিস্তি গ্রহণ করুন">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">সদস্য *</label>
            <select value={iMemberId} onChange={(e) => { setIMemberId(e.target.value); setILoanId(''); }} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all bg-white">
              <option value="">বেছে নিন...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ঋণ *</label>
            <select value={iLoanId} onChange={(e) => setILoanId(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all bg-white">
              <option value="">বেছে নিন...</option>
              {loans.filter(l => l.member_id === iMemberId).map(l => <option key={l.id} value={l.id}>৳{fmt(l.amount)} ({l.date})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পরিমাণ (৳) *</label>
            <input type="number" value={iAmount} onChange={(e) => setIAmount(Number(e.target.value))} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddInstallmentOpen(false)}>বাতিল</Button>
            <Button className="flex-2" onClick={handleAddInstallment} loading={iLoading}>✅ কিস্তি যোগ করুন</Button>
          </div>
        </div>
      </Modal>

      {/* Static Content Modals */}
      <Modal isOpen={isInvestDetailsOpen} onClose={() => setIsInvestDetailsOpen(false)} title="📊 বিনিয়োগের বিবরণ">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
          {investments.length === 0 ? (
            <div className="text-center py-8 text-app-text-muted">কোনো বিনিয়োগ পাওয়া যায়নি</div>
          ) : (
            investments.map(inv => (
              <div key={inv.id} className="p-4 rounded-2xl bg-white border border-app-border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-app-text-primary">{inv.title}</h4>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                    inv.status === 'active' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                  )}>
                    {inv.status === 'active' ? 'চলমান' : 'গৃহীত'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-app-text-muted">বিনিয়োগ:</div>
                    <div className="font-bold">৳{inv.amount.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-app-text-muted">লাভ:</div>
                    <div className="font-bold text-primary">৳{inv.profit.toLocaleString('en-IN')}</div>
                  </div>
                  {inv.received_amount && (
                    <div className="col-span-2 pt-1 border-t border-app-border mt-1">
                      <div className="text-app-text-muted">মোট প্রাপ্তি:</div>
                      <div className="font-bold text-primary">৳{inv.received_amount.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal isOpen={isContactsOpen} onClose={() => setIsContactsOpen(false)} title="📞 যোগাযোগের তালিকা">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-app-text-muted">কোনো কন্টাক্ট পাওয়া যায়নি</div>
          ) : (
            contacts.map(contact => (
              <div key={contact.id} className="p-4 rounded-2xl bg-white border border-app-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {contact.photo ? <img src={contact.photo} className="w-full h-full object-cover rounded-full" /> : contact.name[0]}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-app-text-primary">{contact.name}</h4>
                  <p className="text-xs text-app-text-muted">{contact.position}</p>
                  <p className="text-xs font-bold text-primary mt-0.5">{contact.phone}</p>
                </div>
                <a href={`tel:${contact.phone}`} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} title="📄 প্রয়োজনীয় ডকুমেন্টস">
        <div className="text-center py-12 space-y-4">
          <div className="text-5xl opacity-20">📂</div>
          <p className="text-app-text-muted text-sm">বর্তমানে কোনো ডকুমেন্ট আপলোড করা নেই।</p>
        </div>
      </Modal>

      <Modal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} title="ফাউন্ডেশনের শর্তাবলী">
        <div className="prose prose-sm max-h-[60vh] overflow-y-auto p-2">
          <h4 className="text-primary">১. সদস্যপদ</h4>
          <p>ফাউন্ডেশনের সদস্য হতে হলে নির্ধারিত ফি প্রদান করতে হবে এবং নিয়মিত মাসিক জমা দিতে হবে।</p>
          <h4 className="text-primary">২. সঞ্চয় ও ঋণ</h4>
          <p>প্রতি মাসের ১০ তারিখের মধ্যে মাসিক জমা দিতে হবে। ঋণ গ্রহণের ক্ষেত্রে নির্দিষ্ট শর্তাবলী প্রযোজ্য হবে।</p>
        </div>
      </Modal>

      <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title="অ্যাপ সম্পর্কে">
        <div className="text-center p-4 space-y-4">
          <div className="text-5xl">🤝</div>
          <div>
            <h3 className="font-serif text-lg font-bold text-primary">বন্ধুমহল ফাউন্ডেশন</h3>
            <p className="text-xs text-app-text-muted">ভার্সন ৩.০.০</p>
          </div>
          <p className="text-sm text-app-text-secondary leading-relaxed">
            এটি একটি সঞ্চয় ও ঋণ ব্যবস্থাপনা অ্যাপ। বন্ধুদের মধ্যে স্বচ্ছতা ও সহজ হিসাব রাখার জন্য এটি তৈরি করা হয়েছে।
          </p>
          <div className="pt-4 border-t border-app-border">
            <p className="text-[10px] text-app-text-muted">© ২০২৪ বন্ধুমহল ফাউন্ডেশন। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </Modal>
    </>
  );
};
