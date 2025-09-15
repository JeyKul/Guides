document.addEventListener('DOMContentLoaded', async () => {
  const pages = ['index', 'about', 'contact'];
  const contentEl = document.getElementById('content');
  const guideEl = document.getElementById('guide');

  // Get ?page=name parameter
  function getPageParam() {
    const u = new URL(location.href);
    return u.searchParams.get('page') || 'index';
  }

  // Fetch markdown content
  async function loadMarkdown(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Not found');
      return await res.text();
    } catch {
      return null;
    }
  }

  // Add copy buttons to code blocks
  function addCopyButtons() {
    contentEl.querySelectorAll('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      if (pre.querySelector('.copy-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerText = 'Copy';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        btn.innerText = 'Copied!';
        setTimeout(() => (btn.innerText = 'Copy'), 1500);
      });
      pre.style.position = 'relative';
      pre.appendChild(btn);
      hljs.highlightElement(codeBlock);
    });
  }

  // Load a page markdown and optional guide
  async function loadPage(pageName) {
    const mdText = await loadMarkdown(`pages/${pageName}.md`);
    if (!mdText) {
      contentEl.innerHTML = `<h3>Page not found: ${pageName}</h3>
        <p class="muted">Make sure <code>/pages/${pageName}.md</code> exists in your repo.</p>`;
      guideEl.innerHTML = '';
      return;
    }

    // Detect =GUIDE: directive
    const guideMatch = mdText.match(/^=GUIDE:\s*(.*)$/m);
    let contentText = mdText;
    if (guideMatch) {
      contentText = mdText.replace(guideMatch[0], '');
      const guidePath = guideMatch[1].trim();
      const guideText = await loadMarkdown(guidePath);
      if (guideText) {
        guideEl.innerHTML = marked.parse(guideText);
        guideEl.querySelectorAll('a').forEach(a => {
          const href = a.getAttribute('href') || '';
          if (!href.startsWith('http')) {
            a.href = `?page=${encodeURIComponent(href.replace(/^\.\/|^\.\.\//, ''))}`;
          } else {
            a.target = '_blank';
          }
        });
      }
    } else {
      guideEl.innerHTML = '';
    }

    // Render main content
    contentEl.innerHTML = marked.parse(contentText);
    contentEl.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('http')) a.target = '_blank';
    });

    addCopyButtons();
  }

  // Get current page index for prev/next buttons
  function currentIndex() {
    const p = getPageParam();
    const i = pages.indexOf(p);
    return i === -1 ? 0 : i;
  }

  // Navigation buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const themeToggle = document.getElementById('themeToggle');

  prevBtn?.addEventListener('click', () => {
    const i = currentIndex();
    const prev = pages[(i - 1 + pages.length) % pages.length];
    location.search = `?page=${encodeURIComponent(prev)}`;
  });

  nextBtn?.addEventListener('click', () => {
    const i = currentIndex();
    const next = pages[(i + 1) % pages.length];
    location.search = `?page=${encodeURIComponent(next)}`;
  });

  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('light');
  });

  // Initial load
  const page = getPageParam();
  await loadPage(page);
});
