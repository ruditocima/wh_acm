const initialData = {
    "gudang": [
        {"Kode Gudang": "GDG-01", "Nama Gudang": "Gudang Pusat"}, 
        {"Kode Gudang": "GDG-02", "Nama Gudang": "Gudang Cabang"}
    ],
    "project": [
        {
            "Periode": "2026-07-16",
            "Type": "Distribusi",
            "Region": "ACH",
            "Kode Project": "PRJ-001", 
            "No PR-PO": "POS-2026-001",
            "Nama Project": "Proyek A",
            "PO Plan": "100",
            "PO Final": "100",
            "Status PO": "Sudah",
            "Permit": "BA Open",
            "Status SND": "SNDK",
            "Civil Work": "Done",
            "Status Doc": "On Progres"
        }
    ],
    "barang": [
        {"Kategori": "Material", "Jenis": "Besi", "Kode Barang": "BRG-001", "Nama Barang": "Besi Beton"}, 
        {"Kategori": "Material", "Jenis": "Semen", "Kode Barang": "BRG-002", "Nama Barang": "Semen Tiga Roda"},
        {"Kategori": "Tools", "Jenis": "Obeng", "Kode Barang": "BRG-003", "Nama Barang": "Obeng Plus"}
    ],
    "transaksi": [
        {
            "Tanggal": "2026-07-16", 
            "No Doc": "ACM-NPM-VII-2026-0001", 
            "ID DO-TO": "TX-001", 
            "Tipe Transaksi": "Masuk", 
            "Gudang Asal": "", 
            "Gudang Tujuan": "GDG-01", 
            "Kode Project": "PRJ-001",
            "Kategori": "Material", 
            "Jenis": "Besi", 
            "Kode Barang": "BRG-001", 
            "Nama Barang (Auto)": "Besi Beton", 
            "Jumlah": 100,
            "Petugas": "Budi", 
            "Keterangan": "Stok awal proyek" 
        }
    ]
};

// --- INISIALISASI DATABASE ---
if (!window.db) {
    let localData = localStorage.getItem('wms_app_data');
    window.db = localData ? JSON.parse(localData) : initialData;
}

let currentSection = 'gudang';
let editIndex = -1;

function saveToLocal() { 
    localStorage.setItem('wms_app_data', JSON.stringify(window.db)); 
}

function syncToFirebase() {
    if (typeof window.syncToFirebase === 'function') {
        window.syncToFirebase();
    }
}

function deleteData(index) {
    if(confirm("Yakin ingin menghapus data ini?")) {
        window.db[currentSection].splice(index, 1);
        saveToLocal();
        syncToFirebase();
        renderTable(currentSection);
    }
}

/* Helper fungsi untuk menghitung stok barang di Gudang tertentu */
function getGudangStock(gudangKode, kodeBarang) {
    if (!gudangKode || !kodeBarang) return 0;
    let st = 0;
    (window.db.transaksi || []).forEach(t => {
        if (t['Kode Barang'] !== kodeBarang) return;
        let jml = parseInt(t['Jumlah'] || 0);
        if (t['Gudang Tujuan'] === gudangKode) st += jml;
        if (t['Gudang Asal'] === gudangKode) st -= jml;
    });
    return st;
}

/* Helper fungsi untuk Auto Generate Kode Barang Baru bertipe Drum */
function autoGenerateNextDrumBarang(jenisVal, kategoriVal) {
    let drumBarang = (window.db.barang || []).filter(b => 
        (b['Kategori'] || '').toLowerCase() === (kategoriVal || 'cable').toLowerCase() &&
        b['Jenis'] === jenisVal &&
        (b['Kode Barang'] || '').startsWith('Drum')
    );

    if (drumBarang.length === 0) return null;

    let maxSeq = 0;
    let basePrefix = "";
    let padLen = 2;
    let sampleNama = drumBarang[0]['Nama Barang'] || '';

    drumBarang.forEach(b => {
        let code = b['Kode Barang'] || '';
        let match = code.match(/^(.*?)(\d+)$/);
        if (match) {
            basePrefix = match[1];
            let seqStr = match[2];
            padLen = seqStr.length;
            let seq = parseInt(seqStr, 10);
            if (seq > maxSeq) {
                maxSeq = seq;
                sampleNama = b['Nama Barang'] || sampleNama;
            }
        }
    });

    if (!basePrefix) return null;

    let nextSeq = maxSeq + 1;
    let nextSeqStr = nextSeq.toString().padStart(padLen, '0');
    let newKode = basePrefix + nextSeqStr;

    let newNama = sampleNama;
    let namaMatch = sampleNama.match(/^(.*?)(\d+)$/);
    if (namaMatch) {
        newNama = namaMatch[1] + nextSeqStr;
    }

    let newBarangObj = {
        "Kategori": kategoriVal,
        "Jenis": jenisVal,
        "Kode Barang": newKode,
        "Nama Barang": newNama
    };

    if (!window.db.barang.find(b => b['Kode Barang'] === newKode)) {
        window.db.barang.push(newBarangObj);
        saveToLocal();
        syncToFirebase();
    }

    return newBarangObj;
}

/* Helper fungsi Searchable Dropdown */
function getGudangName(code) {
    if (!code) return '';
    let g = (window.db.gudang || []).find(x => x['Kode Gudang'] === code);
    return g ? g['Nama Gudang'] : code;
}

function getProjectName(code) {
    if (!code) return '';
    let p = (window.db.project || []).find(x => x['Kode Project'] === code);
    return p ? p['Nama Project'] : code;
}

function openSearchableDropdown(listId) {
    document.querySelectorAll('.searchable-list').forEach(el => {
        if (el.id !== listId) el.classList.add('hidden');
    });
    const list = document.getElementById(listId);
    if (list) list.classList.remove('hidden');
}

function handleSearchableInput(inputId, hiddenId, listId) {
    openSearchableDropdown(listId);
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    if (input && hidden && input.value === '') {
        hidden.value = '';
    }

    const filter = input ? input.value.toLowerCase() : '';
    const list = document.getElementById(listId);
    if (!list) return;

    const items = list.querySelectorAll('.searchable-item');
    items.forEach(item => {
        const txt = item.textContent || item.innerText;
        if (txt.toLowerCase().includes(filter)) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}

function selectSearchableOption(hiddenId, inputId, listId, code, name, callback) {
    const hidden = document.getElementById(hiddenId);
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    if (hidden) hidden.value = code;
    if (input) input.value = name;
    if (list) list.classList.add('hidden');

    if (typeof callback === 'function') {
        callback();
    }
}

if (!window.searchableListenerAdded) {
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.searchable-container')) {
            document.querySelectorAll('.searchable-list').forEach(el => el.classList.add('hidden'));
        }
    });
    window.searchableListenerAdded = true;
}

