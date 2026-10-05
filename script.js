const locationInput =
    document.getElementById("location");

const locationBtn =
    document.getElementById("locationBtn");

const geoBtn =
    document.getElementById("geoBtn");

const results =
    document.getElementById("results");


/* ---------- SETTINGS ---------- */

const NATIONAL_URBAN = 0.5;   // rough national urban share
const GAP_WEIGHT = 60;        // points given to the supply gap
const SIZE_WEIGHT = 40;       // points given to market size

let currentState = null;
let currentCategory = "all";
let pendingCategory = "all";   // tab to open after the next analysis
let currentNote = "";


/* ---------- HELPERS ---------- */

function escapeHtml(value) {

    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value).replace(
        /[&<>"']/g,
        function(character) {
            return map[character];
        }
    );
}

function stateLabel(name) {
    return STATES[name].label || name;
}

function formatTonnes(tonnes) {

    const step = tonnes >= 1000 ? 100 : 10;

    const rounded =
        Math.max(step, Math.round(tonnes / step) * step);

    return rounded.toLocaleString("en");
}

function formatPopulation(millions) {
    return millions.toFixed(1) + " million people";
}

function levelFromSize(size) {

    if (size >= 0.6) return "High";
    if (size >= 0.35) return "Medium";

    return "Low";
}

function message(icon, title, text, extra) {

    return `
        <div class="empty-result">

            ${icon ? `<span class="result-icon">${icon}</span>` : ""}

            <h3>${title}</h3>

            <p>${text}</p>

            ${extra || ""}

        </div>
    `;
}


/* ---------- ESTIMATES AND SCORING ---------- */

function demandFor(stateName, product) {

    const state = STATES[stateName];

    const diet =
        product.diet ? product.diet[state.zone] : 1;

    const urban =
        1 + product.urbanLift * (state.urban - NATIONAL_URBAN);

    // tonnes per year
    return state.pop * 1000000 * product.perCapita * diet * urban / 1000;
}

function coverageFor(stateName, product) {

    const override = product.supply.states[stateName];

    if (override !== undefined) return override;

    return product.supply.zones[STATES[stateName].zone];
}

// Largest state demand for each product, used to judge market size
const MAX_DEMAND = {};

PRODUCTS.forEach(function(product) {

    MAX_DEMAND[product.id] = Math.max(
        ...Object.keys(STATES).map(function(name) {
            return demandFor(name, product);
        })
    );

});

function analyzeState(stateName) {

    const rows = PRODUCTS.map(function(product) {

        const demand = demandFor(stateName, product);
        const coverage = coverageFor(stateName, product);

        const gap =
            Math.min(1, Math.max(0, 1 - coverage));

        const size =
            Math.sqrt(demand / MAX_DEMAND[product.id]);

        const score =
            Math.round(GAP_WEIGHT * gap + SIZE_WEIGHT * size);

        return {
            product: product,
            demand: demand,
            coverage: coverage,
            gap: gap,
            size: size,
            score: score
        };

    });

    rows.sort(function(a, b) {
        return b.score - a.score || b.demand - a.demand;
    });

    return rows;
}

function supplySentence(row) {

    if (row.coverage >= 1) {
        return `About ${formatTonnes(row.demand)} tonnes eaten a year. Local farms already produce more than that.`;
    }

    return `About ${formatTonnes(row.demand)} tonnes eaten a year, with roughly ${Math.round(row.coverage * 100)}% supplied locally.`;
}


/* ---------- FINDING THE STATE ---------- */

