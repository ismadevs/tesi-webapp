import { Search, Plus } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="mb-12"> {/* <-- rimosso il flex da qui */}
      
      {/* IL TITOLO (Sta da solo sulla sua riga) */}
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
        Resources
      </h2>

      {/* IL NUOVO CONTENITORE FLEX: Mette Sottotitolo e Azioni sulla stessa linea */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Sottotitolo (ora spinto a sinistra) */}
        <p className="text-lg text-gray-600 mt-4">
          Manage your computational resources and hosting environments.
        </p>

        {/* AREA AZIONI */}
        <div className="flex items-center gap-4">
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none w-50 transition-all"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => console.log('Cliccato Add Site!')}
            className="flex items-center justify-center gap-2 bg-primary text-white px-2 pr-5 pl-3 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Site</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}