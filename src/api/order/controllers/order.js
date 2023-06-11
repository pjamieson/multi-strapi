'use strict';

const fetch = require("node-fetch")
const stripe = require('stripe')(`${process.env.STRIPE_SECRET_KEY}`, {
  apiVersion: '2020-03-02',
})
const shippo = require('shippo')(`${process.env.SHIPPO_API_TOKEN}`)

const { cartSubtotal, cartSalesTax, cartShipping, cartTotal } = require("../../../../config/functions/cart")

const { createCoreController } = require('@strapi/strapi').factories;
//const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = createCoreController('api::order.order', ({ strapi }) =>  ({

  async getSalestaxRate(ctx) {
    // *** Don't forget to add Public permission in Strapi Roles & Permissions ***
    //console.log("getSalestaxRate ctx.request.body", ctx.request.body)
    try {
      const postal_code = ctx.request.body.postal_code
      const request_url = `${process.env.ZIPTAX_API_URL}?key=${process.env.ZIPTAX_API_KEY}&postalcode=${postal_code}`

      const response = await fetch(request_url)
      const data = await response.json()
      const taxrate = {
        "geoCity": data.results[0].geoCity,
        "taxSales": data.results[0].taxSales
      }
      //console.log("getSalestax taxrate", taxrate)
      return taxrate // Results in expected response, but 404 error on client side!!!
    } catch (err) {
      console.log("getSalestaxRate err", err)
    }
  },

  async setupStripe(ctx) {
    let total = 100 // placeholder value
    let validatedCart = []
    let minimalCart = [] // for getting paymentIntent

    // Items & qtys in ctx.request.body
    //console.log("setupStripe ctx.request.body", ctx.request.body)
    const {
      salesTaxRate,
      country,
      cart
    } = ctx.request.body
    //console.log("setupStripe salesTaxRate", salesTaxRate) OK

    await Promise.all(cart.map(async item => {
      if (item.itemType === 'typewriter') {
        const validatedItem = await strapi.entityService.findOne("api::typewriter.typewriter", item.id)
        if (validatedItem) {
          validatedItem.qty = 1
          validatedCart.push(validatedItem)
          minimalCart.push({
            sku: item.sku,
            qty: 1
          })
          return validatedItem // forces block to complete before continuing
        }
      }
    }))

    total = cartTotal(validatedCart, salesTaxRate, country)
    //console.log("setupStripe total", total)

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: 'usd',
        metadata: {
          cart: JSON.stringify(minimalCart)
        },
      });
      return paymentIntent
    } catch (err) {
      return {error: err.raw.message}
    }
  },

  async validateOrder(ctx) {
    const {
      salesTaxRate,
      paymentIntent,
      firstname,
      lastname,
      address,
      address2,
      city,
      state,
      zip,
      country,
      email,
      newsletter,
      cart
    } = ctx.request.body
    //console.log("validateOrder ctx.request.body", ctx.request.body) OK

    let typewriters = []
    let cart_items = []
    let sanitizedCart = []

    // Prepare items and quantities for posting of order to Strapi
    //console.log("validateOrder cart", cart) OK
    await Promise.all(cart.map(async item => {
      //console.log("validateOrder item", item) OK
      if (item.itemType === 'typewriter') {
        const cmsItem = await strapi.entityService.findOne("api::typewriter.typewriter", item.id)
        //console.log("validateOrder cmsItem", cmsItem) OK
        if (cmsItem) {
          cart_items.push({
            item_type: 'typewriter',
            sku: item.sku,
            title: item.title,
            qty: 1
          })
          typewriters.push(cmsItem)
          sanitizedCart.push(
            {...cmsItem, ...{qty: 1}}
          )
          return cmsItem // forces block to complete before continuing
        }
      }
    }))

    let subtotal = cartSubtotal(sanitizedCart)
    let salestax = cartSalesTax(sanitizedCart, salesTaxRate)
    let shipping = cartShipping(sanitizedCart, country)
    let total = cartTotal(sanitizedCart, salesTaxRate, country)

    total = total * .01 // Unlike Stripe, Strapi expects dollars, not cents

    const stripe_payment_id = paymentIntent.id
    //console.log("create order stripe_paymentintent_id", stripe_paymentintent_id)

    const cart_string = JSON.stringify(cart_items)
    //console.log("validateOrder cart_string", cart_string) OK

    const entry = {
      data: {
        stripe_payment_id,
        cart: cart_string,
        subtotal,
        salestax,
        shipping,
        total,
        firstname,
        lastname,
        address,
        address2,
        city,
        state,
        zip,
        country,
        email,
        newsletter,
        typewriters
      }
    }

    try {
      const entity = await strapi.entityService.create("api::order.order", entry);
      //console.log("order/create entity", entity) OK
      const strapi_order = {
        order_id: entity.id,
        order_createdAt: entity.createdAt
      }
      //console.log("order/create strapi_order", strapi_order) OK
      //return sanitizeEntity(entity, { model: strapi.models.order });
      return strapi_order
    } catch (err) {
      console.log("order/create err", err)
    }
  },

  async notifyShippo(ctx) {
    console.log("notifyShippo ctx.request.body", ctx.request.body)
    try {
      const shippo_order = await shippo.order.create(ctx.request.body)
      console.log("notifyShippo shippo_order", shippo_order)
      return shippo_order
    } catch (err) {
      console.log("notifyShippo err", err)
    }
  },

}));
