const express = require('express')
const movies = require('./movies.json')
const crypto = require('node:crypto')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')
app.use(express.json())

const ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8081'
]

app.get('/movies', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  const { genre } = req.query
  if (genre) {
    const moviesByGenre = movies.filter(movie => movie.genre.some(movieGenre => movieGenre.toLocaleLowerCase() === genre.toLocaleLowerCase()))
    console.log(genre)
    return res.json(moviesByGenre)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Pelicula no encontrada' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body) // validateMovie DEVUELVE ERROR, DATA, SUCCESS
  if (result.error) {
    res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  movies.push(newMovie)
  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ error: 'No existe esta pelicula' })
  const result = validatePartialMovie(req.body)
  if (result.error) return res.status(400).json({ error: JSON.parse(result.error.message) })

  movies[movieIndex] = {
    ...movies[movieIndex],
    ...result.data
  }

  res.status(201).json(movies[movieIndex])
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const origin = req.header('origin')
  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'DELETE, PATCH, OPTIONS')
  }

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'DELETE, PATCH, OPTIONS')
  }
  res.send()
})

const PORT = process.env.PORT ?? '3001'

app.listen(PORT, () => {
  console.log('app encendida')
})