function normalize(text) {

    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .replace(/\bnigeria\b/g, " ")
        .replace(/\bstate\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Every name we can recognise, mapped to its state
const LOOKUP = {};

Object.keys(STATES).forEach(function(name) {
    LOOKUP[name.toLowerCase()] = name;
});

Object.keys(ALIASES).forEach(function(alias) {
    LOOKUP[alias] = ALIASES[alias];
});

const LOOKUP_KEYS =
    Object.keys(LOOKUP).sort(function(a, b) {
        return b.length - a.length;
    });

function resolveState(input) {

    const text = normalize(input);

    if (!text) return null;

    // exact name or alias
    if (LOOKUP[text]) return LOOKUP[text];

    // a known name somewhere in the text, e.g. "wuse abuja"
    const padded = ` ${text} `;

    for (const key of LOOKUP_KEYS) {

        if (key.length > 2 && padded.includes(` ${key} `)) {
            return LOOKUP[key];
        }
    }

    // start of a state name, e.g. "lag"
    if (text.length >= 3) {

        const starts = Object.keys(STATES).filter(function(name) {
            return name.toLowerCase().startsWith(text);
        });

        if (starts.length === 1) return starts[0];
    }

    return null;
}

function editDistance(a, b) {

    const row = [];

    for (let j = 0; j <= b.length; j++) row[j] = j;

    for (let i = 1; i <= a.length; i++) {

        let previous = row[0];

        row[0] = i;

        for (let j = 1; j <= b.length; j++) {

            const temp = row[j];

            row[j] = Math.min(
                row[j] + 1,
                row[j - 1] + 1,
                previous + (a[i - 1] === b[j - 1] ? 0 : 1)
            );

            previous = temp;
        }
    }

    return row[b.length];
}

function suggestStates(input) {

    const text = normalize(input);

    const best = {};

    LOOKUP_KEYS.forEach(function(key) {

        const distance = editDistance(text, key);
        const state = LOOKUP[key];

        if (best[state] === undefined || distance < best[state]) {
            best[state] = distance;
        }
    });

    return Object.keys(best)
        .sort(function(a, b) {
            return best[a] - best[b];
        })
        .slice(0, 3);
}

function parseCoordinates(input) {

    const match = input.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
    );

    if (!match) return null;

    return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
    };
}

function insideNigeria(latitude, longitude) {

    return latitude >= 4 && latitude <= 14 &&
        longitude >= 2.5 && longitude <= 15;
}

function nearestState(latitude, longitude) {

    let bestName = null;
    let bestDistance = Infinity;

    Object.keys(STATES).forEach(function(name) {

        STATES[name].points.forEach(function(point) {

            const dLat = point[0] - latitude;
            const dLng = point[1] - longitude;

            const distance = dLat * dLat + dLng * dLng;

            if (distance < bestDistance) {
                bestDistance = distance;
                bestName = name;
            }
        });
    });

    return bestName;
}


/* ---------- RESULTS ---------- */

function rowHtml(row) {

    const percent =
        Math.min(100, Math.round(row.coverage * 100));

    const left = row.coverage >= 1
        ? "Local supply covers demand"
        : `${percent}% supplied locally`;

    const right = row.coverage >= 1
        ? "No gap"
        : `${100 - percent}% gap`;

    return `
        <div class="result-row">

            <div class="result-name">
                <strong>${row.product.name}</strong>
                <small>
                    ${CATEGORIES[row.product.category]},
                    ${formatTonnes(row.demand)} tonnes a year
                </small>
            </div>

            <span class="market-score" title="Opportunity score out of 100">
                ${row.score}
            </span>

            <div class="result-bar">

                <div class="bar-track">
                    <div class="bar-fill" style="width: ${percent}%"></div>
                </div>

                <div class="bar-label">
                    <span>${left}</span>
                    <span>${right}</span>
                </div>

            </div>

        </div>
    `;
}

function tabHtml(id, label) {

    return `
        <button
            type="button"
            class="result-tab"
            data-category="${id}"
            aria-pressed="${currentCategory === id}"
        >
            ${label}
        </button>
    `;
}

