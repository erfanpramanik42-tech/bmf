import React, { useState } from 'react';
import { Contact } from '../types';
import { ArrowLeft, Phone, MapPin, User, CreditCard, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { cn } from '../lib/utils';

interface OfficialsPageProps {
  officials: Contact[];
  onBack: () => void;
}

export const OfficialsPage: React.FC<OfficialsPageProps> = ({ officials, onBack }) => {
  const [selectedOfficial, setSelectedOfficial] = useState<Contact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const BKASH_LOGO = "https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png";
  const NAGAD_LOGO = "https://logos-download.com/wp-content/uploads/2022/01/Nagad_Logo.png";

  return (
    <div className="space-y-4 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-app-border active:scale-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </button>
        <div>
          <h3 className="font-serif text-lg font-bold text-app-text-primary">ফান্ডে দায়িত্বরত ব্যক্তি</h3>
          <p className="text-[9px] text-app-text-muted font-bold uppercase tracking-wider">Bondhumohol Foundation Officials</p>
        </div>
      </div>

      {/* Officials List */}
      <div className="grid grid-cols-1 gap-2.5">
        {officials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-app-border shadow-sm">
            <div className="w-12 h-12 bg-app-bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="w-6 h-6 text-app-text-muted opacity-30" />
            </div>
            <p className="text-xs text-app-text-muted font-medium italic">এখনো কেউ যোগ করা হয়নি</p>
          </div>
        ) : (
          officials.map(official => (
            <Card 
              key={official.id} 
              className="p-3 active:scale-[0.99] transition-all cursor-pointer hover:border-primary/30 relative overflow-hidden group rounded-2xl"
              onClick={() => setSelectedOfficial(official)}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/5 border-2 border-white shadow-sm shrink-0">
                  {official.photo ? (
                    <img src={official.photo} alt={official.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xl bg-primary/10">
                      {official.name[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-app-text-primary truncate">{official.name}</h4>
                  <div className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-md mb-1">
                    {official.position}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-app-text-secondary font-medium">
                      <Phone className="w-3 h-3 text-primary" /> {official.phone}
                    </div>
                    {official.bkash && (
                      <div className="flex items-center gap-1 bg-pink-50 border border-pink-100 px-1.5 py-0.5 rounded-md">
                        <img src={BKASH_LOGO} alt="bKash" className="h-2.5 object-contain" />
                        <span className="text-[8px] text-pink-700 font-bold">{official.bkash}</span>
                      </div>
                    )}
                    {official.nagad && (
                      <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md">
                        <img src={NAGAD_LOGO} alt="Nagad" className="h-2.5 object-contain" />
                        <span className="text-[8px] text-orange-700 font-bold">{official.nagad}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-7 h-7 flex items-center justify-center bg-app-bg-secondary rounded-full shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-app-text-muted" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Official Detail Modal */}
      <Modal 
        isOpen={!!selectedOfficial} 
        onClose={() => setSelectedOfficial(null)} 
        hideHeader
        noPadding
        className="rounded-[32px] overflow-hidden"
      >
        {selectedOfficial && (
          <div className="flex flex-col">
            {/* Modal Header/Cover */}
            <div className="h-32 bg-linear-to-br from-primary-dark to-primary relative">
              <button 
                onClick={() => setSelectedOfficial(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all z-20"
              >
                <ArrowLeft className="w-4 h-4 rotate-90" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-8 -mt-12 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-[32px] overflow-hidden bg-white border-4 border-white shadow-xl mb-4">
                  {selectedOfficial.photo ? (
                    <img src={selectedOfficial.photo} alt={selectedOfficial.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold text-4xl bg-primary/5">
                      {selectedOfficial.name[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <h4 className="text-xl font-black text-app-text-primary mb-1">{selectedOfficial.name}</h4>
                <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full mb-6">
                  {selectedOfficial.position}
                </div>
              </div>

              <div className="space-y-4">
                {/* Contact Info Group */}
                <div className="space-y-3">
                  <div className="group p-4 bg-app-bg-secondary rounded-2xl flex items-center justify-between border border-transparent hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-app-text-muted font-black uppercase tracking-wider">মোবাইল নম্বর</p>
                        <p className="text-sm font-bold text-app-text-primary">{selectedOfficial.phone}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCopy(selectedOfficial.phone, `phone-${selectedOfficial.id}`)}
                      className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-app-border active:scale-90 transition-all"
                    >
                      {copiedId === `phone-${selectedOfficial.id}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-app-text-muted" />}
                    </button>
                  </div>

                  {selectedOfficial.address && (
                    <div className="p-4 bg-app-bg-secondary rounded-2xl flex items-start gap-4 border border-transparent">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-app-text-muted font-black uppercase tracking-wider">বর্তমান ঠিকানা</p>
                        <p className="text-sm font-bold text-app-text-primary leading-relaxed">{selectedOfficial.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Info Group */}
                {(selectedOfficial.bkash || selectedOfficial.nagad) && (
                  <div className="pt-2">
                    <h5 className="text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-3 ml-1">পেমেন্ট মেথড</h5>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedOfficial.bkash && (
                        <div className="p-4 bg-pink-50/50 rounded-2xl flex items-center justify-between border border-pink-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm p-1.5">
                              <img src={BKASH_LOGO} alt="bKash" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-[10px] text-pink-600 font-black uppercase tracking-wider">বিকাশ পার্সোনাল</p>
                              <p className="text-sm font-bold text-pink-900">{selectedOfficial.bkash}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCopy(selectedOfficial.bkash!, `bkash-${selectedOfficial.id}`)}
                            className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-pink-100 active:scale-90 transition-all"
                          >
                            {copiedId === `bkash-${selectedOfficial.id}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-pink-400" />}
                          </button>
                        </div>
                      )}
                      {selectedOfficial.nagad && (
                        <div className="p-4 bg-orange-50/50 rounded-2xl flex items-center justify-between border border-orange-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm p-1.5">
                              <img src={NAGAD_LOGO} alt="Nagad" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-[10px] text-orange-600 font-black uppercase tracking-wider">নগদ পার্সোনাল</p>
                              <p className="text-sm font-bold text-orange-900">{selectedOfficial.nagad}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCopy(selectedOfficial.nagad!, `nagad-${selectedOfficial.id}`)}
                            className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-orange-100 active:scale-90 transition-all"
                          >
                            {copiedId === `nagad-${selectedOfficial.id}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-orange-400" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setSelectedOfficial(null)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
