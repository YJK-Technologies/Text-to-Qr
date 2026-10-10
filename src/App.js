import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import {
  QrCode, Download, FileImage, FileText, Code2, Sparkles,
  Clipboard, Check, RotateCcw, ShieldCheck, Zap, Image as ImageIcon
} from 'lucide-react';

const DEFAULT_TEXT = 'https://example.com';

export default function App() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [size, setSize] = useState(320);
  const [dark, setDark] = useState('#172554');
  const [light, setLight] = useState('#ffffff');
  const [level, setLevel] = useState('H');
  const [margin, setMargin] = useState(true);
  const [qrData, setQrData] = useState('');
  const [svgData, setSvgData] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const value = text.trim();
    if (!value) {
      setQrData('');
      setSvgData('');
      setError('Enter some text or a URL to generate your QR code.');
      return () => { active = false; };
    }
    setError('');
    Promise.all([
      QRCode.toDataURL(value, {
        width: Number(size), margin: margin ? 3 : 0,
        errorCorrectionLevel: level,
        color: { dark, light }
      }),
      QRCode.toString(value, {
        type: 'svg', width: Number(size), margin: margin ? 3 : 0,
        errorCorrectionLevel: level,
        color: { dark, light }
      })
    ]).then(([png, svg]) => {
      if (active) { setQrData(png); setSvgData(svg); }
    }).catch(() => {
      if (active) {
        setQrData('');
        setSvgData('');
        setError('Could not generate a QR code. Try shorter text or a URL.');
      }
    });
    return () => { active = false; };
  }, [text, size, dark, light, level, margin]);

  const canDownload = Boolean(qrData && text.trim());

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadDataUrl(dataUrl, filename) {
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function downloadPNG() {
    if (canDownload) downloadDataUrl(qrData, 'qr-code.png');
  }

  function downloadJPEG() {
    if (!canDownload) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Number(size);
      canvas.height = Number(size);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      downloadDataUrl(canvas.toDataURL('image/jpeg', 0.95), 'qr-code.jpg');
    };
    image.src = qrData;
  }

  function downloadSVG() {
    if (canDownload) {
      saveBlob(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }), 'qr-code.svg');
    }
  }

  function downloadPDF() {
    if (!canDownload) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const qrSize = 100;
    const x = (pageWidth - qrSize) / 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('QR Code', pageWidth / 2, 35, { align: 'center' });
    pdf.addImage(qrData, 'PNG', x, 48, qrSize, qrSize);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize('Content: ' + text.trim(), 160);
    pdf.text(lines, pageWidth / 2, 165, { align: 'center', maxWidth: 160 });
    pdf.save('qr-code.pdf');
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Clipboard access is unavailable. Select and copy the text manually.');
    }
  }

  function resetSettings() {
    setText(DEFAULT_TEXT);
    setSize(320);
    setDark('#172554');
    setLight('#ffffff');
    setLevel('H');
    setMargin(true);
    setError('');
  }

  const formats = useMemo(() => [
    { label: 'PNG', detail: 'Best for sharing', icon: ImageIcon, action: downloadPNG },
    { label: 'JPEG', detail: 'Smaller image file', icon: FileImage, action: downloadJPEG },
    { label: 'SVG', detail: 'Scalable vector', icon: Code2, action: downloadSVG },
    { label: 'PDF', detail: 'Print-ready document', icon: FileText, action: downloadPDF }
  ], [canDownload, qrData, svgData, size, light, text]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="QR Studio home">
          <span className="brand-mark"><QrCode size={23} strokeWidth={2.3} /></span>
          <span>qr<span className="brand-accent">studio</span></span>
        </a>
        <div className="topbar-right"><span className="secure-label"><ShieldCheck size={15} /> Runs in your browser</span></div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="eyebrow"><Sparkles size={14} /> SIMPLE. CUSTOMIZABLE. DOWNLOADABLE.</div>
          <h1>Turn your text into a <span>QR code.</span></h1>
          <p className="hero-copy">Create a custom QR code in seconds. Personalize the colors, then download it in the format you need.</p>
        </section>

        <section className="workspace">
          <div className="editor-panel panel">
            <div className="panel-heading">
              <div><span className="step">01</span><div><h2>Your content</h2><p>What should your QR code contain?</p></div></div>
            </div>

            <label className="field-label" htmlFor="qr-text">Text or URL</label>
            <div className="textarea-wrap">
              <textarea id="qr-text" value={text} onChange={e => setText(e.target.value)} placeholder="Enter text, a website URL, contact details..." rows="5" maxLength="4000" />
              <span className="char-count">{text.length.toLocaleString()} / 4,000</span>
            </div>
            <div className="helper-row"><span>Links, plain text, email addresses, and more.</span><button className="text-button" onClick={copyText} type="button">{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? 'Copied' : 'Copy text'}</button></div>

            <div className="section-divider" />
            <div className="subheading-row"><div><h3>Customize appearance</h3><p>Make the code match your style.</p></div><button className="reset-button" onClick={resetSettings} type="button"><RotateCcw size={14} /> Reset</button></div>

            <div className="color-grid">
              <div className="color-control">
                <label className="field-label" htmlFor="dark-color">QR color</label>
                <div className="color-input"><input id="dark-color" type="color" value={dark} onChange={e => setDark(e.target.value)} /><span>{dark.toUpperCase()}</span></div>
              </div>
              <div className="color-control">
                <label className="field-label" htmlFor="light-color">Background</label>
                <div className="color-input"><input id="light-color" type="color" value={light} onChange={e => setLight(e.target.value)} /><span>{light.toUpperCase()}</span></div>
              </div>
            </div>

            <div className="control-grid">
              <div className="control">
                <label className="field-label" htmlFor="qr-size">Output size <strong>{size} × {size}px</strong></label>
                <input id="qr-size" className="range" type="range" min="160" max="1024" step="32" value={size} onChange={e => setSize(Number(e.target.value))} />
                <div className="range-labels"><span>160px</span><span>1024px</span></div>
              </div>
              <div className="control">
                <label className="field-label" htmlFor="error-level">Error correction</label>
                <select id="error-level" value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="L">Low — 7%</option><option value="M">Medium — 15%</option><option value="Q">Quartile — 25%</option><option value="H">High — 30%</option>
                </select>
              </div>
            </div>
            <label className="checkbox-row"><input type="checkbox" checked={margin} onChange={e => setMargin(e.target.checked)} /><span><strong>Include quiet zone</strong><small>Add a border around the QR code for easier scanning.</small></span></label>
          </div>

          <aside className="preview-column">
            <div className="preview-panel panel">
              <div className="preview-heading"><div><span className="step">02</span><div><h2>Live preview</h2><p>Your QR code updates automatically.</p></div></div><span className="live-dot">LIVE</span></div>
              <div className="qr-stage">
                {qrData ? <img src={qrData} alt="Generated QR code preview" className="qr-image" /> : <div className="qr-placeholder"><QrCode size={58} /><span>QR preview will appear here</span></div>}
              </div>
              {error ? <p className="error-message" role="alert">{error}</p> : <div className="scan-tip"><Zap size={15} /><span>Tip: test-scan your QR code before printing.</span></div>}
              <div className="content-summary"><span className="summary-icon"><QrCode size={17} /></span><div><strong>Encoded content</strong><p>{text.trim() ? text.trim() : 'Nothing entered yet'}</p></div></div>
            </div>

            <div className="download-panel panel">
              <div className="download-title"><div><h2>03&nbsp; Download your QR</h2><p>Choose a format to export your code.</p></div><Download size={19} /></div>
              <div className="format-grid">
                {formats.map(({ label, detail, icon: Icon, action }) => (
                  <button key={label} className="format-card" type="button" onClick={action} disabled={!canDownload}>
                    <span className={'format-icon format-' + label.toLowerCase()}><Icon size={20} /></span>
                    <span className="format-copy"><strong>{label}</strong><small>{detail}</small></span>
                    <Download className="format-download" size={15} />
                  </button>
                ))}
              </div>
              <p className="privacy-note"><ShieldCheck size={14} /> Your text stays in this browser. Nothing is uploaded.</p>
            </div>
          </aside>
        </section>

        <section className="feature-strip">
          <div><span className="feature-icon"><Zap size={17} /></span><div><strong>Instant generation</strong><p>See updates as you type.</p></div></div>
          <div><span className="feature-icon"><ShieldCheck size={17} /></span><div><strong>Private by design</strong><p>Content stays on your device.</p></div></div>
          <div><span className="feature-icon"><Download size={17} /></span><div><strong>4 export formats</strong><p>Web, print, and design friendly.</p></div></div>
        </section>
        <footer>© {new Date().getFullYear()} QR Studio <span>Made for quick, easy QR creation.</span></footer>
      </main>
    </div>
  );
}