function renderResults() {

    const state = STATES[currentState];
    const rows = analyzeState(currentState);
    const top = rows[0];

    const visible = rows.filter(function(row) {
        return currentCategory === "all" ||
            row.product.category === currentCategory;
    });

    results.innerHTML = `
        <div class="result-head">

            <span class="small-label">MARKET ANALYSIS</span>

            <h3>${stateLabel(currentState)}</h3>

            <p>
                ${formatPopulation(state.pop)}, ${ZONE_NAMES[state.zone]}
                ${currentNote ? `<br>${currentNote}` : ""}
            </p>

        </div>

        <div class="preview-highlight">

            <span>Top Opportunity</span>

            <h2>${top.product.name}</h2>

            <p>${supplySentence(top)}</p>

            <div class="score-row">

                <div>
                    <span>Opportunity Score</span>
                    <strong>${top.score}</strong>
                </div>

                <div>
                    <span>Demand Level</span>
                    <strong>${levelFromSize(top.size)}</strong>
                </div>

            </div>

        </div>

        <div class="result-tabs">
            ${tabHtml("all", "All")}
            ${tabHtml("livestock", "Livestock")}
            ${tabHtml("crops", "Staple crops")}
            ${tabHtml("fresh", "Fresh produce")}
        </div>

        <div class="result-rows">
            ${visible.map(rowHtml).join("")}
        </div>

        <p class="result-note">
            Estimates, not survey data. Built from 2022 state population
            projections and national average consumption per person,
            adjusted for regional diets and local production patterns.
            Check prices and supply on the ground before investing.
        </p>
    `;
}

function showState(stateName, note) {

    currentState = stateName;
    currentCategory = pendingCategory;
    pendingCategory = "all";
    currentNote = note || "";

    renderResults();
}

function analyzeLocation() {

    const input = locationInput.value.trim();

    if (!input || (!normalize(input) && !parseCoordinates(input))) {

        results.innerHTML = message(
            "!",
            "Enter a location",
            "Add a Nigerian state or city before starting the analysis."
        );

        return;
    }

    // typed coordinates, e.g. "9.0579, 7.4951"
    const coordinates = parseCoordinates(input);

    if (coordinates) {
        showCoordinates(coordinates.latitude, coordinates.longitude);
        return;
    }

    const stateName = resolveState(input);

    if (stateName) {
        showState(stateName);
        return;
    }

    const suggestions = suggestStates(input)
        .map(function(name) {
            return `
                <button
                    type="button"
                    class="result-tab"
                    data-state="${name}"
                >
                    ${stateLabel(name)}
                </button>
            `;
        })
        .join("");

    results.innerHTML = message(
        "?",
        `We couldn't place "${escapeHtml(input)}"`,
        "Agro Opportunity covers Nigerian states for now. Did you mean one of these?",
        `<div class="result-tabs result-suggest">${suggestions}</div>`
    );
}

function showCoordinates(latitude, longitude) {

    if (!insideNigeria(latitude, longitude)) {

        results.innerHTML = message(
            "!",
            "That location is outside Nigeria",
            "Agro Opportunity covers Nigerian states for now. Enter a state or city to continue."
        );

        return;
    }

    const stateName = nearestState(latitude, longitude);

    locationInput.value = stateLabel(stateName);

    showState(
        stateName,
        "Nearest state to your position. Type another state if this is wrong."
    );
}


/* ---------- HERO CARD ---------- */

function fillHeroCard() {

    const heroTop = document.getElementById("heroTop");
    const heroSummary = document.getElementById("heroSummary");
    const heroScore = document.getElementById("heroScore");
    const heroDemand = document.getElementById("heroDemand");
    const heroList = document.getElementById("heroList");

    if (!heroTop || !heroSummary || !heroScore || !heroDemand || !heroList) {
        return;
    }

    const rows = analyzeState("FCT");
    const top = rows[0];

    heroTop.textContent = top.product.name;
    heroSummary.textContent = supplySentence(top);
    heroScore.textContent = top.score;
    heroDemand.textContent = levelFromSize(top.size);

    heroList.innerHTML = rows.slice(1, 4).map(function(row) {

        return `
            <div class="market-item">

                <div>
                    <span class="market-dot"></span>

                    <div>
                        <strong>${row.product.name}</strong>
                        <small>${CATEGORIES[row.product.category]}</small>
                    </div>
                </div>

                <span class="market-score">
                    ${row.score}
                </span>

            </div>
        `;

    }).join("");
}

