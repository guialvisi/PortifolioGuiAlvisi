(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('main-navigation');
  if (menuButton && navigation) {
    const mobileNavigation = window.matchMedia('(max-width: 900px)');
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

  const portal = document.getElementById('project-portal');
  const studio = document.querySelector('.mini-studio');
  const portalCover = portal?.querySelector('.portal-cover');
  const portalImage = portal?.querySelector('.portal-image');
  let portalTrigger;
  let portalAnimation;
  let studioFlight;
  let studioSelection;

  function resetStudioCamera() {
    studioFlight?.cancel();
    studioFlight = undefined;
    studioSelection?.classList.remove('is-selected');
    studioSelection = undefined;
  }

  if (typeof portal?.showModal === 'function') {
    document.documentElement.classList.add('portals-ready');

    portal.addEventListener('close', () => {
      portalAnimation?.cancel();
      resetStudioCamera();
      portalTrigger?.focus({ preventScroll: true });
    });

    portal.addEventListener('click', (event) => {
      if (event.target === portal) portal.close();
    });

    motionPreference.addEventListener('change', () => {
      if (!motionPreference.matches) return;
      portalAnimation?.cancel();
      studioFlight?.finish();
    });
  }

  function openPortal(project, trigger = project, origin = project.querySelector('.project-media')) {
    const thumbnail = project.querySelector('.project-still');
    const frame = origin.getBoundingClientRect();
    portalTrigger = trigger;
    portal.dataset.project = project.dataset.project;
    portalImage.src = thumbnail.currentSrc || thumbnail.src;
    portalImage.alt = thumbnail.alt;
    portal.querySelector('#portal-title').textContent = project.querySelector('h3').textContent.trim();
    portal.querySelector('.portal-caption p').textContent = project.querySelector('.project-caption p').textContent;
    portal.querySelector('.portal-site').href = project.href;
    portal.showModal();

    if (motionPreference.matches || !portalCover.animate || !frame.width || !frame.height) return;
    const cover = portalCover.getBoundingClientRect();
    const offsetX = frame.left - cover.left;
    const offsetY = frame.top - cover.top;
    const scaleX = frame.width / cover.width;
    const scaleY = frame.height / cover.height;
    portalAnimation = portalCover.animate([
      {
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`,
        boxShadow: '0 0 0 3px var(--portal-accent)',
      },
      { transform: 'none' },
    ], { duration: 610, easing: 'cubic-bezier(.23, .75, .22, 1)' });
  }

  // Project recordings load only when a preview is requested.
  const projectVideos = {
    xuniltech: 'assets/videos/xuniltech.webm',
    chocolate: 'assets/videos/chocolate-preview.webm',
    royal: 'assets/videos/royal.webm',
    pse: 'assets/videos/pse-preview.webm',
    vinicius: 'assets/videos/vinicius-preview.webm',
  };

  const projects = document.querySelectorAll('.project[data-project]');

  if (studio && typeof portal?.showModal === 'function') {
    const stage = studio.querySelector('.studio-stage');
    const set = studio.querySelector('.studio-set');
    const projectById = new Map([...projects].map((project) => [project.dataset.project, project]));
    studio.hidden = false;

    if ('IntersectionObserver' in window) {
      const studioObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        studio.classList.add('is-lit');
        studioObserver.disconnect();
      }, { threshold: 0.15 });
      studioObserver.observe(stage);
    } else {
      studio.classList.add('is-lit');
    }

    const resetStudioTilt = () => {
      stage.style.removeProperty('--studio-pitch');
      stage.style.removeProperty('--studio-yaw');
    };

    stage.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || motionPreference.matches || studioFlight || portal.open) return;
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      stage.style.setProperty('--studio-pitch', `${-y * 11}deg`);
      stage.style.setProperty('--studio-yaw', `${x * 14}deg`);
    });
    studio.addEventListener('focusin', () => studio.classList.add('is-lit'));
    stage.addEventListener('pointerleave', () => {
      if (!studioFlight) resetStudioTilt();
    });
    portal.addEventListener('close', resetStudioTilt);
    motionPreference.addEventListener('change', resetStudioTilt);

    studio.querySelectorAll('.studio-object').forEach((object) => {
      const project = projectById.get(object.dataset.project);
      const model = object.querySelector('.studio-model');

      object.addEventListener('click', async () => {
        if (studioFlight || portal.open) return;
        if (motionPreference.matches || !set.animate) {
          openPortal(project, object, model);
          return;
        }

        studio.classList.add('is-lit');
        studioSelection = object;
        object.classList.add('is-selected');
        const scene = set.getBoundingClientRect();
        const detail = model.getBoundingClientRect();
        const header = document.querySelector('.header');
        const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
        const stageTop = Math.max(scene.top, headerBottom, 0);
        const stageBottom = Math.min(scene.bottom, window.innerHeight);
        const visibleCenterY = stageTop < stageBottom ? (stageTop + stageBottom) / 2 : (scene.top + scene.bottom) / 2;
        const detailX = detail.left + detail.width / 2;
        const detailY = detail.top + detail.height / 2;
        const x = scene.left + scene.width / 2 - detailX;
        const y = visibleCenterY - detailY;
        const origin = `${detailX - scene.left}px ${detailY - scene.top}px`;
        const zoom = Math.min(2.35, scene.width / (detail.width * 1.6));

        const flight = set.animate([
          { transform: 'none', transformOrigin: origin },
          { transform: `translate(${x}px, ${y}px) scale(${zoom})`, transformOrigin: origin },
        ], { duration: 440, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
        studioFlight = flight;
        try {
          await flight.finished;
        } catch {
          return;
        }
        if (studioFlight !== flight || portal.open) return;
        openPortal(project, object, model);
      });
    });
  }

  projects.forEach((project) => {
    if (typeof portal?.showModal === 'function') {
      project.setAttribute('aria-haspopup', 'dialog');
      project.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        resetStudioCamera();
        openPortal(project);
      });
    }

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
      if (motionPreference.matches || document.hidden || portal?.open) return;
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
    portal?.addEventListener('focusin', stop);
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
    let camera = 0;
    let lastFrame;

    function resizeCanvas() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.strokeStyle = strandColor;
    }

    function drawCanvas(timestamp) {
      const elapsed = Math.min(timestamp - (lastFrame ?? timestamp), 50);
      lastFrame = timestamp;
      const scrollAngle = window.scrollY / Math.max(height, 1) * 0.72;
      camera += (scrollAngle - camera) * (1 - Math.exp(-elapsed / 180));
      const rotation = timestamp / 3600 + camera;
      const radius = Math.min(width, height) * 0.36;
      const count = width < 760 ? 14 : 24;
      context.clearRect(0, 0, width, height);

      for (let index = 0; index < count; index += 1) {
        const phase = index / (count - 1) * 3.5 - rotation;
        const near = (Math.cos(phase) + 1) / 2;
        context.globalAlpha = 0.05 + near ** 2 * 0.32;
        context.lineWidth = 0.55 + near * 1.15;
        context.beginPath();
        for (let step = 0; step <= 40; step += 1) {
          const u = step / 20 - 1;
          const angle = phase + u * 3;
          const perspective = 1 / (1 - Math.cos(angle) * 0.38);
          const x = width / 2 + u * width * 0.9 * perspective;
          const y = height / 2 + (Math.sin(angle) * radius - u * height * 0.37) * perspective;
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      frame = requestAnimationFrame(drawCanvas);
    }

    function syncCanvas() {
      cancelAnimationFrame(frame);
      lastFrame = undefined;
      camera = window.scrollY / Math.max(height, 1) * 0.72;
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
    const turnDuration = 840;
    intro.style.setProperty('--intro-turn-duration', `${turnDuration}ms`);
    const animation = { duration: 950, delay: turnDuration, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', fill: 'forwards' };
    function logoDestination() {
      const { left, top, width, height } = brand.getBoundingClientRect();
      const moveX = left + width / 2 - intro.clientWidth / 2;
      const moveY = top + height / 2 - intro.clientHeight / 2;
      return [
        { width: '100%', height: '100%', borderRadius: '0', transform: 'none' },
        { width: '43px', height: '43px', borderRadius: '12px', transform: `translate(${moveX}px, ${moveY}px)` },
      ];
    }
    const docking = squircle.animate(logoDestination(), animation);
    function syncLogoDestination() {
      docking.effect.setKeyframes(logoDestination());
    }
    window.addEventListener('resize', syncLogoDestination);
    introLogo.animate([
      { opacity: 0, transform: 'rotateX(18deg) rotateY(-360deg) scale(.72)' },
      { opacity: 1, offset: 0.2 },
      { opacity: 1, transform: 'rotateX(0deg) rotateY(0deg) scale(1)' },
    ], { duration: turnDuration, easing: 'cubic-bezier(.3, .05, .2, 1)', fill: 'both' });
    introLogo.animate([{ width: '80px' }, { width: '43px' }], animation);

    const curves = document.getElementById('intro-curves');
    const scene = curves?.getContext('2d');
    let introFrame;

    function drawIntroCurves() {
      const width = curves.clientWidth;
      const height = curves.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * scale);
      const pixelHeight = Math.round(height * scale);
      if (curves.width !== pixelWidth || curves.height !== pixelHeight) {
        curves.width = pixelWidth;
        curves.height = pixelHeight;
      }
      scene.setTransform(scale, 0, 0, scale, 0, 0);
      scene.clearRect(0, 0, width, height);
      scene.lineCap = 'round';
      const time = introFade.currentTime ?? 0;
      const progress = Math.min(time / turnDuration, 1);
      const reveal = Math.min(progress * 6, 1);
      const exit = 1 - Math.min(Math.max(time - turnDuration, 0) / 720, 1);
      const sweep = 1 - (1 - progress) ** 3;
      const radius = Math.min(width, height) * 0.32;
      const count = width < 760 ? 14 : 23;

      for (let line = 0; line < count; line += 1) {
        let previous;
        for (let step = 0; step <= 64; step += 1) {
          const u = step / 64 * 2 - 1;
          const angle = u * 3.4 + line / (count - 1) * 3.1 - sweep * 3.8;
          const depth = Math.cos(angle);
          const perspective = 1 / (1 - depth * 0.32);
          const x = width / 2 + u * width * 0.85 * perspective;
          const y = height / 2 + (Math.sin(angle) * radius - u * height * 0.27) * perspective;

          if (previous) {
            const light = (depth + 1) / 2;
            const centerFade = Math.min(Math.hypot(x - width / 2, y - height / 2) / 110, 1);
            scene.strokeStyle = light > 0.8 ? '#f3d59b' : '#c6a365';
            scene.globalAlpha = (0.05 + light ** 2 * 0.57) * centerFade * reveal * exit;
            scene.lineWidth = 0.45 + light * 1.35;
            scene.beginPath();
            scene.moveTo(previous.x, previous.y);
            scene.lineTo(x, y);
            scene.stroke();
          }
          previous = { x, y };
        }
      }

      if (exit > 0) introFrame = requestAnimationFrame(drawIntroCurves);
    }

    function finishIntro() {
      cancelAnimationFrame(introFrame);
      motionPreference.removeEventListener('change', finishIntro);
      window.removeEventListener('resize', syncLogoDestination);
      intro.remove();
    }

    motionPreference.addEventListener('change', finishIntro);
    const introFade = intro.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 220,
      delay: animation.duration + animation.delay,
      fill: 'forwards',
    });
    introFade.onfinish = finishIntro;
    if (scene) introFrame = requestAnimationFrame(drawIntroCurves);
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
  const parallaxTargets = document.querySelectorAll('.portrait');
  const movingTracks = document.querySelectorAll('.marquee, .showcase-window, .code-scene');
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
      if (target.matches('.marquee, .showcase-window, .code-scene')) {
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
