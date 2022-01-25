async function onMapLoaded() {
  // concurrently connect and get an initial position to center the map
  const [host, initialLocation] = await Promise.all([
    window.xsocket({ url: `ws://${window.location.hostname}:8081/` })
      .useFeature('reestablishSessions')
      .useFeature('clientId')
      .connect(),
    getPosition()
  ])

  // display the map and create a collection of markers
  const map = new google.maps.Map(document.getElementById("map"), { center: initialLocation, zoom: 15 })
  const markers = {}

  // subscribe to the stream of location updates and start updating with our initial location
  const locationStream = await host.locationStream()
  locationStream.subscribe(updateMarker)
  updateLocation(initialLocation)

  // a recursive function to continually update our position
  function updateLocation(location) {
    host.registerLocation(location)
    getPosition().then(updateLocation)
  }

  // update the marker for the specific clientId
  function updateMarker({ lat, lng, address, clientId }) {
    const title = `Client ID: ${clientId}\nAddress: ${address}`
    const marker = markers[clientId] = markers[clientId] || new google.maps.Marker({ title, map })
    marker.setPosition({ lat, lng })
  }
}

// "promisify" getCurrentPosition and map the result into the format we want
function getPosition() {
  return new Promise(
    (resolve, reject) => navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject
    )
  )
}

