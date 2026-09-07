const locationInput = document.getElementById("location");
const locationBtn = document.getElementById("locationBtn");
const results = document.getElementById("results");

locationBtn.addEventListener("click", function () {

    const location = locationInput.value.trim();

    if (!location) {
        results.innerHTML = `
            <p>Please enter a location.</p>
        `;
        return;
    }

    results.innerHTML = `
        <h3>${location}</h3>
        <p>Location analysis will be generated here.</p>
    `;

});
