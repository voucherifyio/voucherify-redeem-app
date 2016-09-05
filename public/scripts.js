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
    var $backToFormBtn = $('#back_to_form_btn')
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
        return text !== ""
    }

    function validateAmount(amount) {
        var re = /^[0-9.,]+$/
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
        var base_price = +($basePrice.val())

        var html_body = $('<div>')
            .append('<h4>Voucher redeemed successfully</h4>')
            .append('<p>Voucher Type: <b>' + voucher_type + '</b></p>')
            .append(function () {
                if (voucher_gift_amount) {
                    var gift_amount_left = (voucher_gift_amount - (voucher_amount_redeemed - base_price));
                    return '<p>Gift amount: <b>' + gift_amount_left.toFixed(2) + '</b><small><i>/' + voucher_gift_amount.toFixed(2) + '</i></small></p>'
                }

                if (voucher_discount_value) {
                    var html = []

                    var discount_value = Voucherify.utils.calculateDiscount(base_price, result.voucher)

                    html.push('<p>Discount type: <b>' + result.voucher.discount.type + '</b></p>')
                    html.push('<p>Discount value: <b>' + discount_value + '</b></p>')

                    return html.join('\n')
                }
            })
            .append('<br>')
            .append(function () {
                var html = []

                if (voucher_gift_amount) {
                    html.push('<p>Base price: <b>' + base_price.toFixed(2) + '</b></p>')
                    html.push('<p>Amount left: <b>' + (voucher_gift_amount - voucher_amount_redeemed).toFixed(2) + '</b></p>')

                    return html.join('\n')
                }

                if (voucher_discount_value) {
                    var base_value_label
                    var after_value_label

                    if (result.voucher.discount.type === 'UNIT') {
                        base_value_label = 'Base units: '
                        after_value_label = 'Discounted units: '
                    } else if (['PERCENT', 'AMOUNT'].indexOf(result.voucher.discount.type) > -1) {
                        base_value_label = 'Base price: '
                        after_value_label = 'Discounted price: '
                    }

                    var discounted_price = Voucherify.utils.calculatePrice(base_price, result.voucher)

                    html.push('<p>' + base_value_label + '<b>' + base_price + '</b></p>')
                    html.push('<p>' + after_value_label + '<b>' + discounted_price + '</b></p>')

                    return html.join('\n')
                }
            })

        $alertBox
            .toggleClass('alert-info', true)
            .html(html_body)
            .show(ANIMATION_SPEED)

        $backToFormBtn.show(ANIMATION_SPEED)
    }

    function hideResult(callback) {
        $alertBox
            .toggleClass('alert-info', false)
            .html("")
            .hide(ANIMATION_SPEED, callback)

        $backToFormBtn.hide(ANIMATION_SPEED)
    }

    $alertBox.hide()
    $backToFormBtn.hide()

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

    $backToFormBtn.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()

        hideResult(function () {
            $customerEmail.val('');
            $customerName.val('');
            $customerSurname.val('');
            $voucherCode.val('');
            $basePrice.val('');
            $redeemForm.show(ANIMATION_SPEED)
        })
    })

})(window, window.jQuery)