function printNotaPDF(t) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4'); 
    
    let allItems = window.db.transaksi.filter(x => x['No Doc'] === t['No Doc']);
    
    doc.setFont("helvetica", "normal"); 
    doc.setFontSize(12); 
    doc.text("NOTA PERMINTAAN MATERIAL", 40, 60);
    doc.setFontSize(10); 
    doc.text("PT Acero Cetha Metalindo", 40, 75); 

    doc.setFontSize(8); 
    doc.text(`No. Doc : ${t['No Doc'] || '-'}`, 40, 95);
    doc.text(`ID DO-TO: ${t['ID DO-TO'] || '-'}`, 40, 110);
    
    doc.text(`Tanggal : ${t['Tanggal'] || '-'}`, 550, 95, { align: 'right' });
    doc.text(`Tipe Transaksi : ${t['Tipe Transaksi'] || '-'}`, 550, 110, { align: 'right' });

    let bodyData = [];
    allItems.forEach(item => {
        bodyData.push([
            item['Kode Barang'] || '-',
            item['Nama Barang (Auto)'] || '-',
            item['Jumlah'] || '0',
            window.db.gudang.find(g => g['Kode Gudang'] === item['Gudang Asal'])?.['Nama Gudang'] || '-',
            window.db.gudang.find(g => g['Kode Gudang'] === item['Gudang Tujuan'])?.['Nama Gudang'] || '-',
            window.db.project.find(p => p['Kode Project'] === item['Kode Project'])?.['Nama Project'] || '-',
            item['Keterangan'] || '-'
        ]);
    });
    
    while (bodyData.length < 12) {
        bodyData.push(['', '', '', '', '', '', '']);
    }

    doc.autoTable({
        startY: 125,
        head: [['ID BRG', 'NAMA MATERIAL', 'QTY', 'DARI', 'TUJUAN', 'NAMA PROYEK', 'KETERANGAN']],
        body: bodyData,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 8 },
        bodyStyles: { halign: 'center', valign: 'middle', fontSize: 8 },
        columnStyles: { 1: { halign: 'left' } }
    });

    let counts = {};
    let sums = {};
    allItems.forEach(item => {
        let nama = item['Nama Barang (Auto)'] || '-';
        let qty = parseInt(item['Jumlah'] || 0);
        counts[nama] = (counts[nama] || 0) + 1;
        sums[nama] = (sums[nama] || 0) + qty;
    });

    let noteTexts = [];
    for (let nama in counts) {
        if (counts[nama] > 1) { 
            noteTexts.push(`${nama} : ${sums[nama]}`);
        }
    }

    let currentY = doc.lastAutoTable.finalY + 15; 
    
    if (noteTexts.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Note : ${noteTexts.join(', ')}`, 40, currentY);
        currentY += 20; 
    } else {
        currentY += 10;
    }

    let finalY = currentY + 10;
    doc.setFontSize(8); 
    doc.setFont("helvetica", "normal"); 

    doc.text("Pickup by,", 40, finalY);
    let namaPetugas = t['Petugas'] || '';
    if (namaPetugas) { doc.text(namaPetugas.toUpperCase(), 40, finalY + 38); }
    doc.line(40, finalY + 40, 140, finalY + 40); 

    doc.text("Disetujui oleh,", 230, finalY);
    doc.line(230, finalY + 40, 330, finalY + 40); 

    doc.text("Diketahui oleh,", 420, finalY);
    doc.text("RUDI", 420, finalY + 38);
    doc.line(420, finalY + 40, 520, finalY + 40);

    doc.save(`NOTA_${t['No Doc']}.pdf`);
}

function exportCSV() {
    let data = window.db[currentSection];
    if (!data || data.length === 0) return alert("Tidak ada data untuk diexport!");
    let csv = Object.keys(data[0]).join(',') + '\n';
    data.forEach(row => {
        csv += Object.values(row).map(val => `"${val}"`).join(',') + '\n';
    });
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = currentSection + '.csv';
    a.click();
}

function exportRekapStokCSV() {
    const selectedGudang = document.getElementById('gudang-filter')?.value || "";
    let rekap = {};
    window.db.transaksi.forEach(t => {
        let nama = t['Nama Barang (Auto)'] || '-';
        let jml = parseInt(t['Jumlah'] || 0);
        if(!rekap[nama]) rekap[nama] = { masuk: 0, keluar: 0, t_masuk: 0, t_keluar: 0 };
        let isGudangRelevant = (selectedGudang === "" || t['Gudang Asal'] === selectedGudang || t['Gudang Tujuan'] === selectedGudang);
        if(isGudangRelevant) {
            if(t['Tipe Transaksi'] === 'Masuk' && (selectedGudang === "" || t['Gudang Tujuan'] === selectedGudang)) rekap[nama].masuk += jml;
            if(t['Tipe Transaksi'] === 'Keluar' && (selectedGudang === "" || t['Gudang Asal'] === selectedGudang)) rekap[nama].keluar += jml;
            if(t['Tipe Transaksi'] === 'Transfer') {
                if(t['Gudang Tujuan'] === selectedGudang || selectedGudang === "") rekap[nama].t_masuk += jml;
                if(t['Gudang Asal'] === selectedGudang || selectedGudang === "") rekap[nama].t_keluar += jml;
            }
        }
    });

    let sortedKeys = Object.keys(rekap).sort((a, b) => a.localeCompare(b));

    let csv = 'Nama Barang,Masuk,Keluar,T. Masuk,T. Keluar,Sisa\n';
    sortedKeys.forEach(nama => {
        let sisa = rekap[nama].masuk - rekap[nama].keluar + rekap[nama].t_masuk - rekap[nama].t_keluar;
        csv += `"${nama}",${rekap[nama].masuk},${rekap[nama].keluar},${rekap[nama].t_masuk},${rekap[nama].t_keluar},${sisa}\n`;
    });
    
    let namaGudang = "Semua_Gudang";
    if (selectedGudang) {
        let g = window.db.gudang.find(x => x['Kode Gudang'] === selectedGudang);
        if (g) namaGudang = g['Nama Gudang'].replace(/\s+/g, '_');
    }
    
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Rekap_Stok_${namaGudang}.csv`;
    a.click();
}

