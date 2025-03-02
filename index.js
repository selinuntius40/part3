require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()
const Person = require('./models/person')

const cors = require('cors')
app.use(cors())

app.use(express.static('dist'))

let persons = []

app.use(express.json())

morgan.token('content', function (req, res) {return req.method === 'POST' ? JSON.stringify(req.body) : null})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :content'))

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformed id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {     
        response.json(persons)
    })
})

app.get('/info', (request, response) => {

    const dt = new Date(Date.now())

    Person.find({}).then(persons => {
        response.send(`
        <p>Phonebook has info for ${persons.length} persons</p>
        <p>${dt}</p>`)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
	Person.findById(request.params.id)
    .then(person => {
        response.json(person)
    })
    .catch(error => next(error))
    
})

app.delete('/api/persons/:id', (request, response, next) => {

	Person.findByIdAndDelete(request.params.id)
    .then(result => {
        response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {

    const { name, number } = request.body

	if (!name) {
		// 400 => bad request!
		return response.status(400).json({
			error: 'name is missing'
		})
	} else if (persons.filter(person => person.name === name).length > 0) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }

    if (!number) {
        return response.status(400).json({
            error: 'number is missing'
        })
    }

	const person = new Person({
        name: name,
        number: number,
    })

	person.save().then(savedPerson => {
        response.json(savedPerson)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body
  
    Person.findByIdAndUpdate(request.params.id, 
        { name, number }, 
        { new: true, runValidators: true, context: 'query' }
    )
      .then(updatedPerson => {
        response.json(updatedPerson)
      })
      .catch(error => next(error))
  })
app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})