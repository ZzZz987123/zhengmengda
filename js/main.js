(function () {
  "use strict";

  document.body.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (/noreveal/.test(window.location.search)) {
    document.documentElement.style.scrollBehavior = "auto";
  }

  /* ---------- 顶部导航：滚动后加毛玻璃 ---------- */
  var topbar = document.querySelector(".topbar");
  var onScrollTop = function () {
    if (window.scrollY > 24) topbar.classList.add("scrolled");
    else topbar.classList.remove("scrolled");
  };
  onScrollTop();
  window.addEventListener("scroll", onScrollTop, { passive: true });

  /* ---------- 滚动淡入 ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  var noReveal = /noreveal/.test(window.location.search);
  if ("IntersectionObserver" in window && !reduceMotion && !noReveal) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }
  /* 保险：4 秒后任何仍隐藏的元素强制显示，避免空白 */
  if (!noReveal) {
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { el.classList.add("in"); });
    }, 4000);
  }

  /* ---------- 待插入链接：阻止空 # 跳转 ---------- */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ---------- 照片灯箱：点击任意照片放大 ---------- */
  var zoomImages = Array.prototype.slice.call(document.querySelectorAll("img"));
  zoomImages.forEach(function (img) { img.setAttribute("data-zoom", ""); });

  var lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML =
    '<button class="lb-close" type="button" aria-label="关闭">✕</button>' +
    '<button class="lb-prev" type="button" aria-label="上一张">‹</button>' +
    '<img alt="">' +
    '<button class="lb-next" type="button" aria-label="下一张">›</button>' +
    '<span class="lb-counter" aria-live="polite"></span>';
  document.body.appendChild(lightbox);

  var lbImg = lightbox.querySelector("img");
  var lbCounter = lightbox.querySelector(".lb-counter");
  var lbIndex = 0;
  var openLightbox = function (index) {
    lbIndex = (index + zoomImages.length) % zoomImages.length;
    var img = zoomImages[lbIndex];
    lbImg.src = img.getAttribute("src");
    lbImg.alt = img.getAttribute("alt") || "照片";
    lbCounter.textContent = (lbIndex + 1) + " / " + zoomImages.length;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  var closeLightbox = function () {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    lbImg.removeAttribute("src");
  };
  zoomImages.forEach(function (img, i) {
    img.addEventListener("click", function () { openLightbox(i); });
  });
  lightbox.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lb-prev").addEventListener("click", function () { openLightbox(lbIndex - 1); });
  lightbox.querySelector(".lb-next").addEventListener("click", function () { openLightbox(lbIndex + 1); });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") openLightbox(lbIndex - 1);
    else if (e.key === "ArrowRight") openLightbox(lbIndex + 1);
  });

  /* Procedural solid geometry, lit with a restrained studio setup. */
  var canvas = document.getElementById('sculpture-canvas');
  if (!canvas || typeof THREE === 'undefined') return;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); }
  catch (error) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 0, 9);
  var sculpture = new THREE.Group();
  scene.add(sculpture);
  var silver = new THREE.MeshStandardMaterial({ color: 0x9b9e9d, metalness: 0.72, roughness: 0.32 });
  var bronze = new THREE.MeshStandardMaterial({ color: 0x8b7960, metalness: 0.64, roughness: 0.38 });
  var ring = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.16, 24, 128), silver);
  ring.rotation.set(0.38, 0.65, -0.25);
  sculpture.add(ring);
  var inner = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.07, 16, 128), bronze);
  inner.rotation.set(-0.55, -0.52, 0.25);
  sculpture.add(inner);
  var arc = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.035, 12, 100, Math.PI * 1.5), bronze);
  arc.rotation.set(0.18, -0.2, 0.8);
  sculpture.add(arc);
  scene.add(new THREE.HemisphereLight(0xe3e7ed, 0x343029, 1.5));
  var key = new THREE.DirectionalLight(0xfff2dc, 2.4);
  key.position.set(-3, 5, 5); scene.add(key);
  var rim = new THREE.DirectionalLight(0xbacadd, 1.8);
  rim.position.set(4, -1, 2); scene.add(rim);
  var holder = canvas.parentElement;
  var visible = true, frame = 0, last = 0, time = 0, pointerX = 0, pointerY = 0;
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = holder.clientWidth, h = holder.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.z = Math.max(9, 3.2 / (Math.tan(Math.PI / 10) * camera.aspect)); camera.updateProjectionMatrix(); render();
  }
  function animate(now) {
    frame = 0;
    if (!visible || document.hidden || reduceMotion) { last = 0; return; }
    if (!last || now - last >= 32) {
      time += last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      sculpture.rotation.y = Math.sin(time * 0.16) * 0.16 + pointerX * 0.07;
      sculpture.rotation.x = Math.cos(time * 0.12) * 0.06 + pointerY * 0.05;
      arc.rotation.z = 0.8 + time * 0.025;
      render();
    }
    frame = requestAnimationFrame(animate);
  }
  function resume() { if (!frame && visible && !document.hidden && !reduceMotion) frame = requestAnimationFrame(animate); }
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', resume);
  if ('IntersectionObserver' in window) new IntersectionObserver(function(entries) {
    visible = entries[0].isIntersecting; resume();
  }).observe(holder);
  if (window.matchMedia('(pointer: fine)').matches) document.querySelector('.hero').addEventListener('pointermove', function(event) {
    var rect = holder.getBoundingClientRect();
    pointerX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  });
  canvas.addEventListener('webglcontextlost', function(event) { event.preventDefault(); visible = false; canvas.style.opacity = '0'; });
  canvas.addEventListener('webglcontextrestored', function() { visible = true; canvas.style.opacity = ''; resize(); resume(); });
  resume();
})();
