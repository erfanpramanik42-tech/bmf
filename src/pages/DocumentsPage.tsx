import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Document as AppDocument } from '../types';
import { Card } from '../components/Card';
import { FileText, Search, ArrowLeft, ChevronRight, Share2, Image as ImageIcon, ExternalLink, File as FileIcon } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface DocumentsPageProps {
  onBack: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onBack }) => {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'documents'), (snap) => {
      setDocuments(snap.docs.map(d => ({ ...d.data(), id: d.id } as AppDocument)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'documents'));

    return () => unsub();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [documents, searchQuery]);

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'link': return <ExternalLink className="w-5 h-5" />;
      default: return <FileIcon className="w-5 h-5" />;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-50 text-red-600';
      case 'image': return 'bg-blue-50 text-blue-600';
      case 'link': return 'bg-green-50 text-green-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

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
          📄 ফাউন্ডেশন ডকুমেন্টস
        </h3>
      </div>

      {/* Info Banner */}
      <div className="bg-linear-to-r from-primary/10 to-primary/5 p-4 rounded-2xl border border-primary/10 mb-6">
        <p className="text-xs text-app-text-secondary leading-relaxed">
          ফাউন্ডেশনের সকল গুরুত্বপূর্ণ ডকুমেন্টস, গঠনতন্ত্র এবং প্রয়োজনীয় ফাইলসমূহ এখানে পাওয়া যাবে।
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-sm border border-app-border mb-6 focus-within:border-primary transition-all">
        <Search className="w-4 h-4 text-app-text-muted" />
        <input 
          type="text" 
          placeholder="ডকুমেন্ট খুঁজুন..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm text-app-text-primary placeholder:text-app-text-muted"
        />
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-app-border">
          <div className="w-16 h-16 bg-app-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-app-text-muted opacity-30" />
          </div>
          <h3 className="text-sm font-bold text-app-text-secondary mb-1">কোনো ডকুমেন্ট পাওয়া যায়নি</h3>
          <p className="text-[11px] text-app-text-muted">ভিন্ন নামে খোঁজ করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc, idx) => (
            <motion.a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 p-4 bg-white border border-app-border rounded-2xl hover:border-primary hover:shadow-md transition-all group active:scale-[0.98]"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                getDocColor(doc.type),
                "group-hover:bg-primary group-hover:text-white"
              )}>
                {getDocIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-app-text-primary truncate group-hover:text-primary transition-colors">
                  {doc.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {doc.type === 'pdf' ? 'PDF' : doc.type === 'image' ? 'IMAGE' : doc.type === 'link' ? 'LINK' : 'FILE'}
                  </span>
                  <span className="w-1 h-1 bg-app-text-muted rounded-full opacity-30" />
                  <span className="text-[10px] text-app-text-muted font-medium">
                    {new Date(doc.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-app-bg-secondary flex items-center justify-center text-app-text-muted group-hover:text-primary transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
};
