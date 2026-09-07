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

  /* ---------- AI 形象交互 ---------- */
  var avatar = document.getElementById("ai-avatar");
  if (avatar) {
    avatar.addEventListener("click", function () { avatar.classList.toggle("lit"); });
    avatar.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        avatar.classList.toggle("lit");
      }
    });
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

  /* ---------- 轻量 3D 彩蛋 ---------- */
  if (typeof THREE === "undefined" || reduceMotion) return;

  /* 全站粒子背景（所有板块共享） */
  var bgCanvas = document.getElementById("bg-canvas");
  if (bgCanvas) {
    var isMobileBg = window.innerWidth < 768;
    var bRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
    bRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileBg ? 1.5 : 2));
    var bScene = new THREE.Scene();
    var bCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    bCamera.position.z = 9;

    var COUNT = isMobileBg ? 220 : 420;
    var positions = new Float32Array(COUNT * 3);
    for (var i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 13;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    var bGeom = new THREE.BufferGeometry();
    bGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var dotCanvas = document.createElement("canvas");
    dotCanvas.width = dotCanvas.height = 32;
    var dotCtx = dotCanvas.getContext("2d");
    var grad = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    dotCtx.fillStyle = grad;
    dotCtx.fillRect(0, 0, 32, 32);
    var dotTex = new THREE.CanvasTexture(dotCanvas);
    var bMat = new THREE.PointsMaterial({
      color: 0x5eead4,
      size: 0.12,
      map: dotTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var bPoints = new THREE.Points(bGeom, bMat);
    bScene.add(bPoints);

    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    var scrollOffset = window.scrollY;
    var onMouseMove = function (e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    var resizeBg = function () {
      var w = window.innerWidth, h = window.innerHeight;
      bRenderer.setSize(w, h, false);
      bCamera.aspect = w / h;
      bCamera.updateProjectionMatrix();
    };
    resizeBg();
    window.addEventListener("resize", resizeBg);
    window.addEventListener("scroll", function () { scrollOffset = window.scrollY; }, { passive: true });

    (function animateBg() {
      requestAnimationFrame(animateBg);
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;
      bPoints.rotation.y += 0.00045;
      bCamera.position.x += (mouseX * 1.1 - bCamera.position.x) * 0.04;
      bCamera.position.y += (-mouseY * 0.7 + scrollOffset * 0.0006 - bCamera.position.y) * 0.04;
      bCamera.lookAt(bScene.position);
      bRenderer.render(bScene, bCamera);
    })();
  }

  /* 页脚旋转几何体：悬停加速 */
  var footCanvas = document.getElementById("footer-canvas");
  if (footCanvas) {
    var fRenderer = new THREE.WebGLRenderer({ canvas: footCanvas, alpha: true, antialias: true });
    fRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var fScene = new THREE.Scene();
    var fCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    fCamera.position.z = 5.2;

    var fGeom = new THREE.IcosahedronGeometry(1.7, 1);
    var fMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    var fMesh = new THREE.Mesh(fGeom, fMat);
    fScene.add(fMesh);

    var speed = 1, targetSpeed = 1;
    var foot3d = footCanvas.parentElement;
    var setSize = function () {
      var size = Math.min(foot3d.clientHeight, 130);
      fRenderer.setSize(size, size, false);
      fRenderer.domElement.style.width = size + "px";
      fRenderer.domElement.style.height = size + "px";
    };
    setSize();
    window.addEventListener("resize", setSize);
    foot3d.addEventListener("mouseenter", function () { targetSpeed = 3.2; });
    foot3d.addEventListener("mouseleave", function () { targetSpeed = 1; });

    (function animateFoot() {
      requestAnimationFrame(animateFoot);
      speed += (targetSpeed - speed) * 0.06;
      fMesh.rotation.x += 0.0032 * speed;
      fMesh.rotation.y += 0.005 * speed;
      fRenderer.render(fScene, fCamera);
    })();
  }
})();
