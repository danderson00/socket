function onMapLoaded() {
  // get an initial position and center a new map with it
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const initialLocation = { lat: coords.latitude, lng: coords.longitude }
      const map = new google.maps.Map(document.getElementById("map"), { center: initialLocation, zoom: 15 })
      const markers = {}

      const host = await window.xsocket({ url: `ws://${window.location.hostname}:8081/` })
        .useFeature('reestablishSessions')
        .useFeature('clientId')
        .connect()

      const locationStream = await host.locationStream()
      locationStream.subscribe(updateMarker)
      updateLocation(initialLocation)

      // a recursive function to continually update our position
      function updateLocation(location) {
        host.registerLocation(location)
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude: lat, longitude: lng } }) => {
            updateLocation({ lat, lng })
          },
          reportError
        )
      }

      // update the marker for the specific clientId when updates are received
      function updateMarker({ lat, lng, address, clientId }) {
        const title = `Client ID: ${clientId}\nAddress: ${address}`
        const marker = markers[clientId] = markers[clientId] || new google.maps.Marker({ title, map })
        marker.setPosition({ lat, lng })
      }
    },
    reportError
  )

  function reportError(error) {
    console.error('An error occurred obtaining location: ', error)
  }
}

