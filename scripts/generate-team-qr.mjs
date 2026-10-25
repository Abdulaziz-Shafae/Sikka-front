import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { sikkaTeam } from '../lib/sikka-team.ts';

// Static, scanner-readable assets. No external QR service or tracking redirects.
for (const member of sikkaTeam) {
  if (!member.linkedinUrl) continue;
  const directory = new URL('../public/team/', import.meta.url);
  await mkdir(directory, { recursive: true });
  const svg = await QRCode.toString(member.linkedinUrl, {
    type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 256,
    color: { dark: '#0B2E8B', light: '#FFFFFF' },
  });
  const destination = new URL('../public' + member.qrImage, import.meta.url);
  await writeFile(destination, svg, 'utf8');
  console.log(fileURLToPath(destination));
}
