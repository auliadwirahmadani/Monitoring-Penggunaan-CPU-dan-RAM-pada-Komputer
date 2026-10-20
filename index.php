<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring Penggunaan CPU dan RAM pada Komputer</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <!-- Custom Stylesheet -->
    <link rel="stylesheet" href="assets/css/style.css">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    }
                }
            }
        }
    </script>
</head>
<body class="dark min-h-screen transition-colors duration-300">

    <!-- Navbar / Header -->
    <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                        Monitoring Penggunaan CPU & RAM
                        <span class="text-xs font-normal px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Windows</span>
                    </h1>
                    <div class="flex items-center gap-2 text-xs text-slate-400">
                        <span id="liveIndicator" class="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-indicator inline-block"></span>
                        <span id="liveStatusText" class="font-medium text-emerald-400">Live Monitoring</span>
                        <span class="text-slate-600">•</span>
                        <span id="lastUpdatedText">Menghubungkan...</span>
                    </div>
                </div>
            </div>

            <!-- Toolbar Controls -->
            <div class="flex flex-wrap items-center gap-2">
                <!-- Interval Selector -->
                <div class="flex items-center bg-slate-800/80 rounded-lg px-2.5 py-1 border border-slate-700/60 text-xs">
                    <span class="text-slate-400 mr-2">Interval:</span>
                    <select id="selectInterval" class="bg-transparent text-slate-200 focus:outline-none cursor-pointer">
                        <option value="1000" class="bg-slate-800 text-slate-200">1 Detik</option>
                        <option value="2000" selected class="bg-slate-800 text-slate-200">2 Detik</option>
                        <option value="3000" class="bg-slate-800 text-slate-200">3 Detik</option>
                        <option value="5000" class="bg-slate-800 text-slate-200">5 Detik</option>
                    </select>
                </div>

                <!-- Pause / Resume Button -->
                <button id="btnTogglePause" class="flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700/60 text-slate-200 border border-slate-600 hover:bg-slate-700 transition">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Jeda
                </button>

                <!-- Sound Alert Toggle -->
                <button id="btnToggleSound" class="flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-700 transition">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                    Suara: Senyap
                </button>

                <!-- Threshold control -->
                <div class="hidden sm:flex items-center bg-slate-800/80 rounded-lg px-2.5 py-1 border border-slate-700/60 text-xs gap-2">
                    <span class="text-slate-400">Ambang:</span>
                    <input type="range" id="inputThreshold" min="50" max="95" step="5" value="85" class="w-16 accent-rose-500 cursor-pointer">
                    <span id="thresholdDisplay" class="font-mono text-rose-400 font-semibold">85%</span>
                </div>

                <!-- Export CSV -->
                <button id="btnExportCsv" title="Unduh Catatan Monitoring ke CSV" class="flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Ekspor CSV
                </button>

                <!-- Theme Toggle -->
                <button id="btnThemeToggle" title="Ganti Tema Gelap / Terang" class="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <!-- Critical Alert Banner -->
        <div id="alertBanner" class="hidden glass-card border-rose-500/40 bg-rose-500/10 p-4 flex items-center justify-between text-rose-300 animate-bounce">
            <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-rose-500 pulse-indicator pulse-danger"></span>
                <span id="alertBannerText" class="text-sm font-semibold">Peringatan: Beban komputasi tinggi terdeteksi!</span>
            </div>
            <span class="text-xs bg-rose-500/20 px-2 py-1 rounded font-mono">Batas Ambang Terlampaui</span>
        </div>

        <!-- 4 Metric Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- 1. CPU Usage Card -->
            <div class="glass-card p-5 relative overflow-hidden">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Penggunaan CPU</span>
                    <span id="cpuStatusBadge" class="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Normal</span>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <div id="cpuPercentText" class="text-3xl font-extrabold text-gradient-cyan font-mono">0.0%</div>
                        <p class="text-xs text-slate-400 mt-1">Total Processor Load</p>
                    </div>
                    <!-- Radial Gauge -->
                    <div class="relative w-16 h-16 flex items-center justify-center">
                        <svg class="w-16 h-16" viewBox="0 0 100 100">
                            <circle class="text-slate-700/40 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent" />
                            <circle id="cpuProgressRing" class="gauge-circle" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" />
                        </svg>
                        <svg class="w-5 h-5 absolute text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                </div>
            </div>

            <!-- 2. RAM Usage Card -->
            <div class="glass-card p-5 relative overflow-hidden">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Penggunaan RAM</span>
                    <span id="ramStatusBadge" class="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Normal</span>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <div id="ramPercentText" class="text-3xl font-extrabold text-gradient-purple font-mono">0.0%</div>
                        <p class="text-xs text-slate-400 mt-1 font-mono">
                            <span id="ramUsedText" class="text-purple-300 font-semibold">- GB</span> / <span id="ramTotalText">- GB</span>
                        </p>
                    </div>
                    <!-- Radial Gauge -->
                    <div class="relative w-16 h-16 flex items-center justify-center">
                        <svg class="w-16 h-16" viewBox="0 0 100 100">
                            <circle class="text-slate-700/40 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent" />
                            <circle id="ramProgressRing" class="gauge-circle" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent" stroke="#a855f7" />
                        </svg>
                        <svg class="w-5 h-5 absolute text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    </div>
                </div>
            </div>

            <!-- 3. Disk (C:) Usage Card -->
            <div class="glass-card p-5 relative overflow-hidden">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Penyimpanan (C:)</span>
                    <span id="diskPercentText" class="text-xs font-mono font-semibold text-blue-400">0%</span>
                </div>
                <div>
                    <div class="flex items-baseline justify-between mb-2 font-mono">
                        <span id="diskUsedText" class="text-xl font-bold text-slate-100">- GB</span>
                        <span class="text-xs text-slate-400">Bebas: <span id="diskFreeText" class="text-emerald-400 font-medium">- GB</span></span>
                    </div>
                    <!-- Progress Bar -->
                    <div class="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                        <div id="diskProgressBar" class="bg-blue-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-mono">
                        <span>Terpakai</span>
                        <span>Kapasitas: <span id="diskTotalText">- GB</span></span>
                    </div>
                </div>
            </div>

            <!-- 4. System Uptime & Status Card -->
            <div class="glass-card p-5 relative overflow-hidden">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">System Uptime</span>
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div>
                    <div id="sysUptime" class="text-lg font-bold text-slate-100 font-mono tracking-tight truncate">Memuat...</div>
                    <div class="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/40 pt-2 font-mono">
                        <span>RAM Bebas:</span>
                        <span id="ramFreeText" class="text-emerald-400 font-semibold">- GB</span>
                    </div>
                </div>
            </div>

        </div>

        <!-- 2 Big Charts: CPU & RAM Real-time Timeline -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Real-time CPU Usage Chart -->
            <div class="glass-card p-5">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                        <h2 class="text-sm font-semibold text-slate-200">Riwayat Penggunaan CPU (Real-Time)</h2>
                    </div>
                    <span class="text-xs font-mono text-slate-400">30 Sampel Terakhir</span>
                </div>
                <div class="relative h-60 w-full">
                    <canvas id="cpuChart"></canvas>
                </div>
            </div>

            <!-- Real-time RAM Usage Chart -->
            <div class="glass-card p-5">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                        <h2 class="text-sm font-semibold text-slate-200">Riwayat Penggunaan RAM (Real-Time)</h2>
                    </div>
                    <span class="text-xs font-mono text-slate-400">30 Sampel Terakhir</span>
                </div>
                <div class="relative h-60 w-full">
                    <canvas id="ramChart"></canvas>
                </div>
            </div>

        </div>

        <!-- Bottom Grid: Top Processes Table & System Specifications -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Left: Top Consuming Processes (2 Columns) -->
            <div class="glass-card p-5 lg:col-span-2">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 class="text-sm font-semibold text-slate-100 flex items-center gap-2">
                            Daftar Proses Penggunaan Tertinggi
                            <span id="processCountBadge" class="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">10 Proses</span>
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">Aplikasi yang paling banyak memakan RAM dan prosesor</p>
                    </div>

                    <!-- Search Input -->
                    <div class="relative w-full sm:w-56">
                        <input type="text" id="processSearchInput" placeholder="Cari nama proses / PID..." class="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition">
                        <svg class="w-4 h-4 absolute left-2.5 top-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                </div>

                <!-- Process Table -->
                <div class="overflow-x-auto custom-scrollbar max-h-96">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-slate-700/60 text-slate-400 uppercase tracking-wider font-semibold">
                                <th class="py-2.5 px-4">PID</th>
                                <th class="py-2.5 px-4">Nama Proses</th>
                                <th class="py-2.5 px-4">Memori (RAM)</th>
                                <th class="py-2.5 px-4">Waktu CPU</th>
                                <th class="py-2.5 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody id="processTableBody">
                            <tr>
                                <td colspan="5" class="py-6 text-center text-slate-500">
                                    Memuat daftar proses...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: System Specifications Card (1 Column) -->
            <div class="glass-card p-5 flex flex-col justify-between">
                <div>
                    <h2 class="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-1">
                        <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        Spesifikasi Perangkat Komputer
                    </h2>
                    <p class="text-xs text-slate-400 mb-4">Informasi hardware dan sistem operasi</p>

                    <div class="space-y-3.5 text-xs">
                        <div class="border-b border-slate-700/40 pb-2.5">
                            <span class="text-slate-400 block mb-0.5">Model Prosesor (CPU):</span>
                            <span id="sysCpuName" class="text-slate-100 font-semibold">Memuat...</span>
                        </div>
                        <div class="border-b border-slate-700/40 pb-2.5">
                            <span class="text-slate-400 block mb-0.5">Arsitektur Core & Threads:</span>
                            <span id="sysCpuCores" class="text-cyan-400 font-mono font-medium">Memuat...</span>
                        </div>
                        <div class="border-b border-slate-700/40 pb-2.5">
                            <span class="text-slate-400 block mb-0.5">Sistem Operasi:</span>
                            <span id="sysOsName" class="text-slate-100 font-semibold">Memuat...</span>
                        </div>
                        <div class="border-b border-slate-700/40 pb-2.5">
                            <span class="text-slate-400 block mb-0.5">Arsitektur & Versi OS:</span>
                            <span id="sysArch" class="text-slate-300 font-mono">Memuat...</span>
                        </div>
                        <div class="border-b border-slate-700/40 pb-2.5">
                            <span class="text-slate-400 block mb-0.5">Nama Perangkat & Pengguna:</span>
                            <span id="sysComputerName" class="text-purple-300 font-mono">Memuat...</span>
                        </div>
                    </div>
                </div>

                <!-- Snapshot Download Action -->
                <div class="pt-5 mt-4 border-t border-slate-700/40">
                    <button id="btnExportJson" class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition">
                        <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        Unduh Snapshot Metrik (JSON)
                    </button>
                </div>
            </div>

        </div>

    </main>

    <!-- Footer -->
    <footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 border-t border-slate-800/60 mt-10">
        Monitoring Penggunaan CPU dan RAM pada Komputer &bull; Laragon &bull; Real-time Performance System
    </footer>

    <!-- Application Script -->
    <script src="assets/js/app.js"></script>
</body>
</html>
