# SwaarmJS

SwaarmJS is an attribution and measuring SDK that allows you to interact with the Swaarm platform through a simple API

## Installing

Just add the dist/swaarm.min.js in your html page, use one of our CDNs (e.g. `https://cdn.jsdelivr.net/gh/swaarm/swaarmjs@master/dist/swaarm.min.js`) 
and you are ready to go. Alternatively you can fetch it directly from npm: https://www.npmjs.com/package/@swaarm/swaarmjs

## Usage

Before using the SDK you need to configure it in the following way:

```javascript
    Swaarm.initialize({
        "trackingUrl": "http://track.example.org" //This is the base url of your Swaarm tracking domain
    })
``` 

## Registering an impression

One of the simplest actions you can do with the Swaarm JS SDK is to register an impression. To do this you can call

```javascript
Swaarm.impression({
    offer_id: "10",
    pub_id: "123"
})
```
It will create an impression for the offer 10 and publisher 123. You can add any parameters that you might need to the first argument:

```javascript
Swaarm.impression({
    offer_id: "10",
    pub_id: "123",
    pub_sub_id: "777",
    "site": "example.org"
})
```

The SDK will automatically pick up any matching Swaarm parameters from the URL as well.

## Registering a click

Registering clicks can be done similarly to the impressions:

```javascript
Swaarm.click({
    offer_id: "10",
    pub_id: "123",
    pub_sub_id: "777",
    "site": "example.org"
})
```

## Conversion Tracking

The Swaarm JS SDK can also help you with tracking conversions and events as well as performing attribution on the web.

### Landing Pages

To register the user for attribution on landing pages you need to run the following code:

```javascript
    Swaarm.land();
```

### Attribution

After the user viewed your landing page, they might continue exploring other parts of your website. 
Once the user has performed an action that you want to mark as a conversion event in Swaarm you will need the following code:

```javascript
    Swaarm.attribute();
```

### Sending custom events

As the user continues to explore your platform you can register their actions in Swaarm. Say for example the user
subscribed to your newsletter:

```javascript
    Swaarm.event('newsletter-subscription')
```

Monetary events can also be tracked, here is one example of a sale action:

```javascript
    Swaarm.event('sale', {'saleAmount': 53.2})
```

If you are using custom currencies, that is supported as well. Here is one transaction made with 20 in-game coins that are
valued at 50 USD

```javascript
    Swaarm.event('sale',{'saleAmount': 50,'originalSaleAmount': 20, 'originalSaleAmountCurrency': 'coins'})
```