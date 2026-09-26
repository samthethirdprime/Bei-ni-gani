import React, { useState } from 'react';
import { X, Database, ShieldCheck, Copy, Check, ExternalLink, Code } from 'lucide-react';
import defaultAppletConfig from '../../firebase-applet-config.json';

interface FirebaseConfigGuideModalProps {
  onClose: () => void;
}

export const FirebaseConfigGuideModal: React.FC<FirebaseConfigGuideModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const envTemplate = `# Add to your .env file to use your own Firebase Project:
VITE_FIREBASE_API_KEY="${defaultAppletConfig.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${defaultAppletConfig.authDomain}"
VITE_FIREBASE_PROJECT_ID="${defaultAppletConfig.projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${defaultAppletConfig.storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${defaultAppletConfig.messagingSenderId}"
VITE_FIREBASE_APP_ID="${defaultAppletConfig.appId}"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="${defaultAppletConfig.firestoreDatabaseId}"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                Firebase Firestore Status & Credentials
              </h3>
              <p className="text-xs text-neutral-400">
                Connected to persistent cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Active Status Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-300 text-sm">
                Firebase Firestore is Active
              </div>
              <p className="text-neutral-300 mt-1">
                Product catalog, community prices paid, and confirmation feedback are persisted in real-time to Google Cloud Firestore with security rules applied.
              </p>
              <div className="mt-2 text-[11px] text-neutral-400 space-y-0.5">
                <div>Project ID: <code className="text-emerald-400">{defaultAppletConfig.projectId}</code></div>
                <div>Database ID: <code className="text-emerald-400">{defaultAppletConfig.firestoreDatabaseId}</code></div>
                <div>Collections: <code className="text-neutral-300">products</code>, <code className="text-neutral-300">reports</code>, <code className="text-neutral-300">feedback</code></div>
              </div>
            </div>
          </div>

          {/* Guide for Custom Project */}
          <div>
            <h4 className="font-bold text-white mb-1.5 flex items-center justify-between">
              <span>How to add your own Firebase Project in <code className="text-emerald-400">.env</code>:</span>
              <button
                onClick={copyToClipboard}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-lg"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Template'}</span>
              </button>
            </h4>
            <p className="text-neutral-400 mb-2">
              If you wish to switch to your own private Firebase project, create a <code className="text-white">.env</code> file in the app root with the following variables. The application in <code className="text-white">src/firebaseConfig.js</code> will automatically detect and prioritize them:
            </p>
            <div className="relative bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto">
              <pre>{envTemplate}</pre>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-neutral-400">
            <strong className="text-neutral-200 block mb-0.5">Production Security Note:</strong>
            The Firestore security rules in <code className="text-neutral-300">firestore.rules</code> are deployed and enforce valid document sizes, allowed schemas, and prevent arbitrary deletions.
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
