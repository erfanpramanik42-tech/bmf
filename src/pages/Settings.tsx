import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { AppSettings, User, Investment, Expense, Terms, DeveloperInfo, Document as AppDocument } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { cn } from '../lib/utils';
import { Settings as SettingsIcon, Plus, Trash2, Edit2, Bell, FileText, User as UserIcon, Banknote, Wallet, Send, FileSpreadsheet, CloudUpload, ShieldCheck, Facebook, MapPin, Phone, Info, Settings2, TrendingUp } from 'lucide-react';
import { auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { hashPin, normalizeDigits } from '../lib/crypto';

interface SettingsProps {
  currentUser: User;
  showToast: (msg: string) => void;
  onAction: (action: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, showToast, onAction }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [cashEntries, setCashEntries] = useState<any[]>([]);
  const [terms, setTerms] = useState<Terms | null>(null);
  const [developer, setDeveloper] = useState<DeveloperInfo | null>(null);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Super Admin Check
  const isSuperAdmin = currentUser.isSuperAdmin === true;

  // Developer Edit State
  const [isEditDeveloperOpen, setIsEditDeveloperOpen] = useState(false);
  const [devName, setDevName] = useState('');
  const [devAddress, setDevAddress] = useState('');
  const [devPhone, setDevPhone] = useState('');
  const [devFacebook, setDevFacebook] = useState('');
  const [devPhoto, setDevPhoto] = useState('');
  const [devBio, setDevBio] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  // Terms Edit State
  const [isEditTermsOpen, setIsEditTermsOpen] = useState(false);
  const [editTerms, setEditTerms] = useState<Terms | null>(null);
  const [termsLoading, setTermsLoading] = useState(false);

  // Add Investment Modal State
  const [isAddInvOpen, setIsAddInvOpen] = useState(false);
  const [newInvTitle, setNewInvTitle] = useState('');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvProfit, setNewInvProfit] = useState('');
  const [newInvDate, setNewInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invLoading, setInvLoading] = useState(false);

  // Receive Investment Modal State
  const [isReceiveInvOpen, setIsReceiveInvOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [receiveLoading, setReceiveLoading] = useState(false);

  // Add Contact Modal State
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactPhoto, setNewContactPhoto] = useState('');
  const [newContactBkash, setNewContactBkash] = useState('');
  const [newContactNagad, setNewContactNagad] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  // Add Cash Entry Modal State
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [newCashTitle, setNewCashTitle] = useState('');
  const [newCashAmount, setNewCashAmount] = useState('');
  const [newCashType, setNewCashType] = useState<'in' | 'out'>('in');
  const [cashLoading, setCashLoading] = useState(false);

  // Add Expense Modal State
  const [isAddExpOpen, setIsAddExpOpen] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expLoading, setExpLoading] = useState(false);

  // Add Admin Modal State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Super Admin Config State
  const [isSuperConfigOpen, setIsSuperConfigOpen] = useState(false);
  const [newSuperPin, setNewSuperPin] = useState('');
  const [confirmSuperPin, setConfirmSuperPin] = useState('');
  const [newSuperPhone, setNewSuperPhone] = useState('');
  const [superConfigLoading, setSuperConfigLoading] = useState(false);

  // Document Modal State
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState<AppDocument['type']>('pdf');
  const [docLoading, setDocLoading] = useState(false);

  const handleUpdateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName || !devPhone) {
      showToast('⚠️ নাম ও ফোন নম্বর আবশ্যক');
      return;
    }
    setDevLoading(true);
    try {
      await setDoc(doc(db, 'developer', 'main'), {
        id: 'main',
        name: devName,
        address: devAddress,
        phone: devPhone,
        facebook: devFacebook,
        photo: devPhoto,
        bio: devBio,
        updated_at: new Date().toISOString()
      });
      showToast('✅ ডেভলোপার তথ্য আপডেট করা হয়েছে');
      setIsEditDeveloperOpen(false);
    } catch (e) {
      showToast('❌ আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setDevLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin' && !isSuperAdmin) {
      showToast('❌ শুধুমাত্র অ্যাডমিন এই কাজটি করতে পারেন');
      return;
    }
    if (!newAdminName || !newAdminPhone || !newAdminPin) {
      showToast('⚠️ সব ঘর পূরণ করুন');
      return;
    }
    if (newAdminPin.length !== 4) {
      showToast('⚠️ পিন অবশ্যই ৪ সংখ্যার হতে হবে');
      return;
    }
    setAdminLoading(true);
    try {
      const normPhone = normalizeDigits(newAdminPhone);
      
      // Prevent adding super admin as regular admin
      if (normPhone === settings?.super_admin_phone || normPhone === '01796369416') {
        showToast('❌ এই নম্বরটি সুপার অ্যাডমিনের জন্য সংরক্ষিত');
        setAdminLoading(false);
        return;
      }

      const pinHash = await hashPin(normPhone, newAdminPin);
      
      await setDoc(doc(db, 'admins', normPhone), {
        name: newAdminName,
        phone: normPhone,
        pin_hash: pinHash,
        role: 'admin',
        join_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      
      showToast('✅ নতুন অ্যাডমিন যোগ করা হয়েছে');
      setIsAddAdminOpen(false);
      setNewAdminName('');
      setNewAdminPhone('');
      setNewAdminPin('');
    } catch (e) {
      showToast('❌ অ্যাডমিন যোগ করতে সমস্যা হয়েছে');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (currentUser.role !== 'admin' && !isSuperAdmin) {
      showToast('❌ শুধুমাত্র অ্যাডমিন এই কাজটি করতে পারেন');
      return;
    }
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই অ্যাডমিনকে মুছতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
      showToast('✅ অ্যাডমিন মুছে ফেলা হয়েছে');
    } catch (e) {
      showToast('❌ মুছতে সমস্যা হয়েছে');
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvTitle || !newInvAmount || !newInvProfit) {
      showToast('⚠️ সব ঘর পূরণ করুন');
      return;
    }
    setInvLoading(true);
    try {
      await addDoc(collection(db, 'investments'), {
        title: newInvTitle,
        amount: Number(newInvAmount),
        profit: Number(newInvProfit),
        expected_return: Number(newInvAmount) + Number(newInvProfit),
        invest_date: newInvDate,
        status: 'active',
        created_at: new Date().toISOString()
      });
      showToast('✅ বিনিয়োগ যোগ করা হয়েছে');
      setIsAddInvOpen(false);
      setNewInvTitle('');
      setNewInvAmount('');
      setNewInvProfit('');
    } catch (e) {
      showToast('❌ বিনিয়োগ যোগ করতে সমস্যা হয়েছে');
    } finally {
      setInvLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone || !newContactRole) {
      showToast('⚠️ সব ঘর পূরণ করুন');
      return;
    }
    setContactLoading(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        name: newContactName,
        phone: newContactPhone,
        position: newContactRole,
        address: newContactAddress,
        photo: newContactPhoto,
        bkash: newContactBkash,
        nagad: newContactNagad,
        created_at: new Date().toISOString()
      });
      showToast('✅ কন্টাক্ট যোগ করা হয়েছে');
      setIsAddContactOpen(false);
      resetContactForm();
    } catch (e) {
      showToast('❌ কন্টাক্ট যোগ করতে সমস্যা হয়েছে');
    } finally {
      setContactLoading(false);
    }
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setNewContactName(contact.name);
    setNewContactPhone(contact.phone);
    setNewContactRole(contact.position || contact.role || '');
    setNewContactAddress(contact.address || '');
    setNewContactPhoto(contact.photo || '');
    setNewContactBkash(contact.bkash || '');
    setNewContactNagad(contact.nagad || '');
    setIsEditContactOpen(true);
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    if (!newContactName || !newContactPhone || !newContactRole) {
      showToast('⚠️ সব ঘর পূরণ করুন');
      return;
    }
    setContactLoading(true);
    try {
      await updateDoc(doc(db, 'contacts', editingContact.id), {
        name: newContactName,
        phone: newContactPhone,
        position: newContactRole,
        address: newContactAddress,
        photo: newContactPhoto,
        bkash: newContactBkash,
        nagad: newContactNagad
      });
      showToast('✅ কন্টাক্ট আপডেট করা হয়েছে');
      setIsEditContactOpen(false);
      resetContactForm();
    } catch (e) {
      showToast('❌ আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই কন্টাক্টটি মুছতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'contacts', id));
      showToast('✅ কন্টাক্ট মুছে ফেলা হয়েছে');
    } catch (e) {
      showToast('❌ মুছতে সমস্যা হয়েছে');
    }
  };

  const resetContactForm = () => {
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRole('');
    setNewContactAddress('');
    setNewContactPhoto('');
    setNewContactBkash('');
    setNewContactNagad('');
    setEditingContact(null);
  };

  const handleAddCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCashTitle || !newCashAmount) {
      showToast('⚠️ সব ঘর পূরণ করুন');
      return;
    }
    setCashLoading(true);
    try {
      await addDoc(collection(db, 'cash_entries'), {
        title: newCashTitle,
        amount: Number(newCashAmount),
        type: newCashType,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });
      showToast('✅ ক্যাশ এন্ট্রি যোগ করা হয়েছে');
      setIsAddCashOpen(false);
      setNewCashTitle('');
      setNewCashAmount('');
    } catch (e) {
      showToast('❌ ক্যাশ এন্ট্রি যোগ করতে সমস্যা হয়েছে');
    } finally {
      setCashLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle || !newExpAmount) {
      showToast('⚠️ সব ঘর পূরণ করুন');
      return;
    }
    setExpLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        title: newExpTitle,
        amount: Number(newExpAmount),
        date: newExpDate,
        created_at: new Date().toISOString()
      });
      showToast('✅ খরচ যোগ করা হয়েছে');
      setIsAddExpOpen(false);
      setNewExpTitle('');
      setNewExpAmount('');
    } catch (e) {
      showToast('❌ খরচ যোগ করতে সমস্যা হয়েছে');
    } finally {
      setExpLoading(false);
    }
  };

  // Notification form state
  const [notifSubject, setNotifSubject] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifSubject || !notifBody) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        title: notifSubject,
        body: notifBody,
        target: notifTarget,
        sent_at: new Date().toISOString(),
        sent_by: currentUser.id,
        read_by: []
      });
      setNotifSubject('');
      setNotifBody('');
      showToast('✅ বিজ্ঞপ্তি পাঠানো হয়েছে');
    } catch (e) {
      showToast('❌ বিজ্ঞপ্তি পাঠানো ব্যর্থ হয়েছে');
    }
  };

  const handleSuperConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    if (!newSuperPin || !confirmSuperPin || !newSuperPhone) {
      showToast('⚠️ সকল তথ্য পূরণ করুন');
      return;
    }
    if (newSuperPin.length !== 4) {
      showToast('⚠️ পিন অবশ্যই ৪ সংখ্যার হতে হবে');
      return;
    }
    if (newSuperPin !== confirmSuperPin) {
      showToast('⚠️ পিন দুটি মেলেনি');
      return;
    }

    setSuperConfigLoading(true);
    try {
      const normPhone = normalizeDigits(newSuperPhone);
      const pinHash = await hashPin(normPhone, newSuperPin);
      
      await updateDoc(doc(db, 'settings', 'main'), {
        super_admin_phone: normPhone,
        super_admin_pin_hash: pinHash
      });
      
      showToast('✅ সুপার এডমিন তথ্য আপডেট হয়েছে');
      setIsSuperConfigOpen(false);
      setNewSuperPin('');
      setConfirmSuperPin('');
      setNewSuperPhone('');
    } catch (error) {
      console.error(error);
      showToast('❌ আপডেট ব্যর্থ হয়েছে');
    } finally {
      setSuperConfigLoading(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle || !newDocUrl) {
      showToast('⚠️ সব ঘর পূরণ করুন');
      return;
    }
    setDocLoading(true);
    try {
      await addDoc(collection(db, 'documents'), {
        title: newDocTitle,
        url: newDocUrl,
        type: newDocType,
        created_at: new Date().toISOString(),
        created_by: currentUser.id
      });
      showToast('✅ ডকুমেন্ট সফলভাবে যোগ করা হয়েছে');
      setIsAddDocOpen(false);
      setNewDocTitle('');
      setNewDocUrl('');
    } catch (e) {
      showToast('❌ ডকুমেন্ট যোগ করতে সমস্যা হয়েছে');
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই ডকুমেন্টটি মুছতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
      showToast('✅ ডকুমেন্ট মুছে ফেলা হয়েছে');
    } catch (e) {
      showToast('❌ মুছতে সমস্যা হয়েছে');
    }
  };

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

    const unsubContacts = onSnapshot(collection(db, 'contacts'), (snap) => {
      setContacts(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contacts'));

    const unsubCash = onSnapshot(collection(db, 'cash_entries'), (snap) => {
      setCashEntries(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'cash_entries'));

    const unsubTerms = onSnapshot(doc(db, 'settings', 'terms'), (docSnap) => {
      if (docSnap.exists()) {
        setTerms(docSnap.data() as Terms);
      } else {
        const defaultTerms: Terms = {
          membership: ['ফাউন্ডেশনের সদস্য হতে হলে নির্ধারিত ফি প্রদান করতে হবে।', 'নিয়মিত মাসিক জমা দিতে হবে।'],
          deposit: ['প্রতি মাসের ১০ তারিখের মধ্যে মাসিক জমা দিতে হবে।', 'দেরি হলে জরিমানা প্রযোজ্য হতে পারে।'],
          loan: ['ঋণ গ্রহণের ক্ষেত্রে নির্দিষ্ট শর্তাবলী প্রযোজ্য হবে।', 'কিস্তি সময়মতো পরিশোধ করতে হবে।'],
          governance: ['ফাউন্ডেশনের সকল সিদ্ধান্ত সংখ্যাগরিষ্ঠের মতামতে নেওয়া হবে।'],
          special: 'বিশেষ প্রয়োজনে অ্যাডমিনের সাথে যোগাযোগ করুন।'
        };
        setDoc(doc(db, 'settings', 'terms'), defaultTerms).catch(console.error);
        setTerms(defaultTerms);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/terms'));

    const unsubDev = onSnapshot(doc(db, 'developer', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DeveloperInfo;
        setDeveloper(data);
        setDevName(data.name || '');
        setDevAddress(data.address || '');
        setDevPhone(data.phone || '');
        setDevFacebook(data.facebook || '');
        setDevPhoto(data.photo || '');
        setDevBio(data.bio || '');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'developer/main'));

    const unsubDocs = onSnapshot(collection(db, 'documents'), (snap) => {
      setDocuments(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppDocument)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'documents'));

    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'members'));

    setLoading(false);
    return () => {
      unsubSettings(); unsubAdmins(); unsubInv(); unsubExp(); unsubContacts(); unsubCash(); unsubTerms(); unsubDev(); unsubDocs(); unsubMembers();
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

  const handleReceiveInvestment = (inv: Investment) => {
    setSelectedInv(inv);
    setReceivedAmount((inv.amount + inv.profit).toString());
    setIsReceiveInvOpen(true);
  };

  const confirmReceiveInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !receivedAmount) return;
    
    const amount = Number(receivedAmount);
    if (isNaN(amount)) {
      showToast('❌ সঠিক অংক লিখুন');
      return;
    }

    setReceiveLoading(true);
    try {
      await updateDoc(doc(db, 'investments', selectedInv.id), {
        status: 'received',
        received_amount: amount,
        received_date: new Date().toISOString().split('T')[0]
      });
      showToast('✅ বিনিয়োগের টাকা ফান্ডে যোগ হয়েছে');
      setIsReceiveInvOpen(false);
      setSelectedInv(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `investments/${selectedInv.id}`);
      showToast('❌ আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleSaveTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTerms) return;
    setTermsLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'terms'), editTerms);
      showToast('✅ শর্তাবলী সংরক্ষিত হয়েছে');
      setIsEditTermsOpen(false);
    } catch (e) {
      showToast('❌ সেভ করতে সমস্যা হয়েছে');
    } finally {
      setTermsLoading(false);
    }
  };

  const updateTermItem = (category: keyof Terms, index: number, value: string) => {
    if (!editTerms) return;
    const current = editTerms[category];
    if (Array.isArray(current)) {
      const updated = [...current];
      updated[index] = value;
      setEditTerms({ ...editTerms, [category]: updated });
    }
  };

  const addTermItem = (category: keyof Terms) => {
    if (!editTerms) return;
    const current = editTerms[category];
    if (Array.isArray(current)) {
      setEditTerms({ ...editTerms, [category]: [...current, ''] });
    }
  };

  const removeTermItem = (category: keyof Terms, index: number) => {
    if (!editTerms) return;
    const current = editTerms[category];
    if (Array.isArray(current)) {
      const updated = current.filter((_, i) => i !== index);
      setEditTerms({ ...editTerms, [category]: updated });
    }
  };

  const fmt = (num: number) => Math.round(num).toLocaleString('en-IN');

  return (
    <div className="space-y-4 pb-10">
      <h3 className="font-serif text-base font-bold flex items-center gap-2">
        ⚙️ সেটিংস
      </h3>

      {/* My Profile Section for Admin */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 overflow-hidden bg-white">
              {currentUser.photo ? (
                <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                  {currentUser.name[0]}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-app-text-primary">{currentUser.name}</h4>
              <p className="text-[10px] text-app-text-muted font-medium">{currentUser.isSuperAdmin ? 'সুপার অ্যাডমিন প্রোফাইল' : 'অ্যাডমিন প্রোফাইল'}</p>
            </div>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            className="h-8 px-4 rounded-full text-[11px] font-bold shadow-sm"
            onClick={() => onAction('goto_mypage')}
          >
            👤 আমার পেজ
          </Button>
        </div>
      </Card>

      {/* Super Admin Section */}
      {isSuperAdmin && (
        <Card className="p-5 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg font-bold text-app-text-primary">সুপার এডমিন প্যানেল</h3>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-2xl border border-app-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-app-text-primary">ডেভলোপার তথ্য</p>
                  <p className="text-[10px] text-app-text-muted font-medium">অ্যাপের ডেভলোপার ইনফো পরিবর্তন করুন</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditDeveloperOpen(true)}>
                <Edit2 className="w-4 h-4 mr-1" /> সম্পাদনা
              </Button>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-app-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-app-text-primary">সুপার এডমিন কনফিগারেশন</p>
                  <p className="text-[10px] text-app-text-muted font-medium">লগইন ফোন ও পিন পরিবর্তন করুন</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setNewSuperPhone(settings?.super_admin_phone || '');
                setIsSuperConfigOpen(true);
              }}>
                <Edit2 className="w-4 h-4 mr-1" /> পরিবর্তন
              </Button>
            </div>
          </div>
        </Card>
      )}

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
          {(isSuperAdmin || currentUser.role === 'admin') && (
            <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]" onClick={() => setIsAddAdminOpen(true)}>
              <Plus className="w-3 h-3" /> যোগ করুন
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {(() => {
            const superAdminProfile = admins.find(a => a.isSuperAdmin || (settings?.super_admin_phone && a.phone === settings.super_admin_phone));
            return (
              <div className="flex items-center gap-3 p-2 bg-app-bg-secondary rounded-xl">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-purple-200">
                  {superAdminProfile?.photo ? (
                    <img src={superAdminProfile.photo} alt="Super Admin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    'স'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">সুপার অ্যাডমিন <span className="text-[8px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full ml-1">সুপার</span></div>
                  <div className="text-[10px] text-app-text-muted">📞 {settings?.super_admin_phone || '(যেকোনো ফোন)'}</div>
                </div>
              </div>
            );
          })()}
          {admins.filter(a => !a.isSuperAdmin && a.phone !== settings?.super_admin_phone).map(a => (
            <div key={a.id} className="flex items-center gap-3 p-2 bg-app-bg-secondary rounded-xl">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-primary/20">
                {a.photo ? (
                  <img src={a.photo} alt={a.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  a.name[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{a.name} {a.id === currentUser.id && <span className="text-[8px] bg-green-100 text-primary px-1.5 py-0.5 rounded-full ml-1">আমি</span>}</div>
                <div className="text-[10px] text-app-text-muted">📞 {a.phone}</div>
              </div>
              {(isSuperAdmin || currentUser.role === 'admin') && (
                <button onClick={() => handleDeleteAdmin(a.id)} className="p-2 text-danger active:scale-90 transition-all">
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
          <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]" onClick={() => setIsAddInvOpen(true)}>
            <Plus className="w-3 h-3" /> যোগ করুন
          </Button>
        </div>
        <div className="space-y-2">
          {investments.length === 0 ? (
            <div className="text-center py-4 text-app-text-muted text-xs italic">কোনো বিনিয়োগ নেই</div>
          ) : (
            investments.map(i => (
              <div key={i.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs font-bold">{i.title}</div>
                  <div className="flex gap-2 items-center">
                    <span className={cn(
                      "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                      i.status === 'active' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                    )}>
                      {i.status === 'active' ? '🔵 চলমান' : '✅ সম্পন্ন'}
                    </span>
                    {i.status === 'active' && (
                      <button 
                        onClick={() => handleReceiveInvestment(i)}
                        className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-md font-bold active:scale-95 transition-all"
                      >
                        বুঝে পেয়েছি
                      </button>
                    )}
                  </div>
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

      {/* Add Investment Modal */}
      <Modal isOpen={isAddInvOpen} onClose={() => setIsAddInvOpen(false)} title="📈 নতুন বিনিয়োগ যোগ করুন">
        <form onSubmit={handleAddInvestment} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">বিনিয়োগের নাম *</label>
            <input 
              type="text" 
              value={newInvTitle}
              onChange={(e) => setNewInvTitle(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="যেমন: জমি ক্রয়"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">বিনিয়োগের পরিমাণ (৳) *</label>
              <input 
                type="number" 
                value={newInvAmount}
                onChange={(e) => setNewInvAmount(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="৫০০০"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">সম্ভাব্য লাভ (৳) *</label>
              <input 
                type="number" 
                value={newInvProfit}
                onChange={(e) => setNewInvProfit(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="১০০০"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">বিনিয়োগের তারিখ *</label>
            <input 
              type="date" 
              value={newInvDate}
              onChange={(e) => setNewInvDate(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddInvOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={invLoading}>✅ বিনিয়োগ যোগ করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Receive Investment Modal */}
      <Modal isOpen={isReceiveInvOpen} onClose={() => setIsReceiveInvOpen(false)} title="💰 বিনিয়োগ ফেরত গ্রহণ">
        <form onSubmit={confirmReceiveInvestment} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-2">
            <div className="text-xs font-bold text-blue-800">{selectedInv?.title}</div>
            <div className="text-[10px] text-blue-600">মূল বিনিয়োগ: ৳{selectedInv ? fmt(selectedInv.amount) : 0}</div>
            <div className="text-[10px] text-blue-600">সম্ভাব্য লাভ: ৳{selectedInv ? fmt(selectedInv.profit) : 0}</div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">কত টাকা লাভসহ ফেরত পেয়েছেন? *</label>
            <input 
              type="number" 
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="৬০০০"
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsReceiveInvOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={receiveLoading}>✅ বুঝে পেয়েছি</Button>
          </div>
        </form>
      </Modal>

      {/* Contacts / Persons in Charge */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-primary" /> ফান্ডে দায়িত্বরত ব্যক্তি
          </div>
          <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]" onClick={() => setIsAddContactOpen(true)}>
            <Plus className="w-3 h-3" /> যোগ করুন
          </Button>
        </div>
        <div className="space-y-2">
          {contacts.length === 0 ? (
            <div className="text-center py-4 text-app-text-muted text-xs italic">কেউ যোগ করা হয়নি</div>
          ) : (
            contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 bg-app-bg-secondary rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {c.photo ? <img src={c.photo} className="w-full h-full rounded-full object-cover" /> : c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{c.name}</div>
                  <div className="text-[10px] text-primary font-bold">{c.position || c.role}</div>
                  <div className="text-[10px] text-app-text-muted">📞 {c.phone}</div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEditContact(c)}
                    className="p-2 text-app-text-muted active:scale-90 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-2 text-danger active:scale-90 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Contact Modal */}
      <Modal isOpen={isAddContactOpen} onClose={() => { setIsAddContactOpen(false); resetContactForm(); }} title="👤 নতুন কন্টাক্ট যোগ করুন">
        <form onSubmit={handleAddContact} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নাম *</label>
              <input 
                type="text" 
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="যেমন: আব্দুর রহমান"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পদবী/দায়িত্ব *</label>
              <input 
                type="text" 
                value={newContactRole}
                onChange={(e) => setNewContactRole(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="যেমন: ক্যাশিয়ার"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফোন নম্বর *</label>
              <input 
                type="text" 
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="017XXXXXXXX"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ঠিকানা</label>
              <input 
                type="text" 
                value={newContactAddress}
                onChange={(e) => setNewContactAddress(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="গ্রাম, ডাকঘর, উপজেলা"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফটো (গ্যালারি থেকে)</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-app-bg-secondary border-2 border-dashed border-app-border flex items-center justify-center overflow-hidden shrink-0">
                  {newContactPhoto ? (
                    <img src={newContactPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-app-text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    id="contactPhotoAdd" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 800000) {
                          showToast('⚠️ ছবির সাইজ ৮০০ কেবির কম হতে হবে');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewContactPhoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="contactPhotoAdd"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-app-border rounded-xl text-xs font-bold cursor-pointer hover:border-primary transition-all active:scale-95"
                  >
                    <CloudUpload className="w-4 h-4 text-primary" /> ফটো সিলেক্ট করুন
                  </label>
                  {newContactPhoto && (
                    <button 
                      type="button"
                      onClick={() => setNewContactPhoto('')}
                      className="ml-2 text-[10px] text-danger font-bold"
                    >
                      মুছে ফেলুন
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">বিকাশ নম্বর</label>
                <input 
                  type="text" 
                  value={newContactBkash}
                  onChange={(e) => setNewContactBkash(e.target.value)}
                  className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নগদ নম্বর</label>
                <input 
                  type="text" 
                  value={newContactNagad}
                  onChange={(e) => setNewContactNagad(e.target.value)}
                  className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-2">
            <Button variant="gray" className="flex-1" onClick={() => { setIsAddContactOpen(false); resetContactForm(); }}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={contactLoading}>✅ কন্টাক্ট যোগ করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal isOpen={isEditContactOpen} onClose={() => { setIsEditContactOpen(false); resetContactForm(); }} title="📝 কন্টাক্ট সম্পাদনা">
        <form onSubmit={handleUpdateContact} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নাম *</label>
              <input 
                type="text" 
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পদবী/দায়িত্ব *</label>
              <input 
                type="text" 
                value={newContactRole}
                onChange={(e) => setNewContactRole(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফোন নম্বর *</label>
              <input 
                type="text" 
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ঠিকানা</label>
              <input 
                type="text" 
                value={newContactAddress}
                onChange={(e) => setNewContactAddress(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফটো (গ্যালারি থেকে)</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-app-bg-secondary border-2 border-dashed border-app-border flex items-center justify-center overflow-hidden shrink-0">
                  {newContactPhoto ? (
                    <img src={newContactPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-app-text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    id="contactPhotoEdit" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 800000) {
                          showToast('⚠️ ছবির সাইজ ৮০০ কেবির কম হতে হবে');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewContactPhoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="contactPhotoEdit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-app-border rounded-xl text-xs font-bold cursor-pointer hover:border-primary transition-all active:scale-95"
                  >
                    <CloudUpload className="w-4 h-4 text-primary" /> ফটো পরিবর্তন করুন
                  </label>
                  {newContactPhoto && (
                    <button 
                      type="button"
                      onClick={() => setNewContactPhoto('')}
                      className="ml-2 text-[10px] text-danger font-bold"
                    >
                      মুছে ফেলুন
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">বিকাশ নম্বর</label>
                <input 
                  type="text" 
                  value={newContactBkash}
                  onChange={(e) => setNewContactBkash(e.target.value)}
                  className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নগদ নম্বর</label>
                <input 
                  type="text" 
                  value={newContactNagad}
                  onChange={(e) => setNewContactNagad(e.target.value)}
                  className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-2">
            <Button variant="gray" className="flex-1" onClick={() => { setIsEditContactOpen(false); resetContactForm(); }}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={contactLoading}>💾 সংরক্ষণ করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Notifications */}
      <Card>
        <div className="text-sm font-bold mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" /> বিজ্ঞপ্তি পাঠান
        </div>
        <form onSubmit={handleSendNotification} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-app-text-secondary mb-1 block">প্রাপক *</label>
            <select 
              value={notifTarget}
              onChange={(e) => setNotifTarget(e.target.value)}
              className="w-full p-2.5 border-2 border-app-border rounded-xl text-xs outline-none focus:border-primary transition-all"
            >
              <option value="all">📢 সকল সদস্য</option>
              <optgroup label="👤 নির্দিষ্ট সদস্য">
                {members.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phone})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-app-text-secondary mb-1 block">বিষয় *</label>
            <input 
              type="text" 
              value={notifSubject}
              onChange={(e) => setNotifSubject(e.target.value)}
              className="w-full p-2.5 border-2 border-app-border rounded-xl text-xs outline-none focus:border-primary transition-all" 
              placeholder="যেমন: মাসিক সভার বিজ্ঞপ্তি"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-app-text-secondary mb-1 block">বিস্তারিত বার্তা *</label>
            <textarea 
              rows={3}
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              className="w-full p-2.5 border-2 border-app-border rounded-xl text-xs outline-none focus:border-primary transition-all resize-none" 
              placeholder="বিজ্ঞপ্তির বিস্তারিত লিখুন..."
            />
          </div>
          <Button type="submit" className="w-full h-10 text-xs">
            <Send className="w-3.5 h-3.5 mr-2" /> বিজ্ঞপ্তি পাঠান
          </Button>
        </form>
      </Card>

      {/* Super Admin Configuration */}
      {isSuperAdmin && (
        <Card className="border-amber-200 bg-amber-50/30">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-bold flex items-center gap-2 text-amber-700">
              <ShieldCheck className="w-4 h-4" /> সুপার এডমিন কনফিগারেশন
            </div>
            <Button 
              size="sm" 
              variant="primary" 
              className="h-8 px-3 rounded-lg text-[10px] bg-amber-600 hover:bg-amber-700 border-none"
              onClick={() => {
                setNewSuperPhone(settings?.super_admin_phone || '');
                setIsSuperConfigOpen(true);
              }}
            >
              <Settings2 className="w-3 h-3 mr-1" /> পরিবর্তন
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] p-2 bg-white rounded-lg border border-amber-100">
              <span className="text-app-text-muted">লগইন ফোন:</span>
              <span className="font-bold text-amber-700">{settings?.super_admin_phone || 'ডিফল্ট'}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] p-2 bg-white rounded-lg border border-amber-100">
              <span className="text-app-text-muted">লগইন পিন:</span>
              <span className="font-bold text-amber-700">••••</span>
            </div>
          </div>
          <div className="mt-3 text-[9px] text-amber-600 italic leading-tight">
            * এটি শুধুমাত্র সুপার এডমিনের জন্য দৃশ্যমান। এখান থেকে সুপার এডমিন লগইন ফোন ও পিন পরিবর্তন করা যাবে।
          </div>
        </Card>
      )}

      {/* Terms & Conditions */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> শর্তাবলী সম্পাদনা
          </div>
          <Button 
            size="sm" 
            variant="primary" 
            className="h-8 px-3 rounded-lg text-[10px]"
            onClick={() => { setEditTerms(terms); setIsEditTermsOpen(true); }}
          >
            <Edit2 className="w-3 h-3" /> সম্পাদনা
          </Button>
        </div>
        <div className="text-[10px] text-app-text-muted italic">থ্রি-ডট মেনুতে যা সদস্যরা দেখবেন</div>
      </Card>

      {/* Document Management */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> ডকুমেন্টস ব্যবস্থাপনা
          </div>
          <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]" onClick={() => setIsAddDocOpen(true)}>
            <Plus className="w-3 h-3" /> যোগ করুন
          </Button>
        </div>
        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="text-center py-4 text-app-text-muted text-xs italic">কোনো ডকুমেন্ট নেই</div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-2 bg-app-bg-secondary rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{doc.title}</div>
                  <div className="text-[9px] text-app-text-muted uppercase">{doc.type} • {new Date(doc.created_at).toLocaleDateString('bn-BD')}</div>
                </div>
                <div className="flex gap-1">
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-primary active:scale-90 transition-all"
                  >
                    <TrendingUp className="w-4 h-4 rotate-45" />
                  </a>
                  <button 
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-danger active:scale-90 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Super Admin Config Modal */}
      <Modal isOpen={isSuperConfigOpen} onClose={() => setIsSuperConfigOpen(false)} title="🔐 সুপার এডমিন কনফিগারেশন">
        <form onSubmit={handleSuperConfig} className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-700 leading-relaxed">
            ℹ️ এখান থেকে সুপার এডমিনের লগইন ফোন নম্বর এবং পিন পরিবর্তন করা যাবে। পিন অবশ্যই ৪ সংখ্যার হতে হবে।
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">সুপার এডমিন ফোন নম্বর *</label>
            <input 
              type="text" 
              value={newSuperPhone}
              onChange={(e) => setNewSuperPhone(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">নতুন পিন কোড *</label>
            <input 
              type="password" 
              value={newSuperPin}
              onChange={(e) => setNewSuperPin(e.target.value)}
              maxLength={4}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="৪ সংখ্যার পিন"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পিন নিশ্চিত করুন *</label>
            <input 
              type="password" 
              value={confirmSuperPin}
              onChange={(e) => setConfirmSuperPin(e.target.value)}
              maxLength={4}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="পুনরায় লিখুন"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsSuperConfigOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={superConfigLoading}>💾 সংরক্ষণ করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Add Document Modal */}
      <Modal isOpen={isAddDocOpen} onClose={() => setIsAddDocOpen(false)} title="📄 নতুন ডকুমেন্ট যোগ করুন">
        <form onSubmit={handleAddDocument} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ডকুমেন্টের নাম *</label>
            <input 
              type="text" 
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="যেমন: ফাউন্ডেশনের গঠনতন্ত্র"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ডকুমেন্ট লিংক (URL) *</label>
            <input 
              type="url" 
              value={newDocUrl}
              onChange={(e) => setNewDocUrl(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ডকুমেন্টের ধরন</label>
            <select 
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value as any)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all"
            >
              <option value="pdf">📄 PDF ফাইল</option>
              <option value="image">🖼️ ছবি</option>
              <option value="link">🔗 ওয়েব লিংক</option>
              <option value="other">📁 অন্যান্য</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddDocOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={docLoading}>✅ ডকুমেন্ট যোগ করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Terms Modal */}
      <Modal isOpen={isEditTermsOpen} onClose={() => setIsEditTermsOpen(false)} title="📝 শর্তাবলী সম্পাদনা" size="lg">
        <form onSubmit={handleSaveTerms} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
          {(['membership', 'deposit', 'loan', 'governance'] as const).map(cat => (
            <div key={cat} className="space-y-3 p-3 bg-app-bg-secondary rounded-xl">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-primary capitalize">
                  {cat === 'membership' ? 'সদস্যপদ' : cat === 'deposit' ? 'সঞ্চয়' : cat === 'loan' ? 'ঋণ' : 'পরিচালনা'}
                </h4>
                <button 
                  type="button" 
                  onClick={() => addTermItem(cat)}
                  className="text-[10px] text-primary flex items-center gap-1 font-bold"
                >
                  <Plus className="w-3 h-3" /> নতুন পয়েন্ট
                </button>
              </div>
              <div className="space-y-2">
                {editTerms?.[cat].map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <textarea 
                      value={item}
                      onChange={(e) => updateTermItem(cat, idx, e.target.value)}
                      className="flex-1 p-2 text-xs border border-app-border rounded-lg outline-none focus:border-primary resize-none"
                      rows={2}
                    />
                    <button 
                      type="button" 
                      onClick={() => removeTermItem(cat, idx)}
                      className="p-2 text-danger active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-3 bg-app-bg-secondary rounded-xl">
            <label className="text-xs font-bold text-primary block mb-2">বিশেষ দ্রষ্টব্য</label>
            <textarea 
              value={editTerms?.special || ''}
              onChange={(e) => setEditTerms(s => s ? { ...s, special: e.target.value } : null)}
              className="w-full p-2 text-xs border border-app-border rounded-lg outline-none focus:border-primary resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsEditTermsOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={termsLoading}>💾 সংরক্ষণ করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Developer Edit Modal */}
      <Modal isOpen={isEditDeveloperOpen} onClose={() => setIsEditDeveloperOpen(false)} title="👨‍💻 ডেভলোপার তথ্য সম্পাদনা">
        <form onSubmit={handleUpdateDeveloper} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ডেভলোপার নাম *</label>
              <input 
                type="text" 
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="নাম লিখুন"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ঠিকানা</label>
              <input 
                type="text" 
                value={devAddress}
                onChange={(e) => setDevAddress(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="ঠিকানা লিখুন"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফোন নম্বর *</label>
              <input 
                type="text" 
                value={devPhone}
                onChange={(e) => setDevPhone(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="০১৭XXXXXXXX"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফেসবুক প্রোফাইল লিংক</label>
              <input 
                type="url" 
                value={devFacebook}
                onChange={(e) => setDevFacebook(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">বায়ো (Bio)</label>
              <textarea 
                value={devBio}
                onChange={(e) => setDevBio(e.target.value)}
                className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all h-24 resize-none" 
                placeholder="ডেভলোপার সম্পর্কে কিছু লিখুন..."
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফটো (গ্যালারি থেকে)</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-app-bg-secondary border-2 border-dashed border-app-border flex items-center justify-center overflow-hidden shrink-0">
                  {devPhoto ? (
                    <img src={devPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-app-text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    id="devPhotoInput" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 800000) {
                          showToast('⚠️ ছবির সাইজ ৮০০ কেবির কম হতে হবে');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setDevPhoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="devPhotoInput"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-app-border rounded-xl text-xs font-bold cursor-pointer hover:border-primary transition-all active:scale-95"
                  >
                    <CloudUpload className="w-4 h-4 text-primary" /> ফটো সিলেক্ট করুন
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsEditDeveloperOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={devLoading}>✅ তথ্য আপডেট করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Cash Fund Addition */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold flex items-center gap-2">
            <Banknote className="w-4 h-4 text-green-600" /> নগদ টাকা ফান্ডে যোগ
          </div>
          <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]" onClick={() => setIsAddCashOpen(true)}>
            <Plus className="w-3 h-3" /> যোগ করুন
          </Button>
        </div>
        <div className="text-[10px] text-app-text-muted mb-3">কোনো সদস্যের না এমন নগদ টাকা সরাসরি ফান্ডে যোগ করুন। চাইলে সদস্যদের মধ্যে ভাগও করতে পারবেন।</div>
        <div className="space-y-2">
          {cashEntries.length === 0 ? (
            <div className="text-center py-4 text-app-text-muted text-xs italic">কোনো এন্ট্রি নেই</div>
          ) : (
            cashEntries.map(e => (
              <div key={e.id} className="p-2.5 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold">{e.title}</div>
                  <div className="text-[9px] text-app-text-muted">{e.date}</div>
                </div>
                <div className="text-xs font-black text-green-600">৳{fmt(e.amount)}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Cash Entry Modal */}
      <Modal isOpen={isAddCashOpen} onClose={() => setIsAddCashOpen(false)} title="💵 নতুন ক্যাশ এন্ট্রি">
        <form onSubmit={handleAddCashEntry} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">বিবরণ *</label>
            <input 
              type="text" 
              value={newCashTitle}
              onChange={(e) => setNewCashTitle(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="যেমন: অনুদান"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পরিমাণ (৳) *</label>
            <input 
              type="number" 
              value={newCashAmount}
              onChange={(e) => setNewCashAmount(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="৫০০"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddCashOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={cashLoading}>✅ এন্ট্রি যোগ করুন</Button>
          </div>
        </form>
      </Modal>

      {/* Expense Management */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-danger" /> খরচ ব্যবস্থাপনা
          </div>
          <Button size="sm" variant="primary" className="h-8 px-3 rounded-lg text-[10px]" onClick={() => setIsAddExpOpen(true)}>
            <Plus className="w-3 h-3" /> যোগ করুন
          </Button>
        </div>
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="text-center py-4 text-app-text-muted text-xs italic">কোনো খরচ নেই</div>
          ) : (
            expenses.map(e => (
              <div key={e.id} className="p-2.5 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold">{e.title}</div>
                  <div className="text-[9px] text-app-text-muted">{e.date}</div>
                </div>
                <div className="text-xs font-black text-danger">৳{fmt(e.amount)}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Expense Modal */}
      <Modal isOpen={isAddExpOpen} onClose={() => setIsAddExpOpen(false)} title="💸 নতুন খরচ যোগ করুন">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">খরচের বিবরণ *</label>
            <input 
              type="text" 
              value={newExpTitle}
              onChange={(e) => setNewExpTitle(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="যেমন: অফিস ভাড়া"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পরিমাণ (৳) *</label>
            <input 
              type="number" 
              value={newExpAmount}
              onChange={(e) => setNewExpAmount(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="৫০০"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">তারিখ *</label>
            <input 
              type="date" 
              value={newExpDate}
              onChange={(e) => setNewExpDate(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddExpOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={expLoading}>✅ খরচ যোগ করুন</Button>
          </div>
        </form>
      </Modal>
      {/* Add Admin Modal */}
      <Modal isOpen={isAddAdminOpen} onClose={() => setIsAddAdminOpen(false)} title="👑 নতুন অ্যাডমিন যোগ করুন">
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">অ্যাডমিনের নাম *</label>
            <input 
              type="text" 
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="নাম লিখুন"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">ফোন নম্বর *</label>
            <input 
              type="tel" 
              value={newAdminPhone}
              onChange={(e) => setNewAdminPhone(e.target.value)}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-app-text-secondary mb-1 block">পিন কোড (৪ সংখ্যা) *</label>
            <input 
              type="password" 
              value={newAdminPin}
              onChange={(e) => setNewAdminPin(e.target.value)}
              maxLength={4}
              className="w-full p-3 border-2 border-app-border rounded-app-sm text-sm outline-none focus:border-primary transition-all" 
              placeholder="৪ সংখ্যার পিন"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="gray" className="flex-1" onClick={() => setIsAddAdminOpen(false)}>বাতিল</Button>
            <Button type="submit" className="flex-2" loading={adminLoading}>✅ অ্যাডমিন যোগ করুন</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
