const initialData = {[cite: 3]
    "gudang": [
        {"Kode Gudang": "GDG-01", "Nama Gudang": "Gudang Pusat"},[cite: 3] 
        {"Kode Gudang": "GDG-02", "Nama Gudang": "Gudang Cabang"}[cite: 3]
    ],
    "project": [
        {
            "Periode": "2026-07-16",[cite: 3]
            "Type": "Distribusi",[cite: 3]
            "Region": "ACH",[cite: 3]
            "Kode Project": "PRJ-001",[cite: 3] 
            "No PR-PO": "POS-2026-001",[cite: 3]
            "Nama Project": "Proyek A",[cite: 3]
            "PO Plan": "100",[cite: 3]
            "PO Final": "100",[cite: 3]
            "Status PO": "Approved",[cite: 3]
            "Permit": "Done",[cite: 3]
            "Status SND": "Done",[cite: 3]
            "Civil Work": "Done",[cite: 3]
            "Status Doc": "Complete"[cite: 3]
        }
    ],
    "barang": [
        {"Kategori": "Material", "Jenis": "Besi", "Kode Barang": "BRG-001", "Nama Barang": "Besi Beton"},[cite: 3] 
        {"Kategori": "Material", "Jenis": "Semen", "Kode Barang": "BRG-002", "Nama Barang": "Semen Tiga Roda"},[cite: 3]
        {"Kategori": "Tools", "Jenis": "Obeng", "Kode Barang": "BRG-003", "Nama Barang": "Obeng Plus"}[cite: 3]
    ],
    "transaksi": [
        {
            "Tanggal": "2026-07-16",[cite: 3] 
            "No Doc": "ACM-NPM-VII-2026-0001",[cite: 3] 
            "ID DO-TO": "TX-001",[cite: 3] 
            "Tipe Transaksi": "Masuk",[cite: 3] 
            "Gudang Asal": "",[cite: 3] 
            "Gudang Tujuan": "GDG-01",[cite: 3] 
            "Kode Project": "PRJ-001",[cite: 3]
            "Kategori": "Material",[cite: 3] 
            "Jenis": "Besi",[cite: 3] 
            "Kode Barang": "BRG-001",[cite: 3] 
            "Nama Barang (Auto)": "Besi Beton",[cite: 3] 
            "Jumlah": 100,[cite: 3]
            "Petugas": "Budi",[cite: 3] 
            "Keterangan": "Stok awal proyek"[cite: 3] 
        }
    ]
};

// --- INISIALISASI DATABASE ---
if (!window.db) {[cite: 3]
    let localData = localStorage.getItem('wms_app_data');[cite: 3]
    window.db = localData ? JSON.parse(localData) : initialData;[cite: 3]
}

let currentSection = 'gudang';[cite: 3]
let editIndex = -1;[cite: 3]

function saveToLocal() {[cite: 3]
    localStorage.setItem('wms_app_data', JSON.stringify(window.db));[cite: 3] 
}

function syncToFirebase() {[cite: 3]
    if (typeof window.syncToFirebase === 'function') {[cite: 3]
        window.syncToFirebase();[cite: 3]
    }
}

function deleteData(index) {[cite: 3]
    if(confirm("Yakin ingin menghapus data ini?")) {[cite: 3]
        window.db[currentSection].splice(index, 1);[cite: 3]
        saveToLocal();[cite: 3]
        syncToFirebase();[cite: 3]
        renderTable(currentSection);[cite: 3]
    }
}

/* Helper fungsi untuk menghitung stok barang di Gudang tertentu */
function getGudangStock(gudangKode, kodeBarang) {[cite: 3]
    if (!gudangKode || !kodeBarang) return 0;[cite: 3]
    let st = 0;[cite: 3]
    (window.db.transaksi || []).forEach(t => {[cite: 3]
        if (t['Kode Barang'] !== kodeBarang) return;[cite: 3]
        let jml = parseInt(t['Jumlah'] || 0);[cite: 3]
        if (t['Gudang Tujuan'] === gudangKode) st += jml;[cite: 3]
        if (t['Gudang Asal'] === gudangKode) st -= jml;[cite: 3]
    });
    return st;[cite: 3]
}

/* Helper fungsi untuk Auto Generate Kode Barang Baru bertipe Drum */
function autoGenerateNextDrumBarang(jenisVal, kategoriVal) {[cite: 3]
    let drumBarang = (window.db.barang || []).filter(b =>[cite: 3] 
        (b['Kategori'] || '').toLowerCase() === (kategoriVal || 'cable').toLowerCase() &&[cite: 3]
        b['Jenis'] === jenisVal &&[cite: 3]
        (b['Kode Barang'] || '').startsWith('Drum')[cite: 3]
    );

    if (drumBarang.length === 0) return null;[cite: 3]

    let maxSeq = 0;[cite: 3]
    let basePrefix = "";[cite: 3]
    let padLen = 2;[cite: 3]
    let sampleNama = drumBarang[0]['Nama Barang'] || '';[cite: 3]

    drumBarang.forEach(b => {[cite: 3]
        let code = b['Kode Barang'] || '';[cite: 3]
        let match = code.match(/^(.*?)(\d+)$/);[cite: 3]
        if (match) {[cite: 3]
            basePrefix = match[1];[cite: 3]
            let seqStr = match[2];[cite: 3]
            padLen = seqStr.length;[cite: 3]
            let seq = parseInt(seqStr, 10);[cite: 3]
            if (seq > maxSeq) {[cite: 3]
                maxSeq = seq;[cite: 3]
                sampleNama = b['Nama Barang'] || sampleNama;[cite: 3]
            }
        }
    });

    if (!basePrefix) return null;[cite: 3]

    let nextSeq = maxSeq + 1;[cite: 3]
    let nextSeqStr = nextSeq.toString().padStart(padLen, '0');[cite: 3]
    let newKode = basePrefix + nextSeqStr;[cite: 3]

    let newNama = sampleNama;[cite: 3]
    let namaMatch = sampleNama.match(/^(.*?)(\d+)$/);[cite: 3]
    if (namaMatch) {[cite: 3]
        newNama = namaMatch[1] + nextSeqStr;[cite: 3]
    }

    let newBarangObj = {[cite: 3]
        "Kategori": kategoriVal,[cite: 3]
        "Jenis": jenisVal,[cite: 3]
        "Kode Barang": newKode,[cite: 3]
        "Nama Barang": newNama[cite: 3]
    };

    if (!window.db.barang.find(b => b['Kode Barang'] === newKode)) {[cite: 3]
        window.db.barang.push(newBarangObj);[cite: 3]
        saveToLocal();[cite: 3]
        syncToFirebase();[cite: 3]
    }

    return newBarangObj;[cite: 3]
}

/* Helper fungsi Searchable Dropdown */
function getGudangName(code) {[cite: 3]
    if (!code) return '';[cite: 3]
    let g = (window.db.gudang || []).find(x => x['Kode Gudang'] === code);[cite: 3]
    return g ? g['Nama Gudang'] : code;[cite: 3]
}

function getProjectName(code) {[cite: 3]
    if (!code) return '';[cite: 3]
    let p = (window.db.project || []).find(x => x['Kode Project'] === code);[cite: 3]
    return p ? p['Nama Project'] : code;[cite: 3]
}

function openSearchableDropdown(listId) {[cite: 3]
    document.querySelectorAll('.searchable-list').forEach(el => {[cite: 3]
        if (el.id !== listId) el.classList.add('hidden');[cite: 3]
    });
    const list = document.getElementById(listId);[cite: 3]
    if (list) list.classList.remove('hidden');[cite: 3]
}

function handleSearchableInput(inputId, hiddenId, listId) {[cite: 3]
    openSearchableDropdown(listId);[cite: 3]
    const input = document.getElementById(inputId);[cite: 3]
    const hidden = document.getElementById(hiddenId);[cite: 3]
    if (input && hidden && input.value === '') {[cite: 3]
        hidden.value = '';[cite: 3]
    }

    const filter = input ? input.value.toLowerCase() : '';[cite: 3]
    const list = document.getElementById(listId);[cite: 3]
    if (!list) return;[cite: 3]

    const items = list.querySelectorAll('.searchable-item');[cite: 3]
    items.forEach(item => {[cite: 3]
        const txt = item.textContent || item.innerText;[cite: 3]
        if (txt.toLowerCase().includes(filter)) {[cite: 3]
            item.style.display = "";[cite: 3]
        } else {
            item.style.display = "none";[cite: 3]
        }
    });
}

function selectSearchableOption(hiddenId, inputId, listId, code, name, callback) {[cite: 3]
    const hidden = document.getElementById(hiddenId);[cite: 3]
    const input = document.getElementById(inputId);[cite: 3]
    const list = document.getElementById(listId);[cite: 3]

    if (hidden) hidden.value = code;[cite: 3]
    if (input) input.value = name;[cite: 3]
    if (list) list.classList.add('hidden');[cite: 3]

    if (typeof callback === 'function') {[cite: 3]
        callback();[cite: 3]
    }
}

if (!window.searchableListenerAdded) {[cite: 3]
    document.addEventListener('click', function(e) {[cite: 3]
        if (!e.target.closest('.searchable-container')) {[cite: 3]
            document.querySelectorAll('.searchable-list').forEach(el => el.classList.add('hidden'));[cite: 3]
        }
    });
    window.searchableListenerAdded = true;[cite: 3]
}

