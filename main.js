// Wait for DOM to fully load before running scripts
document.addEventListener('DOMContentLoaded', function(){
  // ===== SET CURRENT YEAR IN FOOTER =====
  // Get the current year and inject it into all #year elements (footers)
  const y = new Date().getFullYear();
  document.querySelectorAll('#year').forEach(el=>el.textContent = y);

  // ===== MOBILE NAV TOGGLE =====
  // Handle hamburger menu: clicking the toggle button shows/hides the nav menu
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if(navToggle && mainNav){
    navToggle.addEventListener('click', ()=> mainNav.classList.toggle('show'))
  }

  // ===== CONTACT FORM HANDLER =====
  // Handle contact form submission: prevent default, show a thank you message, clear form
  const form = document.getElementById('contact-form');
  if(form){
    const status = document.getElementById('form-status');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name') || 'friend';
      status.textContent = `Thanks, ${name}! (This demo doesn't send messages.)`;
      form.reset();
    })
  }
});

// ===== GLOBAL HELPER FUNCTIONS =====
// Expose utility functions that review pages and other scripts can use
window.appHelpers = {
  // Escape HTML special characters to prevent XSS attacks
  escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') },
  // Format a timestamp (milliseconds since epoch) into a human-readable date string
  formatDate(ts){ try{ const d = new Date(ts); return d.toLocaleString(); }catch(e){ return '' } }
}

// ===== HOME PAGE TESTIMONIALS WITH TA SELECTOR =====
// IIFE: Render reviews on homepage and allow users to select which TA's reviews to display
;(function renderHomeTestimonials(){
  try{
    // Get DOM elements needed for testimonials and selector
    const el = document.getElementById('home-testimonials-list');
    const selector = document.getElementById('ta-selector');
    const reviewLink = document.getElementById('ta-review-link');
    // Exit early if elements don't exist on this page
    if(!el || !selector) return;

    // Auto-detect API base: use local mock server in dev, relative path on Cloudflare Pages
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:9999' : '';

    // ===== RENDER TESTIMONIALS FUNCTION =====
    // This function fetches reviews for the selected TA and displays them
    async function renderTestimonials(){
      try {
        // Get the selected TA ID from dropdown
        const taId = selector.value;
        
        // If "All Reviews" is selected, redirect to all-reviews page
        if (taId === 'all') {
          reviewLink.href = 'all-reviews.html';
          reviewLink.textContent = 'view all reviews';
          
          // Fetch and display mixed reviews from all TAs
          const tas = ['teacher', 'ta1', 'ta2', 'ta3', 'ta4', 'ta5'];
          const allReviewsPromises = tas.map(id => 
            fetch(`${API_BASE}/api/reviews/${id}`)
              .then(r => r.json())
              .catch(() => [])
          );
          
          const allReviewsArrays = await Promise.all(allReviewsPromises);
          const allReviews = allReviewsArrays.flat();
          
          if(!allReviews || allReviews.length === 0) {
            el.innerHTML = '<p style="color:var(--muted)">no reviews yet</p>';
            return;
          }
          
          // Sort and take top 3
          const recent = allReviews.slice().sort((a,b)=>b.ts - a.ts).slice(0,3);
          el.innerHTML = recent.map(r=>`<div class="card reveal" style="margin-bottom:.6rem"><strong>${appHelpers.escapeHtml(r.name)}</strong> <div style="color:var(--muted);font-size:.9rem">${appHelpers.formatDate(r.ts)}</div><div style="margin:.4rem 0">${'★'.repeat(r.rating)}</div><div>${appHelpers.escapeHtml(r.text)}</div></div>`).join('');
          return;
        }
        
        // Fetch reviews from Worker API for specific TA
        reviewLink.textContent = 'view reviews';
        const response = await fetch(`${API_BASE}/api/reviews/${taId}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const reviews = await response.json();
        
        // If no reviews exist, show placeholder message
        if(!reviews || reviews.length===0){ 
          el.innerHTML = '<p style="color:var(--muted)">no reviews yet</p>'; 
          reviewLink.href = `reviews/${taId}.html`;
          return 
        }
        
        // Sort reviews by newest first, take top 3, then render them as cards
        const recent = reviews.slice().sort((a,b)=>b.ts - a.ts).slice(0,3);
        el.innerHTML = recent.map(r=>`<div class="card reveal" style="margin-bottom:.6rem"><strong>${appHelpers.escapeHtml(r.name)}</strong> <div style="color:var(--muted);font-size:.9rem">${appHelpers.formatDate(r.ts)}</div><div style="margin:.4rem 0">${'★'.repeat(r.rating)}</div><div>${appHelpers.escapeHtml(r.text)}</div></div>`).join('');
        
        // Update the review link to point to the selected TA's review page
        reviewLink.href = `reviews/${taId}.html`;
      } catch (err) {
        console.error('Failed to load testimonials:', err);
        el.innerHTML = '<p style="color:#dc2626">Error loading reviews</p>';
      }
    }

    // Listen for changes to the TA selector dropdown
    selector.addEventListener('change', renderTestimonials);
    // Initial render with the default selected TA
    renderTestimonials();
  }catch(e){ console.warn('testimonials render failed', e) }
})();

// ===== SECRET ADMIN PANEL ACCESS =====
// Triple-click the footer copyright text to access admin panel
;(function setupAdminAccess(){
  document.addEventListener('DOMContentLoaded', function(){
    const trigger = document.getElementById('admin-trigger');
    if(!trigger) return;
    
    let clickCount = 0;
    let clickTimer = null;
    
    trigger.addEventListener('click', function(){
      clickCount++;
      
      // Clear previous timer
      if(clickTimer) clearTimeout(clickTimer);
      
      // If 3 clicks detected, navigate to admin panel
      if(clickCount === 3){
        window.location.href = 'admin-panel.html';
        clickCount = 0;
        return;
      }
      
      // Reset click count after 1 second of no clicks
      clickTimer = setTimeout(function(){
        clickCount = 0;
      }, 1000);
    });
  });
})();
