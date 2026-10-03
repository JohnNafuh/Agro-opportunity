/*
    AGRO OPPORTUNITY: ESTIMATE DATA

    Everything in this file is a rounded estimate, not survey data.

    Population: 2022 state projections (National Population Commission /
    National Bureau of Statistics), in millions.

    perCapita: national average consumption in kg per person per year,
    rounded from FAO food balance figures and USDA Nigeria reports.

    urban, diet and supply values are working assumptions that reflect
    known patterns (who eats what, which states produce what).
    Replace them with real figures as you get them.
*/

const ZONE_NAMES = {
    NW: "North West",
    NE: "North East",
    NC: "North Central",
    SW: "South West",
    SE: "South East",
    SS: "South South"
};


/*
    pop    = population in millions
    urban  = share of people living in towns and cities (0 to 1)
    points = [latitude, longitude] anchors used to match a GPS position
             to the nearest state (state centre, capital, big towns)
*/
const STATES = {
    "Abia":        { pop: 4.14,  urban: 0.55, zone: "SE", points: [[5.45, 7.52], [5.53, 7.49], [5.11, 7.37]] },
    "Adamawa":     { pop: 4.90,  urban: 0.30, zone: "NE", points: [[9.33, 12.40], [9.21, 12.48], [10.27, 13.27]] },
    "Akwa Ibom":   { pop: 4.98,  urban: 0.35, zone: "SS", points: [[5.01, 7.85], [5.04, 7.91]] },
    "Anambra":     { pop: 5.95,  urban: 0.65, zone: "SE", points: [[6.22, 6.94], [6.21, 7.07], [6.15, 6.79], [6.02, 6.91]] },
    "Bauchi":      { pop: 8.31,  urban: 0.20, zone: "NE", points: [[10.78, 9.99], [10.31, 9.84]] },
    "Bayelsa":     { pop: 2.54,  urban: 0.30, zone: "SS", points: [[4.77, 6.07], [4.92, 6.26]] },
    "Benue":       { pop: 6.14,  urban: 0.20, zone: "NC", points: [[7.34, 8.74], [7.73, 8.52], [7.19, 8.13]] },
    "Borno":       { pop: 6.11,  urban: 0.35, zone: "NE", points: [[11.88, 13.15], [11.83, 13.15]] },
    "Cross River": { pop: 4.41,  urban: 0.30, zone: "SS", points: [[5.87, 8.60], [4.96, 8.33]] },
    "Delta":       { pop: 5.64,  urban: 0.45, zone: "SS", points: [[5.70, 5.93], [6.20, 6.73], [5.52, 5.75]] },
    "Ebonyi":      { pop: 3.24,  urban: 0.25, zone: "SE", points: [[6.26, 8.01], [6.32, 8.11]] },
    "Edo":         { pop: 4.78,  urban: 0.55, zone: "SS", points: [[6.63, 5.93], [6.34, 5.63]] },
    "Ekiti":       { pop: 3.59,  urban: 0.50, zone: "SW", points: [[7.72, 5.31], [7.62, 5.22]] },
    "Enugu":       { pop: 4.69,  urban: 0.50, zone: "SE", points: [[6.54, 7.44], [6.44, 7.50], [6.86, 7.39]] },
    "FCT":         { pop: 3.07,  urban: 0.75, zone: "NC", label: "Abuja (FCT)", points: [[8.89, 7.19], [9.06, 7.49], [8.94, 7.08], [9.15, 7.33]] },
    "Gombe":       { pop: 3.96,  urban: 0.30, zone: "NE", points: [[10.36, 11.19], [10.29, 11.17]] },
    "Imo":         { pop: 5.46,  urban: 0.45, zone: "SE", points: [[5.57, 7.06], [5.48, 7.03]] },
    "Jigawa":      { pop: 7.50,  urban: 0.12, zone: "NW", points: [[12.23, 9.56], [11.76, 9.34]] },
    "Kaduna":      { pop: 9.03,  urban: 0.45, zone: "NW", points: [[10.38, 7.71], [10.52, 7.44], [11.09, 7.72]] },
    "Kano":        { pop: 15.46, urban: 0.50, zone: "NW", points: [[11.75, 8.52], [12.00, 8.52]] },
    "Katsina":     { pop: 10.37, urban: 0.25, zone: "NW", points: [[12.38, 7.63], [12.99, 7.60], [11.52, 7.31]] },
    "Kebbi":       { pop: 5.56,  urban: 0.15, zone: "NW", points: [[11.49, 4.23], [12.45, 4.20]] },
    "Kogi":        { pop: 4.47,  urban: 0.35, zone: "NC", points: [[7.73, 6.69], [7.80, 6.74], [7.55, 6.23]] },
    "Kwara":       { pop: 3.55,  urban: 0.50, zone: "NC", points: [[8.97, 4.39], [8.50, 4.55]] },
    "Lagos":       { pop: 13.49, urban: 0.95, zone: "SW", points: [[6.52, 3.54], [6.60, 3.35], [6.45, 3.40], [6.62, 3.51], [6.58, 3.98], [6.42, 2.88], [6.47, 3.60]] },
    "Nasarawa":    { pop: 2.89,  urban: 0.30, zone: "NC", points: [[8.50, 8.20], [8.49, 8.52], [8.85, 7.87]] },
    "Niger":       { pop: 6.78,  urban: 0.25, zone: "NC", points: [[9.93, 5.60], [9.61, 6.56], [9.08, 6.01]] },
    "Ogun":        { pop: 6.38,  urban: 0.55, zone: "SW", points: [[7.00, 3.47], [7.16, 3.35], [6.69, 3.23], [6.84, 3.65], [6.82, 3.92]] },
    "Ondo":        { pop: 5.32,  urban: 0.45, zone: "SW", points: [[6.91, 5.15], [7.25, 5.19], [7.09, 4.84]] },
    "Osun":        { pop: 4.44,  urban: 0.60, zone: "SW", points: [[7.56, 4.52], [7.77, 4.56], [7.49, 4.55]] },
    "Oyo":         { pop: 7.98,  urban: 0.60, zone: "SW", points: [[8.16, 3.61], [7.38, 3.95], [8.13, 4.24], [7.85, 3.93]] },
    "Plateau":     { pop: 4.72,  urban: 0.35, zone: "NC", points: [[9.22, 9.52], [9.90, 8.86]] },
    "Rivers":      { pop: 7.48,  urban: 0.55, zone: "SS", points: [[4.84, 6.92], [4.82, 7.03]] },
    "Sokoto":      { pop: 6.39,  urban: 0.20, zone: "NW", points: [[13.05, 5.32], [13.06, 5.24]] },
    "Taraba":      { pop: 3.61,  urban: 0.20, zone: "NE", points: [[7.99, 10.77], [8.89, 11.36], [7.87, 9.78]] },
    "Yobe":        { pop: 3.65,  urban: 0.20, zone: "NE", points: [[12.29, 11.44], [11.75, 11.96]] },
    "Zamfara":     { pop: 5.83,  urban: 0.20, zone: "NW", points: [[12.12, 6.22], [12.16, 6.66]] }
};


