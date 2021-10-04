const express = require('express')
const app = express()
const cors = require('cors')
const mercadopago = require('mercadopago')
// const axios = require('axios').default()

// REPLACE WITH YOUR ACCESS TOKEN AVAILABLE IN: https://developers.mercadopago.com/panel
mercadopago.configure({
  access_token:
    'TEST-1525632293088814-100414-957f02583329f006389847e732f36d1d-228186099'
})

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(
  cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    origin: '*'
  })
)
app.use(express.static('../../client'))

app.get('/', function (req, res) {
  res.status(200).sendFile('index.html')
})

app.post('/create_preference', (req, res) => {
  let preference = {
    items: [
      {
        title: req.body.description,
        unit_price: Number(req.body.price),
        quantity: Number(req.body.quantity)
      }
    ],
    back_urls: {
      success: 'https://scholas-node.herokuapp.com/feedback',
      failure: 'https://scholas-node.herokuapp.com/feedback',
      pending: 'https://scholas-node.herokuapp.com/feedback'
    },
    auto_return: 'approved'
  }

  mercadopago.preferences
    .create(preference)
    .then((response) => {
      res.json({
        id: response.body.id
      })
      return response.body.id
    })
    .then((preferenceId) => {
      console.log(preferenceId)
      //   axios.get('https://api.mercadopago.com/v1/payments/1242010966')
    })
    .catch(function (error) {
      console.log(error)
    })
})

app.post('/mercadopago/notifications', (req, res) => {
  console.log(req.body)
	// req.body.payment_id

  res.status('200').json(req.body)
})

app.get('/feedback', function (req, res) {
  res.json({
    Payment: req.query.payment_id,
    Status: req.query.status,
    MerchantOrder: req.query.merchant_order_id
  })
})

app.listen(process.env.PORT || 5000, () => {
  console.log('The server is now running on Port 5000')
})
