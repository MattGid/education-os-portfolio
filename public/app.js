/* ==========================================================================
   EDUCATION OS — CLEAN MINIMALIST PORTFOLIO ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------------------
     1. Top Scroll Progress Fallback (when CSS animation-timeline is unsupported)
     -------------------------------------------------------------------------- */
  const pageProgress = document.getElementById('page-scroll-progress');
  if (pageProgress && !CSS.supports('animation-timeline', 'scroll()')) {
    window.addEventListener(
      'scroll',
      () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const ratio = scrollable > 0 ? Math.min(1, Math.max(0, scrolled / scrollable)) : 0;
        pageProgress.style.transform = `scaleX(${ratio})`;
      },
      { passive: true }
    );
  }

  /* --------------------------------------------------------------------------
     2. Section 03 — Intuitive Horizontal Timeline (Wheel, Drag, Trackpad & Tabs)
     -------------------------------------------------------------------------- */
  const scroller = document.getElementById('timeline-scroller');
  const stages = document.querySelectorAll('.timeline-stage');
  const stageTabs = document.querySelectorAll('.stage-tab');
  const prevBtn = document.getElementById('timeline-prev-btn');
  const nextBtn = document.getElementById('timeline-next-btn');

  let activeStageIdx = 0;

  function setActiveStageUI(idx) {
    activeStageIdx = Math.max(0, Math.min(stages.length - 1, idx));
    stageTabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === activeStageIdx);
    });
  }

  function scrollToStage(idx) {
    if (!scroller || !stages[idx]) return;
    const target = stages[idx];
    const firstLeft = stages[0].offsetLeft;
    const targetScrollLeft = target.offsetLeft - firstLeft;
    scroller.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
    setActiveStageUI(idx);
  }

  if (scroller && stages.length) {
    // Sync active date tab as user scrolls horizontally
    scroller.addEventListener(
      'scroll',
      () => {
        const scrollLeft = scroller.scrollLeft;
        const firstLeft = stages[0].offsetLeft;
        let closestIdx = 0;
        let minDistance = Infinity;

        stages.forEach((stage, i) => {
          const stageStart = stage.offsetLeft - firstLeft;
          const dist = Math.abs(scrollLeft - stageStart);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
          }
        });

        setActiveStageUI(closestIdx);
      },
      { passive: true }
    );

    // Mouse wheel over timeline translates cleanly into horizontal scrolling
    scroller.addEventListener(
      'wheel',
      (e) => {
        // If primarily vertical wheel motion, translate to horizontal scroll if not at boundary
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          const maxScroll = scroller.scrollWidth - scroller.clientWidth;
          const atStart = scroller.scrollLeft <= 1 && e.deltaY < 0;
          const atEnd = scroller.scrollLeft >= maxScroll - 1 && e.deltaY > 0;
          if (!atStart && !atEnd) {
            e.preventDefault();
            scroller.scrollLeft += e.deltaY;
          }
        }
      },
      { passive: false }
    );

    // Click and drag to scroll horizontally on desktop
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    scroller.addEventListener('mousedown', (e) => {
      if (
        document.body.classList.contains('is-editing-text') ||
        document.body.classList.contains('is-commenting')
      ) {
        return;
      }
      isDown = true;
      startX = e.pageX - scroller.offsetLeft;
      startScrollLeft = scroller.scrollLeft;
      scroller.classList.add('is-dragging');
    });

    const stopDrag = () => {
      if (!isDown) return;
      isDown = false;
      scroller.classList.remove('is-dragging');
    };

    scroller.addEventListener('mouseleave', stopDrag);
    window.addEventListener('mouseup', stopDrag);

    scroller.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scroller.offsetLeft;
      const walk = (x - startX) * 1.35;
      scroller.scrollLeft = startScrollLeft - walk;
    });

    // Keyboard Left / Right arrow support when focused
    scroller.addEventListener('keydown', (e) => {
      if (document.body.classList.contains('is-editing-text')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToStage(Math.min(stages.length - 1, activeStageIdx + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToStage(Math.max(0, activeStageIdx - 1));
      }
    });
  }

  stageTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.getAttribute('data-stage-index') || '0', 10);
      scrollToStage(idx);
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => scrollToStage(Math.max(0, activeStageIdx - 1)));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () =>
      scrollToStage(Math.min(stages.length - 1, activeStageIdx + 1))
    );
  }

  /* --------------------------------------------------------------------------
     2b. Platform Presentation Video Section (Play, Chapters & Local File Preview)
     -------------------------------------------------------------------------- */
  const videoEl = document.getElementById('platform-presentation-video');
  const posterOverlay = document.getElementById('video-poster-overlay');
  const localPicker = document.getElementById('local-video-picker');
  const chapterBtns = document.querySelectorAll('.video-chapter-btn');
  const activeChapterLabel = document.getElementById('video-active-chapter-label');

  if (posterOverlay && videoEl) {
    const triggerPlayOrPick = () => {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            posterOverlay.classList.add('is-playing');
          })
          .catch(() => {
            // If presentation.mp4 isn't uploaded yet, let the user pick a local video file to preview immediately
            if (localPicker) localPicker.click();
          });
      }
    };

    posterOverlay.addEventListener('click', triggerPlayOrPick);
    posterOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerPlayOrPick();
      }
    });

    videoEl.addEventListener('play', () => {
      posterOverlay.classList.add('is-playing');
    });
  }

  if (localPicker && videoEl && posterOverlay) {
    localPicker.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const blobUrl = URL.createObjectURL(file);
      videoEl.src = blobUrl;
      posterOverlay.classList.add('is-playing');
      videoEl.play().catch(() => {});
    });
  }

  chapterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      chapterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const label = btn.getAttribute('data-chapter-label');
      const timeSec = parseFloat(btn.getAttribute('data-chapter-time') || '0');
      if (activeChapterLabel && label) {
        activeChapterLabel.textContent = label;
      }

      if (videoEl && videoEl.readyState >= 1) {
        videoEl.currentTime = timeSec;
        videoEl.play().catch(() => {});
      }
    });
  });

  /* --------------------------------------------------------------------------
     3. Section 04 — Interactive 9-Stage Learning Loop Inspector
     -------------------------------------------------------------------------- */
  const loopData = [
    {
      step: '01 / Invite',
      title: 'Tenant-Scoped Invitation',
      desc: 'A learner enters through a school-specific invitation link rather than an open public sign-up, binding the onboarding context immediately to the target tenant.'
    },
    {
      step: '02 / Approve',
      title: 'Membership & Educator Approval',
      desc: 'Authentication confirms identity, while school-level membership and educator approval verify whether the learner is authorised to enter the workspace.'
    },
    {
      step: '03 / Learn',
      title: 'Authorised Curriculum Context',
      desc: 'Learners access structured references, movement footage or musical material inside the protected boundary of their active school.'
    },
    {
      step: '04 / Assign',
      title: 'Persistent Homework Assignment',
      desc: 'Educators assign targeted practice with instructions and reference media connected directly to the learner’s ongoing history.'
    },
    {
      step: '05 / Practise',
      title: 'Deliberate Practice Between Lessons',
      desc: 'Between live sessions, learners record their music practice or martial-arts movement drills with all references kept in one place.'
    },
    {
      step: '06 / Submit',
      title: 'Private Signed Media Submission',
      desc: 'Learners upload private practice recordings or training videos resolved only for authorised users via short-lived signed access.'
    },
    {
      step: '07 / Review',
      title: 'Coach Inspection & Video/Audio Analysis',
      desc: 'The coach is notified and reviews the submission in context, including time-based feedback and visual drawing/annotation over movement footage.'
    },
    {
      step: '08 / Feedback',
      title: 'Structured, Revisitable Feedback',
      desc: 'Feedback stays permanently attached to the assignment and submission history rather than vanishing in ephemeral chat threads.'
    },
    {
      step: '09 / Return to Learning',
      title: 'Continuous Learning Relationship',
      desc: 'The learner applies the feedback and transitions into the next curriculum module or live class without ever leaving the tenant workspace.'
    }
  ];

  const loopBtns = document.querySelectorAll('.loop-node-btn');
  const loopBadge = document.getElementById('loop-inspector-badge');
  const loopTitle = document.getElementById('loop-inspector-title');
  const loopDesc = document.getElementById('loop-inspector-desc');

  loopBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      loopBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const item = loopData[index];
      if (item && loopBadge && loopTitle && loopDesc) {
        loopBadge.textContent = item.step;
        loopTitle.textContent = item.title;
        loopDesc.textContent = item.desc;
      }
    });
  });

  /* --------------------------------------------------------------------------
     4. Section 05 — Core User Journeys Interactive Tabs
     -------------------------------------------------------------------------- */
  const journeyTabBtns = document.querySelectorAll('.minimal-tab-btn');
  const journeyPanels = document.querySelectorAll('.journey-panel');

  journeyTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-journey-target');
      journeyTabBtns.forEach((b) => b.classList.remove('active'));
      journeyPanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });

  /* --------------------------------------------------------------------------
     5. Section 06 — Multi-Tenant System State & Permission Simulator
     -------------------------------------------------------------------------- */
  const simState = {
    tenant: 'melodina',
    membership: 'approved',
    role: 'learner',
    entry: 'direct-link'
  };

  const simBtns = document.querySelectorAll('[data-sim-group]');
  const outRoute = document.getElementById('sim-out-route');
  const outAuth = document.getElementById('sim-out-auth');
  const outControls = document.getElementById('sim-out-controls');
  const outMedia = document.getElementById('sim-out-media');
  const outVerdict = document.getElementById('sim-out-verdict');

  function renderSimulation() {
    if (!outRoute || !outAuth || !outControls || !outMedia || !outVerdict) return;

    const tenantSlug = simState.tenant === 'melodina' ? 'melodina-hub' : 'mira-treino';
    const tenantLesson =
      simState.tenant === 'melodina' ? 'acoustic-phrasing-04' : 'guard-retention-drill';

    if (simState.membership === 'syncing') {
      outRoute.textContent = `/${tenantSlug}/syncing-context...`;
      outAuth.textContent = 'AUTHENTICATED · MEMBERSHIP SYNC IN PROGRESS';
      outControls.textContent = 'FAIL-CLOSED (Previous tenant controls locked)';
      outMedia.textContent = 'LOCKED (Awaiting tenant boundary verification)';
      outVerdict.className = 'sim-verdict pending';
      outVerdict.innerHTML =
        '<strong>Fail-Closed Synchronisation State:</strong> While switching schools, Education OS hides controls from the previous tenant and blocks action execution until active membership and role permissions resolve.';
      return;
    }

    if (simState.membership === 'missing') {
      outRoute.textContent = `/${tenantSlug}/access-required`;
      outAuth.textContent = 'AUTHENTICATED · NO TENANT MEMBERSHIP';
      outControls.textContent = 'NONE (Request Invitation / Switch School)';
      outMedia.textContent = 'DENIED (Row Level Security + Storage Guard)';
      outVerdict.className = 'sim-verdict blocked';
      outVerdict.innerHTML =
        '<strong>Identity ≠ School Access:</strong> Even though the user is signed in, they hold no membership in this school. The system renders an explicit missing-membership state rather than a generic crash.';
      return;
    }

    if (simState.membership === 'pending') {
      outRoute.textContent = `/${tenantSlug}/membership-pending`;
      outAuth.textContent = 'AUTHENTICATED · AWAITING EDUCATOR APPROVAL';
      outControls.textContent = 'READ-ONLY ONBOARDING STATUS';
      outMedia.textContent = 'LOCKED UNTIL EDUCATOR APPROVAL';
      outVerdict.className = 'sim-verdict pending';
      outVerdict.innerHTML =
        '<strong>Explicit Pending State:</strong> Invitation was claimed, but educator approval is still required before curriculum or private submissions unlock. Direct-link target is preserved for post-approval return.';
      return;
    }

    if (simState.role === 'platform-admin') {
      outRoute.textContent = `/platform-admin/tenants/${tenantSlug}`;
      outAuth.textContent = 'PLATFORM ADMIN · INFRASTRUCTURE SCOPE';
      outControls.textContent = 'TENANT CONFIG, WHITE-LABEL & MODULE TOGGLES';
      outMedia.textContent = 'RESTRICTED (Private learner submissions protected)';
      outVerdict.className = 'sim-verdict pending';
      outVerdict.innerHTML =
        '<strong>Admin ≠ Educator Authority:</strong> Being able to administer Education OS does not automatically grant access to private learner recordings inside every school.';
      return;
    }

    const routePath =
      simState.entry === 'direct-link'
        ? `/${tenantSlug}/assignments/${tenantLesson}?return=preserved`
        : `/${tenantSlug}/workspace`;

    outRoute.textContent = routePath;
    outAuth.textContent = `AUTHENTICATED · APPROVED (${simState.role.toUpperCase()})`;

    if (simState.role === 'educator') {
      outControls.textContent =
        simState.tenant === 'melodina'
          ? 'ASSIGN WORK, SCORE REVIEW, DUAL-CHANNEL LIVE AUDIO'
          : 'ASSIGN DRILL, VIDEO FRAME DRAWING & TIME-CODED REVIEW';
    } else {
      outControls.textContent =
        simState.tenant === 'melodina'
          ? 'PRACTICE RECORDER, SUBMIT AUDIO, VIEW FEEDBACK HISTORY'
          : 'UPLOAD MOVEMENT FOOTAGE, VIEW ANNOTATED COACH BREAKDOWN';
    }

    outMedia.textContent = 'SHORT-LIVED SIGNED URL ISSUED (Authorised Scope)';
    outVerdict.className = 'sim-verdict granted';
    outVerdict.innerHTML =
      simState.entry === 'direct-link'
        ? `<strong>Direct-Link Context Preserved:</strong> After sign-in and membership validation, the user is returned directly to <code>${routePath}</code> with tenant-specific capabilities active.`
        : `<strong>Active Tenant Workspace:</strong> Identity, school membership and ${simState.role} authority are verified. All private media resolves via short-lived signed access.`;
  }

  simBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-sim-group');
      const val = btn.getAttribute('data-sim-val');
      if (!group || !val) return;

      simState[group] = val;
      document
        .querySelectorAll(`[data-sim-group="${group}"]`)
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderSimulation();
    });
  });

  renderSimulation();

  /* --------------------------------------------------------------------------
     6. Inline Live Text Editor & Pin Commenting System
     -------------------------------------------------------------------------- */
  const STORAGE_KEY = 'education_os_inline_edits_v3';
  const COMMENTS_STORAGE_KEY = 'education_os_comments_v3';
  try {
    localStorage.removeItem('education_os_inline_edits_v1');
    localStorage.removeItem('education_os_comments_v1');
    localStorage.removeItem('education_os_inline_edits_v2');
    localStorage.removeItem('education_os_comments_v2');
  } catch {
    // Ignore storage access errors
  }

  const toggleBtn = document.getElementById('editor-toggle-btn');
  const toggleLabel = document.getElementById('editor-toggle-label');
  const commentToggleBtn = document.getElementById('comment-toggle-btn');
  const commentToggleLabel = document.getElementById('comment-toggle-label');
  const actionsPanel = document.getElementById('editor-actions-panel');
  const saveStatus = document.getElementById('editor-save-status');
  const copyBtn = document.getElementById('editor-copy-btn');
  const downloadBtn = document.getElementById('editor-download-btn');
  const resetBtn = document.getElementById('editor-reset-btn');

  // Comment Popover DOM
  const pinsLayer = document.getElementById('comment-pins-layer');
  const popover = document.getElementById('comment-popover');
  const popoverTargetLabel = document.getElementById('comment-popover-target');
  const parentBtn = document.getElementById('comment-parent-btn');
  const hierarchyBar = document.getElementById('comment-hierarchy-bar');
  const popoverCloseBtn = document.getElementById('comment-popover-close');
  const commentTextarea = document.getElementById('comment-textarea');
  const commentSaveBtn = document.getElementById('comment-save-btn');
  const commentCancelBtn = document.getElementById('comment-cancel-btn');
  const commentDeleteBtn = document.getElementById('comment-delete-btn');
  const quickChips = document.querySelectorAll('.comment-chip');

  const EDITABLE_SELECTOR = [
    'main h1',
    'main h2',
    'main h3',
    'main h4',
    'main h5',
    'main p',
    'main li',
    'main td',
    'main th',
    'main caption',
    'main figcaption',
    'main .section-meta > span:not(.line)',
    'main .spec-key',
    'main .spec-val',
    'main .spec-label',
    'main .spec-value',
    'main .col-kicker',
    'main .ux-cap-index',
    'main .ux-zone-kicker',
    'main .ux-zone-code',
    'main .stage-month-badge',
    'main .stage-date',
    'main .stage-tab',
    'main .minimal-tab-btn',
    'main .clean-step-row > span',
    'main .comp-table-row > span',
    'main .contrast-header > span',
    'main .tag-minimal',
    'main .arch-tag',
    'footer .container > span'
  ].join(', ');

  const editableNodes = Array.from(document.querySelectorAll(EDITABLE_SELECTOR));
  const originalHTMLMap = new Map();

  editableNodes.forEach((node, idx) => {
    const editId = `edit-node-${idx}`;
    node.setAttribute('data-edit-id', editId);
    originalHTMLMap.set(editId, node.innerHTML);
  });

  // Make EVERY SINGLE element & container inside <main> and <footer> selectable for comments
  const NON_COMMENTABLE_TAGS = new Set(['BR', 'SOURCE', 'INPUT', 'SVG', 'PATH', 'SCRIPT', 'STYLE']);
  const allCandidateNodes = Array.from(document.querySelectorAll('main, main *, footer, footer *'));
  let targetIdx = 0;
  allCandidateNodes.forEach((node) => {
    if (NON_COMMENTABLE_TAGS.has(node.tagName)) return;
    if (node.classList.contains('timeline-edge-blur') || node.classList.contains('line')) return;
    node.setAttribute('data-comment-target-id', `target-${targetIdx++}`);
  });

  function loadSavedEdits() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveEditsMap(mapObj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapObj));
    } catch {
      // Ignore storage quota errors
    }
  }

  function loadSavedComments() {
    try {
      const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCommentsList(list) {
    try {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage quota errors
    }
  }

  let isEditing = false;
  let isCommenting = false;
  let activeCommentTargetId = null;
  let hoveredCommentEl = null;

  function describeElement(el) {
    if (!el) return 'Element';
    const section = el.closest('section');
    const secId = section && section.id ? `#${section.id}` : 'page';
    const tag = el.tagName.toLowerCase();
    const cls = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).filter((c) => c !== 'comment-hover-target')[0]
      : '';
    const snippet = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 42);
    return `${secId} · <${tag}${cls === '.' ? '' : cls}> "${snippet}${snippet.length >= 42 ? '…' : ''}"`;
  }

  function updateStatusLabel(customMsg) {
    if (!saveStatus) return;
    const editCount = Object.keys(loadSavedEdits()).length;
    const commentList = loadSavedComments();
    const commentCount = commentList.length;

    if (commentToggleLabel) {
      commentToggleLabel.textContent =
        commentCount > 0 ? `Comments (${commentCount})` : 'Comment Mode';
    }

    if (actionsPanel) {
      actionsPanel.hidden = !isEditing && !isCommenting && editCount === 0 && commentCount === 0;
    }

    if (customMsg) {
      saveStatus.textContent = customMsg;
      return;
    }

    if (editCount > 0 || commentCount > 0) {
      saveStatus.textContent = `${editCount} edit${editCount === 1 ? '' : 's'} · ${commentCount} comment${commentCount === 1 ? '' : 's'}`;
    } else if (isCommenting) {
      saveStatus.textContent = 'Click any element to add a note';
    } else if (isEditing) {
      saveStatus.textContent = 'Click any text to edit';
    } else {
      saveStatus.textContent = 'Ready';
    }
  }

  function applySavedEditsToDOM() {
    const saved = loadSavedEdits();
    let count = 0;
    Object.entries(saved).forEach(([editId, html]) => {
      const el = document.querySelector(`[data-edit-id="${editId}"]`);
      if (el && typeof html === 'string' && el.innerHTML !== html) {
        el.innerHTML = html;
        count++;
      }
    });
    updateStatusLabel();
    return count;
  }

  function renderCommentPins() {
    if (!pinsLayer) return;
    pinsLayer.innerHTML = '';

    document.querySelectorAll('[data-has-comment]').forEach((el) => {
      el.removeAttribute('data-has-comment');
    });

    const comments = loadSavedComments();
    comments.forEach((item, index) => {
      const el = document.querySelector(`[data-comment-target-id="${item.targetId}"]`);
      if (!el) return;
      el.setAttribute('data-has-comment', 'true');

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'comment-pin-badge';
      pin.textContent = String(index + 1);
      pin.title = `#${index + 1}: ${item.text}`;

      const topPx = rect.top + window.scrollY + 6;
      const leftPx = Math.min(
        window.innerWidth - 18,
        Math.max(18, rect.right + window.scrollX - 6)
      );
      pin.style.top = `${topPx}px`;
      pin.style.left = `${leftPx}px`;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        openCommentPopover(el);
      });

      pinsLayer.appendChild(pin);
    });

    updateStatusLabel();
  }

  function shortNodeName(el) {
    if (!el) return '';
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    const cls =
      el.className && typeof el.className === 'string'
        ? el.className
            .trim()
            .split(/\s+/)
            .filter((c) => c !== 'comment-hover-target' && c !== 'comment-active-target')[0]
        : '';
    return cls ? `${tag}.${cls}` : tag;
  }

  function clearActiveTargetHighlight() {
    document.querySelectorAll('.comment-active-target').forEach((el) => {
      el.classList.remove('comment-active-target');
    });
  }

  function openCommentPopover(targetEl, preservePositionAndDraft = false) {
    if (!popover || !targetEl) return;
    const targetId = targetEl.getAttribute('data-comment-target-id');
    if (!targetId) return;

    const draftText = preservePositionAndDraft && commentTextarea ? commentTextarea.value : '';

    clearActiveTargetHighlight();
    targetEl.classList.add('comment-active-target');

    activeCommentTargetId = targetId;
    if (popoverTargetLabel) {
      popoverTargetLabel.textContent = describeElement(targetEl);
    }

    // Build ancestor chain for easy container selection
    if (hierarchyBar) {
      hierarchyBar.innerHTML = '';
      const chain = [];
      let curr = targetEl;
      while (curr && curr !== document.body && curr.hasAttribute('data-comment-target-id')) {
        chain.unshift(curr);
        if (curr.tagName === 'SECTION' || curr.tagName === 'MAIN' || curr.tagName === 'FOOTER') {
          break;
        }
        curr = curr.parentElement ? curr.parentElement.closest('[data-comment-target-id]') : null;
      }

      chain.forEach((node) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'comment-crumb-btn' + (node === targetEl ? ' active' : '');
        btn.textContent = shortNodeName(node);
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openCommentPopover(node, true);
        });
        hierarchyBar.appendChild(btn);
      });
    }

    const parentCandidate = targetEl.parentElement
      ? targetEl.parentElement.closest('[data-comment-target-id]')
      : null;
    if (parentBtn) {
      parentBtn.disabled = !parentCandidate;
      parentBtn.onclick = (e) => {
        e.stopPropagation();
        if (parentCandidate) {
          openCommentPopover(parentCandidate, true);
        }
      };
    }

    const existing = loadSavedComments().find((c) => c.targetId === targetId);
    if (commentTextarea) {
      commentTextarea.value = existing ? existing.text : draftText;
    }
    if (commentDeleteBtn) {
      commentDeleteBtn.hidden = !existing;
    }

    const wasHidden = popover.hidden;
    popover.hidden = false;

    if (!preservePositionAndDraft || wasHidden) {
      const rect = targetEl.getBoundingClientRect();
      const popWidth = 360;
      const popHeight = 260;
      const left = Math.min(
        window.innerWidth - popWidth - 16,
        Math.max(16, rect.left + Math.min(rect.width * 0.25, 120))
      );
      const top = Math.min(
        window.innerHeight - popHeight - 80,
        Math.max(16, rect.top + 28)
      );
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    }

    setTimeout(() => {
      if (commentTextarea) commentTextarea.focus();
    }, 20);
  }

  function closeCommentPopover() {
    if (popover) popover.hidden = true;
    clearActiveTargetHighlight();
    activeCommentTargetId = null;
  }

  function setEditingMode(enabled) {
    isEditing = enabled;
    if (isEditing && isCommenting) {
      setCommentingMode(false);
    }
    document.body.classList.toggle('is-editing-text', isEditing);
    if (toggleBtn) toggleBtn.classList.toggle('active', isEditing);
    if (toggleLabel) toggleLabel.textContent = isEditing ? 'Editing Active' : 'Edit Text';

    editableNodes.forEach((node) => {
      if (isEditing) {
        node.setAttribute('contenteditable', 'true');
        node.setAttribute('spellcheck', 'true');
      } else {
        node.removeAttribute('contenteditable');
        node.removeAttribute('spellcheck');
      }
    });

    updateStatusLabel();
  }

  function setCommentingMode(enabled) {
    isCommenting = enabled;
    if (isCommenting && isEditing) {
      setEditingMode(false);
    }
    document.body.classList.toggle('is-commenting', isCommenting);
    if (commentToggleBtn) commentToggleBtn.classList.toggle('active', isCommenting);
    if (!isCommenting && hoveredCommentEl) {
      hoveredCommentEl.classList.remove('comment-hover-target');
      hoveredCommentEl = null;
    }
    if (!isCommenting) {
      closeCommentPopover();
    }
    updateStatusLabel();
  }

  // Record text edits on input
  editableNodes.forEach((node) => {
    node.addEventListener('input', () => {
      const editId = node.getAttribute('data-edit-id');
      if (!editId) return;
      const saved = loadSavedEdits();
      const orig = originalHTMLMap.get(editId);
      if (node.innerHTML === orig) {
        delete saved[editId];
      } else {
        saved[editId] = node.innerHTML;
      }
      saveEditsMap(saved);
      updateStatusLabel();
      renderCommentPins();
    });
  });

  // Hover highlight and click-to-comment in Comment Mode
  document.addEventListener('mousemove', (e) => {
    if (!isCommenting) return;
    if (
      e.target.closest('#inline-editor-dock') ||
      e.target.closest('#comment-popover') ||
      e.target.closest('#comment-pins-layer')
    ) {
      if (hoveredCommentEl) {
        hoveredCommentEl.classList.remove('comment-hover-target');
        hoveredCommentEl = null;
      }
      return;
    }

    const candidate = e.target.closest('[data-comment-target-id]');
    if (candidate !== hoveredCommentEl) {
      if (hoveredCommentEl) hoveredCommentEl.classList.remove('comment-hover-target');
      hoveredCommentEl = candidate;
      if (hoveredCommentEl) hoveredCommentEl.classList.add('comment-hover-target');
    }
  });

  document.addEventListener(
    'click',
    (e) => {
      if (!isCommenting) return;
      if (
        e.target.closest('#inline-editor-dock') ||
        e.target.closest('#comment-popover') ||
        e.target.closest('#comment-pins-layer')
      ) {
        return;
      }
      const candidate = e.target.closest('[data-comment-target-id]');
      if (candidate) {
        e.preventDefault();
        e.stopPropagation();
        openCommentPopover(candidate);
      }
    },
    true
  );

  // Quick-insert chips inside popover
  quickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const tag = chip.getAttribute('data-Insert-tag') || '';
      if (!commentTextarea) return;
      if (!commentTextarea.value.startsWith(tag)) {
        commentTextarea.value = tag + commentTextarea.value;
      }
      commentTextarea.focus();
    });
  });

  function saveActiveComment() {
    if (!activeCommentTargetId || !commentTextarea) return;
    const text = commentTextarea.value.trim();
    const list = loadSavedComments();
    const idx = list.findIndex((c) => c.targetId === activeCommentTargetId);

    if (!text) {
      if (idx !== -1) list.splice(idx, 1);
    } else {
      const el = document.querySelector(`[data-comment-target-id="${activeCommentTargetId}"]`);
      const entry = {
        targetId: activeCommentTargetId,
        label: describeElement(el),
        text
      };
      if (idx !== -1) {
        list[idx] = entry;
      } else {
        list.push(entry);
      }
    }

    saveCommentsList(list);
    closeCommentPopover();
    renderCommentPins();
  }

  if (commentSaveBtn) {
    commentSaveBtn.addEventListener('click', saveActiveComment);
  }
  if (commentCancelBtn) {
    commentCancelBtn.addEventListener('click', closeCommentPopover);
  }
  if (popoverCloseBtn) {
    popoverCloseBtn.addEventListener('click', closeCommentPopover);
  }
  if (commentDeleteBtn) {
    commentDeleteBtn.addEventListener('click', () => {
      if (!activeCommentTargetId) return;
      const list = loadSavedComments().filter((c) => c.targetId !== activeCommentTargetId);
      saveCommentsList(list);
      closeCommentPopover();
      renderCommentPins();
    });
  }

  if (commentTextarea) {
    commentTextarea.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        saveActiveComment();
      } else if (e.key === 'Escape') {
        closeCommentPopover();
      }
    });
  }

  // Keep pins anchored on scroll / resize / timeline scroll
  window.addEventListener('resize', renderCommentPins, { passive: true });
  window.addEventListener('scroll', renderCommentPins, { passive: true });
  if (scroller) {
    scroller.addEventListener('scroll', renderCommentPins, { passive: true });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => setEditingMode(!isEditing));
  }
  if (commentToggleBtn) {
    commentToggleBtn.addEventListener('click', () => setCommentingMode(!isCommenting));
  }

  // Keyboard shortcuts: Cmd/Ctrl + E (Edit Text), Cmd/Ctrl + M (Comment Mode)
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      setEditingMode(!isEditing);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      setCommentingMode(!isCommenting);
    }
  });

  // Copy All Edits & Comments for AI
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const savedEdits = loadSavedEdits();
      const editEntries = Object.entries(savedEdits);
      const savedComments = loadSavedComments();
      const lines = [];

      if (editEntries.length === 0 && savedComments.length === 0) {
        lines.push('No text edits or comments recorded yet.');
      } else {
        lines.push('# Portfolio Feedback: Pinned Comments & Text Edits');
        lines.push('');

        if (savedComments.length > 0) {
          lines.push('## 1. Pinned Comments (Removals & Layout Changes)');
          savedComments.forEach((item, i) => {
            lines.push(`${i + 1}. **Target:** \`${item.label}\``);
            lines.push(`   - **Instruction:** ${item.text}`);
          });
          lines.push('');
        }

        if (editEntries.length > 0) {
          lines.push('## 2. Inline Text Edits');
          editEntries.forEach(([editId, newHTML]) => {
            const el = document.querySelector(`[data-edit-id="${editId}"]`);
            const section = el ? el.closest('section') : null;
            const sectionId = section ? `#${section.id}` : 'page';
            const tag = el ? el.tagName.toLowerCase() : 'element';
            const tempOrig = document.createElement('div');
            tempOrig.innerHTML = originalHTMLMap.get(editId) || '';
            const beforeText = tempOrig.textContent.trim().replace(/\s+/g, ' ');
            const afterText = el ? el.textContent.trim().replace(/\s+/g, ' ') : newHTML;
            lines.push(`- **[${sectionId} · <${tag}>]**`);
            lines.push(`  - Before: "${beforeText}"`);
            lines.push(`  - After:  "${afterText}"`);
          });
        }
      }

      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        updateStatusLabel('Copied all edits & comments!');
        setTimeout(() => updateStatusLabel(), 2500);
      } catch {
        updateStatusLabel('Clipboard permission needed');
      }
    });
  }

  // Download full clean index.html with all edits baked in
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const clone = document.documentElement.cloneNode(true);
      const cloneBody = clone.querySelector('body');
      if (cloneBody) {
        cloneBody.classList.remove('is-editing-text', 'is-commenting');
      }

      clone
        .querySelectorAll(
          '[contenteditable], [spellcheck], [data-edit-id], [data-comment-target-id], [data-has-comment], .comment-hover-target'
        )
        .forEach((el) => {
          el.removeAttribute('contenteditable');
          el.removeAttribute('spellcheck');
          el.removeAttribute('data-edit-id');
          el.removeAttribute('data-comment-target-id');
          el.removeAttribute('data-has-comment');
          el.classList.remove('comment-hover-target');
        });

      const clonePins = clone.querySelector('#comment-pins-layer');
      if (clonePins) clonePins.innerHTML = '';
      const clonePop = clone.querySelector('#comment-popover');
      if (clonePop) clonePop.setAttribute('hidden', '');

      const cloneToggle = clone.querySelector('#editor-toggle-btn');
      if (cloneToggle) cloneToggle.classList.remove('active');
      const cloneCommentToggle = clone.querySelector('#comment-toggle-btn');
      if (cloneCommentToggle) cloneCommentToggle.classList.remove('active');
      const clonePanel = clone.querySelector('#editor-actions-panel');
      if (clonePanel) clonePanel.setAttribute('hidden', '');

      const htmlString = '<!DOCTYPE html>\n' + clone.outerHTML;
      const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      updateStatusLabel('Downloaded index.html!');
      setTimeout(() => updateStatusLabel(), 2500);
    });
  }

  // Reset local edits and comments back to original state
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!window.confirm('Discard all local text edits and pinned comments?')) {
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COMMENTS_STORAGE_KEY);
      editableNodes.forEach((node) => {
        const editId = node.getAttribute('data-edit-id');
        if (editId && originalHTMLMap.has(editId)) {
          node.innerHTML = originalHTMLMap.get(editId);
        }
      });
      closeCommentPopover();
      renderCommentPins();
      updateStatusLabel('Cleared edits & comments');
    });
  }

  // Restore saved edits & comments on startup
  applySavedEditsToDOM();
  renderCommentPins();

  const params = new URLSearchParams(window.location.search);
  if (params.get('edit') === '1') {
    setEditingMode(true);
  } else if (params.get('comment') === '1') {
    setCommentingMode(true);
  }
});
