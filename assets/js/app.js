/**
 * Aplikasi Monitoring Penggunaan CPU dan RAM
 * Frontend Real-time Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        isPaused: false,
        refreshInterval: 2000,
        timerId: null,
        soundEnabled: false,
        alertThreshold: 85,
        lastBeepTime: 0,
        historyLog: [],
        maxHistoryRecords: 300,
        filterText: '',
        lastMetrics: null
    };

    // UI Elements
    const elements = {
        // Status & badges
        liveIndicator: document.getElementById('liveIndicator'),
        liveStatusText: document.getElementById('liveStatusText'),
        lastUpdatedText: document.getElementById('lastUpdatedText'),
        alertBanner: document.getElementById('alertBanner'),
        alertBannerText: document.getElementById('alertBannerText'),

        // CPU Elements
        cpuPercentText: document.getElementById('cpuPercentText'),
        cpuProgressRing: document.getElementById('cpuProgressRing'),
        cpuStatusBadge: document.getElementById('cpuStatusBadge'),
        
        // RAM Elements
        ramPercentText: document.getElementById('ramPercentText'),
        ramProgressRing: document.getElementById('ramProgressRing'),
        ramUsedText: document.getElementById('ramUsedText'),
        ramFreeText: document.getElementById('ramFreeText'),
        ramTotalText: document.getElementById('ramTotalText'),
        ramStatusBadge: document.getElementById('ramStatusBadge'),

        // Disk Elements
        diskPercentText: document.getElementById('diskPercentText'),
        diskUsedText: document.getElementById('diskUsedText'),
        diskFreeText: document.getElementById('diskFreeText'),
        diskTotalText: document.getElementById('diskTotalText'),
        diskProgressBar: document.getElementById('diskProgressBar'),

        // System Specs Elements
        sysCpuName: document.getElementById('sysCpuName'),
        sysCpuCores: document.getElementById('sysCpuCores'),
        sysOsName: document.getElementById('sysOsName'),
        sysArch: document.getElementById('sysArch'),
        sysComputerName: document.getElementById('sysComputerName'),
        sysUptime: document.getElementById('sysUptime'),

        // Process Table
        processTableBody: document.getElementById('processTableBody'),
        processSearchInput: document.getElementById('processSearchInput'),
        processCountBadge: document.getElementById('processCountBadge'),

        // Controls
        btnTogglePause: document.getElementById('btnTogglePause'),
        selectInterval: document.getElementById('selectInterval'),
        btnToggleSound: document.getElementById('btnToggleSound'),
        inputThreshold: document.getElementById('inputThreshold'),
        thresholdDisplay: document.getElementById('thresholdDisplay'),
        btnExportCsv: document.getElementById('btnExportCsv'),
        btnExportJson: document.getElementById('btnExportJson'),
        btnThemeToggle: document.getElementById('btnThemeToggle')
    };

    // Gauge circle constant (r = 40, circumference = 2 * PI * 40 ≈ 251.327)
    const CIRCUMFERENCE = 251.327;
    if (elements.cpuProgressRing) elements.cpuProgressRing.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    if (elements.ramProgressRing) elements.ramProgressRing.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;

    function setGaugePercent(circleElement, percent, colorType) {
        if (!circleElement) return;
        const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
        circleElement.style.strokeDashoffset = offset;

        let strokeColor = '#10b981'; // Green
        if (percent >= state.alertThreshold) {
            strokeColor = '#f43f5e'; // Red
        } else if (percent >= 70) {
            strokeColor = '#f59e0b'; // Amber
        }
        circleElement.style.stroke = strokeColor;
    }

    // Audio Alert via Web Audio API
    let audioCtx = null;
    function playAlertBeep() {
        if (!state.soundEnabled) return;
        const now = Date.now();
        // Cooldown 8 seconds
        if (now - state.lastBeepTime < 8000) return;
        state.lastBeepTime = now;

        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
        } catch (e) {
            console.warn('Audio alert error:', e);
        }
    }

    // Initialize Chart.js
    const maxDataPoints = 30;
    const chartLabels = Array(maxDataPoints).fill('');
    const cpuData = Array(maxDataPoints).fill(0);
    const ramData = Array(maxDataPoints).fill(0);

    const isDark = !document.body.classList.contains('light');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const chartOptions = (label, colorHex, fillGradient) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#38bdf8',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: (context) => ` ${context.parsed.y.toFixed(1)}%`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: textColor, maxTicksLimit: 6, font: { size: 10 } }
            },
            y: {
                min: 0,
                max: 100,
                grid: { color: gridColor },
                ticks: {
                    color: textColor,
                    stepSize: 25,
                    font: { size: 10 },
                    callback: (val) => val + '%'
                }
            }
        }
    });

    const ctxCpu = document.getElementById('cpuChart')?.getContext('2d');
    let cpuChart = null;
    if (ctxCpu) {
        const gradientCpu = ctxCpu.createLinearGradient(0, 0, 0, 200);
        gradientCpu.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        gradientCpu.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

        cpuChart = new Chart(ctxCpu, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'CPU Usage',
                    data: cpuData,
                    borderColor: '#06b6d4',
                    borderWidth: 2.5,
                    fill: true,
                    backgroundColor: gradientCpu,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#06b6d4'
                }]
            },
            options: chartOptions('CPU', '#06b6d4')
        });
    }

    const ctxRam = document.getElementById('ramChart')?.getContext('2d');
    let ramChart = null;
    if (ctxRam) {
        const gradientRam = ctxRam.createLinearGradient(0, 0, 0, 200);
        gradientRam.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        gradientRam.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

        ramChart = new Chart(ctxRam, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'RAM Usage',
                    data: ramData,
                    borderColor: '#a855f7',
                    borderWidth: 2.5,
                    fill: true,
                    backgroundColor: gradientRam,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#a855f7'
                }]
            },
            options: chartOptions('RAM', '#a855f7')
        });
    }

    // Fetch System Specifications (once)
    async function fetchSystemSpecs() {
        try {
            const res = await fetch('api.php?action=sysinfo');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            if (elements.sysCpuName) elements.sysCpuName.textContent = data.cpu_name || 'Tidak diketahui';
            if (elements.sysCpuCores) elements.sysCpuCores.textContent = `${data.cpu_cores || '-'} Cores / ${data.cpu_threads || '-'} Threads (${data.cpu_max_clock_mhz || '-'} MHz)`;
            if (elements.sysOsName) elements.sysOsName.textContent = data.os_name || 'Windows';
            if (elements.sysArch) elements.sysArch.textContent = `${data.os_arch || '64-bit'} (Build ${data.os_version || '-'})`;
            if (elements.sysComputerName) elements.sysComputerName.textContent = `${data.computer_name || '-'} (${data.user_name || '-'})`;
            if (elements.sysUptime && data.uptime) elements.sysUptime.textContent = data.uptime;
        } catch (err) {
            console.warn('Gagal memuat info sistem hardware:', err);
        }
    }

    // Fetch Real-time Metrics
    async function fetchMetrics() {
        if (state.isPaused) return;

        try {
            const startTime = Date.now();
            const res = await fetch('api.php?action=metrics');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            if (!data.success && data.error) {
                console.warn('Backend warning:', data.error);
                return;
            }

            state.lastMetrics = data;
            updateDashboard(data);

            // Record into history
            state.historyLog.push({
                timestamp: data.timestamp,
                cpu_percent: data.cpu.percent,
                ram_percent: data.ram.percent,
                ram_used_gb: data.ram.used_gb,
                ram_free_gb: data.ram.free_gb,
                ram_total_gb: data.ram.total_gb,
                disk_percent: data.disk.percent,
                disk_used_gb: data.disk.used_gb,
                disk_total_gb: data.disk.total_gb
            });
            if (state.historyLog.length > state.maxHistoryRecords) {
                state.historyLog.shift();
            }

        } catch (err) {
            console.error('Fetch metrics error:', err);
            if (elements.liveStatusText) {
                elements.liveStatusText.textContent = 'Koneksi Terputus';
            }
            if (elements.liveIndicator) {
                elements.liveIndicator.className = 'w-3 h-3 rounded-full bg-rose-500';
            }
        }
    }

    // Update Dashboard UI with metrics data
    function updateDashboard(data) {
        const timeStr = data.timestamp ? data.timestamp.split(' ')[1] : new Date().toLocaleTimeString();

        // Status Indicator
        if (elements.liveStatusText) elements.liveStatusText.textContent = 'Live Monitoring';
        if (elements.liveIndicator) elements.liveIndicator.className = 'w-3 h-3 rounded-full bg-emerald-500 pulse-indicator';
        if (elements.lastUpdatedText) elements.lastUpdatedText.textContent = `Pembaruan: ${timeStr}`;
        if (elements.sysUptime && data.uptime) elements.sysUptime.textContent = data.uptime;

        // 1. CPU Section
        const cpuVal = data.cpu.percent;
        if (elements.cpuPercentText) elements.cpuPercentText.textContent = `${cpuVal.toFixed(1)}%`;
        setGaugePercent(elements.cpuProgressRing, cpuVal, 'cpu');
        updateStatusBadge(elements.cpuStatusBadge, cpuVal);

        // 2. RAM Section
        const ramVal = data.ram.percent;
        if (elements.ramPercentText) elements.ramPercentText.textContent = `${ramVal.toFixed(1)}%`;
        if (elements.ramUsedText) elements.ramUsedText.textContent = `${data.ram.used_gb} GB`;
        if (elements.ramFreeText) elements.ramFreeText.textContent = `${data.ram.free_gb} GB`;
        if (elements.ramTotalText) elements.ramTotalText.textContent = `${data.ram.total_gb} GB`;
        setGaugePercent(elements.ramProgressRing, ramVal, 'ram');
        updateStatusBadge(elements.ramStatusBadge, ramVal);

        // 3. Disk Section
        if (data.disk) {
            if (elements.diskPercentText) elements.diskPercentText.textContent = `${data.disk.percent}%`;
            if (elements.diskUsedText) elements.diskUsedText.textContent = `${data.disk.used_gb} GB`;
            if (elements.diskFreeText) elements.diskFreeText.textContent = `${data.disk.free_gb} GB`;
            if (elements.diskTotalText) elements.diskTotalText.textContent = `${data.disk.total_gb} GB`;
            if (elements.diskProgressBar) {
                elements.diskProgressBar.style.width = `${data.disk.percent}%`;
                let diskColor = 'bg-blue-500';
                if (data.disk.percent >= 90) diskColor = 'bg-rose-500';
                else if (data.disk.percent >= 75) diskColor = 'bg-amber-500';
                elements.diskProgressBar.className = `h-full rounded-full transition-all duration-500 ${diskColor}`;
            }
        }

        // 4. Update Charts
        if (cpuChart) {
            cpuChart.data.labels.shift();
            cpuChart.data.labels.push(timeStr);
            cpuChart.data.datasets[0].data.shift();
            cpuChart.data.datasets[0].data.push(cpuVal);
            cpuChart.update('none'); // Update smoothly without full reset
        }

        if (ramChart) {
            ramChart.data.labels.shift();
            ramChart.data.labels.push(timeStr);
            ramChart.data.datasets[0].data.shift();
            ramChart.data.datasets[0].data.push(ramVal);
            ramChart.update('none');
        }

        // 5. Alert Trigger Check
        checkThresholdAlerts(cpuVal, ramVal);

        // 6. Update Process Table
        renderProcessTable(data.processes || []);
    }

    // Status Badge helper
    function updateStatusBadge(badgeEl, percent) {
        if (!badgeEl) return;
        if (percent >= state.alertThreshold) {
            badgeEl.className = 'px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30';
            badgeEl.textContent = 'Kritis';
        } else if (percent >= 70) {
            badgeEl.className = 'px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30';
            badgeEl.textContent = 'Tinggi';
        } else {
            badgeEl.className = 'px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            badgeEl.textContent = 'Normal';
        }
    }

    // Check threshold alerts
    function checkThresholdAlerts(cpu, ram) {
        const isCpuHigh = cpu >= state.alertThreshold;
        const isRamHigh = ram >= state.alertThreshold;

        if (isCpuHigh || isRamHigh) {
            let msg = 'Peringatan: ';
            if (isCpuHigh && isRamHigh) msg += `Penggunaan CPU (${cpu.toFixed(1)}%) dan RAM (${ram.toFixed(1)}%) melampaui batas ambang ${state.alertThreshold}%!`;
            else if (isCpuHigh) msg += `Penggunaan CPU tinggi (${cpu.toFixed(1)}% >= ${state.alertThreshold}%)!`;
            else msg += `Penggunaan RAM tinggi (${ram.toFixed(1)}% >= ${state.alertThreshold}%)!`;

            if (elements.alertBanner) {
                elements.alertBanner.classList.remove('hidden');
                if (elements.alertBannerText) elements.alertBannerText.textContent = msg;
            }
            playAlertBeep();
        } else {
            if (elements.alertBanner) {
                elements.alertBanner.classList.add('hidden');
            }
        }
    }

    // Render Process Table
    function renderProcessTable(processes) {
        if (!elements.processTableBody) return;

        let filtered = processes;
        if (state.filterText) {
            const query = state.filterText.toLowerCase();
            filtered = processes.filter(p => 
                p.name.toLowerCase().includes(query) || 
                String(p.pid).includes(query)
            );
        }

        if (elements.processCountBadge) {
            elements.processCountBadge.textContent = `${filtered.length} Proses Aktif`;
        }

        if (filtered.length === 0) {
            elements.processTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-6 text-center text-sm text-slate-500">
                        Tidak ada proses yang cocok dengan kata kunci pencarian.
                    </td>
                </tr>
            `;
            return;
        }

        const rowsHtml = filtered.map((proc, index) => {
            const isTop = index === 0;
            return `
                <tr class="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 font-mono text-xs text-slate-400">#${proc.pid}</td>
                    <td class="py-3 px-4 font-medium flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${isTop ? 'bg-amber-400' : 'bg-blue-400'}"></span>
                        <span class="truncate max-w-[200px]" title="${proc.name}">${proc.name}</span>
                    </td>
                    <td class="py-3 px-4 font-mono text-sm font-semibold text-purple-400">
                        ${proc.ram_mb.toLocaleString()} MB
                    </td>
                    <td class="py-3 px-4 font-mono text-xs text-slate-400">
                        ${proc.cpu_time}s
                    </td>
                    <td class="py-3 px-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${proc.status === 'Normal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                            ${proc.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        elements.processTableBody.innerHTML = rowsHtml;
    }

    // Event Listeners: Search Process
    if (elements.processSearchInput) {
        elements.processSearchInput.addEventListener('input', (e) => {
            state.filterText = e.target.value.trim();
            if (state.lastMetrics && state.lastMetrics.processes) {
                renderProcessTable(state.lastMetrics.processes);
            }
        });
    }

    // Toggle Pause / Resume
    if (elements.btnTogglePause) {
        elements.btnTogglePause.addEventListener('click', () => {
            state.isPaused = !state.isPaused;
            if (state.isPaused) {
                elements.btnTogglePause.innerHTML = `
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Resume
                `;
                elements.btnTogglePause.className = 'flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition';
                if (elements.liveStatusText) elements.liveStatusText.textContent = 'Dijeda (Paused)';
                if (elements.liveIndicator) elements.liveIndicator.className = 'w-3 h-3 rounded-full bg-amber-500';
            } else {
                elements.btnTogglePause.innerHTML = `
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Jeda
                `;
                elements.btnTogglePause.className = 'flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700/60 text-slate-200 border border-slate-600 hover:bg-slate-700 transition';
                fetchMetrics();
            }
        });
    }

    // Change Interval
    if (elements.selectInterval) {
        elements.selectInterval.addEventListener('change', (e) => {
            state.refreshInterval = parseInt(e.target.value, 10);
            restartPollingTimer();
        });
    }

    function restartPollingTimer() {
        if (state.timerId) clearInterval(state.timerId);
        state.timerId = setInterval(fetchMetrics, state.refreshInterval);
    }

    // Toggle Sound Alert
    if (elements.btnToggleSound) {
        elements.btnToggleSound.addEventListener('click', () => {
            state.soundEnabled = !state.soundEnabled;
            updateSoundButtonState();
        });
    }

    function updateSoundButtonState() {
        if (!elements.btnToggleSound) return;
        if (state.soundEnabled) {
            elements.btnToggleSound.className = 'flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition';
            elements.btnToggleSound.innerHTML = `
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                Suara: Aktif
            `;
            // Trigger sample beep to confirm user gesture
            playAlertBeep();
        } else {
            elements.btnToggleSound.className = 'flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-700 transition';
            elements.btnToggleSound.innerHTML = `
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                Suara: Senyap
            `;
        }
    }

    // Threshold input
    if (elements.inputThreshold) {
        elements.inputThreshold.addEventListener('input', (e) => {
            state.alertThreshold = parseInt(e.target.value, 10);
            if (elements.thresholdDisplay) elements.thresholdDisplay.textContent = `${state.alertThreshold}%`;
        });
    }

    // Export CSV
    if (elements.btnExportCsv) {
        elements.btnExportCsv.addEventListener('click', () => {
            if (state.historyLog.length === 0) {
                alert('Belum ada data riwayat monitoring untuk diekspor.');
                return;
            }

            const headers = ['Waktu', 'CPU (%)', 'RAM Terpakai (GB)', 'RAM Bebas (GB)', 'RAM Total (GB)', 'RAM (%)', 'Disk Terpakai (GB)', 'Disk Total (GB)', 'Disk (%)'];
            const rows = state.historyLog.map(item => [
                `"${item.timestamp}"`,
                item.cpu_percent,
                item.ram_used_gb,
                item.ram_free_gb,
                item.ram_total_gb,
                item.ram_percent,
                item.disk_used_gb,
                item.disk_total_gb,
                item.disk_percent
            ]);

            const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const filename = `Monitoring_CPU_RAM_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Export JSON
    if (elements.btnExportJson) {
        elements.btnExportJson.addEventListener('click', () => {
            if (!state.lastMetrics) {
                alert('Data snapshot belum tersedia.');
                return;
            }
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.lastMetrics, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `snapshot_metrics_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });
    }

    // Theme Toggle (Dark / Light)
    if (elements.btnThemeToggle) {
        // Load saved theme
        const savedTheme = localStorage.getItem('app_theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.remove('dark');
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
            document.body.classList.add('dark');
        }

        elements.btnThemeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('dark')) {
                document.body.classList.remove('dark');
                document.body.classList.add('light');
                localStorage.setItem('app_theme', 'light');
            } else {
                document.body.classList.remove('light');
                document.body.classList.add('dark');
                localStorage.setItem('app_theme', 'dark');
            }
        });
    }

    // Start
    fetchSystemSpecs();
    fetchMetrics();
    restartPollingTimer();
});