function renderDashboard() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
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
    `;
}

function searchTransaksi() {
    const searchDoc = document.getElementById('search-doc');
    const query = searchDoc ? searchDoc.value.trim().toLowerCase() : '';
    renderTable('transaksi', query);
}

function renderTable(section, searchQuery = '') {
    currentSection = section;
    
    if (!window.db[section]) window.db[section] = [];

    const selectedGudangFilter = (section === 'transaksi') ? (document.getElementById('transaksi-gudang-filter')?.value || '') : '';

    if (section === 'transaksi') {
        window.db[section].sort((a, b) => new Date(b['Tanggal'] || 0) - new Date(a['Tanggal'] || 0));
    } else if (section === 'barang') {
        window.db[section].sort((a, b) => {
            let catA = (a['Kategori'] || "").toLowerCase();
            let catB = (b['Kategori'] || "").toLowerCase();
            let jenisA = (a['Jenis'] || "").toLowerCase();
            let jenisB = (b['Jenis'] || "").toLowerCase();
            let kodeA = (a['Kode Barang'] || "").toLowerCase();
            let kodeB = (b['Kode Barang'] || "").toLowerCase();

            if (catA !== catB) return catA.localeCompare(catB);
            if (jenisA !== jenisB) return jenisA.localeCompare(jenisB);
            return kodeA.localeCompare(kodeB);
        });
    } else if (section === 'project') {
        window.db[section].sort((a, b) => {
            let codeA = (a['Kode Project'] || "").toLowerCase();
            let codeB = (b['Kode Project'] || "").toLowerCase();
            return codeA.localeCompare(codeB);
        });
    } else if (section === 'gudang') {
        window.db[section].sort((a, b) => {
            let codeA = (a['Kode Gudang'] || "").toLowerCase();
            let codeB = (b['Kode Gudang'] || "").toLowerCase();
            return codeA.localeCompare(codeB);
        });
    }
    
    let data = window.db[section];

    if (section === 'transaksi' && searchQuery) {
        data = data.filter(item => (item['No Doc'] || '').toLowerCase().includes(searchQuery));
    }

    if (section === 'transaksi' && selectedGudangFilter) {
        data = data.filter(item => 
            item['Gudang Asal'] === selectedGudangFilter || item['Gudang Tujuan'] === selectedGudangFilter
        );
    }
    
    let exportBtn = (section === 'transaksi' || section === 'barang' || section === 'project') ? `<button onclick="exportCSV()" class="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-500 mr-2 text-[9pt]">Export CSV</button>` : '';
    
    let searchBar = '';
    if (section === 'transaksi') {
        const existingSearchDoc = document.getElementById('search-doc');
        const gudangOptions = (window.db.gudang || []).map(g => `<option value="${g['Kode Gudang']}" ${selectedGudangFilter === g['Kode Gudang'] ? 'selected' : ''}>${g['Nama Gudang']}</option>`).join('');
        
        searchBar = `
            <div class="flex flex-wrap items-center gap-2 mr-4">
                <select id="transaksi-gudang-filter" onchange="renderTable('transaksi')" class="border p-2 rounded text-[9pt]">
                    <option value="">-- Semua Gudang --</option>
                    ${gudangOptions}
                </select>
                <input type="text" id="search-doc" value="${searchQuery ? (existingSearchDoc?.value || '') : ''}" placeholder="Cari No Doc..." class="border p-2 rounded text-[9pt] w-36 md:w-48">
                <button onclick="searchTransaksi()" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-500 text-[9pt]">Cari</button>
            </div>
        `;
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
                <thead class="bg-gray-50"><tr>`;
    
    if (data.length > 0) {
        let keys = Object.keys(data[0]);
        if (section === 'transaksi') {
            keys = ['Tanggal', 'No Doc', 'ID DO-TO', 'Tipe Transaksi', 'Gudang Asal', 'Gudang Tujuan', 'Kode Project', 'Kategori', 'Jenis', 'Kode Barang', 'Nama Barang (Auto)', ...keys.filter(k => !['Tanggal', 'No Doc', 'ID DO-TO', 'Tipe Transaksi', 'Gudang Asal', 'Gudang Tujuan', 'Kode Project', 'Kategori', 'Jenis', 'Kode Barang', 'Nama Barang (Auto)'].includes(k))];
        } else if (section === 'barang') {
            keys = ['Kategori', 'Jenis', 'Kode Barang', 'Nama Barang', ...keys.filter(k => !['Kategori', 'Jenis', 'Kode Barang', 'Nama Barang'].includes(k))];
        } else if (section === 'project') {
            keys = ['Periode', 'Type', 'Region', 'Kode Project', 'No PR-PO', 'Nama Project', 'PO Plan', 'PO Final', 'Status PO', 'Permit', 'Status SND', 'Civil Work', 'Status Doc', ...keys.filter(k => !['Periode', 'Type', 'Region', 'Kode Project', 'No PR-PO', 'Nama Project', 'PO Plan', 'PO Final', 'Status PO', 'Permit', 'Status SND', 'Civil Work', 'Status Doc'].includes(k))];
        }

        keys.forEach(k => html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">${k}</th>`);
        html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">Aksi</th></tr></thead><tbody>`;

        data.forEach((item) => {
            let originalIndex = window.db[section].indexOf(item);
            html += `<tr class="hover:bg-gray-50 border-b">`;
            
            keys.forEach(k => {
                html += `<td class="border text-[9pt] text-gray-800">${item[k] !== undefined ? item[k] : ''}</td>`;
            });
            
            let aksi = `<button onclick="openModal(${originalIndex})" class="text-blue-600 hover:underline text-[9pt] font-bold">Edit</button>`;
            if (section === 'barang' || section === 'transaksi' || section === 'gudang' || section === 'project') {
                aksi += ` | <button onclick="deleteData(${originalIndex})" class="text-red-600 hover:underline text-[9pt] font-bold">Hapus</button>`;
            }
            html += `<td class="border">${aksi}</td></tr>`;
        });
    } else {
        let defaultKeys = [];
        if(section === 'barang') defaultKeys = ["Kategori", "Jenis", "Kode Barang", "Nama Barang"];
        else if(section === 'transaksi') defaultKeys = ["Tanggal", "No Doc", "ID DO-TO", "Tipe Transaksi", "Gudang Asal", "Gudang Tujuan", "Kode Project", "Kategori", "Jenis", "Kode Barang", "Nama Barang (Auto)", "Jumlah", "Petugas", "Keterangan"];
        else if(section === 'gudang') defaultKeys = ["Kode Gudang", "Nama Gudang"];
        else if(section === 'project') defaultKeys = ["Periode", "Type", "Region", "Kode Project", "No PR-PO", "Nama Project", "PO Plan", "PO Final", "Status PO", "Permit", "Status SND", "Civil Work", "Status Doc"];

        defaultKeys.forEach(k => html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">${k}</th>`);
        html += `<th class="border text-[9pt] font-bold uppercase text-gray-600">Aksi</th></tr></thead><tbody><tr><td colspan="${defaultKeys.length + 1}" class="text-center p-4 text-gray-400">Tidak ada data ditemukan</td></tr>`;
    }
    html += `</tbody></table></div>`;
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.innerHTML = html;
}

function getRomanMonth(date) {
    const months = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    return months[date.getMonth()];
}

function generateUniqueDocCode(dateStr) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const year = date.getFullYear();
    const month = getRomanMonth(date);
    
    const prefix = `ACM-NPM-${month}-${year}-`;
    
    const existingDocs = (window.db.transaksi || [])
        .filter(t => {
            if (!t['Tanggal']) return false;
            return new Date(t['Tanggal']).getFullYear() === year;
        })
        .map(t => t['No Doc']);

    let maxNum = 0;
    existingDocs.forEach(doc => {
        if (doc) {
            const parts = doc.split('-');
            if (parts.length >= 5) {
                const num = parseInt(parts[4], 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
    });

    return prefix + (maxNum + 1).toString().padStart(4, '0');
}

function onTanggalChange(val) {
    const docInput = document.querySelector('input[name="No Doc"]');
    if (docInput) {
        docInput.value = generateUniqueDocCode(val);
    }
}

function onTipeTransaksiChange() {
    const tbody = document.getElementById('item-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        addTransactionRow();
    }
    onGudangAsalChange();
}

function onGudangTujuanChange() {
    const rows = document.querySelectorAll('#item-tbody tr');
    rows.forEach(tr => {
        let jenisSelect = tr.querySelector('select[name="Jenis[]"]');
        if (jenisSelect && jenisSelect.value) {
            let currentKode = tr.querySelector('select[name="Kode Barang[]"]')?.value || '';
            onJenisChangeRow(jenisSelect, currentKode);
        }
    });
}

function onGudangAsalChange() {
    const tipeTransaksi = document.querySelector('[name="Tipe Transaksi"]')?.value;
    const gudangAsal = document.querySelector('[name="Gudang Asal"]')?.value;
    const projectListContainer = document.getElementById('project-list-items');
    const projectHidden = document.getElementById('project-val');
    const projectInput = document.getElementById('project-input');

    const rows = document.querySelectorAll('#item-tbody tr');
    rows.forEach(tr => {
        let jenisSelect = tr.querySelector('select[name="Jenis[]"]');
        if (jenisSelect && jenisSelect.value) {
            let currentKode = tr.querySelector('select[name="Kode Barang[]"]')?.value || '';
            onJenisChangeRow(jenisSelect, currentKode);
        }
    });

    if (!projectListContainer) return;

    let selectedProjectVal = projectHidden ? projectHidden.value : '';
    let filteredProjects = window.db.project || [];

    if (tipeTransaksi === 'Keluar') {
        if (!gudangAsal) {
            filteredProjects = [];
        } else {
            let targetPrefix = "";
            if (gudangAsal.startsWith('ACM-ACH')) targetPrefix = 'ACH';
            else if (gudangAsal.startsWith('ACM-PLB')) targetPrefix = 'PLB';
            else if (gudangAsal.startsWith('ACM-PMN')) targetPrefix = 'PMN';
            else if (gudangAsal.startsWith('ACM-BKT')) targetPrefix = 'BKT';
            else if (gudangAsal.startsWith('ACM-PAD')) targetPrefix = 'PAD';

            if (targetPrefix) {
                filteredProjects = filteredProjects.filter(p => (p['Kode Project'] || "").startsWith(targetPrefix));
            } else {
                filteredProjects = [];
            }
        }
    }

    let currentProjObj = filteredProjects.find(p => p['Kode Project'] === selectedProjectVal);
    if (!currentProjObj) {
        if (projectHidden) projectHidden.value = '';
        if (projectInput) projectInput.value = '';
    } else {
        if (projectInput) projectInput.value = currentProjObj['Nama Project'];
    }

    let listHTML = `<div onclick="selectSearchableOption('project-val', 'project-input', 'project-list-items', '', '', null)" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] text-gray-500 italic searchable-item">-- Pilih Project --</div>`;

    filteredProjects.forEach(p => {
        const safeName = (p['Nama Project'] || '').replace(/'/g, "\\'");
        const safeCode = (p['Kode Project'] || '').replace(/'/g, "\\'");
        listHTML += `<div onclick="selectSearchableOption('project-val', 'project-input', 'project-list-items', '${safeCode}', '${safeName}', null)" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] searchable-item">${p['Nama Project']}</div>`;
    });

    projectListContainer.innerHTML = listHTML;
}

function validateCurrentRows() {
    const tipeTransaksi = document.querySelector('[name="Tipe Transaksi"]')?.value || 'Masuk';
    const selectedGudangAsal = document.querySelector('[name="Gudang Asal"]')?.value || '';
    const selectedGudangTujuan = document.querySelector('[name="Gudang Tujuan"]')?.value || '';

    const rows = document.querySelectorAll('#item-tbody tr');
    for (let row of rows) {
        let kategori = row.querySelector('select[name="Kategori[]"]')?.value || '';
        let kodeBarang = row.querySelector('select[name="Kode Barang[]"]')?.value;
        let qtyInput = row.querySelector('input[name="Jumlah[]"]');
        let qty = parseInt(qtyInput?.value || 0);

        if ((tipeTransaksi === 'Keluar' || tipeTransaksi === 'Transfer') && kodeBarang && selectedGudangAsal) {
            let sisaStok = getGudangStock(selectedGudangAsal, kodeBarang);
            if (qty > sisaStok) {
                alert(`Stok ${kodeBarang} tidak mencukupi di Gudang Asal! (Sisa stok: ${sisaStok})`);
                if (qtyInput) qtyInput.focus();
                return false;
            }
        }

        if (kategori.toLowerCase() === 'cable' && kodeBarang && kodeBarang.startsWith('Drum')) {
            if (qty > 3000) {
                alert(`Jumlah input untuk ${kodeBarang} tidak boleh melebihi 3000!`);
                if (qtyInput) qtyInput.focus();
                return false;
            }

            if (tipeTransaksi === 'Masuk' || tipeTransaksi === 'Transfer') {
                let currentTargetStock = getGudangStock(selectedGudangTujuan, kodeBarang);
                if (currentTargetStock + qty > 3000) {
                    alert(`Total stok ${kodeBarang} di Gudang Tujuan tidak boleh melebihi 3000! (Stok saat ini: ${currentTargetStock}, Input: ${qty})`);
                    if (qtyInput) qtyInput.focus();
                    return false;
                }
            }
        }
    }
    return true;
}

function addTransactionRow(item = {}) {
    const tbody = document.getElementById('item-tbody');
    if (!tbody) return;

    if (tbody.children.length > 0) {
        if (!validateCurrentRows()) {
            return;
        }
    }

    let tr = document.createElement('tr');
    
    let categories = [...new Set((window.db.barang || []).map(b => b['Kategori']))];
    let catOptions = categories.map(c => `<option value="${c}" ${item['Kategori'] === c ? 'selected' : ''}>${c}</option>`).join('');

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
    `;
    tbody.appendChild(tr);

    if (item['Kategori']) {
        let catSelect = tr.querySelector('select[name="Kategori[]"]');
        onKategoriChangeRow(catSelect, item['Jenis'], item['Kode Barang']);
    }
}

function onKategoriChangeRow(el, preselectJenis = '', preselectKode = '') {
    let tr = el.closest('tr');
    let val = el.value;
    let jenisSelect = tr.querySelector('select[name="Jenis[]"]');
    let kodeSelect = tr.querySelector('select[name="Kode Barang[]"]');
    let namaInput = tr.querySelector('input[name="Nama Barang (Auto)[]"]');
    
    if (!jenisSelect || !kodeSelect || !namaInput) return;

    jenisSelect.innerHTML = '<option value="">-- Pilih --</option>';
    kodeSelect.innerHTML = '<option value="">-- Pilih --</option>';
    namaInput.value = '';

    if (val) {
        let filteredJenis = [...new Set((window.db.barang || []).filter(b => b['Kategori'] === val).map(b => b['Jenis']))];
        filteredJenis.forEach(j => {
            jenisSelect.innerHTML += `<option value="${j}" ${preselectJenis === j ? 'selected' : ''}>${j}</option>`;
        });
        if(preselectJenis) onJenisChangeRow(jenisSelect, preselectKode);
    }
}

function onJenisChangeRow(el, preselectKode = '') {
    let tr = el.closest('tr');
    let kategoriVal = tr.querySelector('select[name="Kategori[]"]')?.value || '';
    let jenisVal = el.value;
    let kodeSelect = tr.querySelector('select[name="Kode Barang[]"]');
    let namaInput = tr.querySelector('input[name="Nama Barang (Auto)[]"]');

    if (!kodeSelect || !namaInput) return;

    kodeSelect.innerHTML = '<option value="">-- Pilih --</option>';
    namaInput.value = '';

    if (jenisVal && kategoriVal) {
        const tipeTransaksi = document.querySelector('[name="Tipe Transaksi"]')?.value || 'Masuk';
        const selectedGudangAsal = document.querySelector('[name="Gudang Asal"]')?.value || '';
        const selectedGudangTujuan = document.querySelector('[name="Gudang Tujuan"]')?.value || '';

        if ((tipeTransaksi === 'Keluar' || tipeTransaksi === 'Transfer') && !selectedGudangAsal) {
            kodeSelect.innerHTML = '<option value="">-- Pilih Gudang Asal Dulu --</option>';
            return;
        }
        if ((tipeTransaksi === 'Masuk' || tipeTransaksi === 'Transfer') && kategoriVal.toLowerCase() === 'cable' && !selectedGudangTujuan) {
            kodeSelect.innerHTML = '<option value="">-- Pilih Gudang Tujuan Dulu --</option>';
            return;
        }

        let selectedKodeInRows = new Set();
        document.querySelectorAll('#item-tbody tr').forEach(row => {
            let sel = row.querySelector('select[name="Kode Barang[]"]');
            if (sel && sel.value && row !== tr) {
                selectedKodeInRows.add(sel.value);
            }
        });

        if (kategoriVal.toLowerCase() === 'cable' && (tipeTransaksi === 'Masuk' || tipeTransaksi === 'Transfer')) {
            let drumBarang = (window.db.barang || []).filter(b => 
                (b['Kategori'] || '').toLowerCase() === 'cable' &&
                b['Jenis'] === jenisVal &&
                (b['Kode Barang'] || '').startsWith('Drum')
            );

            if (drumBarang.length > 0) {
                let availableDrumBarang = drumBarang.filter(b => {
                    if (tipeTransaksi === 'Transfer') {
                        let stokAsal = getGudangStock(selectedGudangAsal, b['Kode Barang']);
                        if (stokAsal <= 0) return false;
                    }
                    let stokTujuan = getGudangStock(selectedGudangTujuan, b['Kode Barang']);
                    return stokTujuan === 0;
                });

                let autoGenerated = false;
                let autoGeneratedCode = '';

                if (tipeTransaksi === 'Masuk' && availableDrumBarang.length === 0) {
                    let newBarang = autoGenerateNextDrumBarang(jenisVal, kategoriVal);
                    if (newBarang) {
                        availableDrumBarang = [newBarang];
                        autoGenerated = true;
                        autoGeneratedCode = newBarang['Kode Barang'];
                    }
                }

                let nonDrumBarang = (window.db.barang || []).filter(b => 
                    (b['Kategori'] || '').toLowerCase() === 'cable' &&
                    b['Jenis'] === jenisVal &&
                    !(b['Kode Barang'] || '').startsWith('Drum') &&
                    !(b['Kode Barang'] || '').startsWith('Ext')
                );

                let finalFiltered = [...availableDrumBarang, ...nonDrumBarang].filter(b => !selectedKodeInRows.has(b['Kode Barang']));

                finalFiltered.forEach(b => {
                    let isSelected = (preselectKode === b['Kode Barang']) || (autoGenerated && b['Kode Barang'] === autoGeneratedCode);
                    kodeSelect.innerHTML += `<option value="${b['Kode Barang']}" ${isSelected ? 'selected' : ''}>${b['Kode Barang']} - ${b['Nama Barang']}</option>`;
                });

                if (autoGenerated || preselectKode) {
                    updateNamaBarangRow(kodeSelect);
                }
                return;
            }
        }

        let filteredBarang = (window.db.barang || []).filter(b => {
            if (b['Kategori'] !== kategoriVal || b['Jenis'] !== jenisVal) return false;
            if (selectedKodeInRows.has(b['Kode Barang'])) return false;

            if (tipeTransaksi === 'Keluar' || tipeTransaksi === 'Transfer') {
                let stokAsal = getGudangStock(selectedGudangAsal, b['Kode Barang']);
                if (stokAsal <= 0) return false; 
            }

            if (tipeTransaksi === 'Masuk') {
                if ((b['Kode Barang'] || '').startsWith('Ext')) {
                    return false;
                }

                if (kategoriVal.toLowerCase() === 'cable') {
                    let stokTujuan = getGudangStock(selectedGudangTujuan, b['Kode Barang']);
                    if (stokTujuan > 0) return false;
                }
            }

            return true;
        });

        filteredBarang.forEach(b => {
            kodeSelect.innerHTML += `<option value="${b['Kode Barang']}" ${preselectKode === b['Kode Barang'] ? 'selected' : ''}>${b['Kode Barang']} - ${b['Nama Barang']}</option>`;
        });
        if(preselectKode) updateNamaBarangRow(kodeSelect);
    }
}

function updateNamaBarangRow(el) {
    let tr = el.closest('tr');
    let kode = el.value;
    const barang = (window.db.barang || []).find(b => b['Kode Barang'] === kode);
    const namaInput = tr.querySelector('input[name="Nama Barang (Auto)[]"]');
    if (namaInput) namaInput.value = barang ? barang['Nama Barang'] : '';
}

function renderRekapStok() {
    const selectedGudang = document.getElementById('gudang-filter')?.value || "";
    let rekap = {};
    (window.db.transaksi || []).forEach(t => {
        let nama = t['Nama Barang (Auto)'] || '-';
        let jml = parseInt(t['Jumlah'] || 0);
        if(!rekap[nama]) rekap[nama] = { masuk: 0, keluar: 0, t_masuk: 0, t_keluar: 0 };
        let isGudangRelevant = (selectedGudang === "" || t['Gudang Asal'] === selectedGudang || t['Gudang Tujuan'] === selectedGudang);
        if(isGudangRelevant) {
            if(t['Tipe Transaksi'] === 'Masuk' && (selectedGudang === "" || t['Gudang Tujuan'] === selectedGudang)) rekap[nama].masuk += jml;
            if(t['Tipe Transaksi'] === 'Keluar' && (selectedGudang === "" || t['Gudang Asal'] === selectedGudang)) rekap[nama].keluar += jml;
            if(t['Tipe Transaksi'] === 'Transfer') {
                if(t['Gudang Tujuan'] === selectedGudang || selectedGudang === "") rekap[nama].t_masuk += jml;
                if(t['Gudang Asal'] === selectedGudang || selectedGudang === "") rekap[nama].t_keluar += jml;
            }
        }
    });

    let sortedNames = Object.keys(rekap).sort((a, b) => a.localeCompare(b));
    let options = (window.db.gudang || []).map(g => `<option value="${g['Kode Gudang']}" ${selectedGudang === g['Kode Gudang'] ? 'selected' : ''}>${g['Nama Gudang']}</option>`).join('');
    
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
                <tbody>`;
                
    sortedNames.forEach(nama => {
        let sisa = rekap[nama].masuk - rekap[nama].keluar + rekap[nama].t_masuk - rekap[nama].t_keluar;
        html += `<tr><td class="border text-[9pt] font-medium">${nama}</td><td class="border text-[9pt]">${rekap[nama].masuk}</td><td class="border text-[9pt]">${rekap[nama].keluar}</td><td class="border text-[9pt]">${rekap[nama].t_masuk}</td><td class="border text-[9pt]">${rekap[nama].t_keluar}</td><td class="border text-[9pt] font-bold text-blue-600 underline cursor-pointer hover:text-blue-800" onclick="showBreakdown('${nama}')">${sisa}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.innerHTML = html;
}

function showBreakdown(namaBarang) {
    const selectedGudang = document.getElementById('gudang-filter')?.value || "";
    let breakdownList = [];
    (window.db.transaksi || []).forEach(t => {
        if(t['Nama Barang (Auto)'] === namaBarang) {
            let isGudangRelevant = (selectedGudang === "" || t['Gudang Asal'] === selectedGudang || t['Gudang Tujuan'] === selectedGudang);
            if(isGudangRelevant) {
                let jml = parseInt(t['Jumlah'] || 0);
                let effectiveJml = 0;
                if(t['Tipe Transaksi'] === 'Masuk' && (selectedGudang === "" || t['Gudang Tujuan'] === selectedGudang)) effectiveJml = jml;
                else if(t['Tipe Transaksi'] === 'Keluar' && (selectedGudang === "" || t['Gudang Asal'] === selectedGudang)) effectiveJml = -jml;
                else if(t['Tipe Transaksi'] === 'Transfer') {
                    if(t['Gudang Tujuan'] === selectedGudang) effectiveJml = jml;
                    else if(t['Gudang Asal'] === selectedGudang) effectiveJml = -jml;
                    else if(selectedGudang === "") effectiveJml = 0;
                }
                
                if (effectiveJml !== 0 || selectedGudang === "") {
                    breakdownList.push({
                        kode: t['Kode Barang'] || '-',
                        jumlah: effectiveJml !== 0 ? effectiveJml : jml
                    });
                }
            }
        }
    });

    let aggregatedBreakdown = {};
    breakdownList.forEach(item => {
        if (!aggregatedBreakdown[item.kode]) {
            aggregatedBreakdown[item.kode] = 0;
        }
        aggregatedBreakdown[item.kode] += item.jumlah;
    });

    const modalTitle = document.getElementById('modal-title');
    const btnSave = document.getElementById('btn-save');
    const dataForm = document.getElementById('data-form');
    const modal = document.getElementById('modal');

    if (modalTitle) modalTitle.innerText = `Breakdown Stok: ${namaBarang}`;
    if (btnSave) btnSave.classList.add('hidden');
    
    let html = `<div class="overflow-x-auto"><table class="w-full text-left border-collapse border border-gray-200 text-[9pt] table-compact"><thead class="bg-gray-100"><tr><th class="border text-[9pt] font-bold uppercase text-gray-600">Kode Barang</th><th class="border text-[9pt] font-bold uppercase text-gray-600">Sisa</th></tr></thead><tbody>`;
    
    let hasData = false;
    for (let kode in aggregatedBreakdown) {
        let sisa = aggregatedBreakdown[kode];
        if (sisa > 0) {
            hasData = true;
            html += `<tr><td class="border text-[9pt] font-medium">${kode}</td><td class="border text-[9pt] font-bold">${sisa}</td></tr>`;
        }
    }

    if(!hasData) {
        html += `<tr><td colspan="2" class="text-center p-4 text-gray-400">Tidak ada data breakdown</td></tr>`;
    }

    html += `</tbody></table></div>`;
    if (dataForm) dataForm.innerHTML = html;
    if (modal) modal.classList.remove('hidden');
}

function renderRekapStokProyek() {
    const selectedProject = document.getElementById('project-filter')?.value || "";
    let rekap = {};
    (window.db.transaksi || []).forEach(t => {
        if (selectedProject !== "" && t['Kode Project'] !== selectedProject) return;
        let nama = t['Nama Barang (Auto)'] || '-';
        let jml = parseInt(t['Jumlah'] || 0);
        if(!rekap[nama]) rekap[nama] = { masuk: 0, keluar: 0 };
        if(t['Tipe Transaksi'] === 'Masuk') rekap[nama].masuk += jml;
        if(t['Tipe Transaksi'] === 'Keluar') rekap[nama].keluar += jml;
    });

    let sortedNames = Object.keys(rekap).sort((a, b) => a.localeCompare(b));
    let options = (window.db.project || []).map(p => `<option value="${p['Kode Project']}" ${selectedProject === p['Kode Project'] ? 'selected' : ''}>${p['Nama Project']}</option>`).join('');
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
                <tbody>`; 
    sortedNames.forEach(nama => {
        let netto = rekap[nama].masuk - rekap[nama].keluar;
        html += `<tr>
            <td class="border text-[9pt] font-medium">${nama}</td>
            <td class="border text-[9pt]">${rekap[nama].masuk}</td>
            <td class="border text-[9pt]">${rekap[nama].keluar}</td>
            <td class="border text-[9pt] font-bold underline cursor-pointer hover:opacity-80 ${netto < 0 ? 'text-red-600' : 'text-green-600'}" onclick="showBreakdownProyek('${nama}')">${netto}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.innerHTML = html;
}

function showBreakdownProyek(namaBarang) {
    const selectedProject = document.getElementById('project-filter')?.value || "";
    let breakdownList = [];
    (window.db.transaksi || []).forEach(t => {
        if(t['Nama Barang (Auto)'] === namaBarang) {
            if (selectedProject === "" || t['Kode Project'] === selectedProject) {
                let jml = parseInt(t['Jumlah'] || 0);
                let effectiveJml = 0;
                if(t['Tipe Transaksi'] === 'Masuk') effectiveJml = jml;
                if(t['Tipe Transaksi'] === 'Keluar') effectiveJml = -jml;

                breakdownList.push({
                    kode: t['Kode Barang'] || '-',
                    jumlah: effectiveJml !== 0 ? effectiveJml : jml
                });
            }
        }
    });
    
    let aggregatedBreakdown = {};
    breakdownList.forEach(item => {
        if (!aggregatedBreakdown[item.kode]) {
            aggregatedBreakdown[item.kode] = 0;
        }
        aggregatedBreakdown[item.kode] += item.jumlah;
    });

    const modalTitle = document.getElementById('modal-title');
    const btnSave = document.getElementById('btn-save');
    const dataForm = document.getElementById('data-form');
    const modal = document.getElementById('modal');

    if (modalTitle) modalTitle.innerText = `Breakdown Stok Proyek: ${namaBarang}`;
    if (btnSave) btnSave.classList.add('hidden');
    
    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse border border-gray-200 text-[9pt] table-compact">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Kode Barang</th>
                        <th class="border text-[9pt] font-bold uppercase text-gray-600">Sisa</th>
                    </tr>
                </thead>
                <tbody>`;
                
    let hasData = false;
    for (let kode in aggregatedBreakdown) {
        let sisa = aggregatedBreakdown[kode];
        if (sisa > 0) {
            hasData = true;
            html += `<tr><td class="border text-[9pt] font-medium">${kode}</td><td class="border text-[9pt] font-bold">${sisa}</td></tr>`;
        }
    }

    if(!hasData) {
        html += `<tr><td colspan="2" class="text-center p-4 text-gray-400">Tidak ada data breakdown proyek</td></tr>`;
    }
    
    html += `</tbody></table></div>`;
    if (dataForm) dataForm.innerHTML = html;
    if (modal) modal.classList.remove('hidden');
}

function openModal(index) {
    editIndex = parseInt(index, 10);
    if (isNaN(editIndex)) editIndex = -1;

    const btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.classList.remove('hidden');

    let btnPdf = document.getElementById('btn-print-pdf');
    if (!btnPdf && btnSave && btnSave.parentNode) {
        btnPdf = document.createElement('button');
        btnPdf.id = 'btn-print-pdf';
        btnPdf.className = "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-[9pt] hidden";
        btnPdf.innerText = "Print PDF";
        btnSave.parentNode.insertBefore(btnPdf, btnSave);
    }
    
    const form = document.getElementById('data-form');
    if (!form) return;
    form.innerHTML = '';
    
    const item = (editIndex === -1 || !window.db[currentSection]) ? {} : (window.db[currentSection][editIndex] || {});
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.innerText = editIndex === -1 ? 'Tambah Data' : 'Edit Data';

    if (currentSection === 'transaksi') {
        if (btnPdf) {
            if (editIndex !== -1) {
                btnPdf.classList.remove('hidden');
                btnPdf.onclick = function() { printNotaPDF(window.db.transaksi[editIndex]); };
            } else {
                btnPdf.classList.add('hidden');
            }
        }

        form.className = "text-[9pt]";
        let dateVal = item['Tanggal'] || new Date().toISOString().split('T')[0];
        let docVal = item['No Doc'] || generateUniqueDocCode(dateVal);
        let idDoToVal = item['ID DO-TO'] || '';

        let gudangAsalCode = item['Gudang Asal'] || '';
        let gudangAsalName = getGudangName(gudangAsalCode);

        let gudangTujuanCode = item['Gudang Tujuan'] || '';
        let gudangTujuanName = getGudangName(gudangTujuanCode);

        let projectCode = item['Kode Project'] || '';
        let projectName = getProjectName(projectCode);

        let gudangAsalItems = `<div onclick="selectSearchableOption('gudang-asal-val', 'gudang-asal-input', 'gudang-asal-list', '', '', () => { onTipeTransaksiChange(); onGudangAsalChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] text-gray-500 italic searchable-item">-- Pilih Gudang Asal --</div>`;
        (window.db.gudang || []).forEach(g => {
            const safeName = (g['Nama Gudang'] || '').replace(/'/g, "\\'");
            const safeCode = (g['Kode Gudang'] || '').replace(/'/g, "\\'");
            gudangAsalItems += `<div onclick="selectSearchableOption('gudang-asal-val', 'gudang-asal-input', 'gudang-asal-list', '${safeCode}', '${safeName}', () => { onTipeTransaksiChange(); onGudangAsalChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] searchable-item">${g['Nama Gudang']}</div>`;
        });

        let gudangTujuanItems = `<div onclick="selectSearchableOption('gudang-tujuan-val', 'gudang-tujuan-input', 'gudang-tujuan-list', '', '', () => { onGudangTujuanChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] text-gray-500 italic searchable-item">-- Pilih Gudang Tujuan --</div>`;
        (window.db.gudang || []).forEach(g => {
            const safeName = (g['Nama Gudang'] || '').replace(/'/g, "\\'");
            const safeCode = (g['Kode Gudang'] || '').replace(/'/g, "\\'");
            gudangTujuanItems += `<div onclick="selectSearchableOption('gudang-tujuan-val', 'gudang-tujuan-input', 'gudang-tujuan-list', '${safeCode}', '${safeName}', () => { onGudangTujuanChange(); })" class="p-2 hover:bg-indigo-50 cursor-pointer text-[8pt] searchable-item">${g['Nama Gudang']}</div>`;
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
        `;
        form.innerHTML = headerHTML;
        const modal = document.getElementById('modal');
        if (modal) modal.classList.remove('hidden');

        onGudangAsalChange();

        if (editIndex === -1) {
            addTransactionRow();
        } else {
            let sameDocItems = (window.db.transaksi || []).filter(t => t['No Doc'] === item['No Doc']);
            
            if (sameDocItems.length > 0) {
                sameDocItems.forEach(docItem => {
                    addTransactionRow(docItem);
                });
            } else {
                addTransactionRow(item);
            }
        }
        return;
    }

    if (btnPdf) btnPdf.classList.add('hidden');

    // Pengaturan tata letak kolom berdasarkan section
    if (currentSection === 'project') {
        form.className = "grid grid-cols-1 md:grid-cols-3 gap-4 text-[9pt]";
    } else {
        form.className = "grid grid-cols-2 gap-4 text-[9pt]";
    }
    
    let keys = [];
    if (currentSection === 'barang') {
        keys = ['Kategori', 'Jenis', 'Kode Barang', 'Nama Barang'];
    } else if (currentSection === 'project') {
        keys = ['Periode', 'Type', 'Region', 'Kode Project', 'No PR-PO', 'Nama Project', 'PO Plan', 'PO Final', 'Status PO', 'Permit', 'Status SND', 'Civil Work', 'Status Doc'];
    } else if (currentSection === 'gudang') {
        keys = ['Kode Gudang', 'Nama Gudang'];
    } else {
        keys = window.db[currentSection] && window.db[currentSection].length > 0 ? Object.keys(window.db[currentSection][0]) : [];
    }

    keys.forEach(key => {
        let isRequired = (key === 'Kode Project' || key === 'Nama Project' || key === 'Kode Gudang' || key === 'Nama Gudang' || key === 'Kode Barang') ? 'required' : '';
        let inputHtml = '';
        if (key === 'Periode') {
            inputHtml = `<input type="date" name="${key}" value="${item[key] || ''}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>`;
        } else if (key === 'Type' && currentSection === 'project') {
            const typeOptions = ['Distribusi', 'Sub Feeder', 'Hub Feeder', 'Main Feeder', 'MTI', 'Permit', 'Rectifikasi', 'Uplink'];
            let opts = `<option value="">-- Pilih Type --</option>`;
            typeOptions.forEach(opt => {
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;
        } else if (key === 'Region' && currentSection === 'project') {
            const regionOptions = ['ACH', 'BKT', 'PAD', 'PLB', 'PMN'];
            let opts = `<option value="">-- Pilih Region --</option>`;
            regionOptions.forEach(opt => {
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;
        } else if (key === 'Status PO' && currentSection === 'project') {
            const poStatusOptions = ['Belum', 'Sudah', 'Closed'];
            let opts = `<option value="">-- Pilih Status PO --</option>`;
            poStatusOptions.forEach(opt => {
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;
        } else if (key === 'Permit' && currentSection === 'project') {
            const permitOptions = ['BA Open', 'Donasi', 'BA Closed', 'Wait PO', 'Invoice', 'Closed'];
            let opts = `<option value="">-- Pilih Permit --</option>`;
            permitOptions.forEach(opt => {
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;
        } else if (key === 'Status SND' && currentSection === 'project') {
            const sndStatusOptions = ['SNDK', 'Design', 'Pre APD', 'APD', 'DRM', 'Pre ABD', 'ABD', 'Closed'];
            let opts = `<option value="">-- Pilih Status SND --</option>`;
            sndStatusOptions.forEach(opt => {
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;
        } else if (key === 'Status Doc' && currentSection === 'project') {
            const docStatusOptions = ['On Progres', 'Upload GDOC', 'Review YOFC', 'Review User', 'Revisi', 'Rekoncile', 'Closed'];
            let opts = `<option value="">-- Pilih Status Doc --</option>`;
            docStatusOptions.forEach(opt => {
                opts += `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`;
            });
            inputHtml = `<select name="${key}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>${opts}</select>`;
        } else {
            inputHtml = `<input type="text" name="${key}" value="${item[key] || ''}" class="w-full border p-2 rounded text-[9pt]" ${isRequired}>`;
        }
        form.innerHTML += `<div><label class="block text-[9pt] font-medium mb-1 text-gray-700">${key}</label>${inputHtml}</div>`;
    });

    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('hidden');
}

function closeModal() { 
    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('hidden'); 
}

window.autoConvertCableStock = function(tglTransaksi, petugas) {
    if (!window.db.barang || !window.db.transaksi) return;

    let stockPerGudang = {};
    window.db.transaksi.forEach(t => {
        let kode = t['Kode Barang'];
        if (!kode) return;
        let jml = parseInt(t['Jumlah'] || 0);
        
        if (t['Tipe Transaksi'] === 'Masuk') {
            let g = t['Gudang Tujuan'];
            if (!stockPerGudang[g]) stockPerGudang[g] = {};
            stockPerGudang[g][kode] = (stockPerGudang[g][kode] || 0) + jml;
        } else if (t['Tipe Transaksi'] === 'Keluar') {
            let g = t['Gudang Asal'];
            if (!stockPerGudang[g]) stockPerGudang[g] = {};
            stockPerGudang[g][kode] = (stockPerGudang[g][kode] || 0) - jml;
        } else if (t['Tipe Transaksi'] === 'Transfer') {
            let gAsal = t['Gudang Asal'];
            let gTujuan = t['Gudang Tujuan'];
            
            if (!stockPerGudang[gAsal]) stockPerGudang[gAsal] = {};
            stockPerGudang[gAsal][kode] = (stockPerGudang[gAsal][kode] || 0) - jml;
            
            if (!stockPerGudang[gTujuan]) stockPerGudang[gTujuan] = {};
            stockPerGudang[gTujuan][kode] = (stockPerGudang[gTujuan][kode] || 0) + jml;
        }
    });

    let cableItems = window.db.barang.filter(b => 
        (b['Kategori'] || '').toLowerCase() === 'cable' && 
        (b['Kode Barang'] || '').startsWith('Drum')
    );

    cableItems.forEach(cable => {
        let kodeAsal = cable['Kode Barang'];
        
        for (let gudang in stockPerGudang) {
            let sisaStok = stockPerGudang[gudang][kodeAsal] || 0;
            
            if (sisaStok > 0 && sisaStok < 3000) {
                let parts = kodeAsal.split('-');
                let baseExt = parts[0].replace('Drum', 'Ext'); 
                
                let existingExt = window.db.barang.filter(b => (b['Kode Barang'] || '').startsWith(baseExt + '-'));
                let maxSeq = 0;
                
                existingExt.forEach(b => {
                    let extParts = b['Kode Barang'].split('-');
                    if (extParts.length > 1) {
                        let seq = parseInt(extParts[1]);
                        if (!isNaN(seq) && seq > maxSeq) {
                            maxSeq = seq;
                        }
                    }
                });
                
                let nextSeqStr = (maxSeq + 1).toString().padStart(2, '0');
                let kodeBaru = `${baseExt}-${nextSeqStr}`;
                let namaBaru = (cable['Nama Barang'] || '').replace('Drum', 'Ext');
                
                if (!window.db.barang.find(b => b['Kode Barang'] === kodeBaru)) {
                    window.db.barang.push({
                        "Kategori": cable['Kategori'],
                        "Jenis": cable['Jenis'],
                        "Kode Barang": kodeBaru,
                        "Nama Barang": namaBaru
                    });
                }
                
                let noDocAuto = generateUniqueDocCode(tglTransaksi) + "-CNV-" + kodeBaru; 
                
                window.db.transaksi.push({
                    "Tanggal": tglTransaksi,
                    "No Doc": noDocAuto,
                    "ID DO-TO": "SYS-AUTO",
                    "Tipe Transaksi": "Keluar",
                    "Gudang Asal": gudang,
                    "Gudang Tujuan": "",
                    "Kode Project": "",
                    "Kategori": cable['Kategori'],
                    "Jenis": cable['Jenis'],
                    "Kode Barang": kodeAsal,
                    "Nama Barang (Auto)": cable['Nama Barang'],
                    "Jumlah": sisaStok,
                    "Petugas": petugas || "Sistem",
                    "Keterangan": `Auto convert to ${kodeBaru} (Stock < 3000)`
                });

                window.db.transaksi.push({
                    "Tanggal": tglTransaksi,
                    "No Doc": noDocAuto,
                    "ID DO-TO": "SYS-AUTO",
                    "Tipe Transaksi": "Masuk",
                    "Gudang Asal": "",
                    "Gudang Tujuan": gudang,
                    "Kode Project": "", 
                    "Kategori": cable['Kategori'],
                    "Jenis": cable['Jenis'],
                    "Kode Barang": kodeBaru,
                    "Nama Barang (Auto)": namaBaru,
                    "Jumlah": sisaStok,
                    "Petugas": petugas || "Sistem",
                    "Keterangan": `Auto convert from ${kodeAsal}`
                });
                
                stockPerGudang[gudang][kodeAsal] = 0;
            }
        }
    });
};

function saveData() {
    try {
        const form = document.getElementById('data-form');
        if (!form) {
            alert("Error: Elemen modal #data-form tidak ditemukan!");
            return;
        }

        if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
            if (typeof form.reportValidity === 'function') form.reportValidity();
            return;
        }

        let editIdx = parseInt(editIndex, 10);
        let isNewInput = (isNaN(editIdx) || editIdx === -1);

        if (currentSection === 'transaksi') {
            if (!validateCurrentRows()) return;
        }

        let inputs = form.querySelectorAll('input, select, textarea');

        // Validasi Duplikasi Kode Project
        if (currentSection === 'project') {
            let kodeInputEl = form.querySelector('[name="Kode Project"]');
            let kodeProjInput = kodeInputEl ? kodeInputEl.value.trim().toLowerCase() : '';

            if (!kodeProjInput) {
                alert('Kode Project tidak boleh kosong!');
                return;
            }

            let isDuplicate = (window.db.project || []).some((p, index) => {
                if (!isNewInput && index === editIdx) return false;
                return (p['Kode Project'] || '').trim().toLowerCase() === kodeProjInput;
            });

            if (isDuplicate) {
                alert('Kode Project sudah digunakan! Harap gunakan Kode Project yang lain.');
                return;
            }
        }

        // Simpan Data
        if (currentSection === 'transaksi') {
            let tgl = form.querySelector('[name="Tanggal"]')?.value || '';
            let idDoTo = form.querySelector('[name="ID DO-TO"]')?.value || '';
            let docVal = form.querySelector('[name="No Doc"]')?.value || '';
            let tipe = form.querySelector('[name="Tipe Transaksi"]')?.value || '';
            let asal = form.querySelector('[name="Gudang Asal"]')?.value || '';
            let tujuan = form.querySelector('[name="Gudang Tujuan"]')?.value || '';
            let proj = form.querySelector('[name="Kode Project"]')?.value || '';
            let petugas = form.querySelector('[name="Petugas"]')?.value || '';
            let ket = form.querySelector('[name="Keterangan"]')?.value || '';

            let kats = Array.from(form.querySelectorAll('[name="Kategori[]"]')).map(e => e.value);
            let jens = Array.from(form.querySelectorAll('[name="Jenis[]"]')).map(e => e.value);
            let kbs = Array.from(form.querySelectorAll('[name="Kode Barang[]"]')).map(e => e.value);
            let nbs = Array.from(form.querySelectorAll('[name="Nama Barang (Auto)[]"]')).map(e => e.value);
            let jmls = Array.from(form.querySelectorAll('[name="Jumlah[]"]')).map(e => e.value);

            if (kats.length === 0) {
                alert("Minimal harus ada 1 barang dalam transaksi!");
                return;
            }

            let newItems = [];
            for (let i = 0; i < kats.length; i++) {
                newItems.push({
                    "Tanggal": tgl,
                    "No Doc": docVal,
                    "ID DO-TO": idDoTo,
                    "Tipe Transaksi": tipe,
                    "Gudang Asal": asal,
                    "Gudang Tujuan": tujuan,
                    "Kode Project": proj,
                    "Kategori": kats[i],
                    "Jenis": jens[i],
                    "Kode Barang": kbs[i],
                    "Nama Barang (Auto)": nbs[i],
                    "Jumlah": parseInt(jmls[i] || 0),
                    "Petugas": petugas,
                    "Keterangan": ket
                });
            }

            if (!window.db.transaksi) window.db.transaksi = [];

            if (isNewInput) {
                window.db.transaksi.push(...newItems);
            } else {
                window.db.transaksi = window.db.transaksi.filter(t => t['No Doc'] !== docVal);
                window.db.transaksi.push(...newItems);
            }

            autoConvertCableStock(tgl, petugas);
        } else {
            let newItem = {};
            inputs.forEach(input => {
                if (input.name && !input.name.endsWith('[]')) {
                    newItem[input.name] = input.value;
                }
            });

            if (!window.db[currentSection]) {
                window.db[currentSection] = [];
            }

            if (isNewInput) {
                window.db[currentSection].push(newItem);
            } else {
                if (editIdx >= 0 && editIdx < window.db[currentSection].length) {
                    window.db[currentSection][editIdx] = newItem;
                } else {
                    window.db[currentSection].push(newItem);
                }
            }
        }

        saveToLocal();
        syncToFirebase();

        if (isNewInput) {
            let lanjut = confirm("Data berhasil disimpan! Apakah Anda ingin lanjut Input Baru?");
            if (lanjut) {
                openModal(-1);
            } else {
                closeModal();
                renderTable(currentSection);
            }
        } else {
            alert("Data berhasil diperbarui!");
            closeModal();
            renderTable(currentSection);
        }

    } catch (err) {
        console.error("Save Error:", err);
        alert("Terjadi kesalahan saat menyimpan: " + err.message);
    }
}
