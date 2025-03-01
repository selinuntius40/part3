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

app.get('/api/persons/:id', (request, response) => {
	Person.findById(request.params.id).then(person => {
        response.json(person)
    })
})

app.delete('/api/persons/:id', (request, response) => {

	Person.findByIdAndDelete(request.params.id).then(result => {
        response.status(204).end()
    })
})

app.post('/api/persons', (request, response) => {

    const body = request.body

	if (!body.name) {
		// 400 => bad request!
		return response.status(400).json({
			error: 'name is missing'
		})
	} else if (persons.filter(person => person.name === body.name).length > 0) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }

    if (!body.number) {
        return response.status(400).json({
            error: 'number is missing'
        })
    }

	const person = new Person({
        name: body.name,
        number: body.number,
    })

	person.save().then(savedPerson => {
        response.json(savedPerson)
    })
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})