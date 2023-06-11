"use-strict";

module.exports = {
  routes: [
    {
      "method": "POST",
      "path": "/orders/salestax",
      "handler": "order.getSalestaxRate",
      "config": {
        "policies": []
      }
    },
    {
      "method": "POST",
      "path": "/orders/payment",
      "handler": "order.setupStripe",
      "config": {
        "policies": []
      }
    },
    {
      "method": "POST",
      "path": "/orders/validate",
      "handler": "order.validateOrder",
      "config": {
        "policies": []
      }
    },
    {
      "method": "POST",
      "path": "/orders/shipping",
      "handler": "order.notifyShippo",
      "config": {
        "policies": []
      }
    }
  ]
}