function fillStateList() {

    const list = document.getElementById("stateList");

    if (!list) return;

    list.innerHTML = Object.keys(STATES).map(function(name) {
        return `<option value="${stateLabel(name)}"></option>`;
    }).join("");
}


/* ---------- EVENTS ---------- */

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

// category tabs and "did you mean" buttons inside the results box
results.addEventListener(
    "click",
    function(event) {

        const button = event.target.closest("button");

        if (!button) return;

        if (button.dataset.category) {

            currentCategory = button.dataset.category;

            renderResults();

            return;
        }

        if (button.dataset.state) {

            locationInput.value = stateLabel(button.dataset.state);

            showState(button.dataset.state);
        }

    }
);

geoBtn.addEventListener(
    "click",
    function() {

        if (!navigator.geolocation) {

            results.innerHTML = message(
                "",
                "Geolocation unavailable",
                "Your browser does not support location services. Enter your state instead."
            );

            return;
        }

        geoBtn.textContent =
            "Finding location...";

        navigator.geolocation.getCurrentPosition(

            function(position) {

                geoBtn.textContent =
                    "Use my current location";

                showCoordinates(
                    position.coords.latitude,
                    position.coords.longitude
                );

            },

            function() {

                geoBtn.textContent =
                    "Use my current location";

                results.innerHTML = message(
                    "",
                    "Location access denied",
                    "Allow location access or enter your location manually."
                );

            }

        );

    }
);


fillStateList();
fillHeroCard();



/* ---------- CATEGORY POP-UP ---------- */

