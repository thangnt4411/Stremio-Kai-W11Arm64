const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RELEASES_URL = "https://github.com/allecsc/Stremio-Kai/releases/latest";

// sessionStorage helper — returns parsed JSON or null
function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* quota exceeded — non-critical */
  }
}

// Fetch all releases and populate both the latest-release info and total downloads
async function fetchReleaseData() {
  try {
    let releases = getCached("kai_releases");
    if (!releases) {
      const response = await fetch(
        "https://api.github.com/repos/allecsc/Stremio-Kai/releases",
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      releases = await response.json();
      setCache("kai_releases", releases);
    }

    // --- Latest release (first entry) ---
    const latest = releases[0];
    if (latest) {
      document.getElementById("version-info").textContent =
        `Latest: ${latest.tag_name}`;

      const installerAsset = latest.assets.find((asset) =>
        asset.name.toLowerCase().includes(".exe"),
      );
      const portableAsset = latest.assets.find((asset) => {
        const n = asset.name.toLowerCase();
        return n.includes(".7z") || n.includes(".zip");
      });

      document.getElementById("download-installer").href = installerAsset
        ? installerAsset.browser_download_url
        : latest.html_url;
      document.getElementById("download-portable").href = portableAsset
        ? portableAsset.browser_download_url
        : latest.html_url;
    }

    // --- Total downloads across all releases ---
    let totalDownloads = 0;
    releases.forEach((release) => {
      release.assets.forEach((asset) => {
        totalDownloads += asset.download_count;
      });
    });

    document.getElementById("download-count").innerHTML = `
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            ${totalDownloads.toLocaleString()} Downloads
        `;
  } catch (error) {
    console.error("Error fetching release data:", error);
    document.getElementById("version-info").textContent =
      "Visit GitHub for latest version";
    document.getElementById("download-installer").href = RELEASES_URL;
    document.getElementById("download-portable").href = RELEASES_URL;
  }
}

// Carousel & Gallery System
function initCarousel() {
  const carouselItems = Array.from(document.querySelectorAll(".carousel-item"));

  const navPrev = document.querySelector(".carousel-nav.prev");
  const navNext = document.querySelector(".carousel-nav.next");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.querySelector(".lightbox-close");
  const lbPrevBtn = document.querySelector(".lightbox-nav.prev");
  const lbNextBtn = document.querySelector(".lightbox-nav.next");

  // NOTE: Elements are matched by index.
  // We assume the Carousel and Gallery have the same items in the same order.

  let currentIndex = 0; // Tracks the unified state (Carousel + Lightbox)

  // --- Carousel Logic ---

  const updateCarousel = () => {
    carouselItems.forEach((item) => {
      item.classList.remove(
        "active",
        "prev",
        "next",
        "hidden-left",
        "hidden-right",
      );
    });

    const total = carouselItems.length;
    // Safety check if carousel is missing
    if (total === 0) return;

    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    // Set Active
    carouselItems[currentIndex].classList.add("active");

    // Set Neighbors
    carouselItems[prevIndex].classList.add("prev");
    carouselItems[nextIndex].classList.add("next");

    // Hide others
    carouselItems.forEach((item, index) => {
      if (
        index !== currentIndex &&
        index !== prevIndex &&
        index !== nextIndex
      ) {
        if (index < currentIndex) item.classList.add("hidden-left");
        else item.classList.add("hidden-right");
      }
    });
  };

  const setIndex = (index) => {
    if (carouselItems.length === 0) return;
    currentIndex = (index + carouselItems.length) % carouselItems.length;
    updateCarousel();
  };

  const rotateNext = () => setIndex(currentIndex + 1);
  const rotatePrev = () => setIndex(currentIndex - 1);

  // --- Interactions ---

  if (navNext) navNext.addEventListener("click", rotateNext);
  if (navPrev) navPrev.addEventListener("click", rotatePrev);

  // Carousel Item Clicks
  carouselItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      if (index === currentIndex) {
        openLightbox(currentIndex);
      } else if (index === (currentIndex + 1) % carouselItems.length) {
        rotateNext();
      } else if (
        index ===
        (currentIndex - 1 + carouselItems.length) % carouselItems.length
      ) {
        rotatePrev();
      } else {
        setIndex(index);
      }
    });
  });

  // --- Lightbox Logic ---

  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxVideo = document.getElementById("lightbox-video");

  const openLightbox = (index) => {
    const sourceItem = carouselItems[index];
    if (!sourceItem) return;

    const mediaSrc = sourceItem.dataset.img;
    const hasVideo = sourceItem.querySelector("video");

    // Determine if this is a video (check for video element or common video extensions)
    const isVideo = hasVideo || /\.(mp4|webm|ogg|mov)$/i.test(mediaSrc);

    if (isVideo && lightboxVideo) {
      // Show video, hide image
      lightboxVideo.src = mediaSrc;
      lightboxVideo.classList.add("lightbox-media-active");
      lightboxImg.classList.remove("lightbox-media-active");
    } else {
      // Show image, hide video
      lightboxImg.src = mediaSrc;
      lightboxImg.classList.add("lightbox-media-active");
      if (lightboxVideo) {
        lightboxVideo.classList.remove("lightbox-media-active");
        lightboxVideo.src = ""; // Stop any playing video
      }
    }

    // Get caption from the overlay text or img alt
    const overlayEl = sourceItem.querySelector(".carousel-overlay");
    const captionText = overlayEl
      ? overlayEl.textContent
      : sourceItem.querySelector("img")?.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = captionText;

    lightbox.classList.add("lightbox-open");
    document.body.style.overflow = "hidden";
  };

  const lbShowNext = () => {
    if (carouselItems.length > 0) {
      rotateNext(); // Rotate the background carousel
      openLightbox(currentIndex);
    }
  };

  const lbShowPrev = () => {
    if (carouselItems.length > 0) {
      rotatePrev(); // Rotate the background carousel
      openLightbox(currentIndex);
    }
  };

  // Lightbox Controls
  const closeLightbox = () => {
    lightbox.classList.remove("lightbox-open");
    document.body.style.overflow = "auto";
    // Stop video playback when closing
    if (lightboxVideo) {
      lightboxVideo.pause();
      lightboxVideo.src = "";
    }
  };

  if (lbNextBtn) {
    lbNextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      lbShowNext();
    });
  }

  if (lbPrevBtn) {
    lbPrevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      lbShowPrev();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Keyboard Navigation
  document.addEventListener("keydown", (e) => {
    const isLbOpen = lightbox && lightbox.classList.contains("lightbox-open");

    if (e.key === "ArrowLeft") {
      if (isLbOpen) lbShowPrev();
      else rotatePrev();
    } else if (e.key === "ArrowRight") {
      if (isLbOpen) lbShowNext();
      else rotateNext();
    } else if (e.key === "Escape") {
      if (isLbOpen) closeLightbox();
    }
  });

  // Touch/Swipe Support for Mobile
  const addSwipeSupport = (element, onSwipeLeft, onSwipeRight) => {
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    element.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    element.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
          if (swipeDistance > 0) {
            onSwipeRight(); // Swipe right
          } else {
            onSwipeLeft(); // Swipe left
          }
        }
      },
      { passive: true },
    );
  };

  // Add swipe support to carousel
  const carouselTrack = document.querySelector(".carousel-track");
  if (carouselTrack) {
    addSwipeSupport(carouselTrack, rotateNext, rotatePrev);
  }

  // Add swipe support to lightbox
  if (lightbox) {
    addSwipeSupport(lightbox, lbShowNext, lbShowPrev);
  }

  // Initial Render
  updateCarousel();
}

// Smooth scroll for navigation
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      // Only smooth scroll if it's an anchor link and not just "#"
      if (href && href.startsWith("#") && href !== "#") {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });
}

// Intersection Observer for fade-in animations
function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-visible");
        observer.unobserve(entry.target); // No need to keep watching once visible
      }
    });
  }, observerOptions);

  // Observe feature cards and FAQ items
  document.querySelectorAll(".feature-card, .faq-item").forEach((el) => {
    el.classList.add("fade-initial");
    observer.observe(el);
  });
}

// Mobile hamburger navigation toggle
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      toggle.setAttribute(
        "aria-expanded",
        navLinks.classList.contains("active"),
      );
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
}

// Initialize everything on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchReleaseData();
  initCarousel();
  initSmoothScroll();
  initAnimations();
  initMobileNav();
});
