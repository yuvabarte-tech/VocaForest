import React, { useState } from 'react';
import { Award, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface MedalsAndCertsProps {
  student: any;
}

export default function MedalsAndCerts({ student }: MedalsAndCertsProps) {
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  
  // Generate medals based on level
  const totalMedals = Math.floor(student.level / 2); // 1 medal every 2 levels
  const medals = Array.from({ length: Math.max(1, totalMedals) }, (_, i) => ({
    id: i + 1,
    name: `Level ${ (i + 1) * 2 } Explorer Medal`,
    unlocked: (i + 1) * 2 <= student.level
  }));

  const handleDownload = async (cert: any) => {
    setDownloadingCertId(cert.id);
    
    try {
      const res = await fetch('https://i.ibb.co/G3dzq5vH/cert.png');
      const blob = await res.blob();
      const base64Bg = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      
      // Add background image
      doc.addImage(base64Bg, 'PNG', 0, 0, width, height);
      
      // Student Name
      doc.setFont('times', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(30, 41, 59); // #1e293b
      const name = (student.fullName || student.username).toUpperCase();
      doc.text(name, width / 2, height * 0.44, { align: 'center', maxWidth: width * 0.85 });
      
      // Achievement Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(cert.title, width / 2, height * 0.58, { align: 'center' });
      
      // Date
      doc.setFontSize(16);
      doc.text(new Date(cert.date).toLocaleDateString(), width * 0.28, height * 0.72);
      
      doc.save(`Certificate_${cert.title.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error("Failed to generate certificate", e);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setDownloadingCertId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4">
      {/* Medals Section */}
      <div className="glass-panel p-6 border-4 border-amber-200 bg-white/95">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🏅</span>
          <div>
            <h2 className="font-display text-3xl text-amber-800 font-bold">My Medals</h2>
            <p className="text-xs text-gray-500 font-medium">Earn a new medal for every 2 levels you grow!</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {medals.map((medal) => (
            <div key={medal.id} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${medal.unlocked ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200 opacity-50 grayscale'}`}>
              <Award className={`w-12 h-12 mb-2 ${medal.unlocked ? 'text-amber-500' : 'text-gray-400'}`} />
              <p className={`text-xs font-bold text-center ${medal.unlocked ? 'text-amber-900' : 'text-gray-500'}`}>{medal.name}</p>
              {medal.unlocked ? (
                <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold mt-2 uppercase tracking-widest">Unlocked</span>
              ) : (
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold mt-2 uppercase tracking-widest">Locked</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Certificates Section */}
      <div className="glass-panel p-6 border-4 border-sky-200 bg-white/95">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">📜</span>
          <div>
            <h2 className="font-display text-3xl text-sky-800 font-bold">My Certificates</h2>
            <p className="text-xs text-gray-500 font-medium">Download digital certificates awarded by your teacher.</p>
          </div>
        </div>

        {(!student.certificates || student.certificates.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="font-display text-xl text-gray-500 font-bold">No Certificates Yet</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">Keep playing Quiz Land and mastering words to earn special certificates from Teacher Yuva!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {student.certificates.map((cert: any) => (
              <div key={cert.id} className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between">
                <div>
                  <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12 transition-transform group-hover:scale-110">🎓</div>
                  <h3 className="font-display text-lg text-sky-900 font-bold pr-12 leading-tight mb-2">{cert.title}</h3>
                  <p className="text-xs text-gray-500 font-semibold mb-6">Awarded: {new Date(cert.date).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => handleDownload(cert)}
                  disabled={downloadingCertId === cert.id}
                  className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 text-white font-display text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm relative z-10"
                >
                  {downloadingCertId === cert.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Download Certificate</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
