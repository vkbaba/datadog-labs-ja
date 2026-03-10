document.addEventListener('DOMContentLoaded', () => {
  const content = document.querySelector('.sl-markdown-content');
  if (!content) return;

  const overlay = document.createElement('div');
  overlay.style.cssText =
    'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.82);' +
    'z-index:9999;cursor:zoom-out;align-items:center;justify-content:center;' +
    'padding:2rem;box-sizing:border-box;';

  const zoomedImg = document.createElement('img');
  zoomedImg.style.cssText =
    'max-width:90vw;max-height:90vh;object-fit:contain;' +
    'border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,0.6);';

  overlay.appendChild(zoomedImg);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  };

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  content.querySelectorAll('img').forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      zoomedImg.src = img.src;
      zoomedImg.alt = img.alt;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });
});
