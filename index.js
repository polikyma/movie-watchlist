
// Global State
let hasSearched = false
let searchResults = []
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || []

// DOM Elements
const resultsEl = document.querySelector('#results')
const watchlistEl = document.querySelector('#watchlist')

// Event Listeners
document.addEventListener('submit', handleSearchBtn)
document.addEventListener('click', handleButtonClick)
document.addEventListener("DOMContentLoaded", renderSearchResults())
document.addEventListener("DOMContentLoaded", renderWatchlist())


/*************************
 * Event Handlers
 *************************/
async function handleSearchBtn (e) {
  e.preventDefault()
  hasSearched = true

  const searchInput = document.querySelector('#search-input').value.trim()
  if (!searchInput) return

  await fetchMovies(searchInput.replace(/ /g, '+'))
  renderSearchResults()
}

function handleButtonClick (e) {
  const target = e.target
  if (target.classList.contains('add-watchlist-btn')) {
    handleAddToWatchlist(target.dataset.id)
  } else if (target.classList.contains('remove-watchlist-btn')) {
    handleRemoveFromWatchlist(target.dataset.id)
  } else if (target.classList.contains('watchlist-nav-btn')) {
    navigateToPage('watchlist.html')
  } else if (target.classList.contains('search-nav-btn')) {
    navigateToPage('index.html')
  } else if (target.classList.contains('read-more-btn')) {
    toggleReadMore(target.dataset.id, target.dataset.page, false)
  } else if (target.classList.contains('read-less-btn')) {
    toggleReadMore(target.dataset.id, target.dataset.page, true)
  }
}

/*************************
 * Watchlist Functions
 *************************/
function handleAddToWatchlist (movieId) {
  if (!watchlist.some(movie => movie.id === movieId)) {
    watchlist.unshift({ id: movieId, isTruncated: true })
    updateLocalStorage()
  }
}

function handleRemoveFromWatchlist (movieId) {
  watchlist = watchlist.filter(movie => movie.id !== movieId)
  updateLocalStorage()
  renderWatchlist()
}

function updateLocalStorage () {
  localStorage.setItem('watchlist', JSON.stringify(watchlist))
}

function navigateToPage (page) {
  window.location.href = page
}

function toggleReadMore (movieId, page, isTruncated) {
  const movieList = page === 'search' ? searchResults : watchlist
  const movie = movieList.find(item => item.id === movieId)
  if (movie) {
    movie.isTruncated = isTruncated
    page === 'search' ? renderSearchResults() : renderWatchlist()
  }
}

/*************************
 * API Fetch Functions
 *************************/
async function fetchMovies (query) {
  searchResults = []
  try {
    const res = await fetch(`/api/search/${query}`)
    const data = await res.json()

    if (data.Search) {
      searchResults = data.Search.filter(
        movie => movie.Type === 'movie' && movie.Poster !== 'N/A'
      ).map(movie => ({ id: movie.imdbID, isTruncated: true }))
    }
  } catch (error) {
    console.error('Error fetching movie data:', error)
  }
}

async function fetchMovieDetails (movies) {
  return Promise.all(
    movies.map(async item => {
      try {
        const res = await fetch(`/api/details/${item.id}`)
        const movie = await res.json()
        movie.isTruncated = item.isTruncated
        return movie
      } catch (error) {
        console.error('Error fetching movie details:', error)
        return null
      }
    })
  )
}

/*************************
 * Render Functions
 *************************/
async function renderSearchResults () {
  if (!searchResults.length) {
    const messageHtml = hasSearched
      ? `<p>Unable to find what you\'re looking for. Please try another search.</p>`
      : `<i class="fa-solid fa-film"></i>
          <p>Start exploring</p>`
    resultsEl.innerHTML = `<div class="placeholder">
                              ${messageHtml}
                            </div>`
    return
  }

  const moviesInfo = await fetchMovieDetails(searchResults)
  resultsEl.innerHTML = generateMovieCards(moviesInfo, 'search')
}

async function renderWatchlist () {
  if (watchlist.length) {
    const moviesInfo = await fetchMovieDetails(watchlist)
    watchlistEl.innerHTML = generateMovieCards(moviesInfo, 'watchlist')
  }
}

function generateMovieCards (movies, page) {
  return movies
    .map(
      movie => `
    <div class='card'>
      <img class='poster' src='${movie.Poster}' alt='"${movie.Title}" poster' />
      <div class='movie-info-container'>
        <div class='row-1'>
          <h3>${movie.Title}</h3>
          <div class="icon-wrapper">
            <i class='fa-solid fa-star' aria-hidden="true"></i>
            <span class="sr-only">IMDB rating</span>
            <p class="text-sm">${movie.imdbRating}</p>
          </div>
        </div>
        <div class='row-2'>
          <p class="text-sm">${movie.Runtime}</p>
          <p class="text-sm">${movie.Genre}</p>
          <div class="icon-wrapper">
            <i class='fa-solid fa-circle-${
              page === 'search' ? 'plus' : 'minus'
            }' aria-hidden="true"></i>
            <button class="text-sm ${
              page === 'search' ? 'add-watchlist-btn' : 'remove-watchlist-btn'
            }" data-id="${movie.imdbID}">
              ${page === 'search' ? 'Watchlist' : 'Remove'}
            </button>
          </div>
        </div>
        <div class='row-3'>
          ${generateMoviePlotHtml(movie, page)}
        </div>
      </div>
    </div>
  `
    )
    .join('')
}

function generateMoviePlotHtml (movie, page) {
  const maxLength = 160
  if (!movie.Plot) return ''

  if (movie.Plot.length <= maxLength) {
    return `<p class="card-content">${movie.Plot}</p>`
  }
  return movie.isTruncated
    ? `<p class="card-content">${movie.Plot.substring(0, maxLength)}...</p>
     <button class="read-more-btn" data-id=${
       movie.imdbID
     } data-page=${page}>Read more</button>`
    : `<p class="card-content expand">${movie.Plot}</p>
     <button class="read-less-btn" data-id=${movie.imdbID} data-page=${page}>Read less</button>`
}