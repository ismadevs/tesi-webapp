import { useState } from 'react';
import { X } from 'lucide-react';

export default function EditSiteModal({ siteToEdit, onClose, onSave, existingSites = [] }){
  // Se per qualche motivo il componente viene renderizzato senza dati, blocchiamo tutto
  if (!siteToEdit) return null;

  // ==========================================
  // 1. STATI DEL FORM (PRE-COMPILATI)
  // ==========================================
  // Invece di partire vuoti, estraiamo i valori di partenza da 'siteToEdit'
  const [name, setName] = useState(siteToEdit.name);
  const [status, setStatus] = useState(siteToEdit.status);
  const [cpuCores, setCpuCores] = useState(siteToEdit.compute.cpuCores);
  const [ramGB, setRamGB] = useState(siteToEdit.compute.ramGB);
  const [storageTB, setStorageTB] = useState(siteToEdit.compute.storageTB);
  const [hostingType, setHostingType] = useState(siteToEdit.tech.hostingType);
  const [os, setOs] = useState(siteToEdit.tech.os);

  // Dividiamo la stringa dell'IP in 4 pezzetti per riempire i 4 input
  // Es: "192.168.1.10" diventa ['192', '168', '1', '10']
  const initialIpParts = siteToEdit.tech.ipAddress ? siteToEdit.tech.ipAddress.split('.') : ['0', '0', '0', '0'];
  const [ipParts, setIpParts] = useState(initialIpParts);

  const [error, setError] = useState('');

  // ==========================================
  // 2. DIZIONARI DEI DATI (Identici alla AddSiteModal)
  // ==========================================
  const coresOptions = [1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160, 192];
  const ramOptions = [1, 2, 4, 8, 16, 32, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072];
  const storageOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 28, 32];
  const hostingOptions = ['Docker', 'Kubernetes', 'Shared Cloud', 'Dedicated Instance', 'Dedicated Host', 'Bare Metal'];
  const osOptions = ['Ubuntu', 'Debian', 'Rocky Linux', 'AlmaLinux', 'RHEL', 'Windows Server'];

  // ==========================================
  // 3. LOGICA DI VALIDAZIONE E SALVATAGGIO
  // ==========================================
  const handleIpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue === '' || (Number(cleanValue) >= 0 && Number(cleanValue) <= 255)) {
      const newIpParts = [...ipParts];
      newIpParts[index] = cleanValue;
      setIpParts(newIpParts);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Name cannot be empty.');

    const nameRegex = /^[a-zA-Z0-9\s\-]+$/;
    if (!nameRegex.test(name)) {
      return setError('Name can only contain letters, numbers, spaces, and dashes.');
    }

    // MODIFICA CRITICA: Controllo doppioni
    // Filtriamo existingSites escludendo il sito CORRENTE (tramite l'ID).
    // Altrimenti, se non cambi il nome e clicchi salva, ti direbbe che il nome esiste già!
    const isDuplicate = existingSites.some(site =>
      site.id !== siteToEdit.id && site.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) return setError('A site with this name already exists.');

    if (ipParts.some(part => part === '')) {
      return setError('Please complete all 4 fields of the IP address.');
    }

    // Costruiamo i dati aggiornati
    const updatedData = {
      name: name.trim(),
      status: status,
      cpuCores: Number(cpuCores),
      ramGB: Number(ramGB),
      storageTB: Number(storageTB),
      hostingType: hostingType,
      os: os,
      ipAddress: ipParts.join('.')
    };

    // Passiamo l'ID e i nuovi dati alla funzione genitore
    onSave(siteToEdit.id, updatedData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>

      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {/* Mostriamo dinamicamente il nome originale del sito nel titolo */}
          <h2 className="text-xl font-bold text-gray-900 tracking-tight line-clamp-1">
            Edit {siteToEdit.name}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* GENERAL */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Site Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* COMPUTE */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Compute Allocation</label>
            <div className="grid grid-cols-3 gap-4">
              <select value={cpuCores} onChange={(e) => setCpuCores(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                {coresOptions.map(num => <option key={num} value={num}>{num} Cores</option>)}
              </select>
              <select value={ramGB} onChange={(e) => setRamGB(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                {ramOptions.map(num => <option key={num} value={num}>{num} GB RAM</option>)}
              </select>
              <select value={storageTB} onChange={(e) => setStorageTB(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                {storageOptions.map(num => <option key={num} value={num}>{num} TB SSD</option>)}
              </select>
            </div>
          </div>

          {/* INFRASTRUCTURE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hosting Type</label>
              <select value={hostingType} onChange={(e) => setHostingType(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                {hostingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Operating System</label>
              <select value={os} onChange={(e) => setOs(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                {osOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          {/* IP ADDRESS */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">IPv4 Address</label>
            <div className="flex items-center gap-2">
              {ipParts.map((part, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={3}
                    value={part}
                    onChange={(e) => handleIpChange(index, e.target.value)}
                    className="w-16 text-center px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {index < 3 && <span className="text-gray-400 font-bold">.</span>}
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-600 transition-colors cursor-pointer shadow-sm">
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}