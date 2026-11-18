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
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
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
    project.querySelector('.project-media').append(video);

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
      if (event.pointerType === 'mouse') project.classList.add('is-pointer-over');
      if (event.pointerType !== 'touch') play();
    });
    project.addEventListener('pointerleave', () => {
      project.classList.remove('is-pointer-over');
      stop();
    });
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

  const canvas = document.getElementById('bg-canvas');
  const context = canvas?.getContext('2d');
  if (context) {
    let width;
    let height;
    let frame;
    const strandColor = getComputedStyle(canvas).getPropertyValue('--gold').trim();
    const strands = Array.from({ length: 30 }, () => ({
      periodX: 8 + Math.random() * 6,
      periodY: 8 + Math.random() * 6,
      width: 0.8 + Math.random() * 1.7,
      opacity: 0.08 + Math.random() * 0.26,
    }));

    function resizeCanvas() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.globalCompositeOperation = 'lighter';
      context.strokeStyle = strandColor;
    }

    function drawCanvas(timestamp) {
      const time = timestamp / 1600;
      const count = width < 960 ? 15 : strands.length;
      context.clearRect(0, 0, width, height);
      for (let index = 0; index < count; index += 1) {
        const strand = strands[index];
        const swayX = Math.sin(time / strand.periodX);
        const swayY = Math.cos(time / strand.periodY);
        context.beginPath();
        context.moveTo(-200 + index * width / count + swayX * 100, height + 200);
        context.bezierCurveTo(
          width * 0.2 + swayY * 200, height * 0.8,
          width * 0.8 + swayX * 200, height * 0.2,
          width + 200, -200 + swayY * 100,
        );
        context.lineWidth = strand.width;
        context.globalAlpha = strand.opacity;
        context.stroke();
      }
      frame = requestAnimationFrame(drawCanvas);
    }

    function syncCanvas() {
      cancelAnimationFrame(frame);
      if (motionPreference.matches || document.hidden) {
        context.clearRect(0, 0, width, height);
      } else {
        frame = requestAnimationFrame(drawCanvas);
      }
    }

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('visibilitychange', syncCanvas);
    motionPreference.addEventListener('change', syncCanvas);
    resizeCanvas();
    syncCanvas();
  }

  const intro = document.getElementById('intro-layer');
  const squircle = document.getElementById('intro-squircle');
  const introLogo = document.getElementById('intro-logo');
  const brand = document.querySelector('.header .brand');
  if (brand && intro?.animate && !motionPreference.matches) {
    document.documentElement.classList.add('has-intro');
    intro.hidden = false;
    const { left, top, width, height } = brand.getBoundingClientRect();
    const moveX = left + width / 2 - intro.clientWidth / 2;
    const moveY = top + height / 2 - intro.clientHeight / 2;
    const animation = { duration: 1060, delay: 420, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', fill: 'forwards' };
    squircle.animate([
      { width: '100%', height: '100%', borderRadius: '0', transform: 'none' },
      { width: '43px', height: '43px', borderRadius: '12px', transform: `translate(${moveX}px, ${moveY}px)` },
    ], animation);
    introLogo.animate([
      { opacity: 0, transform: 'scale(.6)', filter: 'blur(10px)' },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
    ], { duration: 420, easing: 'ease-out', fill: 'backwards' });
    introLogo.animate([{ width: '80px' }, { width: '43px' }], animation);
    intro.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 300,
      delay: animation.duration + animation.delay,
      fill: 'forwards',
    }).onfinish = () => intro.remove();
  }

  // Content stays visible when animations are disabled or unsupported.
  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    return;
  }

  // Build title masks without changing text, emphasis or accessible names.
  document.querySelectorAll('.reveal h2, h2.reveal').forEach((heading) => {
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
        word.style.setProperty('--word-index', Math.min(wordIndex++, 5));
        mask.append(word);
        fragment.append(mask);
      });
      node.replaceWith(fragment);
    });
  });

  document.querySelectorAll('.brand-strip, .statement, .about, .budget, .service-list, .process-grid').forEach((group) => {
    [...group.querySelectorAll(':scope > .reveal')].forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 90}ms`);
    });
  });

  const reveal = (element) => {
    element.classList.add('visible');
    observer.unobserve(element);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, { threshold: 0.08 });

  [...revealElements, ...document.querySelectorAll('.project-item, .contact')].forEach((element) => {
    observer.observe(element);
    element.addEventListener('focusin', () => reveal(element), { once: true });
  });
  document.documentElement.classList.add('motion');

  // One scheduled update per frame; native scrolling remains in control.
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const parallaxViewport = window.matchMedia('(min-width: 761px) and (not (pointer: coarse))');
  const parallaxTargets = document.querySelectorAll('.portrait, .contact');
  const movingTracks = document.querySelectorAll('.marquee, .showcase-window');
  const visibleLayers = new Set();
  let scrollFrame = 0;
  const updateScroll = () => {
    scrollFrame = 0;
    if (motionPreference.matches) return;

    const viewportHeight = window.innerHeight;
    const distance = document.documentElement.scrollHeight - viewportHeight;
    progress.style.transform = `scaleX(${distance > 0 ? window.scrollY / distance : 0})`;
    if (!parallaxViewport.matches) return;

    visibleLayers.forEach((layer) => {
      const { top, bottom, height } = layer.getBoundingClientRect();
      if (bottom <= 0 || top >= viewportHeight) return;
      const fraction = (viewportHeight - top) / (viewportHeight + height);
      layer.style.setProperty('--parallax-y', `${(12 - fraction * 24).toFixed(2)}px`);
    });
  };
  const scheduleScroll = () => {
    if (!scrollFrame && !motionPreference.matches) scrollFrame = requestAnimationFrame(updateScroll);
  };
  const layerObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (target.matches('.marquee, .showcase-window')) {
        target.classList.toggle('track-offscreen', !isIntersecting);
      } else if (isIntersecting) {
        visibleLayers.add(target);
      } else {
        visibleLayers.delete(target);
      }
    });
    if (visibleLayers.size) scheduleScroll();
  });
  movingTracks.forEach((track) => {
    track.classList.add('track-offscreen');
    layerObserver.observe(track);
  });
  parallaxTargets.forEach((layer) => layerObserver.observe(layer));
  parallaxViewport.addEventListener('change', scheduleScroll);
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll);
  scheduleScroll();

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
      parallaxTargets.forEach((layer) => layer.style.removeProperty('--parallax-y'));
      progress.remove();
    }
  });
})();
