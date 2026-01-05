
import React, { useState } from 'react';
import { Shield, FileText, AlertTriangle, Server, ChevronRight, Terminal, Copy, ArrowLeft, CreditCard, Calculator, BellRing, TrendingUp, Info, Sun, Moon, Share2, HelpCircle, GitMerge } from 'lucide-react';

// --- DATOS ESTATICOS ---
const changelogData = [
  {
    version: "v3.0 Fénix",
    date: "Junio 2024",
    changes: [
      "Reconstrucción completa del código base con React y Vite.",
      "Interfaz renovada con modo oscuro y diseño adaptable.",
      "Pestaña 'Mis Cuentas' para guardar y compartir datos bancarios.",
      "Notificaciones Push para cambios de tasas (requiere activación).",
      "Instalación como PWA (Aplicación Web Progresiva) para acceso offline."
    ]
  },
  {
    version: "v2.0",
    date: "2022",
    changes: ["Mejoras de rendimiento y estabilidad."]
  }
];

const faqData = [
  {
    q: "¿Cada cuánto se actualizan las tasas?",
    a: "La tasa del BCV se actualiza según la publicación oficial. Las tasas de USDT (P2P) se actualizan en tiempo real, reflejando el promedio del mercado."
  },
  {
    q: "¿Por qué hay una tasa de BCV y otra de USDT?",
    a: "Ofrecemos ambas para dar una visión completa. El BCV es la tasa oficial del gobierno, mientras que el USDT (P2P) refleja el valor en el mercado de criptomonedas, que muchos usan como referencia."
  },
  {
    q: "¿Mis datos de 'Mis Cuentas' están seguros?",
    a: "Sí. Toda la información que guardas en la sección 'Mis Cuentas' se almacena únicamente en tu dispositivo (usando localStorage). Nunca se envía a ningún servidor externo."
  }
];


// --- COMPONENTE PRINCIPAL ---
export default function InfoView({ logs, toggleTheme, theme, setActiveTab }) {
  const [showLogs, setShowLogs] = useState(false);
  const [legalView, setLegalView] = useState(null); 
  const [expandedChangelog, setExpandedChangelog] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.time}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    alert("Registros copiados al portapapeles");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TasasAlDía',
        text: 'Consulta las tasas de cambio en Venezuela de forma rápida y sencilla.',
        url: window.location.href
      })
    } else {
      alert('La función de compartir no está disponible en este navegador.');
    }
  }

  // --- RENDERIZADO DE VISTAS LEGALES ---
  if (legalView) {
    return <LegalDocLayout 
      isTerms={legalView === 'terms'} 
      onBack={() => setLegalView(null)} 
    />;
  }

  // --- RENDERIZADO DE VISTA PRINCIPAL ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-6 pb-24">
      
      <Header theme={theme} toggleTheme={toggleTheme} />

      <ImportantNotice />

      <Ecosystem setActiveTab={setActiveTab} />

      <DataSource />

      <CollapsibleSection 
        icon={<GitMerge size={18} />} 
        title="Historial de Versiones"
        data={changelogData}
        expandedId={expandedChangelog}
        setExpandedId={setExpandedChangelog}
        renderItem={(item) => <ChangelogItem item={item} />}
      />

      <CollapsibleSection 
        icon={<HelpCircle size={18} />} 
        title="Preguntas Frecuentes"
        data={faqData}
        expandedId={expandedFaq}
        setExpandedId={setExpandedFaq}
        renderItem={(item) => <FaqItem item={item} />}
      />

      <div className="space-y-3">
        <LegalButton icon={<FileText size={18}/>} title="Términos y Condiciones" onClick={() => setLegalView('terms')} />
        <LegalButton icon={<Shield size={18}/>} title="Política de Privacidad" onClick={() => setLegalView('privacy')} />
      </div>

      <Footer onShare={handleShare} onToggleLogs={() => setShowLogs(!showLogs)} showLogs={showLogs} />

      {showLogs && <LogConsole logs={logs} onCopy={handleCopyLogs} />}
    </div>
  );
}

// --- SUB-COMPONENTES UI (Mejorados y Modulares) ---

const Header = ({ theme, toggleTheme }) => (
  <div className="flex items-center gap-3 px-2">
     <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <Info size={24} className="text-brand-dark dark:text-brand stroke-[2.5]" />
     </div>
     <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Información</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">TasasAlDía <span className="text-brand-dark dark:text-brand">v3.0 Fénix</span></p>
     </div>
     <button onClick={toggleTheme} className="ml-auto p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-dark dark:hover:text-brand transition-all active:scale-95 shadow-sm">
        {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
     </button>
  </div>
);

const ImportantNotice = () => (
  <div className="relative overflow-hidden bg-amber-50 dark:bg-slate-800/50 border border-amber-100 dark:border-amber-900/30 p-5 rounded-[1.5rem]">
    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-xl"></div>
    <div className="relative z-10 flex gap-4">
        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-500 shrink-0 h-fit">
            <AlertTriangle size={20} strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide">Aviso Importante</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-justify">Esta aplicación no está afiliada al BCV. No somos una entidad financiera. Los datos son referenciales.</p>
        </div>
    </div>
  </div>
);

const Ecosystem = ({ setActiveTab }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-2">
        <h3 className="font-black text-lg text-slate-800 dark:text-white">Ecosistema</h3>
        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 uppercase">Todo en uno</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
        <FeatureCard icon={<TrendingUp size={18} />} title="Monitor Híbrido" desc="Tasas BCV y USDT (P2P)." onClick={() => setActiveTab('monitor')} bgClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
        <FeatureCard icon={<CreditCard size={18} />} title="Mis Cuentas" desc="Guarda y comparte tus datos." onClick={() => setActiveTab('wallet')} bgClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" />
        <FeatureCard icon={<Calculator size={18} />} title="Calculadora Smart" desc="Conversiones instantáneas." onClick={() => setActiveTab('calc')} bgClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
        <FeatureCard icon={<BellRing size={18} />} title="Alertas Push" desc="Actívalas desde el monitor." onClick={() => setActiveTab('monitor')} bgClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" />
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc, bgClass, onClick }) => (
    <button onClick={onClick} className="bg-white text-left dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
        <div className={`w-fit p-2.5 rounded-xl mb-3 ${bgClass} group-hover:scale-110 transition-transform duration-300`}>{React.cloneElement(icon, { strokeWidth: 2.5 })}</div>
        <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-1 uppercase tracking-wide">{title}</h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
    </button>
);

