(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('main-navigation');
  if (menuButton && navigation) {
    const mobileNavigation = window.matchMedia('(max-width: 760px)');
    const setMenu = (open) => {
      menuButton.setAttribute('aria-expanded', String(open));
      navigation.classList.toggle('is-open', open);
    };
    menuButton.hidden = false;
    document.documentElement.classList.add('menu-ready');
    menuButton.addEventListener('click', () => {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a') && mobileNavigation.matches) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuButton.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.header')) setMenu(false);
    });
    mobileNavigation.addEventListener('change', () => setMenu(false));
  }

  const budgetForm = document.getElementById('budget-form');
  if (budgetForm) {
    const nameInput = budgetForm.elements.namedItem('name');
    const descriptionInput = budgetForm.elements.namedItem('description');

    [nameInput, descriptionInput].forEach((field) => {
      field.addEventListener('input', () => field.setCustomValidity(''));
    });

    budgetForm.addEventListener('submit', (event) => {
      event.preventDefault();
      nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Informe seu nome.');
      descriptionInput.setCustomValidity(descriptionInput.value.trim() ? '' : 'Conte um pouco sobre o projeto.');
      if (!budgetForm.reportValidity()) return;

      const service = budgetForm.elements.namedItem('service').value;
      const message = [
        `Olá, Gui! Meu nome é ${nameInput.value.trim()}.`,
        'Gostaria de conversar sobre um orçamento.',
        '',
        `Tipo de projeto: ${service}`,
        '',
        descriptionInput.value.trim(),
      ].join('\n');

      window.location.assign(`https://wa.me/5511593002207?text=${encodeURIComponent(message)}`);
    });
  }

  document.querySelectorAll('.device-preview').forEach((preview) => {
    const stage = preview.querySelector('.device-stage');
    const buttons = preview.querySelectorAll('[data-device]');
    let device = null;

    const resizePreview = () => {
      if (stage.hidden) return;
      const width = device === 'mobile' ? 390 : 1440;
      stage.style.setProperty('--preview-scale', stage.clientWidth / width);
    };

    const closePreview = () => {
      stage.replaceChildren();
      stage.hidden = true;
      device = null;
      buttons.forEach((button) => {
        if (button.dataset.device === 'close') button.hidden = true;
        else button.setAttribute('aria-pressed', 'false');
      });
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.device === 'close') {
          closePreview();
          buttons[0].focus();
          return;
        }
        device = button.dataset.device;
        stage.classList.toggle('is-mobile', device === 'mobile');
        stage.hidden = false;
        let frame = stage.querySelector('iframe');
        if (!frame) {
          frame = document.createElement('iframe');
          frame.src = preview.dataset.previewUrl;
          frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
          frame.referrerPolicy = 'no-referrer';
          stage.append(frame);
        }
        frame.title = `${preview.dataset.previewName} — prévia para ${device === 'mobile' ? 'celular' : 'computador'}`;
        buttons.forEach((control) => {
          if (control.dataset.device === 'close') control.hidden = false;
          else control.setAttribute('aria-pressed', String(control === button));
        });
        resizePreview();
      });
    });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(resizePreview);
      resizeObserver.observe(stage);
    } else {
      window.addEventListener('resize', resizePreview);
    }

    preview.closest('details').addEventListener('toggle', (event) => {
      if (!event.currentTarget.open) closePreview();
    });
  });

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealElements = document.querySelectorAll('.reveal');

  // Project recordings load only when a preview is requested.
  const projectVideos = {
    xuniltech: 'assets/videos/xuniltech.webm',
    chocolate: 'assets/videos/chocolate-preview.webm',
    royal: 'assets/videos/royal.webm',
    pse: 'assets/videos/pse-preview.webm',
    vinicius: 'assets/videos/vinicius-preview.webm',
  };

  document.querySelectorAll('[data-project]').forEach((project) => {
    const source = projectVideos[project.dataset.project];
    if (!source) return;

    const video = document.createElement('video');
    video.className = 'project-preview';
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = project.querySelector('.project-still')?.src || '';
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;
    project.querySelector('.project-cover').append(video);

    let active = false;
    let playbackRequest = 0;
    const stop = () => {
      active = false;
      playbackRequest += 1;
      video.pause();
      project.classList.remove('is-playing');
    };
    const play = async () => {
      if (motionPreference.matches || document.hidden) return;
      active = true;
      const request = ++playbackRequest;
      if (!video.getAttribute('src')) {
        video.src = source;
        video.load();
      }
      try {
        await video.play();
        if (request !== playbackRequest) return;
        if (active) project.classList.add('is-playing');
        else video.pause();
      } catch {
        // An older interrupted play request must not cancel a newer one.
        if (request === playbackRequest) stop();
      }
    };

    project.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') play();
    });
    project.addEventListener('pointerleave', stop);
    project.addEventListener('focus', play);
    project.addEventListener('blur', stop);
    video.addEventListener('error', stop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
    });
    motionPreference.addEventListener('change', () => {
      if (motionPreference.matches) stop();
    });

    // On touch screens, preview only the project currently in view.
    if ('IntersectionObserver' in window) {
      const previewObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (window.matchMedia('(hover: none)').matches && entry.isIntersecting) play();
          else if (!entry.isIntersecting) stop();
        });
      }, { threshold: 0.6 });
      previewObserver.observe(project);
    }
  });

  // Content stays visible when animations are disabled or unsupported.
  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    return;
  }

  // Build title masks without changing text, emphasis or accessible names.
  document.querySelectorAll('h2').forEach((heading) => {
    let wordIndex = 0;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
          return;
        }
        const mask = document.createElement('span');
        mask.className = 'word-mask';
        const word = document.createElement('span');
        word.className = 'word-enter';
        word.textContent = part;
        word.style.setProperty('--word-index', wordIndex++);
        mask.append(word);
        fragment.append(mask);
      });
      node.replaceWith(fragment);
    });
  });

  document.querySelectorAll('.project-grid, .service-list, .process-grid').forEach((group) => {
    [...group.children].forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 90}ms`);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealElements.forEach((element) => observer.observe(element));
  document.documentElement.classList.add('motion');

  // One scheduled update per frame; native scrolling remains in control.
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const portrait = document.querySelector('.portrait');
  const statement = document.querySelector('.statement');
  const statementWords = document.querySelectorAll('.statement-word');
  let scrollFrame = 0;
  const updateScroll = () => {
    scrollFrame = 0;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? window.scrollY / distance : 0})`;
    if (statement && !motionPreference.matches) {
      const bounds = statement.getBoundingClientRect();
      const start = window.innerHeight * 0.85;
      const range = Math.max(1, bounds.height + window.innerHeight * 0.15);
      const fraction = Math.max(0, Math.min(1, (start - bounds.top) / range));
      statementWords.forEach((word, index) => {
        const fill = Math.max(0, Math.min(1, fraction * statementWords.length - index));
        word.style.setProperty('--word-fill', `${(fill * 100).toFixed(1)}%`);
      });
    }
    if (portrait && !motionPreference.matches) {
      const bounds = portrait.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
        const offset = ((bounds.top + bounds.height / 2) / window.innerHeight - 0.5) * -18;
        portrait.style.setProperty('--portrait-shift', `${offset.toFixed(2)}px`);
      }
    }
  };
  const scheduleScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  };
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll);
  scheduleScroll();

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.button, .nav-contact').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || motionPreference.matches) return;
      const bounds = button.getBoundingClientRect();
      button.style.setProperty('--magnet-x', `${((event.clientX - bounds.left - bounds.width / 2) * 0.09).toFixed(1)}px`);
      button.style.setProperty('--magnet-y', `${((event.clientY - bounds.top - bounds.height / 2) * 0.12).toFixed(1)}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--magnet-x', '0px');
      button.style.setProperty('--magnet-y', '0px');
    });
  });


  // Respect preference changes made while the page is open.
  motionPreference.addEventListener('change', (event) => {
    if (event.matches) {
      observer.disconnect();
      document.documentElement.classList.remove('motion');
      portrait?.style.removeProperty('--portrait-shift');
      progress.remove();
    }
  });
})();
