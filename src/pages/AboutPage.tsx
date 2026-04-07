import React from 'react';
import { ArrowLeft, Phone, MapPin, Facebook, User, Globe, Heart } from 'lucide-react';
import { DeveloperInfo } from '../types';
import { Card } from '../components/Card';

interface AboutPageProps {
  developer: DeveloperInfo | null;
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ developer, onBack }) => {
  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-app-border active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h3 className="font-serif text-xl font-bold text-app-text-primary">অ্যাপ সম্পর্কে</h3>
          <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-wider">About Bondhumohol Foundation</p>
        </div>
      </div>

      {/* App Description */}
      <Card className="p-6 bg-linear-to-br from-primary/5 to-transparent border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-primary/10">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-app-text-primary leading-relaxed font-medium">
            বন্ধুমহল ফাউন্ডেশন একটি স্মার্ট ও প্রিমিয়াম ডিজিটাল প্ল্যাটফর্ম, যেখানে গ্রুপভিত্তিক সঞ্চয়, ঋণ ও ফান্ড ব্যবস্থাপনা সহজ, দ্রুত এবং সম্পূর্ণ স্বচ্ছভাবে পরিচালনা করা যায়।
          </p>
          <div className="mt-6 flex items-center gap-2 text-primary">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-xs font-black uppercase tracking-widest">স্মার্ট সঞ্চয়, নিরাপদ ভবিষ্যৎ 🤝</span>
          </div>
        </div>
      </Card>

      {/* Developer Info */}
      {developer && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-4 w-1 bg-primary rounded-full" />
            <h4 className="text-sm font-black text-app-text-primary uppercase tracking-wider">ডেভলোপার তথ্য</h4>
          </div>

          <Card className="overflow-hidden">
            {/* Developer Header */}
            <div className="h-24 bg-linear-to-r from-primary-dark to-primary relative" />
            
            <div className="px-6 pb-6 -mt-12 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-white border-4 border-white shadow-xl mb-3">
                  {developer.photo ? (
                    <img src={developer.photo} alt={developer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold text-3xl bg-primary/5">
                      {developer.name[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-black text-app-text-primary mb-0.5">{developer.name}</h4>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-4">Full Stack Developer</p>
                
                {developer.bio && (
                  <p className="text-xs text-app-text-secondary leading-relaxed mb-6 italic">
                    "{developer.bio}"
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-app-bg-secondary rounded-xl border border-transparent hover:border-primary/10 transition-all">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-app-text-muted font-black uppercase tracking-wider">ফোন নম্বর</p>
                    <p className="text-xs font-bold text-app-text-primary">{developer.phone}</p>
                  </div>
                </div>

                {developer.address && (
                  <div className="flex items-center gap-4 p-3 bg-app-bg-secondary rounded-xl border border-transparent hover:border-primary/10 transition-all">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-app-text-muted font-black uppercase tracking-wider">ঠিকানা</p>
                      <p className="text-xs font-bold text-app-text-primary truncate">{developer.address}</p>
                    </div>
                  </div>
                )}

                {developer.facebook && (
                  <a 
                    href={developer.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 bg-app-bg-secondary rounded-xl border border-transparent hover:border-primary/10 transition-all active:scale-95"
                  >
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                      <Facebook className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-app-text-muted font-black uppercase tracking-wider">ফেসবুক প্রোফাইল</p>
                      <p className="text-xs font-bold text-app-text-primary truncate">facebook.com/profile</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-4 opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted">
          © 2026 Bondhumohol Foundation
        </p>
      </div>
    </div>
  );
};
