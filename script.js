// Chess.com API integration
document.addEventListener('DOMContentLoaded', function() {
  const ratingElement = document.getElementById('rapid-rating');

  if (ratingElement) {
    const username = 'coleguidrey';
    const apiUrl = `https://api.chess.com/pub/player/${username}/stats`;

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const rapidRating = data.chess_rapid?.last?.rating;
        ratingElement.textContent = rapidRating || 'N/A';

        if (rapidRating) {
          const meter = document.getElementById('rating-meter');
          const marker = document.getElementById('meter-marker');
          const label = document.getElementById('meter-marker-label');

          const tierEl = document.getElementById('rating-tier');
          if (tierEl && rapidRating >= 400 && rapidRating <= 1000) {
            tierEl.textContent = 'Gentleman';
            tierEl.style.color = '#2e7d32';
            tierEl.style.fontWeight = 'bold';
          }

          if (meter && marker && label) {
            meter.style.display = 'block';
            label.textContent = rapidRating;

            const MIN = 400, MAX = 2400;
            const pct = Math.min(100, Math.max(0, (rapidRating - MIN) / (MAX - MIN) * 100));

            // Defer so CSS transition fires after element is visible
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                marker.style.left = pct + '%';
              });
            });
          }
        }
      })
      .catch(error => {
        console.error('Error fetching Chess.com data:', error);
        ratingElement.textContent = 'Unavailable';
      });
  }

  // Highlight active navigation link
  const parts = window.location.pathname.split('/');
  const currentPage = parts.pop() || 'index.html';
  const inEssays = parts[parts.length - 1] === 'essays';
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const hrefPage = href.split('/').pop();
    if (hrefPage === currentPage || (inEssays && hrefPage === 'writings.html')) {
      link.classList.add('active');
    }
  });
});