function printNotaPDF(t) {[cite: 3]
    const { jsPDF } = window.jspdf;[cite: 3]
    const doc = new jsPDF('p', 'pt', 'a4');[cite: 3] 
    
    let allItems = window.db.transaksi.filter(x => x['No Doc'] === t['No Doc']);[cite: 3]
    
    doc.setFont("helvetica", "normal");[cite: 3] 
    doc.setFontSize(12);[cite: 3] 
    doc.text("NOTA PERMINTAAN MATERIAL", 40, 60);[cite: 3]
    doc.setFontSize(10);[cite: 3] 
    doc.text("PT Acero Cetha Metalindo", 40, 75);[cite: 3] 

    doc.setFontSize(8);[cite: 3] 
    doc.text(`No. Doc : ${t['No Doc'] || '-'}`, 40, 95);[cite: 3]
    doc.text(`ID DO-TO: ${t['ID DO-TO'] || '-'}`, 40, 110);[cite: 3]
    
    doc.text(`Tanggal : ${t['Tanggal'] || '-'}`, 550, 95, { align: 'right' });[cite: 3]
    doc.text(`Tipe Transaksi : ${t['Tipe Transaksi'] || '-'}`, 550, 110, { align: 'right' });[cite: 3]

    let bodyData = [];[cite: 3]
    allItems.forEach(item => {[cite: 3]
        bodyData.push([[cite: 3]
            item['Kode Barang'] || '-',[cite: 3]
            item['Nama Barang (Auto)'] || '-',[cite: 3]
            item['Jumlah'] || '0',[cite: 3]
            window.db.gudang.find(g => g['Kode Gudang'] === item['Gudang Asal'])?.['Nama Gudang'] || '-',[cite: 3]
            window.db.gudang.find(g => g['Kode Gudang'] === item['Gudang Tujuan'])?.['Nama Gudang'] || '-',[cite: 3]
            window.db.project.find(p => p['Kode Project'] === item['Kode Project'])?.['Nama Project'] || '-',[cite: 3]
            item['Keterangan'] || '-'[cite: 3]
        ]);
    });
    
    while (bodyData.length < 12) {[cite: 3]
        bodyData.push(['', '', '', '', '', '', '']);[cite: 3]
    }

    doc.autoTable({[cite: 3]
        startY: 125,[cite: 3]
        head: [['ID BRG', 'NAMA MATERIAL', 'QTY', 'DARI', 'TUJUAN', 'NAMA PROYEK', 'KETERANGAN']],[cite: 3]
        body: bodyData,[cite: 3]
        theme: 'grid',[cite: 3]
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 8 },[cite: 3]
        bodyStyles: { halign: 'center', valign: 'middle', fontSize: 8 },[cite: 3]
        columnStyles: { 1: { halign: 'left' } }[cite: 3]
    });

    let counts = {};[cite: 3]
    let sums = {};[cite: 3]
    allItems.forEach(item => {[cite: 3]
        let nama = item['Nama Barang (Auto)'] || '-';[cite: 3]
        let qty = parseInt(item['Jumlah'] || 0);[cite: 3]
        counts[nama] = (counts[nama] || 0) + 1;[cite: 3]
        sums[nama] = (sums[nama] || 0) + qty;[cite: 3]
    });

    let noteTexts = [];[cite: 3]
    for (let nama in counts) {[cite: 3]
        if (counts[nama] > 1) {[cite: 3] 
            noteTexts.push(`${nama} : ${sums[nama]}`);[cite: 3]
        }
    }

    let currentY = doc.lastAutoTable.finalY + 15;[cite: 3] 
    
    if (noteTexts.length > 0) {[cite: 3]
        doc.setFont("helvetica", "normal");[cite: 3]
        doc.setFontSize(8);[cite: 3]
        doc.text(`Note : ${noteTexts.join(', ')}`, 40, currentY);[cite: 3]
        currentY += 20;[cite: 3] 
    } else {
        currentY += 10;[cite: 3]
    }

    let finalY = currentY + 10;[cite: 3]
    doc.setFontSize(8);[cite: 3] 
    doc.setFont("helvetica", "normal");[cite: 3] 

    doc.text("Pickup by,", 40, finalY);[cite: 3]
    let namaPetugas = t['Petugas'] || '';[cite: 3]
    if (namaPetugas) { doc.text(namaPetugas.toUpperCase(), 40, finalY + 38); }[cite: 3]
    doc.line(40, finalY + 40, 140, finalY + 40);[cite: 3] 

    doc.text("Disetujui oleh,", 230, finalY);[cite: 3]
    doc.line(230, finalY + 40, 330, finalY + 40);[cite: 3] 

    doc.text("Diketahui oleh,", 420, finalY);[cite: 3]
    doc.text("RUDI", 420, finalY + 38);[cite: 3]
    doc.line(420, finalY + 40, 520, finalY + 40);[cite: 3]

    doc.save(`NOTA_${t['No Doc']}.pdf`);[cite: 3]
}

function exportCSV() {[cite: 3]
    let data = window.db[currentSection];[cite: 3]
    if (!data || data.length === 0) return alert("Tidak ada data untuk diexport!");[cite: 3]
    let csv = Object.keys(data[0]).join(',') + '\n';[cite: 3]
    data.forEach(row => {[cite: 3]
        csv += Object.values(row).map(val => `"${val}"`).join(',') + '\n';[cite: 3]
    });
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });[cite: 3]
    let url = URL.createObjectURL(blob);[cite: 3]
    let a = document.createElement('a');[cite: 3]
    a.href = url;[cite: 3]
    a.download = currentSection + '.csv';[cite: 3]
    a.click();[cite: 3]
}

function exportRekapStokCSV() {[cite: 3]
    const selectedGudang = document.getElementById('gudang-filter')?.value || "";[cite: 3]
    let rekap = {};[cite: 3]
    window.db.transaksi.forEach(t => {[cite: 3]
        let nama = t['Nama Barang (Auto)'] || '-';[cite: 3]
        let jml = parseInt(t['Jumlah'] || 0);[cite: 3]
        if(!rekap[nama]) rekap[nama] = { masuk: 0, keluar: 0, t_masuk: 0, t_keluar: 0 };[cite: 3]
        let isGudangRelevant = (selectedGudang === "" || t['Gudang Asal'] === selectedGudang || t['Gudang Tujuan'] === selectedGudang);[cite: 3]
        if(isGudangRelevant) {[cite: 3]
            if(t['Tipe Transaksi'] === 'Masuk' && (selectedGudang === "" || t['Gudang Tujuan'] === selectedGudang)) rekap[nama].masuk += jml;[cite: 3]
            if(t['Tipe Transaksi'] === 'Keluar' && (selectedGudang === "" || t['Gudang Asal'] === selectedGudang)) rekap[nama].keluar += jml;[cite: 3]
            if(t['Tipe Transaksi'] === 'Transfer') {[cite: 3]
                if(t['Gudang Tujuan'] === selectedGudang || selectedGudang === "") rekap[nama].t_masuk += jml;[cite: 3]
                if(t['Gudang Asal'] === selectedGudang || selectedGudang === "") rekap[nama].t_keluar += jml;[cite: 3]
            }
        }
    });

    let sortedKeys = Object.keys(rekap).sort((a, b) => a.localeCompare(b));[cite: 3]

    let csv = 'Nama Barang,Masuk,Keluar,T. Masuk,T. Keluar,Sisa\n';[cite: 3]
    sortedKeys.forEach(nama => {[cite: 3]
        let sisa = rekap[nama].masuk - rekap[nama].keluar + rekap[nama].t_masuk - rekap[nama].t_keluar;[cite: 3]
        csv += `"${nama}",${rekap[nama].masuk},${rekap[nama].keluar},${rekap[nama].t_masuk},${rekap[nama].t_keluar},${sisa}\n`;[cite: 3]
    });
    
    let namaGudang = "Semua_Gudang";[cite: 3]
    if (selectedGudang) {[cite: 3]
        let g = window.db.gudang.find(x => x['Kode Gudang'] === selectedGudang);[cite: 3]
        if (g) namaGudang = g['Nama Gudang'].replace(/\s+/g, '_');[cite: 3]
    }
    
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });[cite: 3]
    let a = document.createElement('a');[cite: 3]
    a.href = URL.createObjectURL(blob);[cite: 3]
    a.download = `Rekap_Stok_${namaGudang}.csv`;[cite: 3]
    a.click();[cite: 3]
}

