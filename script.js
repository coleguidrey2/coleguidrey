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
        const rapidRating = data.chess_rapid?.last?.rating || 'N/A';
        ratingElement.textContent = rapidRating;
      })
      .catch(error => {
        console.error('Error fetching Chess.com data:', error);
        ratingElement.textContent = 'Unavailable';
      });
  }

  // Highlight active navigation link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
});
