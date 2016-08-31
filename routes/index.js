'use strict'

const _                 = require('lodash')
const config            = require('config').get('app')
const express           = require('express')
const voucherify        = require('voucherify')

var applicationKeys = {
    applicationId: process.env.APPLICATION_ID || _.get(config, 'applicationKeys.applicationId'),
    applicationSecretKey: process.env.APPLICATION_SECRET_KEY || _.get(config, 'applicationKeys.applicationSecretKey')
}

var clientSideKeys = {
    clientApplicationId: process.env.CLIENT_APPLICATION_ID || _.get(config, 'clientSideKeys.clientApplicationId'),
    clientPublicKey: process.env.CLIENT_PUBLIC_KEY || _.get(config, 'clientSideKeys.clientPublicKey'),
}

const voucherifyClient = voucherify({
    applicationId: applicationKeys.applicationId,
    clientSecretKey: applicationKeys.applicationSecretKey
})

const Routes = function () {
    const router = express.Router()

    router.get('/', (req, res) => {
        res.render('index', {
            clientSideKeys: clientSideKeys
        })
    })

    router.post('/redeem', (req, res) => {
        const voucher_code      = req.body.voucher_code
        const order             = req.body.order
        const customer          = req.body.customer
        const tracking_id       = req.body.tracking_id

        const payload           = {
            voucher: voucher_code,
            order: order,
            customer: customer
        }

        voucherifyClient.redeem(payload, tracking_id)
            .then((result) => {
                res.json(result)
            })
            .catch((err) => {
                console.log('[Redeem] Error: %s, Stack: %j', err, err.stack)
                res.status(500).json({message: 'Internal Server Error'})
            })
    })

    return router
}

module.exports = Routes
