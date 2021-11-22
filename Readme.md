# SwaarmJS

SwaarmJS is an attribution and measuring SDK that allows you to interact with the Swaarm platform through a simple API

## Installing

Just add the dist/swaarm.min.js in your html page and you are ready to go. Alternatively you can fetch it directly from
npm: https://www.npmjs.com/package/@swaarm/swaarmjs

## Usage

Before using the SDK you need to configure it in the following way:

```javascript
    Swaarm.initialize({
        "trackingUrl": "http://track.example.org" //This is the base url of your Swaarm tracking domain
    })
``` 

### Landing Pages

To register the user for attribution on landing pages you need to run the following code:

```javascript
    Swaarm.land();
```

### Attribution

After the user viewedyour landing page, they might continue exploring other parts of your webiste. 
If the user has performed an action that you want to mark as a conversion event in Swaarm you will need the following code:

```javascript
    Swaarm.attribute();
```

### Sending custom events

As the user continues to explorer your platform you can register their actions in Swaarm. Say for example the user
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