const CATEGORIES = {
    livestock: "Livestock",
    crops: "Staple crops",
    fresh: "Fresh produce"
};


/*
    perCapita = kg per person per year (national average)
    urbanLift = how much demand rises (+) or falls (-) in more urban states
    diet      = regional eating pattern, as a multiplier on perCapita
    supply    = share of a state's own demand met by local production.
                zones = default for each zone, states = overrides.
                1.0 means self-sufficient, above 1.0 means surplus.
*/
const PRODUCTS = [
    {
        id: "chicken", name: "Chicken", category: "livestock",
        perCapita: 1.7, urbanLift: 0.6,
        supply: {
            zones: { NW: 0.45, NE: 0.40, NC: 0.60, SW: 0.85, SE: 0.55, SS: 0.45 },
            states: { "Oyo": 1.3, "Ogun": 1.4, "Osun": 1.0, "Lagos": 0.35, "FCT": 0.30, "Kaduna": 0.8, "Plateau": 0.8, "Kano": 0.55, "Rivers": 0.35, "Anambra": 0.6, "Delta": 0.6, "Kwara": 0.8 }
        }
    },
    {
        id: "eggs", name: "Eggs", category: "livestock",
        perCapita: 2.7, urbanLift: 0.6,
        diet: { NW: 0.85, NE: 0.8, NC: 1.0, SW: 1.25, SE: 1.1, SS: 1.1 },
        supply: {
            zones: { NW: 0.50, NE: 0.40, NC: 0.60, SW: 0.90, SE: 0.50, SS: 0.45 },
            states: { "Oyo": 1.5, "Ogun": 1.5, "Osun": 1.1, "Lagos": 0.40, "FCT": 0.30, "Kaduna": 0.9, "Plateau": 0.9, "Kano": 0.6, "Rivers": 0.35, "Kwara": 0.85 }
        }
    },
    {
        id: "beef", name: "Beef", category: "livestock",
        perCapita: 1.7, urbanLift: 0.4,
        supply: {
            zones: { NW: 1.2, NE: 1.3, NC: 0.9, SW: 0.30, SE: 0.20, SS: 0.20 },
            states: { "Lagos": 0.05, "FCT": 0.25, "Adamawa": 1.6, "Taraba": 1.5, "Borno": 1.2, "Kano": 0.9, "Plateau": 1.0, "Niger": 1.2, "Oyo": 0.4, "Kwara": 0.7 }
        }
    },
    {
        id: "goat", name: "Goat meat", category: "livestock",
        perCapita: 1.2, urbanLift: 0.2,
        supply: {
            zones: { NW: 1.2, NE: 1.2, NC: 0.9, SW: 0.50, SE: 0.45, SS: 0.40 },
            states: { "Lagos": 0.10, "FCT": 0.30, "Sokoto": 1.5, "Kano": 1.0 }
        }
    },
    {
        id: "fish", name: "Fish", category: "livestock",
        perCapita: 9, urbanLift: 0.3,
        diet: { NW: 0.6, NE: 0.6, NC: 0.8, SW: 1.2, SE: 1.2, SS: 1.6 },
        supply: {
            zones: { NW: 0.35, NE: 0.35, NC: 0.40, SW: 0.45, SE: 0.25, SS: 0.70 },
            states: { "Lagos": 0.5, "Delta": 0.9, "Bayelsa": 1.3, "Rivers": 0.6, "Akwa Ibom": 0.9, "Cross River": 0.8, "Kebbi": 0.8, "Niger": 0.7, "Borno": 0.5, "Ogun": 0.6, "Ondo": 0.8, "Kogi": 0.5, "FCT": 0.15, "Anambra": 0.4, "Taraba": 0.6, "Benue": 0.5 }
        }
    },
    {
        id: "milk", name: "Milk", category: "livestock",
        perCapita: 8, urbanLift: 0.6,
        diet: { NW: 1.5, NE: 1.4, NC: 1.0, SW: 0.8, SE: 0.6, SS: 0.6 },
        supply: {
            zones: { NW: 0.50, NE: 0.50, NC: 0.40, SW: 0.10, SE: 0.05, SS: 0.05 },
            states: { "Kano": 0.6, "Adamawa": 0.7, "Plateau": 0.6, "Kaduna": 0.6, "Lagos": 0.03, "FCT": 0.15, "Oyo": 0.2 }
        }
    },
    {
        id: "rice", name: "Rice", category: "crops",
        perCapita: 26, urbanLift: 0.3,
        supply: {
            zones: { NW: 1.1, NE: 0.8, NC: 1.0, SW: 0.30, SE: 0.50, SS: 0.25 },
            states: { "Kebbi": 2.5, "Niger": 1.8, "Ebonyi": 1.6, "Kano": 1.0, "Jigawa": 1.5, "Taraba": 1.6, "Benue": 1.3, "Nasarawa": 1.3, "Lagos": 0.05, "FCT": 0.20, "Kaduna": 1.2, "Anambra": 0.7, "Ekiti": 0.5, "Ogun": 0.4, "Kogi": 1.0, "Borno": 0.5, "Sokoto": 1.2 }
        }
    },
    {
        id: "maize", name: "Maize", category: "crops",
        perCapita: 30, urbanLift: -0.2,
        diet: { NW: 1.3, NE: 1.3, NC: 1.1, SW: 0.8, SE: 0.7, SS: 0.7 },
        supply: {
            zones: { NW: 1.3, NE: 1.2, NC: 1.3, SW: 0.70, SE: 0.40, SS: 0.35 },
            states: { "Kaduna": 2.2, "Niger": 1.8, "Taraba": 1.8, "Plateau": 1.5, "Lagos": 0.03, "FCT": 0.30, "Oyo": 1.1, "Katsina": 1.4, "Borno": 0.9, "Kano": 0.9, "Gombe": 1.4, "Bauchi": 1.4 }
        }
    },
    {
        id: "beans", name: "Beans", category: "crops",
        perCapita: 12, urbanLift: 0,
        supply: {
            zones: { NW: 1.4, NE: 1.4, NC: 0.8, SW: 0.20, SE: 0.15, SS: 0.10 },
            states: { "Kano": 1.1, "Borno": 1.5, "Lagos": 0.01, "FCT": 0.20, "Zamfara": 1.5, "Bauchi": 1.5, "Gombe": 1.5, "Niger": 1.0 }
        }
    },
    {
        id: "yam", name: "Yam", category: "crops",
        perCapita: 80, urbanLift: -0.1,
        diet: { NW: 0.5, NE: 0.6, NC: 1.3, SW: 1.2, SE: 1.3, SS: 1.1 },
        supply: {
            zones: { NW: 0.30, NE: 0.50, NC: 1.6, SW: 0.80, SE: 0.80, SS: 0.60 },
            states: { "Benue": 2.5, "Taraba": 2.2, "Niger": 1.8, "Nasarawa": 2.0, "Kogi": 1.5, "Lagos": 0.02, "FCT": 0.50, "Oyo": 1.3, "Ekiti": 1.3, "Ondo": 1.1, "Enugu": 1.1, "Ebonyi": 1.2, "Cross River": 1.1, "Edo": 0.9, "Kwara": 1.3, "Plateau": 1.0, "Adamawa": 0.7, "Kaduna": 0.6 }
        }
    },
    {
        id: "cassava", name: "Cassava", category: "crops",
        perCapita: 100, urbanLift: -0.2,
        diet: { NW: 0.14, NE: 0.18, NC: 0.9, SW: 0.65, SE: 1.6, SS: 2.0 },
        supply: {
            zones: { NW: 0.80, NE: 0.80, NC: 1.2, SW: 1.2, SE: 0.90, SS: 0.90 },
            states: { "Benue": 2.0, "Kogi": 1.8, "Cross River": 1.4, "Ogun": 1.6, "Oyo": 1.5, "Ondo": 1.5, "Lagos": 0.05, "FCT": 0.40, "Taraba": 1.5, "Rivers": 0.6, "Imo": 0.9, "Enugu": 1.1, "Delta": 1.0, "Edo": 1.3, "Akwa Ibom": 1.0, "Anambra": 0.7, "Bayelsa": 0.7, "Plateau": 0.6, "Kano": 0.5 }
        }
    },
    {
        id: "tomatoes", name: "Tomatoes", category: "fresh",
        perCapita: 12, urbanLift: 0.1,
        supply: {
            zones: { NW: 1.4, NE: 1.0, NC: 0.80, SW: 0.30, SE: 0.15, SS: 0.10 },
            states: { "Kano": 1.8, "Kaduna": 1.9, "Katsina": 1.5, "Jigawa": 1.6, "Gombe": 1.5, "Plateau": 1.5, "Bauchi": 1.3, "Lagos": 0.02, "FCT": 0.20, "Benue": 1.0, "Oyo": 0.5 }
        }
    },
    {
        id: "onions", name: "Onions", category: "fresh",
        perCapita: 7, urbanLift: 0,
        supply: {
            zones: { NW: 1.6, NE: 1.1, NC: 0.40, SW: 0.10, SE: 0.05, SS: 0.05 },
            states: { "Sokoto": 2.5, "Kebbi": 2.5, "Kano": 1.6, "Lagos": 0.01, "FCT": 0.10, "Plateau": 0.6, "Jigawa": 1.4, "Borno": 1.2, "Zamfara": 1.5, "Katsina": 1.3 }
        }
    },
    {
        id: "pepper", name: "Pepper", category: "fresh",
        perCapita: 3.5, urbanLift: 0,
        supply: {
            zones: { NW: 1.3, NE: 1.0, NC: 0.90, SW: 0.60, SE: 0.40, SS: 0.30 },
            states: { "Kaduna": 1.9, "Kano": 1.4, "Lagos": 0.03, "FCT": 0.25, "Plateau": 1.2, "Jigawa": 1.3, "Oyo": 0.8, "Ondo": 0.7, "Benue": 1.0 }
        }
    }
];


