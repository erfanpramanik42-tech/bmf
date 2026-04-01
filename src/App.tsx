import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { User, Role, AppSettings, Investment, Contact } from './types';
import { Header } from './components/Header';
import { BottomNav, Page } from './components/BottomNav';
import { Toast } from './components/Toast';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Info, 
  FileText, 
  TrendingUp, 
  UserCheck, 
  Share2, 
  Download, 
  Trash2, 
  LogOut, 
  Moon, 
  Sun,
  MoreVertical,
  Clipboard
} from 'lucide-react';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Deposits } from './pages/Deposits';
import { Loans } from './pages/Loans';
import { Reports } from './pages/Reports';
import { Requests } from './pages/Requests';
import { Settings } from './pages/Settings';
import { MyPage } from './pages/MyPage';
import { Modals } from './components/Modals';
import { MemberDetails } from './components/MemberDetails';
import { hashPin } from './lib/crypto';
import { handleFirestoreError, OperationType } from './lib/firestore-utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Modal states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [isAddInstallmentOpen, setIsAddInstallmentOpen] = useState(false);
  
  // Additional Modals
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isInvestDetailsOpen, setIsInvestDetailsOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubInv = onSnapshot(collection(db, 'investments'), (snap) => {
      setInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Investment)));
    });
    const unsubContacts = onSnapshot(collection(db, 'contacts'), (snap) => {
      setContacts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Contact)));
    });
    return () => { unsubInv(); unsubContacts(); };
  }, [user]);

  // Member details state
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isMemberDetailsOpen, setIsMemberDetailsOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<User | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('bm_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bm_theme', 'light');
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e: any) {
          console.error("Anonymous sign-in failed", e);
          const projectId = auth.app.options.projectId;
          if (e.code === 'auth/admin-restricted-operation') {
            const msg = `⚠️ ফায়ারবেস প্রজেক্ট (${projectId})-এ Anonymous Auth চালু করা নেই। অনুগ্রহ করে নিশ্চিত করুন যে আপনি সঠিক প্রজেক্টে এটি চালু করেছেন।`;
            showToast(msg);
            console.warn(msg);
          } else {
            showToast(`❌ লগইন ব্যর্থ: ${e.message}`);
          }
          setIsAuthReady(true);
        }
      }
    });

    const savedUser = localStorage.getItem('bm_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    // Load settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'main'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as AppSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/main');
    });

    setLoading(false);
    return () => unsubscribeSettings();
  }, [isAuthReady]);

  const showToast = (msg: string) => setToastMessage(msg);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bm_session');
    showToast('লগআউট হয়েছে');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-primary-dark via-primary to-primary-light flex flex-col items-center justify-center z-[9999] text-white gap-4">
        <div className="text-[60px] animate-pulse">🤝</div>
        <h2 className="font-serif text-xl font-bold">বন্ধুমহল ফাউন্ডেশন</h2>
        <p className="text-xs opacity-75">সংযোগ স্থাপন হচ্ছে...</p>
        <div className="w-9 h-9 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={(u) => { setUser(u); localStorage.setItem('bm_session', JSON.stringify(u)); }} showToast={showToast} settings={settings} />;
  }

  const handleAction = (action: string) => {
    if (action === 'add_member') setIsAddMemberOpen(true);
    if (action === 'add_deposit') setIsAddDepositOpen(true);
    if (action === 'add_loan') setIsAddLoanOpen(true);
    if (action === 'add_installment') setIsAddInstallmentOpen(true);
    if (action === 'req_deposit' || action === 'req_loan' || action === 'req_installment') setIsRequestOpen(true);
    if (action === 'goto_mypage') setActivePage('mypage');
    if (action === 'goto_requests') setActivePage('requests');
  };

  return (
    <div className="flex flex-col min-h-screen pb-[68px] bg-app-bg">
      <Header 
        title="বন্ধুমহল ফাউন্ডেশন" 
        subtitle="Bondhumohol Foundation"
        rightElement={
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-white/20",
              user.role === 'admin' && "bg-accent"
            )}>
              {user.role === 'admin' ? '👑 অ্যাডমিন' : '👤 সদস্য'}
            </span>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-[34px] h-[34px] bg-white/15 rounded-lg flex items-center justify-center text-white text-base active:bg-white/30 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <main className="flex-1 p-[13px] pb-1 overflow-y-auto scrollbar-hide">
        {activePage === 'dashboard' && <Dashboard currentUser={user} onAction={handleAction} />}
        {activePage === 'members' && (
          <Members 
            currentUser={user} 
            onMemberClick={(m) => { setSelectedMember(m); setIsMemberDetailsOpen(true); }} 
            onAddMember={() => setIsAddMemberOpen(true)} 
          />
        )}
        {activePage === 'deposits' && <Deposits currentUser={user} onAddDeposit={() => setIsAddDepositOpen(true)} />}
        {activePage === 'loans' && <Loans currentUser={user} onAddLoan={() => setIsAddLoanOpen(true)} onInstallment={() => setIsAddInstallmentOpen(true)} />}
        {activePage === 'reports' && <Reports />}
        {activePage === 'requests' && <Requests showToast={showToast} />}
        {activePage === 'settings' && <Settings currentUser={user} showToast={showToast} />}
        {activePage === 'mypage' && <MyPage currentUser={user} onEditProfile={() => {}} onAction={handleAction} />}
      </main>

      <BottomNav activePage={activePage} onPageChange={setActivePage} role={user.role} />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <Modals 
        isAddMemberOpen={isAddMemberOpen} 
        setIsAddMemberOpen={(open) => { setIsAddMemberOpen(open); if (!open) setMemberToEdit(null); }}
        isAddDepositOpen={isAddDepositOpen} setIsAddDepositOpen={setIsAddDepositOpen}
        isAddLoanOpen={isAddLoanOpen} setIsAddLoanOpen={setIsAddLoanOpen}
        isAddInstallmentOpen={isAddInstallmentOpen} setIsAddInstallmentOpen={setIsAddInstallmentOpen}
        isTermsOpen={isTermsOpen} setIsTermsOpen={setIsTermsOpen}
        isAboutOpen={isAboutOpen} setIsAboutOpen={setIsAboutOpen}
        isInvestDetailsOpen={isInvestDetailsOpen} setIsInvestDetailsOpen={setIsInvestDetailsOpen}
        isContactsOpen={isContactsOpen} setIsContactsOpen={setIsContactsOpen}
        isDocsOpen={isDocsOpen} setIsDocsOpen={setIsDocsOpen}
        isRequestOpen={isRequestOpen} setIsRequestOpen={setIsRequestOpen}
        currentUser={user} settings={settings} showToast={showToast}
        editMember={memberToEdit}
        investments={investments}
        contacts={contacts}
      />

      <MemberDetails 
        isOpen={isMemberDetailsOpen}
        onClose={() => setIsMemberDetailsOpen(false)}
        member={selectedMember}
        currentUser={user}
        onEdit={(m) => { setMemberToEdit(m); setIsMemberDetailsOpen(false); setIsAddMemberOpen(true); }}
        showToast={showToast}
      />

      {/* Menu Modal */}
      <Modal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="মেনু" size="sm">
        <div className="space-y-1">
          <div className="flex items-center justify-between p-3 px-4 bg-app-bg-secondary rounded-xl mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">ডার্ক মোড</span>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                isDarkMode ? "bg-primary" : "bg-app-border"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                isDarkMode ? "right-1" : "left-1"
              )} />
            </button>
          </div>

          {[
            { icon: <Clipboard className="w-4 h-4" />, label: 'ফাউন্ডেশনের শর্তাবলী', color: 'text-blue-600', bg: 'bg-blue-50', onClick: () => setIsTermsOpen(true) },
            { icon: <TrendingUp className="w-4 h-4" />, label: 'বিনিয়োগের বিস্তারিত', color: 'text-green-600', bg: 'bg-green-50', onClick: () => setIsInvestDetailsOpen(true) },
            { icon: <UserCheck className="w-4 h-4" />, label: 'ফান্ডে দায়িত্বরত ব্যক্তি', color: 'text-indigo-600', bg: 'bg-indigo-50', onClick: () => setIsContactsOpen(true) },
            { icon: <Info className="w-4 h-4" />, label: 'অ্যাপ সম্পর্কে', color: 'text-purple-600', bg: 'bg-purple-50', onClick: () => setIsAboutOpen(true) },
            { icon: <FileText className="w-4 h-4" />, label: 'ডকুমেন্টস', color: 'text-amber-600', bg: 'bg-amber-50', onClick: () => setIsDocsOpen(true) },
            { icon: <Share2 className="w-4 h-4" />, label: 'ব্যাকআপ / শেয়ার', color: 'text-teal-600', bg: 'bg-teal-50', onClick: () => {} },
            { icon: <Download className="w-4 h-4" />, label: 'ডেটা রিস্টোর', color: 'text-cyan-600', bg: 'bg-cyan-50', onClick: () => {} },
            { icon: <Trash2 className="w-4 h-4" />, label: 'সব ডেটা মুছুন', color: 'text-danger', bg: 'bg-red-50', onClick: () => {} },
            { icon: <LogOut className="w-4 h-4" />, label: 'লগআউট', color: 'text-danger', bg: 'bg-red-50', onClick: handleLogout },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={() => { item.onClick(); setIsMenuOpen(false); }}
              className="w-full flex items-center gap-3 p-3 px-4 hover:bg-app-bg-secondary active:bg-app-bg-secondary rounded-xl transition-colors"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg, item.color)}>
                {item.icon}
              </div>
              <span className="text-sm font-bold text-app-text-secondary">{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Static Content Modals */}

    </div>
  );
}

