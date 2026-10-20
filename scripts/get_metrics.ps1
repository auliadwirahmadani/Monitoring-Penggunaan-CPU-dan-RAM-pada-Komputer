param (
    [string]$Mode = "metrics"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if ($Mode -eq "sysinfo") {
    try {
        $cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1 Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed
        $osInfo = Get-CimInstance Win32_OperatingSystem | Select-Object Caption, OSArchitecture, Version, LastBootUpTime
        $csInfo = Get-CimInstance Win32_ComputerSystem | Select-Object Model, Manufacturer, TotalPhysicalMemory

        $uptimeSpan = (Get-Date) - $osInfo.LastBootUpTime
        $uptimeStr = "{0} hari {1} jam {2} menit" -f $uptimeSpan.Days, $uptimeSpan.Hours, $uptimeSpan.Minutes

        $sysinfo = [PSCustomObject]@{
            computer_name       = $env:COMPUTERNAME
            user_name           = $env:USERNAME
            cpu_name            = $cpuInfo.Name.Trim()
            cpu_cores           = $cpuInfo.NumberOfCores
            cpu_threads         = $cpuInfo.NumberOfLogicalProcessors
            cpu_max_clock_mhz   = $cpuInfo.MaxClockSpeed
            os_name             = $osInfo.Caption
            os_arch             = $osInfo.OSArchitecture
            os_version          = $osInfo.Version
            boot_time           = $osInfo.LastBootUpTime.ToString("yyyy-MM-dd HH:mm:ss")
            uptime              = $uptimeStr
            manufacturer        = $csInfo.Manufacturer
            model               = $csInfo.Model
        }

        $sysinfo | ConvertTo-Json
    } catch {
        [PSCustomObject]@{
            error = $_.Exception.Message
        } | ConvertTo-Json
    }
    exit 0
}

# Default: Realtime metrics
try {
    # 1. CPU Usage (%)
    $cpuUsage = 0
    try {
        $counter = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop
        $cpuUsage = [math]::Round($counter.CounterSamples[0].CookedValue, 1)
    } catch {
        $proc = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'" -ErrorAction SilentlyContinue
        if ($proc) {
            $cpuUsage = [math]::Round([double]$proc.PercentProcessorTime, 1)
        } else {
            $wmiProc = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average
            $cpuUsage = [math]::Round([double]$wmiProc.Average, 1)
        }
    }
    if ($cpuUsage -gt 100) { $cpuUsage = 100 }
    if ($cpuUsage -lt 0) { $cpuUsage = 0 }

    # 2. RAM Usage
    $os = Get-CimInstance Win32_OperatingSystem
    $totalRamBytes = [double]$os.TotalVisibleMemorySize * 1024
    $freeRamBytes = [double]$os.FreePhysicalMemory * 1024
    $usedRamBytes = $totalRamBytes - $freeRamBytes

    $totalRamGB = [math]::Round($totalRamBytes / 1GB, 2)
    $freeRamGB = [math]::Round($freeRamBytes / 1GB, 2)
    $usedRamGB = [math]::Round($usedRamBytes / 1GB, 2)
    $ramPercent = [math]::Round(($usedRamBytes / $totalRamBytes) * 100, 1)

    # 3. Disk Usage (C: Drive)
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue
    $diskTotalGB = 0
    $diskFreeGB = 0
    $diskUsedGB = 0
    $diskPercent = 0
    if ($disk -and $disk.Size -gt 0) {
        $diskTotalGB = [math]::Round([double]$disk.Size / 1GB, 1)
        $diskFreeGB = [math]::Round([double]$disk.FreeSpace / 1GB, 1)
        $diskUsedGB = [math]::Round($diskTotalGB - $diskFreeGB, 1)
        $diskPercent = [math]::Round(($diskUsedGB / $diskTotalGB) * 100, 1)
    }

    # 4. Top 10 Processes by Memory
    $processes = Get-Process -ErrorAction SilentlyContinue | 
        Where-Object { $_.WorkingSet64 -gt 0 } |
        Sort-Object WorkingSet64 -Descending |
        Select-Object -First 10 |
        ForEach-Object {
            $cpuTime = 0
            try {
                if ($_.CPU) { $cpuTime = [math]::Round([double]$_.CPU, 1) }
            } catch { $cpuTime = 0 }

            [PSCustomObject]@{
                pid      = $_.Id
                name     = $_.ProcessName
                ram_mb   = [math]::Round($_.WorkingSet64 / 1MB, 1)
                cpu_time = $cpuTime
                status   = if ($_.Responding) { "Normal" } else { "Not Responding" }
            }
        }

    # 5. Uptime
    $uptimeSpan = (Get-Date) - $os.LastBootUpTime
    $uptimeStr = "{0}d {1}h {2}m {3}s" -f $uptimeSpan.Days, $uptimeSpan.Hours, $uptimeSpan.Minutes, $uptimeSpan.Seconds

    $output = [PSCustomObject]@{
        success       = $true
        timestamp     = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        uptime        = $uptimeStr
        cpu = [PSCustomObject]@{
            percent   = $cpuUsage
        }
        ram = [PSCustomObject]@{
            total_gb  = $totalRamGB
            used_gb   = $usedRamGB
            free_gb   = $freeRamGB
            percent   = $ramPercent
        }
        disk = [PSCustomObject]@{
            drive     = "C:"
            total_gb  = $diskTotalGB
            used_gb   = $diskUsedGB
            free_gb   = $diskFreeGB
            percent   = $diskPercent
        }
        processes     = $processes
    }

    $output | ConvertTo-Json -Depth 4
} catch {
    [PSCustomObject]@{
        success = $false
        error   = $_.Exception.Message
    } | ConvertTo-Json
}