function renderDashboard() {[cite: 3]
    const mainContent = document.getElementById('main-content');[cite: 3]
    if (!mainContent) return;[cite: 3]
    mainContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Dashboard Utama</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button onclick="renderTable('gudang')" class="p-6 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-600">Master Gudang</button>
            <button onclick="renderTable('project')" class="p-6 bg-green-700 text-white rounded-lg shadow hover:bg-green-600">Master Project</button>
            <button onclick="renderTable('barang')" class="p-6 bg-yellow-600 text-white rounded-lg shadow hover:bg-yellow-500">Master Barang</button>
            <button onclick="renderTable('transaksi')" class="p-6 bg-red-700 text-white rounded-lg shadow hover:bg-red-600">Data Transaksi</button>
            <button onclick="renderRekapStok()" class="p-6 bg-purple-700 text-white rounded-lg shadow hover:bg-purple-600">Stok Gudang</button>
            <button onclick="renderRekapStokProyek()" class="p-6 bg-pink-700 text-white rounded-lg shadow hover:bg-pink-600">Stok Proyek</button>
            <button onclick="currentSection = 'transaksi'; openModal(-1);" class="p-6 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600">Input Transaksi</button>
        </div>
    `;[cite: 3]
}

function searchTransaksi() {[cite: 3]
    const searchDoc = document.getElementById('search-doc');[cite: 3]
    const query = searchDoc ? searchDoc.value.trim().toLowerCase() : '';[cite: 3]
    renderTable('transaksi', query);[cite: 3]
}

function renderTable(section, searchQuery = '') {[cite: 3]
    currentSection = section;[cite: 3]
    
    if (!window.db[section]) window.db[section] = [];[cite: 3]

    const selectedGudangFilter = (section === 'transaksi') ? (document.getElementById('transaksi-gudang-filter')?.value || '') : '';[cite: 3]

    if (section === 'transaksi') {[cite: 3]
        window.db[section].sort((a, b) => new Date(b['Tanggal'] || 0) - new Date(a['Tanggal'] || 0));[cite: 3]
    } else if (section === 'barang') {[cite: 3]
        window.db[section].sort((a, b) => {[cite: 3]
            let catA = (a['Kategori'] || "").toLowerCase();[cite: 3]
            let catB = (b['Kategori'] || "").toLowerCase();[cite: 3]
            let jenisA = (a['Jenis'] || "").toLowerCase();[cite: 3]
            let jenisB = (b['Jenis'] || "").toLowerCase();[cite: 3]
            let kodeA = (a['Kode Barang'] || "").toLowerCase();[cite: 3]
            let kodeB = (b['Kode Barang'] || "").toLowerCase();[cite: 3]

            if (catA !== catB) return catA.localeCompare(catB);[cite: 3]
            if (jenisA !== jenisB) return jenisA.localeCompare(jenisB);[cite: 3]
            return kodeA.localeCompare(kodeB);[cite: 3]
        });
    } else if (section === 'project') {[cite: 3]
        window.db[section].sort((a, b) => {[cite: 3]
            let codeA = (a['Kode Project'] || "").toLowerCase();[cite: 3]
            let codeB = (b['Kode Project'] || "").toLowerCase();[cite: 3]
            return codeA.localeCompare(codeB);[cite: 3]
        });
    } else if (section === 'gudang') {[cite: 3]
        window.db[section].sort((a, b) => {[cite: 3]
            let codeA = (a['Kode Gudang'] || "").toLowerCase();[cite: 3]
            let codeB = (b['Kode Gudang'] || "").toLowerCase();[cite: 3]
            return codeA.localeCompare(codeB);[cite: 3]
        });
    }
    
    let data = window.db[section];[cite: 3]

    if (section === 'transaksi' && searchQuery) {[cite: 3]
        data = data.filter(item => (item['No Doc'] || '').toLowerCase().includes(searchQuery));[cite: 3]
    }

    if (section === 'transaksi' && selectedGudangFilter) {[cite: 3]
        data = data.filter(item =>[cite: 3] 
            item['Gudang Asal'] === selectedGudangFilter || item['Gudang Tujuan'] === selectedGudangFilter[cite: 3]
        );
    }
    
    let exportBtn = (section === 'transaksi' || section === 'barang' || section === 'project') ? `<button onclick="exportCSV()" class="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-500 mr-2 text-[9pt]">Export CSV</button>` : '';[cite: 3]
    
    let searchBar = '';[cite: 3]
    if (section === 'transaksi') {[cite: 3]
        const existingSearchDoc = document.getElementById('search-doc');[cite: 3]
        const gudangOptions = (window.db.gudang || []).map(g => `<option value="${g['Kode Gudang']}" ${selectedGudangFilter === g['Kode Gudang'] ? 'selected' : ''}>${g['Nama Gudang']}</option>`).join('');[cite: 3]
        
        searchBar = `
            <div class="flex flex-wrap items-center gap-2 mr-4">
                <select id="transaksi-gudang-filter" onchange="renderTable('transaksi')" class="border p-2 rounded text-[9pt]">
                    <option value="">-- Semua Gudang --</option>
                    ${gudangOptions}
                </select>
                <input type="text" id="search-doc" value="${searchQuery ? (existingSearchDoc?.value || '') : ''}" placeholder="Cari No Doc..." class="border p-2 rounded text-[9pt] w-36 md:w-48">
                <button onclick="searchTransaksi()" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-500 text-[9pt]">Cari</button>
            </div>
        `;[cite: 3]
    }

    let html = `
        <div class="sticky top-20 z-40 bg-white pt-2 pb-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 gap-2">
            <h2 class="text-[9pt] font-bold capitalize text-gray-800">${section.replace('_', ' ')}</h2>
            <div class="flex flex-wrap items-center w-full md:w-auto justify-end gap-1">
                ${searchBar}
                ${exportBtn}
                <button onclick="openModal(-1)" class="bg-indigo-700 text-white px-4 py-2 rounded shadow hover:bg-indigo-600 text-[9pt]"> + Tambah Data</button>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse border border-gray-200 table-compact">
                <thead class="bg-gray-50"><tr>`;[cite: 3]
    
    if (data.length > 0) {[cite: 3]
        let keys = Object.keys(data[0]);[cite: 3]
        if (section === 'transaksi') {[cite: 3]
            keys = ['Tanggal', 'No Doc', 'ID DO-TO', 'Tipe Transaksi', 'Gudang Asal', 'Gudang Tujuan', 'Kode Project', 'Kategori', 'Jenis', 'Kode Barang', 'Nama Barang (Auto)', ...keys.filter(k => !['Tanggal', 'No Doc', 'ID DO-TO', 'Tipe Transaksi', 'Gudang Asal', 'Gudang Tujuan', 'Kode Project', 'Kategori', 'Jenis', 'Kode Barang', 'Nama Barang (Auto)'].includes(k))];[cite: 3]
        } else if (section === 'barang') {[cite: 3]
            keys = ['Kategori', 'Jenis', 'Kode Barang', 'Nama Barang', ...keys.filter(k => !['Kategori', 'Jenis', 'Kode Barang', 'Nama Barang'].includes(k))];[cite: 3]
        } else if (section === 'project') {[cite: 3]
            keys = ['Periode', 'Type', 'Region', 'Kode Project', 'No PR-PO', 'Nama Project', 'PO Plan', 'PO Final', 'Status PO', 'Permit', 'Status SND', 'Civil Work', 'Status Doc', ...keys.filter(k => !['Periode', 'Type', 'Region', 'Kode Project', 'No PR-PO', 'Nama Project', 'PO Plan', 'PO Final', 'Status PO', 'Permit', 'Status SND', 'Civil Work', 'Status Doc'].includes(k))];[cite: 3]
        }

        keys.forEach(k => html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">${k}</th>`);[cite: 3]
        html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">Aksi</th></tr></thead><tbody>`;[cite: 3]

        data.forEach((item) => {[cite: 3]
            let originalIndex = window.db[section].indexOf(item);[cite: 3]
            html += `<tr class="hover:bg-gray-50 border-b">`;[cite: 3]
            
            keys.forEach(k => {[cite: 3]
                html += `<td class="border text-[9pt] text-gray-800">${item[k] !== undefined ? item[k] : ''}</td>`;[cite: 3]
            });
            
            let aksi = `<button onclick="openModal(${originalIndex})" class="text-blue-600 hover:underline text-[9pt] font-bold">Edit</button>`;[cite: 3]
            if (section === 'barang' || section === 'transaksi' || section === 'gudang' || section === 'project') {[cite: 3]
                aksi += ` | <button onclick="deleteData(${originalIndex})" class="text-red-600 hover:underline text-[9pt] font-bold">Hapus</button>`;[cite: 3]
            }
            html += `<td class="border">${aksi}</td></tr>`;[cite: 3]
        });
    } else {
        let defaultKeys = [];[cite: 3]
        if(section === 'barang') defaultKeys = ["Kategori", "Jenis", "Kode Barang", "Nama Barang"];[cite: 3]
        else if(section === 'transaksi') defaultKeys = ["Tanggal", "No Doc", "ID DO-TO", "Tipe Transaksi", "Gudang Asal", "Gudang Tujuan", "Kode Project", "Kategori", "Jenis", "Kode Barang", "Nama Barang (Auto)", "Jumlah", "Petugas", "Keterangan"];[cite: 3]
        else if(section === 'gudang') defaultKeys = ["Kode Gudang", "Nama Gudang"];[cite: 3]
        else if(section === 'project') defaultKeys = ["Periode", "Type", "Region", "Kode Project", "No PR-PO", "Nama Project", "PO Plan", "PO Final", "Status PO", "Permit", "Status SND", "Civil Work", "Status Doc"];[cite: 3]

        defaultKeys.forEach(k => html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">${k}</th>`);[cite: 3]
        html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">Aksi</th></tr></thead><tbody><tr><td colspan="${defaultKeys.length + 1}" class="text-center p-4 text-gray-400">Tidak ada data ditemukan</td></tr>`;[cite: 3]
    }
    html += `</tbody></table></div>`;[cite: 3]
    
    const mainContent = document.getElementById('main-content');[cite: 3]
    if (mainContent) mainContent.innerHTML = html;[cite: 3]
}

function getRomanMonth(date) {[cite: 3]
    const months = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];[cite: 3]
    return months[date.getMonth()];[cite: 3]
}

function generateUniqueDocCode(dateStr) {[cite: 3]
    const date = dateStr ? new Date(dateStr) : new Date();[cite: 3]
    const year = date.getFullYear();[cite: 3]
    const month = getRomanMonth(date);[cite: 3]
    
    const prefix = `ACM-NPM-${month}-${year}-`;[cite: 3]
    
    const existingDocs = (window.db.transaksi || [])[cite: 3]
        .filter(t => {[cite: 3]
            if (!t['Tanggal']) return false;[cite: 3]
            return new Date(t['Tanggal']).getFullYear() === year;[cite: 3]
        })
        .map(t => t['No Doc']);[cite: 3]

    let maxNum = 0;[cite: 3]
    existingDocs.forEach(doc => {[cite: 3]
        if (doc) {[cite: 3]
            const parts = doc.split('-');[cite: 3]
            if (parts.length >= 5) {[cite: 3]
                const num = parseInt(parts[4], 10);[cite: 3]
                if (!isNaN(num) && num > maxNum) maxNum = num;[cite: 3]
            }
        }
    });

    return prefix + (maxNum + 1).toString().padStart(4, '0');[cite: 3]
}

function onTanggalChange(val) {[cite: 3]
    const docInput = document.querySelector('input[name="No Doc"]');[cite: 3]
    if (docInput) {[cite: 3]
        docInput.value = generateUniqueDocCode(val);[cite: 3]
    }
}

function onTipeTransaksiChange() {[cite: 3]
    const tbody = document.getElementById('item-tbody');[cite: 3]
    if (tbody) {[cite: 3]
        tbody.innerHTML = '';[cite: 3]
        addTransactionRow();[cite: 3]
    }
    onGudangAsalChange();[cite: 3]
}

function onGudangTujuanChange() {[cite: 3]
    const rows = document.querySelectorAll('#item-tbody tr');[cite: 3]
    rows.forEach(tr => {[cite: 3]
        let jenisSelect = tr.querySelector('select[name="Jenis[]"]');[cite: 3]
        if (jenisSelect && jenisSelect.value) {[cite: 3]
            let currentKode = tr.querySelector('select[name="Kode Barang[]"]')?.value || '';[cite: 3]
            onJenisChangeRow(jenisSelect, currentKode);[cite: 3]
        }
    });
}

