import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * QRIS QR Code Generator
 * 
 * Menghasilkan QR code dengan format QRIS (Quick Response Code Indonesian Standard)
 * berdasarkan spesifikasi EMVCo QR Code.
 * 
 * CATATAN PENTING:
 * - QR code ini mengikuti format QRIS standar dan BISA DI-SCAN oleh aplikasi m-banking/e-wallet.
 * - Namun, karena Merchant ID bukan dari PSP (Payment Service Provider) resmi,
 *   transaksi pembayaran nyata TIDAK akan berhasil.
 * - Untuk pembayaran nyata, merchant perlu mendaftar ke PSP seperti GoPay, OVO, DANA, dll.
 */

// CRC-16/CCITT-FALSE calculation (required by EMVCo/QRIS spec)
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Build a TLV (Tag-Length-Value) field per EMVCo spec
function tlv(tag, value) {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Generate QRIS payload string
 * @param {Object} options
 * @param {string} options.merchantName - Nama merchant
 * @param {string} options.merchantCity - Kota merchant
 * @param {string} options.postalCode - Kode pos
 * @param {number} [options.amount] - Jumlah pembayaran (opsional, jika static QR)
 * @returns {string} QRIS payload string
 */
export function generateQrisPayload({
  merchantName = 'Threemi Sweet',
  merchantCity = 'Bandung',
  postalCode = '40197',
  amount = null,
} = {}) {
  // Tag 00 - Payload Format Indicator (wajib "01")
  const tag00 = tlv('00', '01');

  // Tag 01 - Point of Initiation Method
  // "11" = Static (QR bisa dipakai berulang), "12" = Dynamic (sekali pakai)
  const tag01 = tlv('01', amount ? '12' : '11');

  // Tag 26 - Merchant Account Information (Domestic Merchant)
  // Sub-tag 00: Reversed domain (Global Unique Identifier)
  // Sub-tag 01: Merchant ID (simulasi)
  // Sub-tag 02: Merchant Criteria (UMI = Usaha Mikro)
  const tag26Content =
    tlv('00', 'ID.CO.QRIS.WWW') +
    tlv('01', 'ID1020032547698') +
    tlv('02', 'UMI');
  const tag26 = tlv('26', tag26Content);

  // Tag 51 - Merchant Account Information (Cross-border, optional)
  // Not used for domestic-only

  // Tag 52 - Merchant Category Code (MCC: 5812 = Eating Places / Restaurants)
  const tag52 = tlv('52', '5812');

  // Tag 53 - Transaction Currency (360 = IDR)
  const tag53 = tlv('53', '360');

  // Tag 54 - Transaction Amount (optional for static)
  const tag54 = amount ? tlv('54', amount.toString()) : '';

  // Tag 58 - Country Code
  const tag58 = tlv('58', 'ID');

  // Tag 59 - Merchant Name (max 25 chars)
  const tag59 = tlv('59', merchantName.substring(0, 25));

  // Tag 60 - Merchant City (max 15 chars)
  const tag60 = tlv('60', merchantCity.substring(0, 15));

  // Tag 61 - Postal Code
  const tag61 = tlv('61', postalCode);

  // Tag 62 - Additional Data Field Template
  // Sub-tag 07: Terminal Label
  const tag62Content = tlv('07', 'TMSW001');
  const tag62 = tlv('62', tag62Content);

  // Build payload without CRC
  const payloadWithoutCRC =
    tag00 + tag01 + tag26 + tag52 + tag53 + tag54 + tag58 + tag59 + tag60 + tag61 + tag62;

  // Tag 63 - CRC (4 hex chars)
  // CRC is calculated over the entire payload including "6304"
  const crcInput = payloadWithoutCRC + '6304';
  const crcValue = crc16(crcInput);
  const tag63 = '6304' + crcValue;

  return payloadWithoutCRC + tag63;
}

/**
 * QRIS QR Code Display Component
 */
export default function QrisCode({ amount, size = 220 }) {
  const payload = generateQrisPayload({
    merchantName: 'Threemi Sweet',
    merchantCity: 'Bandung',
    postalCode: '40197',
    amount: amount || null,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* QRIS Logo Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        marginBottom: '0.75rem', padding: '0.4rem 1rem',
        background: 'linear-gradient(135deg, #e63946, #1d3557)',
        borderRadius: '6px',
      }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px' }}>QRIS</span>
      </div>

      {/* QR Code */}
      <div style={{
        padding: '12px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
      }}>
        <QRCodeSVG
          value={payload}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Merchant Info */}
      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', margin: '0.75rem 0 0.2rem 0' }}>
        Threemi Sweet by Mila
      </p>
      <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
        NMID: ID1020032547698
      </p>
    </div>
  );
}