const modal = document.getElementById("categoryModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

const CATEGORY_INFO = {
    livestock: {
        title: "Animal & livestock markets",
        text: "Meat, poultry, eggs, milk and fish."
    },
    crops: {
        title: "Staple food markets",
        text: "Grains, legumes and tubers."
    },
    fresh: {
        title: "Fruits & vegetables",
        text: "Fresh produce that spoils fast, so local supply matters."
    }
};

let scrollAfterClose = false;

function ordinal(number) {

    const mod100 = number % 100;

    if (mod100 >= 11 && mod100 <= 13) return number + "th";

    const suffix = { 1: "st", 2: "nd", 3: "rd" }[number % 10] || "th";

    return number + suffix;
}

function demandRank(product, stateName) {

    const mine = demandFor(stateName, product);

    return 1 + Object.keys(STATES).filter(function(name) {
        return demandFor(name, product) > mine;
    }).length;
}

// States that grow more than they eat: places to buy from
function surplusStates(product, excludeName) {

    return Object.keys(STATES)
        .filter(function(name) {
            return name !== excludeName && coverageFor(name, product) > 1;
        })
        .map(function(name) {
            return {
                name: name,
                tonnes: demandFor(name, product) * (coverageFor(name, product) - 1)
            };
        })
        .sort(function(a, b) {
            return b.tonnes - a.tonnes;
        })
        .slice(0, 3);
}

function formatKg(kg) {
    return kg < 10 ? kg.toFixed(1) : String(Math.round(kg));
}

function categoryHtml(categoryId) {

    const info = CATEGORY_INFO[categoryId];

    const stateName = currentState || "FCT";
    const isSample = !currentState;

    const rows = analyzeState(stateName).filter(function(row) {
        return row.product.category === categoryId;
    });

    const top = rows[0];
    const covered = rows[rows.length - 1];

    const total = Object.keys(STATES).length;
    const rank = demandRank(top.product, stateName);
    const lowerName = top.product.name.toLowerCase();

    const insights = [];

    insights.push(
        `<strong>Biggest gap: ${top.product.name}.</strong> ${supplySentence(top)}`
    );

    insights.push(
        `Among the 36 states and the FCT, demand for ${lowerName} here ranks ${ordinal(rank)} of ${total}.`
    );

    const sources = surplusStates(top.product, stateName);

    if (sources.length) {

        insights.push(
            `Strong ${lowerName} producers to source from: ${sources.map(function(item) {
                return stateLabel(item.name);
            }).join(", ")}.`
        );

    } else {

        insights.push(
            `No state shows a clear ${lowerName} surplus in these estimates, so the gap may need imports or new production.`
        );
    }

    if (rows.length > 1 && covered !== top) {

        const how = covered.coverage >= 1
            ? "local farms already produce more than is eaten"
            : `about ${Math.round(covered.coverage * 100)}% supplied locally`;

        insights.push(
            `Best covered here: ${covered.product.name} (${how}), so expect more competition.`
        );
    }

    const typical = rows.slice().sort(function(a, b) {
        return PRODUCTS.indexOf(a.product) - PRODUCTS.indexOf(b.product);
    }).map(function(row) {
        return `<span>${row.product.name} ${formatKg(row.product.perCapita)} kg</span>`;
    }).join("");

    return `
        <span class="small-label">${CATEGORIES[categoryId].toUpperCase()}</span>

        <h3 id="modalTitle">${info.title}</h3>

        <p class="modal-intro">${info.text}</p>

        <p class="modal-state">
            ${isSample
                ? `Sample view: ${stateLabel(stateName)}. Analyze your own location to see it for your area.`
                : `Showing ${stateLabel(stateName)}.`}
        </p>

        <ul class="modal-insights">
            ${insights.map(function(text) {
                return `<li>${text}</li>`;
            }).join("")}
        </ul>

        <div class="result-rows">
            ${rows.map(rowHtml).join("")}
        </div>

        <p class="modal-typical-title">Typical national consumption per person, per year</p>

        <div class="modal-typical">${typical}</div>

        <button
            type="button"
            class="modal-action"
            data-modal-action="analyze"
            data-category="${categoryId}"
        >
            ${currentState
                ? `Show ${CATEGORIES[categoryId].toLowerCase()} in my results`
                : "Analyze my location"}
        </button>

        <p class="result-note">
            Estimates, not survey data.
        </p>
    `;
}

function openCategory(categoryId) {

    if (!modal || !CATEGORY_INFO[categoryId]) return;

    modalContent.innerHTML = categoryHtml(categoryId);

    modalContent.scrollTop = 0;

    document.body.style.overflow = "hidden";

    if (typeof modal.showModal === "function") {
        modal.showModal();
    } else {
        modal.setAttribute("open", "");
    }
}

function closeCategory() {

    if (!modal) return;

    if (typeof modal.close === "function") {
        modal.close();
    } else {
        modal.removeAttribute("open");
        document.body.style.overflow = "";
    }
}

if (modal) {

    const grid = document.querySelector(".category-grid");

    if (grid) {

        grid.addEventListener("click", function(event) {

            const card = event.target.closest(".category-card");

            if (card) openCategory(card.dataset.category);

        });

        grid.addEventListener("keydown", function(event) {

            if (event.key !== "Enter" && event.key !== " ") return;

            const card = event.target.closest(".category-card");

            if (!card) return;

            event.preventDefault();

            openCategory(card.dataset.category);

        });
    }

    modalClose.addEventListener("click", closeCategory);

    // tap on the dimmed area outside the sheet
    modal.addEventListener("click", function(event) {

        if (event.target === modal) closeCategory();

    });

    modalContent.addEventListener("click", function(event) {

        const button = event.target.closest("[data-modal-action]");

        if (!button) return;

        const categoryId = button.dataset.category;

        pendingCategory = categoryId;

        if (currentState) {
            currentCategory = categoryId;
            pendingCategory = "all";
            renderResults();
        }

        scrollAfterClose = true;

        closeCategory();

    });

    modal.addEventListener("close", function() {

        document.body.style.overflow = "";

        if (!scrollAfterClose) return;

        scrollAfterClose = false;

        // wait for the browser to hand focus back before scrolling
        setTimeout(function() {

            const target = document.getElementById("analyze");

            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });

        }, 60);

    });
}
