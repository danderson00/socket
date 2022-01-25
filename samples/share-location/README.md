# share-location

A bare bones location sharing sample for the @x/socket library. This sample demonstrates how to create a simple API for 
registering and broadcasting location information. 

Each device continually broadcasts its current latitude and longitude using the API. A map is shown using the Google 
Maps API with device locations shown as pins. It also demonstrates a simple middleware layer for injecting properties 
into API call parameters.

## Setup

1) Obtain Google Maps API key

Head to the [Google Cloud Platform console](https://console.cloud.google.com/). Create a new project with default 
settings and enable the `Maps Javascript API` from the `APIs` section. Create an API key credential from the 
`Credentials` section and copy the API key to your clipboard.

2) Configure API key

Open `public/index.html` and replace the `<MAPS_API_KEY>` text with the API key from above.

3) Install dependencies

Install the dependencies for the app by running `yarn` or `npm i` from the sample directory.

## Usage

Execute `yarn start` or `npm start` from the command line. This will start the socket host and open a browser to the 
locally hosted sample.

## Limitations

Using the browser geolocation API requires an encrypted connection with the exception of running on the local host.
Loading the app from another device will fail to obtain the device location.

The app can be hosted on a remote server with a domain name and an SSL certificate for the domain (self-signed 
certificates will not work). [Let's Encrypt](https://letsencrypt.org/) offer a free, easy to use service for 
obtaining SSL certificates. 