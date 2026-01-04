/* ================== НАСТРОЙКИ ================== */

const BAL_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKhtmkuO0XQRtc41afR_Wk6TnWla0JkcrDu_TdLmlKDkM6qpMr6nowdKI31vfhi8oUUP63GZ4aPzyy/pub?gid=0&single=true&output=csv';

const LOG_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKhtmkuO0XQRtc41afR_Wk6TnWla0JkcrDu_TdLmlKDkM6qpMr6nowdKI31vfhi8oUUP63GZ4aPzyy/pub?gid=955322529&single=true&output=csv';


/* ================== ЗАГРУЗКА ================== */

document.addEventListener('DOMContentLoaded', fetchData);

async function fetchData() {
  try {
    const nocache = `&t=${Date.now()}`;

    const [balRes, logRes] = await Promise.all([
      fetch(BAL_URL + nocache),
      fetch(LOG_URL + nocache)
    ]);

    const balText = await balRes.text();
    const logText = await logRes.text();

    /* ===== BALANCE ===== */
    const balRows = balText
      .replace(/\r/g, '')
      .split('\n')
      .map(r => r.split(','));

    // C3 и C5
    const balanceUSD = balRows[2]?.[2] || '0';
    const balanceTRY = balRows[4]?.[2] || '0';

    /* ===== LOG ===== */
    const actions = logText
      .replace(/\r/g, '')
      .split('\n')
      .slice(1)
      .map(r => r.split(','))
      .filter(r => r.length >= 4 && r[0].trim() !== '')
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));

    localStorage.setItem(
      'moliyam_cache',
      JSON.stringify({ balanceUSD, balanceTRY, actions })
    );

    renderDashboard(balanceUSD, balanceTRY, actions);
  } catch (e) {
    document.getElementById('content').innerHTML =
      '<div class="p-6 text-center text-red-500 font-bold">Ошибка загрузки данных</div>';
  }
}


/* ================== ГЛАВНЫЙ ЭКРАН ================== */

function renderDashboard(usd, tryBal, actions) {
  document.getElementById('content').innerHTML = `
    <div class="bg-blue-600 text-white rounded-b-[40px] p-6">
      <div class="text-[11px] opacity-70 uppercase">Основной баланс</div>
      <div class="text-4xl font-black mt-1">${usd} USD</div>
      <div class="text-lg opacity-80 mt-1">${tryBal} TRY</div>
    </div>

    <!-- ВИДЖЕТ КНОПОК -->
    <div class="grid grid-cols-4 gap-3 p-4">
      <button class="bg-red-500 text-white rounded-2xl py-4 font-black active:scale-95">−</button>
      <button class="bg-green-500 text-white rounded-2xl py-4 font-black active:scale-95">+</button>
      <button class="bg-blue-500 text-white rounded-2xl py-4 font-black active:scale-95">⇄</button>
      <button onclick="openMonthlyReport()" class="bg-purple-500 text-white rounded-2xl py-4 font-black active:scale-95">📊</button>
    </div>

    <div class="px-4 text-[11px] font-bold text-gray-400 uppercase mb-2">
      Последние операции
    </div>

    <div class="px-4 space-y-3 pb-10">
      ${
        actions.length
          ? actions.slice(0, 20).map(renderAction).join('')
          : '<div class="text-center text-gray-300 py-10">Нет операций</div>'
      }
    </div>
  `;
}


/* ================== ОПЕРАЦИЯ ================== */

function renderAction(a) {
  const isIncome = a[3] === 'income';
  const sign = isIncome ? '+' : '-';
  const color = isIncome ? 'green' : 'red';

  return `
    <div class="bg-white rounded-2xl p-4 shadow flex justify-between items-center">
      <div>
        <div class="font-bold text-gray-800">${a[1] || 'Без названия'}</div>
        <div class="text-xs text-gray-400">${a[0]}</div>
      </div>
      <div class="text-${color}-500 font-black">
        ${sign}${a[2]} TRY
      </div>
    </div>
  `;
}


/* ================== МЕСЯЧНЫЙ ОТЧЁТ ================== */

function openMonthlyReport() {
  const cache = JSON.parse(localStorage.getItem('moliyam_cache'));
  if (!cache) return fetchData();

  const { actions } = cache;

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let income = 0;
  let expense = 0;
  const byDay = {};

  actions.forEach(a => {
    if (!a[0].startsWith(ym)) return;

    const day = a[0].split(' ')[0];
    const amount = Number(a[2]) || 0;

    if (a[3] === 'income') income += amount;
    if (a[3] === 'expense') expense += amount;

    if (!byDay[day]) byDay[day] = 0;
    byDay[day] += a[3] === 'expense' ? amount : -amount;
  });

  document.getElementById('content').innerHTML = `
    <div class="p-4">
      <button onclick="fetchData()" class="text-blue-500 font-bold mb-4">← Назад</button>

      <h1 class="text-2xl font-black mb-4">Отчёт за ${ym}</h1>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="bg-green-100 rounded-2xl p-4">
          <div class="text-xs uppercase">Доход</div>
          <div class="text-xl font-black text-green-600">+${income}</div>
        </div>

        <div class="bg-red-100 rounded-2xl p-4">
          <div class="text-xs uppercase">Расход</div>
          <div class="text-xl font-black text-red-600">-${expense}</div>
        </div>
      </div>

      <div class="bg-blue-100 rounded-2xl p-4 mb-6">
        <div class="text-xs uppercase">Итог</div>
        <div class="text-2xl font-black">${income - expense}</div>
      </div>

      <canvas id="monthChart" height="140"></canvas>
    </div>
  `;

  new Chart(document.getElementById('monthChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(byDay),
      datasets: [{
        data: Object.values(byDay)
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true
    }
  });
}
