import { signInWithPopup } from 'firebase/auth';
import {
  auth,
  googleProvider,
  cacheOAuthTokenFromResult,
  getCachedOAuthAccessToken,
  getCachedOAuthSenderEmail,
  clearCachedOAuthAccessToken,
} from '../lib/firebase';

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function wrapBase6476(b64: string): string {
  return b64.replace(/.{1,76}/g, '$&\r\n').trimEnd();
}

function encodeBase64Url(text: string): string {
  return toBase64Utf8(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function encodeMimeWord(text: string): string {
  const clean = sanitizeHeaderValue(text);
  if (/^[\x20-\x7E]*$/.test(clean)) {
    return clean;
  }
  return `=?UTF-8?B?${toBase64Utf8(clean)}?=`;
}

function encodeMimeDisplayName(name: string): string {
  const clean = sanitizeHeaderValue(name).replace(/"/g, '');
  if (!clean) return '';
  if (/^[a-zA-Z0-9 ._\-]+$/.test(clean)) {
    return `"${clean}"`;
  }
  return `=?UTF-8?B?${toBase64Utf8(clean)}?=`;
}

export async function authorizeGmailAccess(): Promise<{ token: string; email: string }> {
  const result = await signInWithPopup(auth, googleProvider);
  const token = cacheOAuthTokenFromResult(result);
  if (!token) {
    throw new Error('Không lấy được quyền gửi Gmail từ phiên đăng nhập Google. Vui lòng thử lại.');
  }
  return {
    token,
    email: (result.user.email || '').toLowerCase().trim(),
  };
}

export function getActiveGmailToken(): string | null {
  return getCachedOAuthAccessToken();
}

export interface WhitelistEmailPayload {
  toEmail: string;
  roleNote: string;
  addedAt: string;
  grantedByEmail: string;
  grantedByName: string;
  appUrl: string;
}

export function buildWhitelistConfirmationEmailContent(payload: WhitelistEmailPayload): {
  subject: string;
  textPreview: string;
  htmlBody: string;
} {
  const roleLabel = payload.roleNote.trim() || 'Quản trị viên';
  const senderDisplay = payload.grantedByName.trim() || payload.grantedByEmail;

  // Natural conversational subject without bracketed tags or target email (reduces spam score)
  const subject = `Xác nhận tài khoản quản trị D2KN Edu (${roleLabel})`;

  const textPreview =
    `Chào bạn,\r\n\r\n` +
    `Mình xác nhận địa chỉ Gmail ${payload.toEmail} đã được thêm vào danh sách Quản trị viên của Sổ Liên Lạc Điện Tử D2KN Edu.\r\n\r\n` +
    `Thông tin chi tiết:\r\n` +
    `- Vai trò: ${roleLabel}\r\n` +
    `- Người thêm: ${senderDisplay} (${payload.grantedByEmail})\r\n` +
    `- Thời gian: ${payload.addedAt}\r\n\r\n` +
    `Cách truy cập trang quản trị:\r\n` +
    `Khi mở ứng dụng D2KN Edu, bạn nhấn tổ hợp phím Ctrl + Shift + A (hoặc bấm 10 lần vào biểu tượng D2KN Edu ở góc trên bên trái) và chọn đăng nhập bằng Google với tài khoản Gmail này.\r\n\r\n` +
    `Nếu cần hỗ trợ thêm, bạn có thể trả lời trực tiếp email này cho mình nhé.\r\n\r\n` +
    `Trân trọng,\r\n` +
    `${senderDisplay}`;

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // Minimal personal-style HTML matching the plain-text part 1:1 (no dark banners or raw .run.app links)
  const htmlBody = `<!DOCTYPE html>
<html lang="vi">
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.65; color: #1f2937; margin: 0; padding: 12px 0;">
  <p style="margin: 0 0 12px;">Chào bạn,</p>
  <p style="margin: 0 0 12px;">
    Mình xác nhận địa chỉ Gmail <strong>${escapeHtml(payload.toEmail)}</strong> đã được thêm vào danh sách Quản trị viên của Sổ Liên Lạc Điện Tử D2KN Edu.
  </p>
  <p style="margin: 0 0 6px;"><strong>Thông tin chi tiết:</strong></p>
  <ul style="margin: 0 0 14px; padding-left: 20px;">
    <li>Vai trò: ${escapeHtml(roleLabel)}</li>
    <li>Người thêm: ${escapeHtml(senderDisplay)} (${escapeHtml(payload.grantedByEmail)})</li>
    <li>Thời gian: ${escapeHtml(payload.addedAt)}</li>
  </ul>
  <p style="margin: 0 0 12px;">
    <strong>Cách truy cập trang quản trị:</strong><br />
    Khi mở ứng dụng D2KN Edu, bạn nhấn tổ hợp phím <strong>Ctrl + Shift + A</strong> (hoặc bấm 10 lần vào biểu tượng D2KN Edu ở góc trên bên trái) và chọn đăng nhập bằng Google với tài khoản Gmail này.
  </p>
  <p style="margin: 0 0 14px;">Nếu cần hỗ trợ thêm, bạn có thể trả lời trực tiếp email này cho mình nhé.</p>
  <p style="margin: 0;">Trân trọng,<br />${escapeHtml(senderDisplay)}</p>
</body>
</html>`;

  return {
    subject,
    textPreview: textPreview.replace(/\r\n/g, '\n'),
    htmlBody,
  };
}

export async function sendWhitelistConfirmationGmail(
  payload: WhitelistEmailPayload,
  accessTokenOverride?: string
): Promise<{ messageId: string }> {
  const token = accessTokenOverride || getCachedOAuthAccessToken();
  if (!token) {
    throw new Error('MISSING_GMAIL_TOKEN');
  }

  const senderEmail = sanitizeHeaderValue(
    getCachedOAuthSenderEmail() || payload.grantedByEmail || ''
  );
  const toEmail = sanitizeHeaderValue(payload.toEmail);
  const senderDisplay = sanitizeHeaderValue(payload.grantedByName || senderEmail);

  const { subject, textPreview, htmlBody } = buildWhitelistConfirmationEmailContent(payload);
  const plainTextCrLf = textPreview.replace(/\r?\n/g, '\r\n');
  const textBase64 = wrapBase6476(toBase64Utf8(plainTextCrLf));
  const htmlBase64 = wrapBase6476(toBase64Utf8(htmlBody));

  const boundary = `edulink_alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const fromHeader = senderEmail
    ? `${encodeMimeDisplayName(senderDisplay)} <${senderEmail}>`.trim()
    : '';

  const headers: string[] = [];
  if (fromHeader) {
    headers.push(`From: ${fromHeader}`);
  }
  headers.push(`To: ${toEmail}`);
  if (senderEmail) {
    headers.push(`Reply-To: ${senderEmail}`);
  }
  headers.push(
    `Subject: ${encodeMimeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  );

  const mimeMessage = [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    textBase64,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBase64,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  const raw = encodeBase64Url(mimeMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (res.status === 401 || res.status === 403) {
    clearCachedOAuthAccessToken();
    const errText = await res.text();
    throw new Error(`GMAIL_AUTH_ERROR: ${errText}`);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không gửi được email qua Gmail API (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { id?: string };
  return { messageId: data.id || '' };
}