function onGudangAsalChange() {[cite: 3]
    const tipeTransaksi = document.querySelector('[name="Tipe Transaksi"]')?.value;[cite: 3]
    const gudangAsal = document.querySelector('[name="Gudang Asal"]')?.value;[cite: 3]
    const projectListContainer = document.getElementById('project-list-items');[cite: 3]
    const projectHidden = document.getElementById('project-val');[cite: 3]
    const projectInput = document.getElementById('project-input');[cite: 3]

    const rows = document.querySelectorAll('#item-tbody tr');[cite: 3]
    rows.forEach(tr => {[cite: 3]
        let jenisSelect = tr.querySelector('select[name="Jenis[]"]');[cite: 3]
        if (jenisSelect && jenisSelect.value) {[cite: 3]
            let currentKode = tr.querySelector('select[name="Kode Barang[]"]')?.value || '';[cite: 3]
            onJenisChangeRow(jenisSelect, currentKode);[cite: 3]
        }
    });

    if (!projectListContainer) return;[cite: 3]

    let selectedProjectVal = projectHidden ? projectHidden.value : '';[cite: 3]
    let filteredProjects = window.db.project || [];[cite: 3]

    if (tipeTransaksi === 'Keluar') {[cite: 3]
        if (!gudangAsal) {[cite: 3]
            filteredProjects = [];[cite: 3]
        } else {
            let targetPrefix = "";[cite: 3]
            if (gudangAsal.startsWith('ACM-ACH')) targetPrefix = 'ACH';[cite: 3]
            else if (gudangAsal.startsWith('ACM-PLB')) targetPrefix = 'PLB';[cite: 3]
            else if (gudangAsal.startsWith('ACM-PMN')) targetPrefix = 'PMN';[cite: 3]
            else if (gudangAsal.startsWith('ACM-BKT')) targetPrefix = 'BKT';[cite: 3]
            else if (gudangAsal.startsWith('ACM-PAD')) targetPrefix = 'PAD';[cite: 3]

            if (targetPrefix) {[cite: 3]
                filteredProjects = filteredProjects.filter(p => (p['Kode Project'] || "").startsWith(targetPrefix));[cite: 3]
            } else {
                filteredProjects = [];[cite: 3]
            }
        }
    }

    let currentProjObj = filteredProjects.find(p => p['Kode Project'] === selectedProjectVal);[cite: 3]
    if (!currentProjObj) {[cite: 3]
        if (projectHidden) projectHidden.value = '';[cite: 3]
        if (projectInput) projectInput.value = '';[cite: 3]
    } else {
        if (projectInput) projectInput.value = currentProjObj['Nama Project'];[cite: 3]
    }

    let listHTML = `<div onclick="selectSearchableOption('project-val', 'project-input', 'project-list-items', '', '', null)" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] text-gray-500 italic searchable-item">-- Pilih Project --</div>`;[cite: 3]

    filteredProjects.forEach(p => {[cite: 3]
        const safeName = (p['Nama Project'] || '').replace(/'/g, "\\'");[cite: 3]
        const safeCode = (p['Kode Project'] || '').replace(/'/g, "\\'");[cite: 3]
        listHTML += `<div onclick="selectSearchableOption('project-val', 'project-input', 'project-list-items', '${safeCode}', '${safeName}', null)" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] searchable-item">${p['Nama Project']}</div>`;[cite: 3]
    });

    projectListContainer.innerHTML = listHTML;[cite: 3]
}

function validateCurrentRows() {[cite: 3]
    const tipeTransaksi = document.querySelector('[name="Tipe Transaksi"]')?.value || 'Masuk';[cite: 3]
    const selectedGudangAsal = document.querySelector('[name="Gudang Asal"]')?.value || '';[cite: 3]
    const selectedGudangTujuan = document.querySelector('[name="Gudang Tujuan"]')?.value || '';[cite: 3]

    const rows = document.querySelectorAll('#item-tbody tr');[cite: 3]
    for (let row of rows) {[cite: 3]
        let kategori = row.querySelector('select[name="Kategori[]"]')?.value || '';[cite: 3]
        let kodeBarang = row.querySelector('select[name="Kode Barang[]"]')?.value;[cite: 3]
        let qtyInput = row.querySelector('input[name="Jumlah[]"]');[cite: 3]
        let qty = parseInt(qtyInput?.value || 0);[cite: 3]

        if ((tipeTransaksi === 'Keluar' || tipeTransaksi === 'Transfer') && kodeBarang && selectedGudangAsal) {[cite: 3]
            let sisaStok = getGudangStock(selectedGudangAsal, kodeBarang);[cite: 3]
            if (qty > sisaStok) {[cite: 3]
                alert(`Stok ${kodeBarang} tidak mencukupi di Gudang Asal! (Sisa stok: ${sisaStok})`);[cite: 3]
                if (qtyInput) qtyInput.focus();[cite: 3]
                return false;[cite: 3]
            }
        }

        if (kategori.toLowerCase() === 'cable' && kodeBarang && kodeBarang.startsWith('Drum')) {[cite: 3]
            if (qty > 3000) {[cite: 3]
                alert(`Jumlah input untuk ${kodeBarang} tidak boleh melebihi 3000!`);[cite: 3]
                if (qtyInput) qtyInput.focus();[cite: 3]
                return false;[cite: 3]
            }

            if (tipeTransaksi === 'Masuk' || tipeTransaksi === 'Transfer') {[cite: 3]
                let currentTargetStock = getGudangStock(selectedGudangTujuan, kodeBarang);[cite: 3]
                if (currentTargetStock + qty > 3000) {[cite: 3]
                    alert(`Total stok ${kodeBarang} di Gudang Tujuan tidak boleh melebihi 3000! (Stok saat ini: ${currentTargetStock}, Input: ${qty})`);[cite: 3]
                    if (qtyInput) qtyInput.focus();[cite: 3]
                    return false;[cite: 3]
                }
            }
        }
    }
    return true;[cite: 3]
}

function addTransactionRow(item = {}) {[cite: 3]
    const tbody = document.getElementById('item-tbody');[cite: 3]
    if (!tbody) return;[cite: 3]

    if (tbody.children.length > 0) {[cite: 3]
        if (!validateCurrentRows()) {[cite: 3]
            return;[cite: 3]
        }
    }

    let tr = document.createElement('tr');[cite: 3]
    
    let categories = [...new Set((window.db.barang || []).map(b => b['Kategori']))];[cite: 3]
    let catOptions = categories.map(c => `<option value="${c}" ${item['Kategori'] === c ? 'selected' : ''}>${c}</option>`).join('');[cite: 3]

    tr.innerHTML = `
        <td class="border p-1">
            <select name="Kategori[]" onchange="onKategoriChangeRow(this)" class="w-full border p-1 rounded text-[8pt]" required>
                <option value="">-- Pilih --</option>
                ${catOptions}
            </select>
        </td>
        <td class="border p-1">
            <select name="Jenis[]" onchange="onJenisChangeRow(this)" class="w-full border p-1 rounded text-[8pt]" required>
                <option value="">-- Pilih --</option>
            </select>
        </td>
        <td class="border p-1">
            <select name="Kode Barang[]" onchange="updateNamaBarangRow(this)" class="w-full border p-1 rounded text-[8pt]" required>
                <option value="">-- Pilih --</option>
            </select>
        </td>
        <td class="border p-1">
            <input type="text" name="Nama Barang (Auto)[]" value="${item['Nama Barang (Auto)'] || ''}" readonly class="w-full border p-1 rounded bg-gray-100 text-[8pt]">
        </td>
        <td class="border p-1">
            <input type="number" name="Jumlah[]" value="${item['Jumlah'] || ''}" class="w-full border p-1 rounded text-[8pt] text-center" required min="1" max="3000">
        </td>
        <td class="border p-1 text-center">
            <button type="button" onclick="this.closest('tr').remove()" class="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
        </td>
    `;[cite: 3]
    tbody.appendChild(tr);[cite: 3]

    if (item['Kategori']) {[cite: 3]
        let catSelect = tr.querySelector('select[name="Kategori[]"]');[cite: 3]
        onKategoriChangeRow(catSelect, item['Jenis'], item['Kode Barang']);[cite: 3]
    }
}

function onKategoriChangeRow(el, preselectJenis = '', preselectKode = '') {[cite: 3]
    let tr = el.closest('tr');[cite: 3]
    let val = el.value;[cite: 3]
    let jenisSelect = tr.querySelector('select[name="Jenis[]"]');[cite: 3]
    let kodeSelect = tr.querySelector('select[name="Kode Barang[]"]');[cite: 3]
    let namaInput = tr.querySelector('input[name="Nama Barang (Auto)[]"]');[cite: 3]
    
    if (!jenisSelect || !kodeSelect || !namaInput) return;[cite: 3]

    jenisSelect.innerHTML = '<option value="">-- Pilih --</option>';[cite: 3]
    kodeSelect.innerHTML = '<option value="">-- Pilih --</option>';[cite: 3]
    namaInput.value = '';[cite: 3]

    if (val) {[cite: 3]
        let filteredJenis = [...new Set((window.db.barang || []).filter(b => b['Kategori'] === val).map(b => b['Jenis']))];[cite: 3]
        filteredJenis.forEach(j => {[cite: 3]
            jenisSelect.innerHTML += `<option value="${j}" ${preselectJenis === j ? 'selected' : ''}>${j}</option>`;[cite: 3]
        });
        if(preselectJenis) onJenisChangeRow(jenisSelect, preselectKode);[cite: 3]
    }
}

function onJenisChangeRow(el, preselectKode = '') {[cite: 3]
    let tr = el.closest('tr');[cite: 3]
    let kategoriVal = tr.querySelector('select[name="Kategori[]"]')?.value || '';[cite: 3]
    let jenisVal = el.value;[cite: 3]
    let kodeSelect = tr.querySelector('select[name="Kode Barang[]"]');[cite: 3]
    let namaInput = tr.querySelector('input[name="Nama Barang (Auto)[]"]');[cite: 3]

    if (!kodeSelect || !namaInput) return;[cite: 3]

    kodeSelect.innerHTML = '<option value="">-- Pilih --</option>';[cite: 3]
    namaInput.value = '';[cite: 3]

    if (jenisVal && kategoriVal) {[cite: 3]
        const tipeTransaksi = document.querySelector('[name="Tipe Transaksi"]')?.value || 'Masuk';[cite: 3]
        const selectedGudangAsal = document.querySelector('[name="Gudang Asal"]')?.value || '';[cite: 3]
        const selectedGudangTujuan = document.querySelector('[name="Gudang Tujuan"]')?.value || '';[cite: 3]

        if ((tipeTransaksi === 'Keluar' || tipeTransaksi === 'Transfer') && !selectedGudangAsal) {[cite: 3]
            kodeSelect.innerHTML = '<option value="">-- Pilih Gudang Asal Dulu --</option>';[cite: 3]
            return;[cite: 3]
        }
        if ((tipeTransaksi === 'Masuk' || tipeTransaksi === 'Transfer') && kategoriVal.toLowerCase() === 'cable' && !selectedGudangTujuan) {[cite: 3]
            kodeSelect.innerHTML = '<option value="">-- Pilih Gudang Tujuan Dulu --</option>';[cite: 3]
            return;[cite: 3]
        }

        let selectedKodeInRows = new Set();[cite: 3]
        document.querySelectorAll('#item-tbody tr').forEach(row => {[cite: 3]
            let sel = row.querySelector('select[name="Kode Barang[]"]');[cite: 3]
            if (sel && sel.value && row !== tr) {[cite: 3]
                selectedKodeInRows.add(sel.value);[cite: 3]
            }
        });

        if (kategoriVal.toLowerCase() === 'cable' && (tipeTransaksi === 'Masuk' || tipeTransaksi === 'Transfer')) {[cite: 3]
            let drumBarang = (window.db.barang || []).filter(b =>[cite: 3] 
                (b['Kategori'] || '').toLowerCase() === 'cable' &&[cite: 3]
                b['Jenis'] === jenisVal &&[cite: 3]
                (b['Kode Barang'] || '').startsWith('Drum')[cite: 3]
            );

            if (drumBarang.length > 0) {[cite: 3]
                let availableDrumBarang = drumBarang.filter(b => {[cite: 3]
                    if (tipeTransaksi === 'Transfer') {[cite: 3]
                        let stokAsal = getGudangStock(selectedGudangAsal, b['Kode Barang']);[cite: 3]
                        if (stokAsal <= 0) return false;[cite: 3]
                    }
                    let stokTujuan = getGudangStock(selectedGudangTujuan, b['Kode Barang']);[cite: 3]
                    return stokTujuan === 0;[cite: 3]
                });

                let autoGenerated = false;[cite: 3]
                let autoGeneratedCode = '';[cite: 3]

                if (tipeTransaksi === 'Masuk' && availableDrumBarang.length === 0) {[cite: 3]
                    let newBarang = autoGenerateNextDrumBarang(jenisVal, kategoriVal);[cite: 3]
                    if (newBarang) {[cite: 3]
                        availableDrumBarang = [newBarang];[cite: 3]
                        autoGenerated = true;[cite: 3]
                        autoGeneratedCode = newBarang['Kode Barang'];[cite: 3]
                    }
                }

                let nonDrumBarang = (window.db.barang || []).filter(b =>[cite: 3] 
                    (b['Kategori'] || '').toLowerCase() === 'cable' &&[cite: 3]
                    b['Jenis'] === jenisVal &&[cite: 3]
                    !(b['Kode Barang'] || '').startsWith('Drum') &&[cite: 3]
                    !(b['Kode Barang'] || '').startsWith('Ext')[cite: 3]
                );

                let finalFiltered = [...availableDrumBarang, ...nonDrumBarang].filter(b => !selectedKodeInRows.has(b['Kode Barang']));[cite: 3]

                finalFiltered.forEach(b => {[cite: 3]
                    let isSelected = (preselectKode === b['Kode Barang']) || (autoGenerated && b['Kode Barang'] === autoGeneratedCode);[cite: 3]
                    kodeSelect.innerHTML += `<option value="${b['Kode Barang']}" ${isSelected ? 'selected' : ''}>${b['Kode Barang']} - ${b['Nama Barang']}</option>`;[cite: 3]
                });

                if (autoGenerated || preselectKode) {[cite: 3]
                    updateNamaBarangRow(kodeSelect);[cite: 3]
                }
                return;[cite: 3]
            }
        }

        let filteredBarang = (window.db.barang || []).filter(b => {[cite: 3]
            if (b['Kategori'] !== kategoriVal || b['Jenis'] !== jenisVal) return false;[cite: 3]
            if (selectedKodeInRows.has(b['Kode Barang'])) return false;[cite: 3]

            if (tipeTransaksi === 'Keluar' || tipeTransaksi === 'Transfer') {[cite: 3]
                let stokAsal = getGudangStock(selectedGudangAsal, b['Kode Barang']);[cite: 3]
                if (stokAsal <= 0) return false;[cite: 3] 
            }

            if (tipeTransaksi === 'Masuk') {[cite: 3]
                if ((b['Kode Barang'] || '').startsWith('Ext')) {[cite: 3]
                    return false;[cite: 3]
                }

                if (kategoriVal.toLowerCase() === 'cable') {[cite: 3]
                    let stokTujuan = getGudangStock(selectedGudangTujuan, b['Kode Barang']);[cite: 3]
                    if (stokTujuan > 0) return false;[cite: 3]
                }
            }

            return true;[cite: 3]
        });

        filteredBarang.forEach(b => {[cite: 3]
            kodeSelect.innerHTML += `<option value="${b['Kode Barang']}" ${preselectKode === b['Kode Barang'] ? 'selected' : ''}>${b['Kode Barang']} - ${b['Nama Barang']}</option>`;[cite: 3]
        });
        if(preselectKode) updateNamaBarangRow(kodeSelect);[cite: 3]
    }
}

function updateNamaBarangRow(el) {[cite: 3]
    let tr = el.closest('tr');[cite: 3]
    let kode = el.value;[cite: 3]
    const barang = (window.db.barang || []).find(b => b['Kode Barang'] === kode);[cite: 3]
    const namaInput = tr.querySelector('input[name="Nama Barang (Auto)[]"]');[cite: 3]
    if (namaInput) namaInput.value = barang ? barang['Nama Barang'] : '';[cite: 3]
}

function renderRekapStok() {[cite: 3]
    const selectedGudang = document.getElementById('gudang-filter')?.value || "";[cite: 3]
    let rekap = {};[cite: 3]
    (window.db.transaksi || []).forEach(t => {[cite: 3]
        let nama = t['Nama Barang (Auto)'] || '-';[cite: 3]
        let jml = parseInt(t['Jumlah'] || 0);[cite: 3]
        if(!rekap[nama]) rekap[nama] = { masuk: 0, keluar: 0, t_masuk: 0, t_keluar: 0 };[cite: 3]
        let isGudangRelevant = (selectedGudang === "" || t['Gudang Asal'] === selectedGudang || t['Gudang Tujuan'] === selectedGudang);[cite: 3]
        if(isGudangRelevant) {[cite: 3]
            if(t['Tipe Transaksi'] === 'Masuk' && (selectedGudang === "" || t['Gudang Tujuan'] === selectedGudang)) rekap[nama].masuk += jml;[cite: 3]
            if(t['Tipe Transaksi'] === 'Keluar' && (selectedGudang === "" || t['Gudang Asal'] === selectedGudang)) rekap[nama].keluar += jml;[cite: 3]
            if(t['Tipe Transaksi'] === 'Transfer') {[cite: 3]
                if(t['Gudang Tujuan'] === selectedGudang || selectedGudang === "") rekap[nama].t_masuk += jml;[cite: 3]
                if(t['Gudang Asal'] === selectedGudang || selectedGudang === "") rekap[nama].t_keluar += jml;[cite: 3]
            }
        }
    });

    let sortedNames = Object.keys(rekap).sort((a, b) => a.localeCompare(b));[cite: 3]
    let options = (window.db.gudang || []).map(g => `<option value="${g['Kode Gudang']}" ${selectedGudang === g['Kode Gudang'] ? 'selected' : ''}>${g['Nama Gudang']}</option>`).join('');[cite: 3]
    
    let html = `
        <div class="sticky top-20 z-40 bg-white pt-2 pb-4 mb-4 flex justify-between items-end border-b border-gray-200">
            <div class="w-full md:w-1/3">
                <h2 class="text-[9pt] font-bold mb-4">Rekap Stok Gudang</h2>
                <label class="block text-[9pt] font-medium text-gray-700 mb-1">Pilih Gudang:</label>
                <select id="gudang-filter" onchange="renderRekapStok()" class="w-full border p-2 rounded text-[9pt]">
                    <option value="">-- Semua Gudang --</option>
                    ${options}
                </select>
            </div>
            <div>
                <button onclick="exportRekapStokCSV()" class="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-500 text-[9pt]">Export CSV</button>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse border border-gray-200 table-compact">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Nama Barang</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Masuk</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Keluar</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">T. Masuk</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">T. Keluar</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Sisa</th>
                    </tr>
                </thead>
                <tbody>`;[cite: 3]
                
    sortedNames.forEach(nama => {[cite: 3]
        let sisa = rekap[nama].masuk - rekap[nama].keluar + rekap[nama].t_masuk - rekap[nama].t_keluar;[cite: 3]
        html += `<tr><td class="border text-[9pt] font-medium">${nama}</td><td class="border text-[9pt]">${rekap[nama].masuk}</td><td class="border text-[9pt]">${rekap[nama].keluar}</td><td class="border text-[9pt]">${rekap[nama].t_masuk}</td><td class="border text-[9pt]">${rekap[nama].t_keluar}</td><td class="border text-[9pt] font-bold text-blue-600 underline cursor-pointer hover:text-blue-800" onclick="showBreakdown('${nama}')">${sisa}</td></tr>`;[cite: 3]
    });
    html += `</tbody></table></div>`;[cite: 3]
    
    const mainContent = document.getElementById('main-content');[cite: 3]
    if (mainContent) mainContent.innerHTML = html;[cite: 3]
}

function showBreakdown(namaBarang) {[cite: 3]
    const selectedGudang = document.getElementById('gudang-filter')?.value || "";[cite: 3]
    let breakdownList = [];[cite: 3]
    (window.db.transaksi || []).forEach(t => {[cite: 3]
        if(t['Nama Barang (Auto)'] === namaBarang) {[cite: 3]
            let isGudangRelevant = (selectedGudang === "" || t['Gudang Asal'] === selectedGudang || t['Gudang Tujuan'] === selectedGudang);[cite: 3]
            if(isGudangRelevant) {[cite: 3]
                let jml = parseInt(t['Jumlah'] || 0);[cite: 3]
                let effectiveJml = 0;[cite: 3]
                if(t['Tipe Transaksi'] === 'Masuk' && (selectedGudang === "" || t['Gudang Tujuan'] === selectedGudang)) effectiveJml = jml;[cite: 3]
                else if(t['Tipe Transaksi'] === 'Keluar' && (selectedGudang === "" || t['Gudang Asal'] === selectedGudang)) effectiveJml = -jml;[cite: 3]
                else if(t['Tipe Transaksi'] === 'Transfer') {[cite: 3]
                    if(t['Gudang Tujuan'] === selectedGudang) effectiveJml = jml;[cite: 3]
                    else if(t['Gudang Asal'] === selectedGudang) effectiveJml = -jml;[cite: 3]
                    else if(selectedGudang === "") effectiveJml = 0;[cite: 3]
                }
                
                if (effectiveJml !== 0 || selectedGudang === "") {[cite: 3]
                    breakdownList.push({[cite: 3]
                        kode: t['Kode Barang'] || '-',[cite: 3]
                        jumlah: effectiveJml !== 0 ? effectiveJml : jml[cite: 3]
                    });
                }
            }
        }
    });

    let aggregatedBreakdown = {};[cite: 3]
    breakdownList.forEach(item => {[cite: 3]
        if (!aggregatedBreakdown[item.kode]) {[cite: 3]
            aggregatedBreakdown[item.kode] = 0;[cite: 3]
        }
        aggregatedBreakdown[item.kode] += item.jumlah;[cite: 3]
    });

    const modalTitle = document.getElementById('modal-title');[cite: 3]
    const btnSave = document.getElementById('btn-save');[cite: 3]
    const dataForm = document.getElementById('data-form');[cite: 3]
    const modal = document.getElementById('modal');[cite: 3]

    if (modalTitle) modalTitle.innerText = `Breakdown Stok: ${namaBarang}`;[cite: 3]
    if (btnSave) btnSave.classList.add('hidden');[cite: 3]
    
    let html = `<div class="overflow-x-auto"><table class="w-full text-left border-collapse border border-gray-200 text-[9pt] table-compact"><thead class="bg-gray-100"><tr><th class="border text-[9pt] font-bold uppercase text-gray-600">Kode Barang</th><th class="border text-[9pt] font-bold uppercase text-gray-600">Sisa</th></tr></thead><tbody>`;[cite: 3]
    
    let hasData = false;[cite: 3]
    for (let kode in aggregatedBreakdown) {[cite: 3]
        let sisa = aggregatedBreakdown[kode];[cite: 3]
        if (sisa > 0) {[cite: 3]
            hasData = true;[cite: 3]
            html += `<tr><td class="border text-[9pt] font-medium">${kode}</td><td class="border text-[9pt] font-bold">${sisa}</td></tr>`;[cite: 3]
        }
    }

    if(!hasData) {[cite: 3]
        html += `<tr><td colspan="2" class="text-center p-4 text-gray-400">Tidak ada data breakdown</td></tr>`;[cite: 3]
    }

    html += `</tbody></table></div>`;[cite: 3]
    if (dataForm) dataForm.innerHTML = html;[cite: 3]
    if (modal) modal.classList.remove('hidden');[cite: 3]
}

function renderRekapStokProyek() {[cite: 3]
    const selectedProject = document.getElementById('project-filter')?.value || "";[cite: 3]
    let rekap = {};[cite: 3]
    (window.db.transaksi || []).forEach(t => {[cite: 3]
        if (selectedProject !== "" && t['Kode Project'] !== selectedProject) return;[cite: 3]
        let nama = t['Nama Barang (Auto)'] || '-';[cite: 3]
        let jml = parseInt(t['Jumlah'] || 0);[cite: 3]
        if(!rekap[nama]) rekap[nama] = { masuk: 0, keluar: 0 };[cite: 3]
        if(t['Tipe Transaksi'] === 'Masuk') rekap[nama].masuk += jml;[cite: 3]
        if(t['Tipe Transaksi'] === 'Keluar') rekap[nama].keluar += jml;[cite: 3]
    });

    let sortedNames = Object.keys(rekap).sort((a, b) => a.localeCompare(b));[cite: 3]
    let options = (window.db.project || []).map(p => `<option value="${p['Kode Project']}" ${selectedProject === p['Kode Project'] ? 'selected' : ''}>${p['Nama Project']}</option>`).join('');[cite: 3]
    let html = `
        <div class="sticky top-20 z-40 bg-white pt-2 pb-4 mb-4 border-b border-gray-200">
            <h2 class="text-[9pt] font-bold mb-4">Rekap Stok Proyek</h2>
            <label class="block text-[9pt] font-medium text-gray-700 mb-1">Pilih Proyek:</label>
            <select id="project-filter" onchange="renderRekapStokProyek()" class="w-full md:w-1/3 border p-2 rounded text-[9pt]">
                <option value="">-- Semua Proyek --</option>
                ${options}
            </select>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse border border-gray-200 table-compact">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Nama Barang</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Total Masuk</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Total Keluar</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Netto</th>
                    </tr>
                </thead>
                <tbody>`;[cite: 3] 
    sortedNames.forEach(nama => {[cite: 3]
        let netto = rekap[nama].masuk - rekap[nama].keluar;[cite: 3]
        html += `<tr>
            <td class="border text-[9pt] font-medium">${nama}</td>
            <td class="border text-[9pt]">${rekap[nama].masuk}</td>
            <td class="border text-[9pt]">${rekap[nama].keluar}</td>
            <td class="border text-[9pt] font-bold underline cursor-pointer hover:opacity-80 ${netto < 0 ? 'text-red-600' : 'text-green-600'}" onclick="showBreakdownProyek('${nama}')">${netto}</td>
        </tr>`;[cite: 3]
    });
    html += `</tbody></table></div>`;[cite: 3]
    
    const mainContent = document.getElementById('main-content');[cite: 3]
    if (mainContent) mainContent.innerHTML = html;[cite: 3]
}

function showBreakdownProyek(namaBarang) {[cite: 3]
    const selectedProject = document.getElementById('project-filter')?.value || "";[cite: 3]
    let breakdownList = [];[cite: 3]
    (window.db.transaksi || []).forEach(t => {[cite: 3]
        if(t['Nama Barang (Auto)'] === namaBarang) {[cite: 3]
            if (selectedProject === "" || t['Kode Project'] === selectedProject) {[cite: 3]
                let jml = parseInt(t['Jumlah'] || 0);[cite: 3]
                let effectiveJml = 0;[cite: 3]
                if(t['Tipe Transaksi'] === 'Masuk') effectiveJml = jml;[cite: 3]
                if(t['Tipe Transaksi'] === 'Keluar') effectiveJml = -jml;[cite: 3]

                breakdownList.push({[cite: 3]
                    kode: t['Kode Barang'] || '-',[cite: 3]
                    jumlah: effectiveJml !== 0 ? effectiveJml : jml[cite: 3]
                });
            }
        }
    });
    
    let aggregatedBreakdown = {};[cite: 3]
    breakdownList.forEach(item => {[cite: 3]
        if (!aggregatedBreakdown[item.kode]) {[cite: 3]
            aggregatedBreakdown[item.kode] = 0;[cite: 3]
        }
        aggregatedBreakdown[item.kode] += item.jumlah;[cite: 3]
    });

    const modalTitle = document.getElementById('modal-title');[cite: 3]
    const btnSave = document.getElementById('btn-save');[cite: 3]
    const dataForm = document.getElementById('data-form');[cite: 3]
    const modal = document.getElementById('modal');[cite: 3]

    if (modalTitle) modalTitle.innerText = `Breakdown Stok Proyek: ${namaBarang}`;[cite: 3]
    if (btnSave) btnSave.classList.add('hidden');[cite: 3]
    
    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse border border-gray-200 text-[9pt] table-compact">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Kode Barang</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Sisa</th>
                    </tr>
                </thead>
                <tbody>`;[cite: 3]
                
    let hasData = false;[cite: 3]
    for (let kode in aggregatedBreakdown) {[cite: 3]
        let sisa = aggregatedBreakdown[kode];[cite: 3]
        if (sisa > 0) {[cite: 3]
            hasData = true;[cite: 3]
            html += `<tr><td class="border text-[9pt] font-medium">${kode}</td><td class="border text-[9pt] font-bold">${sisa}</td></tr>`;[cite: 3]
        }
    }

    if(!hasData) {[cite: 3]
        html += `<tr><td colspan="2" class="text-center p-4 text-gray-400">Tidak ada data breakdown proyek</td></tr>`;[cite: 3]
    }
    
    html += `</tbody></table></div>`;[cite: 3]
    if (dataForm) dataForm.innerHTML = html;[cite: 3]
    if (modal) modal.classList.remove('hidden');[cite: 3]
}

function openModal(index) {[cite: 3]
    editIndex = parseInt(index, 10);[cite: 3]
    if (isNaN(editIndex)) editIndex = -1;[cite: 3]

    const btnSave = document.getElementById('btn-save');[cite: 3]
    if (btnSave) btnSave.classList.remove('hidden');[cite: 3]

    let btnPdf = document.getElementById('btn-print-pdf');[cite: 3]
    if (!btnPdf && btnSave && btnSave.parentNode) {[cite: 3]
        btnPdf = document.createElement('button');[cite: 3]
        btnPdf.id = 'btn-print-pdf';[cite: 3]
        btnPdf.className = "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-[9pt] hidden";[cite: 3]
        btnPdf.innerText = "Print PDF";[cite: 3]
        btnSave.parentNode.insertBefore(btnPdf, btnSave);[cite: 3]
    }
    
    const form = document.getElementById('data-form');[cite: 3]
    if (!form) return;[cite: 3]
    form.innerHTML = '';[cite: 3]
    
    const item = (editIndex === -1 || !window.db[currentSection]) ? {} : (window.db[currentSection][editIndex] || {});[cite: 3]
    const modalTitle = document.getElementById('modal-title');[cite: 3]
    if (modalTitle) modalTitle.innerText = editIndex === -1 ? 'Tambah Data' : 'Edit Data';[cite: 3]

    if (currentSection === 'transaksi') {[cite: 3]
        if (btnPdf) {[cite: 3]
            if (editIndex !== -1) {[cite: 3]
                btnPdf.classList.remove('hidden');[cite: 3]
                btnPdf.onclick = function() { printNotaPDF(window.db.transaksi[editIndex]); };[cite: 3]
            } else {
                btnPdf.classList.add('hidden');[cite: 3]
            }
        }

        form.className = "text-[9pt]";[cite: 3]
        let dateVal = item['Tanggal'] || new Date().toISOString().split('T')[0];[cite: 3]
        let docVal = item['No Doc'] || generateUniqueDocCode(dateVal);[cite: 3]
        let idDoToVal = item['ID DO-TO'] || '';[cite: 3]

        let gudangAsalCode = item['Gudang Asal'] || '';[cite: 3]
        let gudangAsalName = getGudangName(gudangAsalCode);[cite: 3]

        let gudangTujuanCode = item['Gudang Tujuan'] || '';[cite: 3]
        let gudangTujuanName = getGudangName(gudangTujuanCode);[cite: 3]

        let projectCode = item['Kode Project'] || '';[cite: 3]
        let projectName = getProjectName(projectCode);[cite: 3]

        let gudangAsalItems = `<div onclick="selectSearchableOption('gudang-asal-val', 'gudang-asal-input', 'gudang-asal-list', '', '', () => { onTipeTransaksiChange(); onGudangAsalChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] text-gray-500 italic searchable-item">-- Pilih Gudang Asal --</div>`;[cite: 3]
        (window.db.gudang || []).forEach(g => {[cite: 3]
            const safeName = (g['Nama Gudang'] || '').replace(/'/g, "\\'");[cite: 3]
            const safeCode = (g['Kode Gudang'] || '').replace(/'/g, "\\'");[cite: 3]
            gudangAsalItems += `<div onclick="selectSearchableOption('gudang-asal-val', 'gudang-asal-input', 'gudang-asal-list', '${safeCode}', '${safeName}', () => { onTipeTransaksiChange(); onGudangAsalChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] searchable-item">${g['Nama Gudang']}</div>`;[cite: 3]
        });

        let gudangTujuanItems = `<div onclick="selectSearchableOption('gudang-tujuan-val', 'gudang-tujuan-input', 'gudang-tujuan-list', '', '', () => { onGudangTujuanChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] text-gray-500 italic searchable-item">-- Pilih Gudang Tujuan --</div>`;[cite: 3]
        (window.db.gudang || []).forEach(g => {[cite: 3]
            const safeName = (g['Nama Gudang'] || '').replace(/'/g, "\\'");[cite: 3]
            const safeCode = (g['Kode Gudang'] || '').replace(/'/g, "\\'");[cite: 3]
            gudangTujuanItems += `<div onclick="selectSearchableOption('gudang-tujuan-val', 'gudang-tujuan-input', 'gudang-tujuan-list', '${safeCode}', '${safeName}', () => { onGudangTujuanChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] searchable-item">${g['Nama Gudang']}</div>`;[cite: 3]
        });

        let headerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 bg-gray-50 p-4 rounded border">
                <div>
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" name="Tanggal" value="${dateVal}" onchange="onTanggalChange(this.value)" class="w-full border p-1.5 rounded text-[8pt]" required>
                </div>
                <div>
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">No Doc</label>
                    <input type="text" name="No Doc" value="${docVal}" class="w-full border p-1.5 rounded text-[8pt] bg-white font-bold text-indigo-700" readonly required>
                </div>
                <div>
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">ID DO-TO</label>
                    <input type="text" name="ID DO-TO" value="${idDoToVal}" class="w-full border p-1.5 rounded text-[8pt] bg-white font-bold text-gray-800" required>
                </div>
                <div>
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">Tipe Transaksi</label>
                    <select name="Tipe Transaksi" onchange="onTipeTransaksiChange(); onGudangAsalChange();" class="w-full border p-1.5 rounded text-[8pt]">
                        <option value="Masuk" ${item['Tipe Transaksi'] === 'Masuk' ? 'selected' : ''}>Masuk</option>
                        <option value="Keluar" ${item['Tipe Transaksi'] === 'Keluar' ? 'selected' : ''}>Keluar</option>
                        <option value="Transfer" ${item['Tipe Transaksi'] === 'Transfer' ? 'selected' : ''}>Transfer</option>
                    </select>
                </div>
                <div class="relative searchable-container">
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">Gudang Asal</label>
                    <input type="hidden" name="Gudang Asal" id="gudang-asal-val" value="${gudangAsalCode}">
                    <input type="text" id="gudang-asal-input" value="${gudangAsalName}" placeholder="-- Pilih / Cari Gudang Asal --" onfocus="openSearchableDropdown('gudang-asal-list')" oninput="handleSearchableInput('gudang-asal-input', 'gudang-asal-val', 'gudang-asal-list')" class="w-full border p-1.5 rounded text-[8pt] bg-white cursor-pointer" autocomplete="off">
                    <div id="gudang-asal-list" class="searchable-list hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto z-50">
                        ${gudangAsalItems}
                    </div>
                </div>
                <div class="relative searchable-container">
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">Gudang Tujuan</label>
                    <input type="hidden" name="Gudang Tujuan" id="gudang-tujuan-val" value="${gudangTujuanCode}">
                    <input type="text" id="gudang-tujuan-input" value="${gudangTujuanName}" placeholder="-- Pilih / Cari Gudang Tujuan --" onfocus="openSearchableDropdown('gudang-tujuan-list')" oninput="handleSearchableInput('gudang-tujuan-input', 'gudang-tujuan-val', 'gudang-tujuan-list')" class="w-full border p-1.5 rounded text-[8pt] bg-white cursor-pointer" autocomplete="off">
                    <div id="gudang-tujuan-list" class="searchable-list hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto z-50">
                        ${gudangTujuanItems}
                    </div>
                </div>
                <div class="relative searchable-container">
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">Kode Project</label>
                    <input type="hidden" name="Kode Project" id="project-val" value="${projectCode}">
                    <input type="text" id="project-input" value="${projectName}" placeholder="-- Pilih / Cari Project --" onfocus="openSearchableDropdown('project-list-items')" oninput="handleSearchableInput('project-input', 'project-val', 'project-list-items')" class="w-full border p-1.5 rounded text-[8pt] bg-white cursor-pointer" autocomplete="off">
                    <div id="project-list-items" class="searchable-list hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto z-50">
                    </div>
                </div>
                <div>
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">Petugas <span class="text-red-500">*</span></label>
                    <input type="text" name="Petugas" value="${item['Petugas'] || ''}" class="w-full border p-1.5 rounded text-[8pt]" required>
                </div>
                <div class="col-span-2 md:col-span-4">
                    <label class="block text-[8pt] font-medium text-gray-700 mb-1">Keterangan <span class="text-red-500">*</span></label>
                    <input type="text" name="Keterangan" value="${item['Keterangan'] || ''}" class="w-full border p-1.5 rounded text-[8pt]" required>
                </div>
            </div>
            
            <div class="border-t pt-3">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-[10pt] text-gray-700">Detail Material</h3>
                    <button type="button" onclick="addTransactionRow()" class="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-500 text-[8pt] font-medium">+ Tambah Baris Material</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse border border-gray-300 table-compact">
                        <thead class="bg-gray-200">
                            <tr>
                                <th class="border p-1.5 text-[8pt]">Kategori</th>
                                <th class="border p-1.5 text-[8pt]">Jenis</th>
                                <th class="border p-1.5 text-[8pt] w-1/4">Kode Barang</th>
                                <th class="border p-1.5 text-[8pt]">Nama Barang</th>
                                <th class="border p-1.5 text-[8pt] w-20 text-center">Qty</th>
                                <th class="border p-1.5 text-[8pt] w-10 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="item-tbody"></tbody>
                    </table>
                </div>
            </div>
        `;[cite: 3]
        form.innerHTML = headerHTML;[cite: 3]
        const modal = document.getElementById('modal');[cite: 3]
        if (modal) modal.classList.remove('hidden');[cite: 3]

        onGudangAsalChange();[cite: 3]

        if (editIndex === -1) {[cite: 3]
            addTransactionRow();[cite: 3]
        } else {
            let sameDocItems = (window.db.transaksi || []).filter(t => t['No Doc'] === item['No Doc']);[cite: 3]
            
            if (sameDocItems.length > 0) {[cite: 3]
                sameDocItems.forEach(docItem => {[cite: 3]
                    addTransactionRow(docItem);[cite: 3]
                });
            } else {
                addTransactionRow(item);[cite: 3]
            }
        }
        return;
    }

    if (btnPdf) btnPdf.classList.add('hidden');[cite: 3]

    // Pengaturan tata letak kolom berdasarkan section
    if (currentSection === 'project') {[cite: 3]
        form.className = "grid grid-cols-1 md:grid-cols-3 gap-4 text-[9pt]";[cite: 3]
    } else {
        form.className = "grid grid-cols-2 gap-4 text-[9pt]";[cite: 3]
    }
    
    let keys = [];[cite: 3]
    if (currentSection === 'barang') {[cite: 3]
        keys = ['Kategori', 'Jenis', 'Kode Barang', 'Nama Barang'];[cite: 3]
    } else if (currentSection === 'project') {[cite: 3]
        keys = ['Periode', 'Type', 'Region', 'Kode Project', 'No PR-PO', 'Nama Project', 'PO Plan', 'PO Final', 'Status PO', 'Permit', 'Status SND', 'Civil Work', 'Status Doc'];[cite: 3]
    } else if (currentSection === 'gudang') {[cite: 3]
        keys = ['Kode Gudang', 'Nama Gudang'];[cite: 3]
    } else {
        keys = window.db[currentSection] && window.db[currentSection].length > 0 ? Object.keys(window.db[currentSection][0]) : [];[cite: 3]
    }

    keys.forEach(key => {[cite: 3]
        let isRequired = (key === 'Kode Project' || key === 'Nama Project' || key === 'Kode Gudang' || key === 'Nama Gudang' || key === 'Kode Barang') ? 'required' : '';[cite: 3]
        let inputHtml = '';[cite: 3]
        if (key === 'Periode') {[cite: 3]
            inputHtml = `<input type="date" name="${key}" value="${item[key] || ''}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>`;[cite: 3]
        } else if (key === 'Region' && currentSection === 'project') {[cite: 3]
            const regionOptions = ['ACH', 'BKT', 'PAD', 'PLB', 'PMN'];[cite: 3]
            let opts = `<option value="">-- Pilih Region --</option>`;[cite: 3]
            regionOptions.forEach(opt => {[cite: 3]
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;[cite: 3]
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;[cite: 3]
        } else if (key === 'Type' && currentSection === 'project') {
            const typeOptions = [
                'Distribusi',
                'Sub Feeder',
                'Hub Feeder',
                'Main Feeder',
                'MTI',
                'Permit',
                'Rectifikasi',
                'Uplink'
            ];
            let opts = `<option value="">-- Pilih Type --</option>`;
            typeOptions.forEach(opt => {
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;
        } else {
            inputHtml = `<input type="text" name="${key}" value="${item[key] || ''}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>`;[cite: 3]
        }
        form.innerHTML += `<div><label class="block text-[9pt] font-medium mb-1 text-gray-700">${key}</label>${inputHtml}</div>`;[cite: 3]
    });

    const modal = document.getElementById('modal');[cite: 3]
    if (modal) modal.classList.remove('hidden');[cite: 3]
}

function closeModal() {[cite: 3] 
    const modal = document.getElementById('modal');[cite: 3]
    if (modal) modal.classList.add('hidden');[cite: 3] 
}

window.autoConvertCableStock = function(tglTransaksi, petugas) {[cite: 3]
    if (!window.db.barang || !window.db.transaksi) return;[cite: 3]

    let stockPerGudang = {};[cite: 3]
    window.db.transaksi.forEach(t => {[cite: 3]
        let kode = t['Kode Barang'];[cite: 3]
        if (!kode) return;[cite: 3]
        let jml = parseInt(t['Jumlah'] || 0);[cite: 3]
        
        if (t['Tipe Transaksi'] === 'Masuk') {[cite: 3]
            let g = t['Gudang Tujuan'];[cite: 3]
            if (!stockPerGudang[g]) stockPerGudang[g] = {};[cite: 3]
            stockPerGudang[g][kode] = (stockPerGudang[g][kode] || 0) + jml;[cite: 3]
        } else if (t['Tipe Transaksi'] === 'Keluar') {[cite: 3]
            let g = t['Gudang Asal'];[cite: 3]
            if (!stockPerGudang[g]) stockPerGudang[g] = {};[cite: 3]
            stockPerGudang[g][kode] = (stockPerGudang[g][kode] || 0) - jml;[cite: 3]
        } else if (t['Tipe Transaksi'] === 'Transfer') {[cite: 3]
            let gAsal = t['Gudang Asal'];[cite: 3]
            let gTujuan = t['Gudang Tujuan'];[cite: 3]
            
            if (!stockPerGudang[gAsal]) stockPerGudang[gAsal] = {};[cite: 3]
            stockPerGudang[gAsal][kode] = (stockPerGudang[gAsal][kode] || 0) - jml;[cite: 3]
            
            if (!stockPerGudang[gTujuan]) stockPerGudang[gTujuan] = {};[cite: 3]
            stockPerGudang[gTujuan][kode] = (stockPerGudang[gTujuan][kode] || 0) + jml;[cite: 3]
        }
    });

    let cableItems = window.db.barang.filter(b =>[cite: 3] 
        (b['Kategori'] || '').toLowerCase() === 'cable' &&[cite: 3] 
        (b['Kode Barang'] || '').startsWith('Drum')[cite: 3]
    );

    cableItems.forEach(cable => {[cite: 3]
        let kodeAsal = cable['Kode Barang'];[cite: 3]
        
        for (let gudang in stockPerGudang) {[cite: 3]
            let sisaStok = stockPerGudang[gudang][kodeAsal] || 0;[cite: 3]
            
            if (sisaStok > 0 && sisaStok < 3000) {[cite: 3]
                let parts = kodeAsal.split('-');[cite: 3]
                let baseExt = parts[0].replace('Drum', 'Ext');[cite: 3] 
                
                let existingExt = window.db.barang.filter(b => (b['Kode Barang'] || '').startsWith(baseExt + '-'));[cite: 3]
                let maxSeq = 0;[cite: 3]
                
                existingExt.forEach(b => {[cite: 3]
                    let extParts = b['Kode Barang'].split('-');[cite: 3]
                    if (extParts.length > 1) {[cite: 3]
                        let seq = parseInt(extParts[1]);[cite: 3]
                        if (!isNaN(seq) && seq > maxSeq) {[cite: 3]
                            maxSeq = seq;[cite: 3]
                        }
                    }
                });
                
                let nextSeqStr = (maxSeq + 1).toString().padStart(2, '0');[cite: 3]
                let kodeBaru = `${baseExt}-${nextSeqStr}`;[cite: 3]
                let namaBaru = (cable['Nama Barang'] || '').replace('Drum', 'Ext');[cite: 3]
                
                if (!window.db.barang.find(b => b['Kode Barang'] === kodeBaru)) {[cite: 3]
                    window.db.barang.push({[cite: 3]
                        "Kategori": cable['Kategori'],[cite: 3]
                        "Jenis": cable['Jenis'],[cite: 3]
                        "Kode Barang": kodeBaru,[cite: 3]
                        "Nama Barang": namaBaru[cite: 3]
                    });
                }
                
                let noDocAuto = generateUniqueDocCode(tglTransaksi) + "-CNV-" + kodeBaru;[cite: 3] 
                
                window.db.transaksi.push({[cite: 3]
                    "Tanggal": tglTransaksi,[cite: 3]
                    "No Doc": noDocAuto,[cite: 3]
                    "ID DO-TO": "SYS-AUTO",[cite: 3]
                    "Tipe Transaksi": "Keluar",[cite: 3]
                    "Gudang Asal": gudang,[cite: 3]
                    "Gudang Tujuan": "",[cite: 3]
                    "Kode Project": "",[cite: 3]
                    "Kategori": cable['Kategori'],[cite: 3]
                    "Jenis": cable['Jenis'],[cite: 3]
                    "Kode Barang": kodeAsal,[cite: 3]
                    "Nama Barang (Auto)": cable['Nama Barang'],[cite: 3]
                    "Jumlah": sisaStok,[cite: 3]
                    "Petugas": petugas || "Sistem",[cite: 3]
                    "Keterangan": `Auto convert to ${kodeBaru} (Stock < 3000)`[cite: 3]
                });

                window.db.transaksi.push({[cite: 3]
                    "Tanggal": tglTransaksi,[cite: 3]
                    "No Doc": noDocAuto,[cite: 3]
                    "ID DO-TO": "SYS-AUTO",[cite: 3]
                    "Tipe Transaksi": "Masuk",[cite: 3]
                    "Gudang Asal": "",[cite: 3]
                    "Gudang Tujuan": gudang,[cite: 3]
                    "Kode Project": "",[cite: 3] 
                    "Kategori": cable['Kategori'],[cite: 3]
                    "Jenis": cable['Jenis'],[cite: 3]
                    "Kode Barang": kodeBaru,[cite: 3]
                    "Nama Barang (Auto)": namaBaru,[cite: 3]
                    "Jumlah": sisaStok,[cite: 3]
                    "Petugas": petugas || "Sistem",[cite: 3]
                    "Keterangan": `Auto convert from ${kodeAsal}`[cite: 3]
                });
                
                stockPerGudang[gudang][kodeAsal] = 0;[cite: 3]
            }
        }
    });
};

function saveData() {[cite: 3]
    try {
        const form = document.getElementById('data-form');[cite: 3]
        if (!form) {[cite: 3]
            alert("Error: Elemen modal #data-form tidak ditemukan!");[cite: 3]
            return;[cite: 3]
        }

        if (typeof form.checkValidity === 'function' && !form.checkValidity()) {[cite: 3]
            if (typeof form.reportValidity === 'function') form.reportValidity();[cite: 3]
            return;[cite: 3]
        }

        let editIdx = parseInt(editIndex, 10);[cite: 3]
        let isNewInput = (isNaN(editIdx) || editIdx === -1);[cite: 3]

        if (currentSection === 'transaksi') {[cite: 3]
            if (!validateCurrentRows()) return;[cite: 3]
        }

        let inputs = form.querySelectorAll('input, select, textarea');[cite: 3]

        // Validasi Duplikasi Kode Project
        if (currentSection === 'project') {[cite: 3]
            let kodeInputEl = form.querySelector('[name="Kode Project"]');[cite: 3]
            let kodeProjInput = kodeInputEl ? kodeInputEl.value.trim().toLowerCase() : '';[cite: 3]

            if (!kodeProjInput) {[cite: 3]
                alert('Kode Project tidak boleh kosong!');[cite: 3]
                return;[cite: 3]
            }

            let isDuplicate = (window.db.project || []).some((p, index) => {[cite: 3]
                if (!isNewInput && index === editIdx) return false;[cite: 3]
                return (p['Kode Project'] || '').trim().toLowerCase() === kodeProjInput;[cite: 3]
            });

            if (isDuplicate) {[cite: 3]
                alert('Kode Project sudah digunakan! Harap gunakan Kode Project yang lain.');[cite: 3]
                return;[cite: 3]
            }
        }

        // Simpan Data
        if (currentSection === 'transaksi') {[cite: 3]
            let tgl = form.querySelector('[name="Tanggal"]')?.value || '';[cite: 3]
            let idDoTo = form.querySelector('[name="ID DO-TO"]')?.value || '';[cite: 3]
            let docVal = form.querySelector('[name="No Doc"]')?.value || '';[cite: 3]
            let tipe = form.querySelector('[name="Tipe Transaksi"]')?.value || '';[cite: 3]
            let asal = form.querySelector('[name="Gudang Asal"]')?.value || '';[cite: 3]
            let tujuan = form.querySelector('[name="Gudang Tujuan"]')?.value || '';[cite: 3]
            let proj = form.querySelector('[name="Kode Project"]')?.value || '';[cite: 3]
            let petugas = form.querySelector('[name="Petugas"]')?.value || '';[cite: 3]
            let ket = form.querySelector('[name="Keterangan"]')?.value || '';[cite: 3]

            let kats = Array.from(form.querySelectorAll('[name="Kategori[]"]')).map(e => e.value);[cite: 3]
            let jens = Array.from(form.querySelectorAll('[name="Jenis[]"]')).map(e => e.value);[cite: 3]
            let kbs = Array.from(form.querySelectorAll('[name="Kode Barang[]"]')).map(e => e.value);[cite: 3]
            let nbs = Array.from(form.querySelectorAll('[name="Nama Barang (Auto)[]"]')).map(e => e.value);[cite: 3]
            let jmls = Array.from(form.querySelectorAll('[name="Jumlah[]"]')).map(e => e.value);[cite: 3]

            if (kats.length === 0) {[cite: 3]
                alert("Minimal harus ada 1 barang dalam transaksi!");[cite: 3]
                return;[cite: 3]
            }

            let newItems = [];[cite: 3]
            for (let i = 0; i < kats.length; i++) {[cite: 3]
                newItems.push({[cite: 3]
                    "Tanggal": tgl,[cite: 3]
                    "No Doc": docVal,[cite: 3]
                    "ID DO-TO": idDoTo,[cite: 3]
                    "Tipe Transaksi": tipe,[cite: 3]
                    "Gudang Asal": asal,[cite: 3]
                    "Gudang Tujuan": tujuan,[cite: 3]
                    "Kode Project": proj,[cite: 3]
                    "Kategori": kats[i],[cite: 3]
                    "Jenis": jens[i],[cite: 3]
                    "Kode Barang": kbs[i],[cite: 3]
                    "Nama Barang (Auto)": nbs[i],[cite: 3]
                    "Jumlah": parseInt(jmls[i] || 0),[cite: 3]
                    "Petugas": petugas,[cite: 3]
                    "Keterangan": ket[cite: 3]
                });
            }

            if (!window.db.transaksi) window.db.transaksi = [];[cite: 3]

            if (isNewInput) {[cite: 3]
                window.db.transaksi.push(...newItems);[cite: 3]
            } else {
                window.db.transaksi = window.db.transaksi.filter(t => t['No Doc'] !== docVal);[cite: 3]
                window.db.transaksi.push(...newItems);[cite: 3]
            }

            autoConvertCableStock(tgl, petugas);[cite: 3]
        } else {
            let newItem = {};[cite: 3]
            inputs.forEach(input => {[cite: 3]
                if (input.name && !input.name.endsWith('[]')) {[cite: 3]
                    newItem[input.name] = input.value;[cite: 3]
                }
            });

            if (!window.db[currentSection]) {[cite: 3]
                window.db[currentSection] = [];[cite: 3]
            }

            if (isNewInput) {[cite: 3]
                window.db[currentSection].push(newItem);[cite: 3]
            } else {
                if (editIdx >= 0 && editIdx < window.db[currentSection].length) {[cite: 3]
                    window.db[currentSection][editIdx] = newItem;[cite: 3]
                } else {
                    window.db[currentSection].push(newItem);[cite: 3]
                }
            }
        }

        saveToLocal();[cite: 3]
        syncToFirebase();[cite: 3]

        if (isNewInput) {[cite: 3]
            let lanjut = confirm("Data berhasil disimpan! Apakah Anda ingin lanjut Input Baru?");[cite: 3]
            if (lanjut) {[cite: 3]
                openModal(-1);[cite: 3]
            } else {
                closeModal();[cite: 3]
                renderTable(currentSection);[cite: 3]
            }
        } else {
            alert("Data berhasil diperbarui!");[cite: 3]
            closeModal();[cite: 3]
            renderTable(currentSection);[cite: 3]
        }

    } catch (err) {
        console.error("Save Error:", err);[cite: 3]
        alert("Terjadi kesalahan saat menyimpan: " + err.message);[cite: 3]
    }
}