const DataSource = () => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400"><Server size={20} strokeWidth={2} /></div>
    <div>
        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Transparencia de Datos</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Datos obtenidos vía API pública del BCV y promedios de Binance P2P.</p>
    </div>
  </div>
);

const CollapsibleSection = ({ icon, title, data, expandedId, setExpandedId, renderItem }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-2">
      <div className="text-slate-400">{React.cloneElement(icon, { strokeWidth: 2 })}</div>
      <h3 className="font-black text-lg text-slate-800 dark:text-white">{title}</h3>
    </div>
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  </div>
);

const ChangelogItem = ({ item }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-center">
      <p className="font-bold text-sm text-slate-800 dark:text-white">{item.version}</p>
      <p className="text-xs font-medium text-slate-400">{item.date}</p>
    </div>
    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
      {item.changes.map((change, i) => <li key={i}>{change}</li>)}
    </ul>
  </div>
);

const FaqItem = ({ item }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
    <p className="font-bold text-sm text-slate-800 dark:text-white mb-1">{item.q}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400">{item.a}</p>
  </div>
);

const LegalButton = ({ icon, title, onClick }) => (
    <button onClick={onClick} className="w-full flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-[1.2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition-all group">
        <div className="flex items-center gap-4">
            <div className="text-slate-400 group-hover:text-brand-dark dark:group-hover:text-brand transition-colors">{icon}</div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{title}</span>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-dark dark:group-hover:text-brand transition-colors" />
    </button>
);

const Footer = ({ onShare, onToggleLogs, showLogs }) => (
  <div className="pt-4 flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <button onClick={onShare} className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-dark dark:hover:text-brand transition-colors">
          <Share2 size={14} /> Compartir App
        </button>
      </div>
      <div className="text-center opacity-40">
        <p className="text-xs font-bold text-slate-900 dark:text-white">© 2025 TasasAlDía</p>
      </div>
      <button onClick={onToggleLogs} className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-brand-dark dark:hover:text-brand transition-colors bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-full font-mono">
        <Terminal size={12} />
        {showLogs ? 'Ocultar Registros' : 'Registro de Actividad'}
      </button>
  </div>
);

const LogConsole = ({ logs, onCopy }) => (
  <div className="bg-[#0f172a] dark:bg-black rounded-xl p-4 font-mono text-[10px] border border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
          <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold tracking-widest text-[9px]">CONSOLE</span>
              <button onClick={onCopy} className="text-slate-500 hover:text-white transition-colors"><Copy size={12}/></button>
          </div>
      </div>
      <div className="h-32 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 pr-2">
          {logs.length === 0 ? <span className="text-slate-600 italic">&gt; Esperando actividad...</span> : logs.map((log, i) => (
              <div key={i} className="flex gap-2 text-slate-300">
                  <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                  <span className={log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}>{log.msg}</span>
              </div>
          ))}
      </div>
  </div>
);


function LegalDocLayout({ isTerms, onBack }) {
    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                <button onClick={onBack} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ArrowLeft size={20} /></button>
                <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">{isTerms ? "Términos y Condiciones" : "Política de Privacidad"}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pb-32">
                <div className="prose prose-sm dark:prose-invert prose-slate max-w-none text-slate-600 dark:text-slate-300">
                  {isTerms ? <TermsContent /> : <PrivacyContent />}
                </div>
            </div>
        </div>
    );
}

const TermsContent = () => (
  <div className="space-y-4">
    <p><strong>Última actualización:</strong> Diciembre 2025</p>
    <h4>1. Aceptación de los Términos</h4>
    <p>Al usar "TasasAlDía", usted acepta estos términos.</p>
    <h4>2. Naturaleza Informativa</h4>
    <p>La App es solo para información referencial de tasas en Venezuela. <strong>No es una entidad financiera.</strong></p>
    <h4>3. Exención de Responsabilidad</h4>
    <p>No garantizamos la exactitud de los datos. <strong>El uso de la App es su responsabilidad.</strong></p>
    <h4>4. Propiedad Intelectual</h4>
    <p>El contenido y código son propiedad de TasasAlDía.</p>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-4">
    <p><strong>Última actualización:</strong> Diciembre 2025</p>
    <h4>1. Recopilación de Datos</h4>
    <p><strong>No recopilamos sus datos personales</strong> en servidores externos.</p>
    <h4>2. Almacenamiento Local</h4>
    <p>Usamos el almacenamiento de su dispositivo (`localStorage`) para sus preferencias y cuentas.</p>
    <h4>3. Servicios de Terceros</h4>
    <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>OneSignal:</strong> Para notificaciones push anónimas.</li>
        <li><strong>Google Apps Script:</strong> Para consultar tasas públicas.</li>
    </ul>
  </div>
);
