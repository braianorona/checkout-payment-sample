const express = require('express')
const app = express()
const cors = require('cors')
const mercadopago = require('mercadopago')
const { default: axios } = require('axios')
const { response } = require('express')

// Constants
const token =
  'TEST-1525632293088814-100414-957f02583329f006389847e732f36d1d-228186099'

// Functions
const getPaymentData = (id) => {
  axios
    .get(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => response.data)
    .catch(console.error)
}

const setDonationStatusFromMercadoPagoStatus = (status) => {
  /* 
	Mercado Pago Status --> Donation Status
	-----

	--- success
	approved: El pago fue aprobado y acreditado.

	--- pending
	pending: El usuario no completó el proceso de pago todavía.
	authorized: El pago fue autorizado pero no capturado todavía.
	in_process: El pago está en revisión.

	--- failure
	rejected: El pago fue rechazado. El usuario podría reintentar el pago.
	cancelled: El pago fue cancelado por una de las partes o el pago expiró.
*/

  if (status === 'approved') return 'success'

  if (
    status === 'pending' ||
    status === 'authorized' ||
    status === 'in_process'
  )
    return 'pending'

  if (status === 'rejected' || status === 'cancelled') return 'failure'

  return console.log('Warning: Estado desconocido')
}

const updateDonation = (status) => {
  // 5. Buscar donación por el paymentId/preferenceId
  // 6. Setear nuevo valor del status
}

// REPLACE WITH YOUR ACCESS TOKEN AVAILABLE IN: https://developers.mercadopago.com/panel
mercadopago.configure({
  access_token: token
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

app.get('/create_preference', (req, res) => {
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

      /*
	   0. Crear nueva donación en DB (Setear todos los datos de la donación)
	 
			const donation = {
				...donationData,
				status: "pending"
				paymentId: preferenceId
			} 
	 
	 */
    })
    .catch(function (error) {
      console.log(error)
    })
})

app.post('/mercadopago/notifications', async (req, res) => {
  // 1. Obtener identificador de pago
  const id = req.body.data.id

  // 2. Obtener info de pago a partir del id
  const paymentData = await getPaymentData(id)

  // 3. Setear estado en Donación desde Mercado Pago
  const donationStatus = setDonationStatusFromMercadoPagoStatus(
    paymentData.status
  )

  // 4. Actualizar donación en DB
  updateDonation(donationStatus)

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
