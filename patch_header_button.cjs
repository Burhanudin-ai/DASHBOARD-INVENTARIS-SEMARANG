const fs = require('fs');
const filePath = './src/App.tsx';

let content = fs.readFileSync(filePath, 'utf8');

const target = '          <div className="flex flex-wrap items-center gap-2.5" id="header-action-controls">';
const targetCRLF = '          <div className="flex flex-wrap items-center gap-2.5" id="header-action-controls">\r';

const buttonCode = `
            {/* Admin Authentication Status Button */}
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl font-bold text-xs transition-all border border-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/5"
                title="Logout dari Mode Administrator"
                id="btn-admin-status"
              >
                <Unlock className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Admin: Aktif</span>
                <LogOut className="w-3.5 h-3.5 ml-0.5 text-emerald-500/60" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setLoginReason('Silakan masukkan sandi admin untuk mengaktifkan mode edit dan tambah data.');
                  setIsAdminLoginOpen(true);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition-all border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                title="Login sebagai Administrator untuk Mengubah Data"
                id="btn-admin-status"
              >
                <Lock className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
                <span>Mode: Lihat Saja</span>
              </button>
            )}
`;

if (content.includes(targetCRLF)) {
  content = content.replace(targetCRLF, targetCRLF + buttonCode);
  console.log('App.tsx header button successfully added (CRLF).');
} else if (content.includes(target)) {
  content = content.replace(target, target + buttonCode);
  console.log('App.tsx header button successfully added (LF).');
} else {
  console.error('Could not find header actions controls div in App.tsx');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