// --- Auth Screen ---

interface AuthScreenProps {
  onLogin: (user: User) => void;
  showToast: (msg: string) => void;
  settings: AppSettings | null;
}

function AuthScreen({ onLogin, showToast, settings }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [pinBuf, setPinBuf] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const handleNumpad = (n: number) => {
    if (pinBuf.length >= 4) return;
    const newBuf = pinBuf + n;
    setPinBuf(newBuf);
    if (newBuf.length === 4) {
      setTimeout(() => doLogin(newBuf), 200);
    }
  };

  const handleDel = () => setPinBuf(pinBuf.slice(0, -1));

  const doLogin = async (inputPin: string) => {
    if (!phone) { showToast('⚠️ ফোন নম্বর দিন'); setPinBuf(''); return; }
    setLoading(true);
    
    try {
      const inputHash = await hashPin(phone, inputPin);
      
      // 1. Super Admin Check
      if (settings && inputHash === settings.super_admin_pin_hash && (settings.super_admin_phone === '' || phone === settings.super_admin_phone)) {
        console.log("Super Admin Login detected");
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'roles', auth.currentUser.uid), { role: 'admin', phone, isSuperAdmin: true });
            console.log("Super Admin role set successfully");
          } catch (err: any) {
            console.error("Super Admin setDoc(roles) failed:", err);
            throw err;
          }
        } else {
          console.warn("User not authenticated with Firebase. Permissions might be limited.");
          showToast('⚠️ ফায়ারবেস অথেন্টিকেশন ব্যর্থ। কিছু ফিচার কাজ নাও করতে পারে।');
        }
        onLogin({ id: 'SUPER', name: 'সুপার অ্যাডমিন', phone, role: 'admin', isSuperAdmin: true });
        return;
      }

      // If settings is missing, and it's the first time, we might need to bootstrap
      if (!settings) {
        showToast('⚠️ অ্যাপ সেটিংস লোড হচ্ছে না। অনুগ্রহ করে অপেক্ষা করুন বা রিস্টার্ট দিন।');
        setPinBuf('');
        setLoading(false);
        return;
      }

      // 2. Admin Check
      console.log("Checking regular Admin login...");
      let adminSnap;
      try {
        adminSnap = await getDocs(query(collection(db, 'admins'), where('phone', '==', phone), where('pin_hash', '==', inputHash)));
        console.log("Admin check query completed, size:", adminSnap.size);
      } catch (err: any) {
        console.error("Admin getDocs failed:", err);
        throw err;
      }

      if (!adminSnap.empty) {
        const adminDoc = adminSnap.docs[0];
        const adminData = adminDoc.data() as User;
        
        // Link Firebase UID to Roles for Security Rules
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'roles', auth.currentUser.uid), { role: 'admin', phone });
            console.log("Admin role set successfully");
            await updateDoc(doc(db, 'admins', adminDoc.id), { firebase_uid: auth.currentUser.uid });
            console.log("Admin firebase_uid updated successfully");
          } catch (err: any) {
            console.error("Admin post-login updates failed:", err);
            throw err;
          }
        } else {
          console.warn("User not authenticated with Firebase. Permissions might be limited.");
          showToast('⚠️ ফায়ারবেস অথেন্টিকেশন ব্যর্থ। কিছু ফিচার কাজ নাও করতে পারে।');
        }
        
        onLogin({ ...adminData, id: adminDoc.id, role: 'admin' });
        return;
      }

      // 3. Member Check
      console.log("Checking Member login...");
      let memberSnap;
      try {
        memberSnap = await getDocs(query(collection(db, 'members'), where('phone', '==', phone), where('pin_hash', '==', inputHash)));
        console.log("Member check query completed, size:", memberSnap.size);
      } catch (err: any) {
        console.error("Member getDocs failed:", err);
        throw err;
      }

      if (!memberSnap.empty) {
        const memberDoc = memberSnap.docs[0];
        const memberData = memberDoc.data() as User;
        
        // Link Firebase UID to Roles for Security Rules
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'roles', auth.currentUser.uid), { role: 'member', phone });
            console.log("Member role set successfully");
            await updateDoc(doc(db, 'members', memberDoc.id), { firebase_uid: auth.currentUser.uid });
            console.log("Member firebase_uid updated successfully");
          } catch (err: any) {
            console.error("Member post-login updates failed:", err);
            throw err;
          }
        } else {
          console.warn("User not authenticated with Firebase. Permissions might be limited.");
          showToast('⚠️ ফায়ারবেস অথেন্টিকেশন ব্যর্থ। কিছু ফিচার কাজ নাও করতে পারে।');
        }
        
        onLogin({ ...memberData, id: memberDoc.id, role: 'member' });
        return;
      }

      // 4. Pending Check
      console.log("Checking Pending login...");
      let pendingSnap;
      try {
        pendingSnap = await getDocs(query(collection(db, 'pending_regs'), where('phone', '==', phone)));
        console.log("Pending check query completed, size:", pendingSnap.size);
      } catch (err: any) {
        console.error("Pending getDocs failed:", err);
        throw err;
      }
      if (!pendingSnap.empty) {
        showToast('⏳ আপনার নিবন্ধন অনুমোদনের অপেক্ষায় আছে');
      } else {
        showToast('❌ ফোন বা পিন সঠিক নয়');
      }
      setPinBuf('');
    } catch (e: any) {
      console.error("Login Error:", e);
      if (e.message?.includes('permission-denied')) {
        showToast('❌ অনুমতি নেই। ফায়ারবেস রুলস বা অথেন্টিকেশন চেক করুন।');
      } else {
        showToast(`❌ লগইন ব্যর্থ: ${e.message || 'অজানা সমস্যা'}`);
      }
      setPinBuf('');
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const defaultPin = '1234';
      const defaultPhone = '01700000000';
      const pin_hash = await hashPin(defaultPhone, defaultPin);
      
      await setDoc(doc(db, 'settings', 'main'), {
        monthly_deposit: 500,
        interest_rate: 10,
        excel_link: '',
        super_admin_phone: defaultPhone,
        super_admin_pin_hash: pin_hash
      });
      
      showToast('✅ অ্যাপ ইনিশিয়ালাইজ হয়েছে। পিন: 1234');
      setPhone(defaultPhone);
    } catch (e: any) {
      console.error("Bootstrap Error:", e);
      showToast(`❌ ইনিশিয়ালাইজ ব্যর্থ: ${e.message}`);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const doRegister = async () => {
    if (!regName || !regPhone || !regPin) { showToast('⚠️ নাম, ফোন ও পিন আবশ্যক'); return; }
    if (regPin.length !== 4) { showToast('⚠️ পিন অবশ্যই ৪ সংখ্যার'); return; }
    if (regPin !== regPinConfirm) { showToast('⚠️ পিন মিলছে না'); return; }
    
    setLoading(true);
    try {
      const pin_hash = await hashPin(regPhone, regPin);
      await addDoc(collection(db, 'pending_regs'), {
        name: regName,
        phone: regPhone,
        pin_hash,
        created_at: new Date().toISOString()
      });
      showToast('✅ নিবন্ধন অনুরোধ পাঠানো হয়েছে');
      setTab('login');
      setPhone(regPhone);
    } catch (e) {
      showToast('❌ নিবন্ধন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user.email === "sujonali9091@gmail.com") {
        await setDoc(doc(db, 'roles', result.user.uid), { role: 'admin', email: result.user.email });
        onLogin({ 
          id: 'SUPER', 
          name: result.user.displayName || 'সুপার অ্যাডমিন', 
          phone: '01XXXXXXXXX', 
          role: 'admin', 
          isSuperAdmin: true,
          photo: result.user.photoURL || undefined
        });
      } else {
        showToast('⚠️ শুধুমাত্র অনুমোদিত ইমেইল দিয়ে লগইন সম্ভব');
      }
    } catch (e) {
      showToast('❌ লগইন ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-linear-to-br from-primary-dark via-primary to-primary-light z-[9999] overflow-y-auto">
      <div className="shrink-0 h-[28vh] flex flex-col items-center justify-center p-4 text-white text-center">
        <div className="text-[44px] mb-2">🤝</div>
        <h1 className="font-serif text-xl font-bold mb-1">বন্ধুমহল ফাউন্ডেশন</h1>
        <p className="text-[11px] opacity-80">আপনার বন্ধুদের সঞ্চয় তহবিল</p>
      </div>
      
      <div className="bg-app-bg rounded-t-[28px] p-[18px] px-4 pb-8 shrink-0 min-h-[62vh]">
        <div className="flex bg-app-bg-secondary rounded-lg p-1 mb-5">
          <button 
            onClick={() => setTab('login')}
            className={cn("flex-1 text-center py-2.5 rounded-md text-sm font-bold transition-all", tab === 'login' ? "bg-white text-primary shadow-sm" : "text-app-text-muted")}
          >
            লগইন
          </button>
          <button 
            onClick={() => setTab('register')}
            className={cn("flex-1 text-center py-2.5 rounded-md text-sm font-bold transition-all", tab === 'register' ? "bg-white text-primary shadow-sm" : "text-app-text-muted")}
          >
            নিবন্ধন
          </button>
        </div>

        {tab === 'login' ? (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফোন নম্বর</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3.5 border-2 border-app-border rounded-app-sm text-base font-sans outline-none focus:border-primary transition-all" 
                placeholder="০১XXXXXXXXX"
              />
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পিন কোড</label>
              <div className="flex gap-2.5 justify-center my-4">
                {[0, 1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-[52px] h-[52px] border-2 border-app-border rounded-xl flex items-center justify-center text-2xl font-bold transition-all bg-white",
                      pinBuf.length > i && "bg-primary border-primary text-white"
                    )}
                  >
                    {pinBuf.length > i ? '●' : '•'}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button key={n} onClick={() => handleNumpad(n)} className="p-4 text-xl font-bold bg-app-bg-secondary rounded-xl active:scale-92 transition-all">{n}</button>
                ))}
                <button onClick={handleDel} className="p-4 text-sm font-bold bg-white border border-app-border rounded-xl active:scale-92 transition-all">⌫</button>
                <button onClick={() => handleNumpad(0)} className="p-4 text-xl font-bold bg-app-bg-secondary rounded-xl active:scale-92 transition-all">0</button>
                <button onClick={() => doLogin(pinBuf)} className="p-4 text-xl font-bold bg-primary text-white rounded-xl active:scale-92 transition-all">✓</button>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-app-border"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-app-bg px-2 text-app-text-muted font-bold">অথবা</span></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-app-border hover:border-primary/30 text-app-text-secondary font-bold py-3.5 rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                গুগল দিয়ে প্রবেশ (সুপার এডমিন)
              </button>

              {!settings && (
                <button 
                  onClick={handleBootstrap}
                  disabled={isBootstrapping}
                  className="w-full mt-4 bg-amber-50 border-2 border-amber-200 text-amber-700 font-bold py-3 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isBootstrapping ? 'ইনিশিয়ালাইজ হচ্ছে...' : '⚙️ প্রথমবার ব্যবহার করছেন? ইনিশিয়ালাইজ করুন'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-[11px] text-primary leading-relaxed">
              ℹ️ নিবন্ধনের পর অ্যাডমিন অনুমোদন দিলে লগইন করতে পারবেন।
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">আপনার নাম *</label>
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="নাম লিখুন" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফোন নম্বর *</label>
              <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="০১XXXXXXXXX" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পিন কোড *</label>
                <input type="password" value={regPin} onChange={(e) => setRegPin(e.target.value)} maxLength={4} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="৪ সংখ্যা" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পিন নিশ্চিত করুন *</label>
                <input type="password" value={regPinConfirm} onChange={(e) => setRegPinConfirm(e.target.value)} maxLength={4} className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" placeholder="পুনরায় দিন" />
              </div>
            </div>
            <Button onClick={doRegister} loading={loading} className="w-full mt-4">📝 নিবন্ধন করুন</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Utils ---
// Redundant functions removed as they are now imported from src/lib/crypto.ts