/* Cities and short names people type, mapped to their state */
const ALIASES = {
    "abuja": "FCT", "fct": "FCT", "federal capital territory": "FCT",
    "gwagwalada": "FCT", "kubwa": "FCT", "garki": "FCT", "wuse": "FCT", "maitama": "FCT",
    "ikeja": "Lagos", "lekki": "Lagos", "ikorodu": "Lagos", "surulere": "Lagos", "yaba": "Lagos", "epe": "Lagos", "badagry": "Lagos",
    "port harcourt": "Rivers", "ph": "Rivers", "portharcourt": "Rivers",
    "ibadan": "Oyo", "ogbomosho": "Oyo",
    "benin": "Edo", "benin city": "Edo",
    "jos": "Plateau",
    "calabar": "Cross River",
    "uyo": "Akwa Ibom",
    "owerri": "Imo",
    "aba": "Abia", "umuahia": "Abia",
    "onitsha": "Anambra", "awka": "Anambra", "nnewi": "Anambra",
    "warri": "Delta", "asaba": "Delta",
    "abeokuta": "Ogun", "ota": "Ogun", "sagamu": "Ogun", "ijebu ode": "Ogun",
    "akure": "Ondo",
    "osogbo": "Osun", "oshogbo": "Osun", "ife": "Osun", "ile ife": "Osun",
    "ilorin": "Kwara",
    "lokoja": "Kogi",
    "makurdi": "Benue",
    "lafia": "Nasarawa", "keffi": "Nasarawa",
    "minna": "Niger", "suleja": "Niger",
    "zaria": "Kaduna",
    "maiduguri": "Borno",
    "yola": "Adamawa",
    "jalingo": "Taraba",
    "damaturu": "Yobe",
    "dutse": "Jigawa",
    "gusau": "Zamfara",
    "birnin kebbi": "Kebbi",
    "yenagoa": "Bayelsa",
    "abakaliki": "Ebonyi",
    "ado ekiti": "Ekiti",
    "nsukka": "Enugu"
};
