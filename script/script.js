/* ===========================
   통합 script.js (최종 정리)
   - 햄버거 메뉴
   - (있으면) 포트폴리오 슬라이더(무한루프)
   - head-cloud (data-x/data-y 기준 드롭 + 섞임 / 순간이동 제거)
   =========================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ========= 유틸 ========= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ===========================
     1) 햄버거 메뉴
  =========================== */
  const openBtn = $("#menuOpen");
  const overlay = $("#menuOverlay");
  const closeBtn = $("#menuClose");

  if (openBtn && overlay && closeBtn) {
    const openMenu = () => {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("lock");
    };
    const closeMenu = () => {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lock");
    };

    openBtn.addEventListener("click", (e) => { e.preventDefault(); openMenu(); });
    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeMenu(); });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeMenu();
    });
    $$(".menu-link").forEach((link) => link.addEventListener("click", closeMenu));
  }

  /* ===========================
     2) 포트폴리오 슬라이더 (무한루프)
  =========================== */
  const track = $("#track");
  const prev = $("#prev");
  const next = $("#next");
  const tabs = $$(".tab");

  if (track && prev && next) {
    const originals = Array.from(track.children).filter((el) => el.classList?.contains("slide"));
    const realCount = originals.length;

    if (realCount >= 2) {
      if (!track.dataset.inited) {
        const firstClone = originals[0].cloneNode(true);
        const lastClone = originals[realCount - 1].cloneNode(true);
        track.appendChild(firstClone);
        track.insertBefore(lastClone, originals[0]);
        track.dataset.inited = "1";
      }

      let index = 1;
      let lock = false;

      track.style.transition = "none";
      track.style.transform = `translateX(-${index * 100}%)`;

      const setActiveTab = (realIdx) => {
        if (!tabs.length) return;
        tabs.forEach((t) => t.classList.remove("is-active"));
        const active = tabs.find((t) => Number(t.dataset.go) === realIdx);
        if (active) active.classList.add("is-active");
      };

      const moveTo = (newIndex) => {
        if (lock) return;
        lock = true;
        track.style.transition = "transform .35s ease";
        index = newIndex;
        track.style.transform = `translateX(-${index * 100}%)`;
      };

      track.addEventListener("transitionend", () => {
        if (index === 0) {
          track.style.transition = "none";
          index = realCount;
          track.style.transform = `translateX(-${index * 100}%)`;
        } else if (index === realCount + 1) {
          track.style.transition = "none";
          index = 1;
          track.style.transform = `translateX(-${index * 100}%)`;
        }
        const realIdx = (index - 1 + realCount) % realCount;
        setActiveTab(realIdx);
        requestAnimationFrame(() => (lock = false));
      });

      prev.addEventListener("click", () => moveTo(index - 1));
      next.addEventListener("click", () => moveTo(index + 1));

      tabs.forEach((t) => {
        t.addEventListener("click", (e) => {
          e.preventDefault();
          moveTo(Number(t.dataset.go) + 1);
        });
      });

      setActiveTab(0);
    }
  }

  /* ===========================
     3) head-cloud (data-x/data-y 기준)
     ✅ 순간이동 제거: drop은 top으로, 섞임은 transform으로만
     ✅ 원본 크기 유지: JS에서 width/scale 건드리지 않음
  =========================== */
  const cloud = $(".head-cloud");
  const items = $$(".head-cloud .float-item");

  if (cloud && items.length) {
    // ---- 튜닝 값 ----
    const DROP_START_Y = -240;     // 하늘 시작(top)
    const DROP_DUR = 900;          // drop 시간(ms)
    const DROP_STAGGER = 45;       // item 간 딜레이(ms)
    const MIX_RADIUS = 22;         // 섞임 반경
    const SPEED = 0.22;            // 섞임 속도
    const ROT_RANGE = 8;           // 회전 범위
    const ROT_SPEED = 0.08;        // 회전 속도

    // 1) drop 준비: left는 x 고정, top은 하늘에서 시작
    items.forEach((el, i) => {
      const x = Number(el.dataset.x || 0);
      const y = Number(el.dataset.y || 0);

      el.style.left = `${x}px`;
      el.style.top = `${DROP_START_Y}px`;  // 하늘에서 시작
      el.style.opacity = "0";

      // drop 동안 transform은 건드리지 않음(= 순간이동 방지)
      el.style.transform = "translate3d(0,0,0) rotate(0deg)";

      // 최종 정착 top 저장
      el.dataset.finalTop = String(y);

      // drop 시작
      setTimeout(() => {
        el.style.transition = `top ${DROP_DUR}ms cubic-bezier(.18,.9,.2,1.05), opacity 400ms ease`;
        el.style.opacity = "1";
        el.style.top = `${y}px`; // ✅ 최종 위치로 내려오기(= top만 사용)
      }, i * DROP_STAGGER);
    });

    // 2) drop 끝난 뒤 섞임 시작
    const DROP_TOTAL = (items.length - 1) * DROP_STAGGER + DROP_DUR + 50;

    setTimeout(() => {
      // drop transition 제거(이후 top 고정)
      items.forEach((el) => {
        el.style.transition = "none";
        el.style.top = `${Number(el.dataset.finalTop)}px`;
        el.style.opacity = "1";
        el.style.transform = "translate3d(0,0,0) rotate(0deg)";
      });

      // 섞임 state
      const state = items.map((el) => ({
        el,
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: (Math.random() - 0.5) * ROT_RANGE,
        vr: (Math.random() - 0.5) * ROT_SPEED,
      }));

      function tick() {
        state.forEach((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.r += s.vr;

          if (s.x > MIX_RADIUS || s.x < -MIX_RADIUS) s.vx *= -1;
          if (s.y > MIX_RADIUS || s.y < -MIX_RADIUS) s.vy *= -1;
          if (s.r > ROT_RANGE || s.r < -ROT_RANGE) s.vr *= -1;

          // ✅ transform은 섞임만 담당 (left/top 절대 안 건드림)
          s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.r}deg)`;
        });

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, DROP_TOTAL);
  }
});
