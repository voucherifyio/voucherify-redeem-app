(function (window, $) {
    'use strict'

    var MESSAGES_TIMEOUT = 1000 * 5 // ms * s
    var ANIMATION_SPEED = 300 // ms

    var clientSideKeys = window.clientSideKeys || {}

    Voucherify.initialize(
        clientSideKeys.clientApplicationId,
        clientSideKeys.clientPublicKey
    )

    var $redeemForm = $('#redeem_form')
    var $submitBtn = $('#submit_btn')
    var $customerEmail = $('#customer_email')
    var $customerName = $('#customer_name')
    var $customerSurname = $('#customer_surname')
    var $voucherCode = $('#voucher_code')
    var $basePrice = $('#base_price')
    var $alertBox = $('#alert_box')

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return re.test(email)
    }

    function validateText(text) {
        var re = /^[a-zA-Z\s]{2,}$/
        return re.test(text)
    }

    function validateAmount(amount) {
        var re = /^[0-9]+$/
        return re.test(amount)
    }

    function validateFields() {
        if (!validateEmail($customerEmail.val())) {
            $customerEmail.closest('.form-group').toggleClass('has-error', true)
            return false
        }

        if (!validateText($customerName.val()) || !validateText($customerSurname.val())) {
            $customerName.closest('.form-group').toggleClass('has-error', true)
            return false
        }

        if (!validateAmount($basePrice.val())) {
            $basePrice.closest('.form-group').toggleClass('has-error', true)
            return false
        }

        if ($voucherCode.val() === '') {
            $voucherCode.closest('.form-group').toggleClass('has-error', true)
            return false
        }

        $customerEmail.closest('.form-group').toggleClass('has-error', false)
        $customerName.closest('.form-group').toggleClass('has-error', false)
        $basePrice.closest('.form-group').toggleClass('has-error', false)
        $voucherCode.closest('.form-group').toggleClass('has-error', false)

        return true
    }

    function toggleFields(status) {
        $submitBtn.prop('disabled', status)
        $customerEmail.prop('disabled', status)
        $customerName.prop('disabled', status)
        $customerSurname.prop('disabled', status)
        $basePrice.prop('disabled', status)
        $voucherCode.prop('disabled', status)
    }

    function showError(text) {
        $alertBox
            .toggleClass('alert-danger', true)
            .text(text)
            .show(ANIMATION_SPEED, function () {
                setTimeout(function () {
                    $alertBox
                        .hide(ANIMATION_SPEED)
                        .toggleClass('alert-danger', false)
                        .text('')
                }, MESSAGES_TIMEOUT)
            })
    }

    function showResult(result) {
        var discount_type = {
            PERCENT: 'percent_off',
            AMOUNT: 'amount_off',
            UNIT: 'unit_off'
        }
        var voucher_type = result.voucher.gift && 'Gift Voucher' || result.voucher.discount && 'Discount Voucher'
        var voucher_discount_value = result.voucher.discount && result.voucher.discount[discount_type[result.voucher.discount.type]] || null
        var voucher_gift_amount = result.voucher.gift && (result.voucher.gift.amount / 100) || null
        var voucher_amount_redeemed = result.voucher.redemption && (result.voucher.redemption.redeemed_amount / 100)
        var base_price = parseInt($basePrice.val(), 10)

        var html_body = $('<div>')
            .append('<h4>Voucher redeemed successfully</h4>')
            .append('<p>Voucher Type: <b>' + voucher_type + '</b></p>')
            .append(function () {
                if (voucher_gift_amount) {
                    return '<p>Gift amount: <b>' + (voucher_gift_amount - (voucher_amount_redeemed - base_price)).toFixed(2) + '</b><small><i>/' + voucher_gift_amount.toFixed(2) + '</i></small></p>'
                }

                if (voucher_discount_value) {
                    return '<p>Voucher Value: <b>' + voucher_discount_value.toFixed(2) + '</b></p>'
                }
            })
            .append('<br>')
            .append('<p>Base price: <b>' + base_price.toFixed(2) + '</b></p>')
            .append(function () {
                if (voucher_gift_amount) {
                    return '<p>Amount left: <b>' + (voucher_gift_amount - voucher_amount_redeemed).toFixed(2) + '</b></p>'
                }

                if (voucher_discount_value) {
                    return '<p>Price after redeem: <b>' + (base_price - voucher_discount_value).toFixed(2) + '</b></p>'
                }
            })

        $alertBox
            .toggleClass('alert-info', true)
            .html(html_body)
            .show(ANIMATION_SPEED)
    }

    $alertBox.hide()

    $submitBtn.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()

        if (!validateFields()) {
            showError('Some of fields are empty or not valid. Please, check them again.')
            return
        }

        toggleFields(true)

        Voucherify.setIdentity($customerEmail.val())
        Voucherify.validate({
            code: $voucherCode.val(),
            amount: $basePrice.val() * 100
        }).then(function (result) {
            if (!result.valid) {
                showError('Given voucher code is not valid')
                return
            }

            return $.post('/redeem', {
                voucher_code: result.code,
                tracking_id: result.tracking_id,
                order: {
                    amount: $basePrice.val() * 100
                },
                customer: {
                    name: $customerName.val() + ' ' + $customerSurname.val(),
                    email: $customerEmail.val()
                }
            }).done(function (result) {
                $redeemForm.hide(ANIMATION_SPEED, function () {
                    showResult(result)
                })
            })
        }).fail(function (err) {
            showError('Unexpected error occurred during the validation of the voucher')
        }).always(function () {
            toggleFields(false)
        })
    })

})(window, window.jQuery)