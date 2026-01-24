(function(){
  const mount = document.getElementById('review-stickers');
  if (!mount) return;
  const cfg = (window.REVIEWS_CONFIG||{});
  const hasAPI = cfg.apiKey && cfg.placeId;

  // Create a modal for showing full reviews
  const modal = document.createElement('div');
  modal.className = 'review-modal hidden';
  modal.innerHTML = '<div class="modal-content">' +
    '<span class="close" aria-label="Close">&times;</span>' +
    '<div class="stars"></div>' +
    '<div class="full-text"></div>' +
    '<div class="author"></div>' +
    '<div class="meta"></div>' +
    '<a class="google-link" target="_blank"></a>' +
    '</div>';
  document.body.appendChild(modal);
  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); });
  // Close modal when clicking outside the content
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  function showReview(r) {
    const rating = Math.round(r.rating || r.stars || 5);
    modal.querySelector('.stars').innerText = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    modal.querySelector('.full-text').innerText = r.text || r.snippet || '';
    modal.querySelector('.author').innerText = r.author_name || r.author || '';
    modal.querySelector('.meta').innerText = r.relative_time_description || r.time || '';
    const link = modal.querySelector('.google-link');
    if (r.author_url) {
      link.href = r.author_url;
      link.innerText = 'Read on Google';
      link.style.display = 'inline';
    } else {
      link.style.display = 'none';
    }
    modal.classList.remove('hidden');
  }

  function render(reviews){
    mount.innerHTML = '';
    if (!reviews || !reviews.length){ mount.style.display='none'; return; }
    mount.style.display = '';
    reviews.slice(0,4).forEach(function(r){
      const rating = Math.round(r.rating || r.stars || 5);
      const author = r.author_name || r.author || 'Member';
      const time = r.relative_time_description || r.time || '';
      const text = r.text || r.snippet || '';
      const el = document.createElement('div');
      el.className = 'review-card';
      el.innerHTML =
        '<div class="stars" aria-label="'+rating+' out of 5 stars">' +
          '★'.repeat(rating) + '☆'.repeat(5-rating) +
        '</div>' +
        '<div class="snippet">'+escapeHtml(text)+'</div>' +
        '<div class="author">'+escapeHtml(author)+'</div>' +
        '<div class="meta">'+escapeHtml(time)+'</div>';
      el.addEventListener('click', () => showReview(r));
      mount.appendChild(el);
    });
  }
  function escapeHtml(str){
    return String(str||'').replace(/[&<>"']/g, function(s){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[s]);
    });
  }
  async function loadLocal(){
    try{
      const res = await fetch('assets/reviews.json');
      if (!res.ok) throw new Error('no local');
      const data = await res.json();
      render((data && data.reviews) || []);
    }catch(e){ mount.style.display='none'; }
  }
  if (hasAPI){
    window.initReviews = function(){
      try{
        var dummy = document.createElement('div');
        var svc = new google.maps.places.PlacesService(dummy);
        svc.getDetails({placeId: cfg.placeId, fields: ['reviews','rating','user_ratings_total','name','url']}, function(place, status){
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.reviews){
            var sorted = place.reviews.slice().sort(function(a,b){ return (b.rating-a.rating) || (b.time - a.time); });
            render(sorted);
          } else { loadLocal(); }
        });
      }catch(e){ loadLocal(); }
    };
    var s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(cfg.apiKey)+'&libraries=places&callback=initReviews';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  } else {
    loadLocal();
  }
})();
