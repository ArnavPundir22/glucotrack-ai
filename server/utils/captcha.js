import jwt from 'jsonwebtoken';

const CAPTCHA_SECRET = process.env.JWT_SECRET || 'glucotrack_captcha_secret';

/**
 * Generate a visual SVG Captcha image and signed verification token
 */
export function generateCaptcha() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Generate SVG Image Dimensions
  const width = 180;
  const height = 50;

  // Render text with random rotation & colors
  let svgText = '';
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = 22 + i * 30;
    const y = 34 + (Math.random() * 6 - 3);
    const rotate = Math.random() * 26 - 13;
    const colors = ['#0284c7', '#0369a1', '#0f172a', '#2563eb', '#1d4ed8'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    svgText += `<text x="${x}" y="${y}" transform="rotate(${rotate}, ${x}, ${y})" fill="${color}" font-size="26" font-weight="900" font-family="'Segoe UI', Arial, sans-serif" letter-spacing="2">${char}</text>`;
  }

  // Random noise lines for security
  let noiseLines = '';
  for (let i = 0; i < 4; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const opacity = 0.35 + Math.random() * 0.3;
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="1.5" stroke-opacity="${opacity}" />`;
  }

  // Random background dots
  let noiseDots = '';
  for (let i = 0; i < 25; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = Math.random() * 1.5 + 0.5;
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#cbd5e1" />`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #cbd5e1; user-select: none;">
    ${noiseDots}
    ${noiseLines}
    ${svgText}
  </svg>`;

  const captchaToken = jwt.sign({ code: code.toUpperCase() }, CAPTCHA_SECRET, { expiresIn: '10m' });

  return {
    svg,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    captchaToken,
  };
}

/**
 * Verify Captcha token and user answer
 */
export function verifyCaptchaToken(captchaToken, userAnswer) {
  if (!captchaToken || !userAnswer) return false;
  try {
    const decoded = jwt.verify(captchaToken, CAPTCHA_SECRET);
    return decoded.code === userAnswer.trim().toUpperCase();
  } catch (err) {
    return false;
  }
}
