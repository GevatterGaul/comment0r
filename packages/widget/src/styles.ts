const STYLE_ID = "comment0r-widget-style";

const CSS = `
.c0r-root{font-family:Georgia, "Times New Roman", serif;background:linear-gradient(145deg,#f5f2eb,#fff);border:1px solid #d9cfbc;border-radius:14px;padding:16px;color:#2b2418;max-width:760px;}
.c0r-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.c0r-title{font-size:1.1rem;font-weight:700;letter-spacing:.02em;}
.c0r-thread{font-size:.8rem;color:#7a6b52;}
.c0r-form{display:grid;gap:8px;margin-bottom:14px;}
.c0r-input,.c0r-textarea,.c0r-btn{font:inherit;border-radius:10px;border:1px solid #c7b79d;padding:10px;background:#fffefb;color:#2b2418;}
.c0r-textarea{min-height:88px;resize:vertical;}
.c0r-btn{background:#2d7f61;color:#f4fff9;font-weight:700;cursor:pointer;border-color:#21644c;}
.c0r-btn:disabled{opacity:.7;cursor:wait;}
.c0r-list{display:grid;gap:10px;}
.c0r-comment{background:#fff;border:1px solid #e5dac8;border-radius:10px;padding:10px;}
.c0r-meta{display:flex;gap:8px;align-items:center;font-size:.82rem;color:#6d5f48;margin-bottom:6px;}
.c0r-name{font-weight:700;color:#2f281c;}
.c0r-body{white-space:pre-wrap;line-height:1.35;}
.c0r-empty{font-size:.9rem;color:#6d5f48;padding:8px 0;}
`;

export function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
