import { execFile } from 'node:child_process';
import type { TrackerLocationInput } from '@exyconn/tracker-core';

/**
 * Windows' own location, read in main through Windows Location Services.
 *
 * Electron 33's Chromium reads `navigator.geolocation` on Windows from Google's network
 * location web service, which answers "Failed to query location from network service"
 * without a GOOGLE_API_KEY, and its WinRT provider switch has no effect there (Tech > Logs,
 * tracker 1.13.38, Windows). So Windows asks the OS directly: the GeoCoordinateWatcher of
 * .NET's System.Device, built into Windows PowerShell 5.1 on every Windows 10 and 11. It needs
 * Windows "Location services" and "Let desktop apps access your location" on, which the
 * app's Settings opens.
 */

/** How long Windows may take over one fix; main's caller allows a little more. */
const FIX_SECONDS = 15;

/**
 * Prints one JSON line: the fix, or the GeolocationPositionError code Chromium would have
 * given (1 denied, 2 unavailable or off, 3 timed out), so the reasons read the same.
 */
const SCRIPT = `
Add-Type -AssemblyName System.Device
$w = New-Object System.Device.Location.GeoCoordinateWatcher([System.Device.Location.GeoPositionAccuracy]::High)
$w.Start()
$deadline = (Get-Date).AddSeconds(${FIX_SECONDS})
while ($w.Status -ne 'Ready' -and $w.Permission -ne 'Denied' -and $w.Status -ne 'Disabled' -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 200 }
$l = $w.Position.Location
if ($w.Permission -eq 'Denied') { $out = @{ code = 1; message = 'Windows denied this app location access' } }
elseif ($w.Status -eq 'Disabled') { $out = @{ code = 2; message = 'Windows location services are off' } }
elseif ($l.IsUnknown) { $out = @{ code = 3; message = 'Windows found no location in time' } }
elseif ([double]::IsNaN($l.HorizontalAccuracy)) { $out = @{ code = 2; message = 'Windows gave a location without its accuracy' } }
else { $out = @{ lat = $l.Latitude; lng = $l.Longitude; accuracy = $l.HorizontalAccuracy } }
$w.Stop()
$out | ConvertTo-Json -Compress
`;

/** What the script printed: a fix, or why there is none. */
interface WindowsFix {
  lat?: number;
  lng?: number;
  accuracy?: number;
  code?: number;
  message?: string;
}

/**
 * Reads the script's answer. A failure carries Chromium's wording and code, so the tracker's
 * reasons (tracker-core location-failure.ts) need nothing Windows-specific.
 */
export function parseWindowsFix(stdout: string, now: Date): TrackerLocationInput {
  let fix: WindowsFix;
  try {
    fix = JSON.parse(stdout.trim()) as WindowsFix;
  } catch {
    throw new Error('Geolocation failed (code 2): Windows gave no readable location');
  }
  if (
    typeof fix.lat !== 'number' ||
    typeof fix.lng !== 'number' ||
    typeof fix.accuracy !== 'number'
  ) {
    throw new Error(`Geolocation failed (code ${fix.code ?? 2}): ${fix.message ?? 'no location'}`);
  }
  return {
    lat: fix.lat,
    lng: fix.lng,
    accuracyM: fix.accuracy,
    source: 'SYSTEM',
    capturedAt: now.toISOString(),
  };
}

/** The script as PowerShell's -EncodedCommand takes it: UTF-16LE in base64, no quoting. */
const ENCODED = Buffer.from(SCRIPT, 'utf16le').toString('base64');

/** One fix from Windows Location Services. Rejects with the reason; never logs a coordinate. */
export function readWindowsLocation(): Promise<TrackerLocationInput> {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', ENCODED],
      { timeout: (FIX_SECONDS + 5) * 1000, windowsHide: true },
      (error, stdout) => {
        if (error) {
          reject(new Error(`Geolocation failed (code 3): ${error.message}`));
          return;
        }
        try {
          resolve(parseWindowsFix(stdout, new Date()));
        } catch (failure) {
          reject(failure);
        }
      },
    );
  });
}
