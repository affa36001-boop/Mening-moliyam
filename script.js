const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxOeUHVu7LKTXlGBRw7fYMl54mDCvXG07jEkzZMvIR3LdOKOwWTyMDaI20a21ehZ7Ok/exec';
const LOG_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKhtmkuO0XQRtc41afR_Wk6TnWla0JkcrDu_TdLmlKDkM6qpMr6nowdKI31vfhi8oUUP63GZ4aPzyy/pub?gid=955322529&single=true&output=csv';
const BAL_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKhtmkuO0XQRtc41afR_Wk6TnWla0JkcrDu_TdLmlKDkM6qpMr6nowdKI31vfhi8oUUP63GZ4aPzyy/pub?gid=0&single=true&output=csv';

async function fetchData() {
  try {
    const balRes = await fetch(`${BAL_URL}&t=${Date.now()}`);
    const balData = await balRes.text();
    const balRows = balData.split('\n').map((r) => r.split(','));

    const usdBal = balRows[2] ? balRows[2][2].replace(/"/g, '') : '0';
    const tryBal = balRows[4] ? balRows[4][2].replace(/"/g, '') : '0';
    const monthlyExp = balRows[2] ? balRows[2][4].replace(/"/g, '') : '0';

    const logRes = await fetch(`${LOG_URL}&t=${Date.now()}`);
    const logData = await logRes.text();
    const logRows = logData
      .split('\n')
      .map((r) => r.split(','))
      .slice(1);
    const lastActions = logRows
      .filter((r) => r[0])
      .reverse()
      .slice(0, 10);

    renderDashboard(usdBal, tryBal, monthlyExp, lastActions);
  } catch (e) {
    console.error(e);
  }
}

function renderDashboard(usd, tryCur, monthly, actions) {
  const content = document.getElementById('content');

  let actionsHtml = actions
    .map(
      (row) => `
        <div class="flex justify-between items-center p-4 mb-3 bg-white rounded-2xl shadow-sm border border-gray-50 active:scale-[0.98] transition-transform">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${
                  row[3].includes('expense')
                    ? 'bg-red-50 text-red-500'
                    : 'bg-green-50 text-green-500'
                }">
                    <span class="text-xs font-bold">${
                      row[3].includes('expense') ? 'OUT' : 'IN'
                    }</span>
                </div>
                <div>
                    <p class="font-bold text-gray-800 text-sm">${
                      row[4] || 'Izohsiz'
                    }</p>
                    <p class="text-[10px] text-gray-400 font-medium italic">${
                      row[0]
                    }</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-black ${
                  row[3].includes('expense') ? 'text-red-500' : 'text-green-500'
                }">
                    ${row[3].includes('expense') ? '-' : '+'}${row[2]}
                </p>
                <p class="text-[9px] text-gray-400 font-bold">${row[1]}</p>
            </div>
        </div>
    `
    )
    .join('');

  content.innerHTML = `
        <div class="bg-blue-600 p-6 pt-12 rounded-b-[40px] shadow-lg mb-6 sticky top-0 z-10">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-white text-3xl font-black">${usd} <span class="text-sm opacity-60">USD</span></h2>
                <button onclick="fetchData()" class="bg-white/20 p-2 rounded-xl text-white">↻</button>
            </div>
            <div class="flex justify-between text-blue-100 text-sm font-bold">
                <p>Lira: ${tryCur} TRY</p>
                <p>Xarajat: -${monthly} USD</p>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4 px-6 mb-8">
            <button onclick="openModal('expense')" class="h-20 bg-red-500 rounded-3xl shadow-lg flex flex-col items-center justify-center text-white active:scale-90 transition-transform">
                <span class="text-2xl font-bold">−</span>
                <span class="text-[10px] font-bold">Chiqim</span>
            </button>
            <button onclick="openModal('income')" class="h-20 bg-green-500 rounded-3xl shadow-lg flex flex-col items-center justify-center text-white active:scale-90 transition-transform">
                <span class="text-2xl font-bold">＋</span>
                <span class="text-[10px] font-bold">Kirim</span>
            </button>
            <button onclick="openExchange()" class="h-20 bg-blue-500 rounded-3xl shadow-lg flex flex-col items-center justify-center text-white active:scale-90 transition-transform">
                <span class="text-2xl font-bold">⇄</span>
                <span class="text-[10px] font-bold">Almashuv</span>
            </button>
        </div>

        <div class="px-6 pb-24">
            <h3 class="font-black text-gray-400 mb-4 uppercase text-[10px] tracking-widest">Oxirgi amallar</h3>
            ${
              actionsHtml ||
              '<p class="text-center py-10 text-gray-400 italic">Ma\'lumot yo\'q</p>'
            }
        </div>
    `;
}

window.openModal = function (type) {
  const modal = document.createElement('div');
  modal.className =
    'fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center';
  modal.innerHTML = `
        <div class="w-full max-w-sm bg-white rounded-t-[40px] p-8 pb-12">
            <div class="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h2 class="text-xl font-black mb-6 uppercase text-gray-800">${
              type === 'expense' ? 'Xarajat' : 'Daromad'
            }</h2>
            <div class="space-y-4">
                <select id="m-curr" class="w-full p-4 rounded-2xl bg-gray-100 font-bold border-none outline-none">
                    <option value="USD">USD ($)</option>
                    <option value="TRY">TRY (₺)</option>
                </select>
                <input type="number" id="m-amount" inputmode="decimal" placeholder="Summa" class="w-full p-4 rounded-2xl bg-gray-100 font-black text-xl border-none outline-none">
                <input type="text" id="m-note" placeholder="Izoh..." class="w-full p-4 rounded-2xl bg-gray-100 font-medium border-none outline-none">
                <div class="flex gap-3 pt-4">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 py-4 font-bold text-gray-400">Yopish</button>
                    <button id="saveBtn" class="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-transform">SAQLASH</button>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
  modal.querySelector('#saveBtn').onclick = () => {
    const amt = document.getElementById('m-amount').value;
    if (!amt) return alert('Summani kiriting!');
    sendToSheet(
      {
        currency: document.getElementById('m-curr').value,
        amount: amt,
        type: type,
        note: document.getElementById('m-note').value,
      },
      modal
    );
  };
};

async function sendToSheet(data, modal) {
  const btn = modal.querySelector('#saveBtn');
  btn.disabled = true;
  btn.innerText = '...';
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(data),
    });
    modal.remove();
    setTimeout(fetchData, 2000);
  } catch (e) {
    alert('Xatolik!');
    btn.disabled = false;
  }
}

fetchData();
