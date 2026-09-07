const locationInput =
    document.getElementById("location");

const locationBtn =
    document.getElementById("locationBtn");

const geoBtn =
    document.getElementById("geoBtn");

const results =
    document.getElementById("results");


locationBtn.addEventListener(
    "click",
    analyzeLocation
);


locationInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            analyzeLocation();
        }

    }
);


function analyzeLocation() {

    const location =
        locationInput.value.trim();


    if (!location) {

        results.innerHTML = `
            <div class="empty-result">

                <span class="result-icon">
                    !
                </span>

                <h3>
                    Enter a location
                </h3>

                <p>
                    Add a city, state, region,
                    or market area before
                    starting the analysis.
                </p>

            </div>
        `;

        return;
    }


    results.innerHTML = `
        <div class="empty-result">

            <span class="result-icon">
                ✓
            </span>

            <h3>
                ${location}
            </h3>

            <p>
                Location selected successfully.
                Agricultural consumption analysis
                will be generated from here.
            </p>

        </div>
    `;

}


geoBtn.addEventListener(
    "click",
    function() {

        if (!navigator.geolocation) {

            results.innerHTML = `
                <div class="empty-result">

                    <h3>
                        Geolocation unavailable
                    </h3>

                    <p>
                        Your browser does not
                        support location services.
                    </p>

                </div>
            `;

            return;
        }


        geoBtn.textContent =
            "Finding location...";


        navigator.geolocation.getCurrentPosition(

            function(position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                locationInput.value =
                    `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;


                geoBtn.textContent =
                    "Use my current location";


                results.innerHTML = `
                    <div class="empty-result">

                        <span class="result-icon">
                            ✓
                        </span>

                        <h3>
                            Location detected
                        </h3>

                        <p>
                            Coordinates:
                            ${latitude.toFixed(4)},
                            ${longitude.toFixed(4)}
                        </p>

                    </div>
                `;

            },


            function() {

                geoBtn.textContent =
                    "Use my current location";


                results.innerHTML = `
                    <div class="empty-result">

                        <h3>
                            Location access denied
                        </h3>

                        <p>
                            Allow location access
                            or enter your location manually.
                        </p>

                    </div>
                `;

            }

        );

    }
);
