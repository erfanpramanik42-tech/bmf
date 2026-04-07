import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { User } from '../types';
import { Card } from '../components/Card';
import { Cake, MapPin, Phone, Calendar, PartyPopper, Gift, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface BirthdaysProps {
  onBack: () => void;
}

export const Birthdays: React.FC<BirthdaysProps> = ({ onBack }) => {
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'members'));

    return () => unsub();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'জানানো হয়নি';
    const date = new Date(dateStr);
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });
  };

  const getMonthName = (monthIndex: number) => {
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return months[monthIndex];
  };

  const birthdayData = useMemo(() => {
    const withBirthdays = members.filter(m => m.birthday);
    
    // Sort by month and day
    const sorted = [...withBirthdays].sort((a, b) => {
      const dateA = new Date(a.birthday!);
      const dateB = new Date(b.birthday!);
      const monthDiff = dateA.getMonth() - dateB.getMonth();
      if (monthDiff !== 0) return monthDiff;
      return dateA.getDate() - dateB.getDate();
    });

    // Group by month
    const grouped: Record<number, User[]> = {};
    sorted.forEach(m => {
      const month = new Date(m.birthday!).getMonth();
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(m);
    });

    // Check if anyone has birthday today
    const today = new Date();
    const todayBirthdays = withBirthdays.filter(m => {
      const bDay = new Date(m.birthday!);
      return bDay.getDate() === today.getDate() && bDay.getMonth() === today.getMonth();
    });

    return { grouped, todayBirthdays, total: withBirthdays.length };
  }, [members]);

  return (
    <div className="w-full flex flex-col space-y-6 pb-10">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <button 
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-app-border active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <h3 className="font-serif text-base font-bold text-app-text-primary">
          🎂 সদস্যদের জন্মদিন
        </h3>
      </div>

      {/* Festive Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-pink-500 via-purple-500 to-indigo-600 p-6 mb-6 shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-4 left-10 text-4xl"
          >🎈</motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute bottom-4 right-10 text-4xl"
          >✨</motion.div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
          >🎂</motion.div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center text-white">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-3">
            <PartyPopper className="w-8 h-8 text-yellow-300" />
          </div>
          <h2 className="text-xl font-serif font-bold mb-1">সদস্যদের জন্মদিন</h2>
          <p className="text-white/80 text-xs italic">ফাউন্ডেশনের সকল বন্ধুদের বিশেষ দিন</p>
        </div>
      </div>

      {/* Today's Special */}
      <AnimatePresence>
        {birthdayData.todayBirthdays.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              <h3 className="font-bold text-app-text-primary">আজকের জন্মদিন! 🎊</h3>
            </div>
            <div className="space-y-3">
              {birthdayData.todayBirthdays.map((member) => (
                <Card key={member.id} className="relative overflow-hidden border-2 border-pink-200 bg-linear-to-r from-pink-50 to-purple-50 shadow-md">
                  <div className="absolute top-0 right-0 p-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Gift className="w-6 h-6 text-pink-500" />
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-4 p-1">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-pink-100 flex items-center justify-center text-2xl">👤</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-pink-700">{member.name}</h4>
                      <p className="text-xs text-pink-600 font-medium flex items-center gap-1">
                        <Cake className="w-3 h-3" /> শুভ জন্মদিন বন্ধু!
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <a href={`tel:${member.phone}`} className="p-1.5 bg-pink-500 text-white rounded-lg shadow-sm">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <span className="text-[10px] text-pink-600/70 font-mono">{member.phone}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly List */}
      {birthdayData.total === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-app-border">
          <div className="text-5xl mb-4 opacity-30">🎂</div>
          <p className="text-app-text-muted italic">কোনো জন্মদিনের তথ্য পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.entries(birthdayData.grouped) as unknown as [string, User[]][]).map(([monthIndex, monthMembers]) => (
            <div key={monthIndex} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-serif text-lg font-bold text-app-text-primary flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full" />
                  {getMonthName(parseInt(monthIndex))}
                </h3>
                <span className="text-[10px] font-bold bg-app-bg-secondary px-2 py-1 rounded-full text-app-text-muted">
                  {monthMembers.length} জন
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {monthMembers.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="p-3 border-none shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-app-bg-secondary shrink-0">
                          {member.photo ? (
                            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-app-text-primary truncate">{member.name}</h4>
                            <div className="flex items-center gap-1 text-primary">
                              <Calendar className="w-3 h-3" />
                              <span className="text-[11px] font-bold">{formatDate(member.birthday)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-app-text-muted">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="text-[10px] truncate max-w-[120px]">{member.address || 'ঠিকানা নেই'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-app-text-muted">
                              <Phone className="w-2.5 h-2.5" />
                              <span className="text-[10px] font-mono">{member.phone}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-app-border group-hover:text-primary transition-colors" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
