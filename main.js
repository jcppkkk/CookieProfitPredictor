/**
 * @typedef {function} LoadScript
 */
/**
 * @typedef {Object} Building
 * @property {number} price
 * @property {DocumentFragment} l
 */
/**
 * @function l
 * @param {string} id
 */
/**
 * @function Beautify
 * @param {number} number
 * @param {number} decimalPlaces
 */
/**
 * @function PlaySound
 */
/**
 * @typedef {Object} Game
 * @property {function} registerMod
 * @property {function} Has
 * @property {function} CalculateGains
 * @property {Object[]} GrandmaSynergies
 * @property {Object} GrandmaSynergies.buildingTie
 * @property {number} GrandmaSynergies.buildingTie.storedTotalCps
 * @property {Object.<string, Building>} Objects
 * @property {Building[]} ObjectsById
 * @property {Array} customOptionsMenu
 * @property {Array} Upgrades
 * @property {string} clickStr
 * @property {number} unbuffedCps
 * @property {number} globalCpsMult
 * @property {number} storedCps
 * @property {number} cookies
 * @property {number} cookiesPs
 */
/**
 * @typedef {Object} App
 * @property {Array} mods
 */
/**
 * @typedef {Object} CCSE
 * @property {function} AppendCollapsibleOptionsMenu
 */
LoadScript(App.mods["Best Deal Helper"].dir + "/chroma.min.js");

let BestDealHelper = {
    name: "BestDealHelper",

    config: {
        sortbuildings: 0,
    },

    isLoaded: false,
    load_chroma: false,
    loopCount: 0,

    register: function () {
        Game.registerMod(this.name, this);
    },

    "init": function () {
        MOD = this;
        Game.customOptionsMenu.push(MOD.addOptionsMenu);
        MOD.last_cps = 0;
        MOD.last_buildings_order = [...Game.ObjectsById].map(e => e.id);
        MOD.last_config_sortbuildings = MOD.config.sortbuildings;
        setTimeout(function () {
            setInterval(MOD.logicLoop, 200);
        }, 500);

        MOD.isLoaded = true;
    },

    "load": function (str) {
        const config = JSON.parse(str);
        for (const c in config) MOD.config[c] = config[c];
        MOD.sortDeals();
    },

    "save": function () {
        return JSON.stringify(MOD.config);
    },


    addOptionsMenu: function () {
        const body = `
        <div class="listing">
            ${MOD.button("sortbuildings", "Sort Buildings ON (default)", "Sort Buildings OFF")}
        </div>`;

        CCSE.AppendCollapsibleOptionsMenu(MOD.name, body);
    },

    logicLoop: function () {
        MOD.loopCount++;
        if (
            MOD.loopCount >= 10
            || MOD.last_cps !== Game.cookiesPs
            || MOD.config.sortbuildings !== MOD.last_config_sortbuildings
            || !document.querySelector("#normalizedCpspb0")
        ) {
            MOD.sortDeals();
            MOD.loopCount = 0;
            MOD.last_config_sortbuildings = MOD.config.sortbuildings;
            MOD.last_cps = Game.cookiesPs;
        }
    },
    median: function (values) {
        if (values.length === 0) return 0;

        values.sort(function (a, b) {
            return a - b;
        });

        const half = Math.floor(values.length / 2);

        if (values.length % 2) return values[half];

        return (values[half - 1] + values[half]) / 2.0;
    },
    insertAfter: function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    },

    sortDeals: function () {
        let enabledBuildings = Game.ObjectsById.map(e => +!e.locked).reduce((a, b) => a + b) + 2;
        let buildings = [...Game.ObjectsById].filter(o => o.id < enabledBuildings);

        buildings.forEach(function (me) {
            Game.timedout = true;
            me.amount++;
            Game.CalculateGains();
            let newCookiesPs = Game.cookiesPs;
            me.amount--;
            Game.CalculateGains();
            Game.timedout = false;

            let deltaTime;
            if (me.price > Game.cookies) {
                deltaTime = (me.price - Game.cookies) / Game.cookiesPs + Game.cookies / newCookiesPs;
            } else {
                deltaTime = me.price / newCookiesPs;
            }

            let deltaCps = newCookiesPs - Game.cookiesPs;
            return me.cpsAcceleration = deltaCps / deltaTime;
        });

        // Sort buildings or leave them to default
        if (MOD.config.sortbuildings) {
            buildings.sort(function (a, b) {
                return (a.cpsAcceleration === b.cpsAcceleration) ? 0 : (a.cpsAcceleration < b.cpsAcceleration ? 1 : -1);
            });
        }

        // Sort buildings only if the order has changed
        let buildings_order = buildings.map(e => e.id);
        if (!buildings_order.every((value, index) => value === MOD.last_buildings_order[index])) {
            let store = document.querySelector("#products");
            for (let i = 0; i < buildings.length; ++i) {
                store.appendChild(buildings[i].l);
            }
            MOD.last_buildings_order = buildings_order;
            // Game.Notify(`Buildings are sorted!`, ``, [16, 5], 1.5, 1);
        }

        // Normalization by Mean
        const cpsAccelerationArr = buildings.map(e => e.cpsAcceleration);
        const avg = cpsAccelerationArr.reduce((a, b) => a + b, 0) / buildings.length;
        let color = (
            chroma.scale(["red", "yellow", "lightgreen"])
                .mode("lrgb")
                .domain([Math.min(...cpsAccelerationArr), MOD.median(cpsAccelerationArr), Math.max(...cpsAccelerationArr)])
        );

        for (const i in buildings) {
            let me = buildings[i];
            let cpspb = document.querySelector("#normalizedCpspb" + me.id);
            if (!cpspb) {
                cpspb = document.createElement("span");
                cpspb.setAttribute("id", "normalizedCpspb" + me.id);
                cpspb.style.fontWeight = "bolder";
                MOD.insertAfter(cpspb, l("productPrice" + me.id));
            }
            cpspb.textContent = " 💹" + Beautify(me.cpsAcceleration * 100 / avg, 2) + "%";
            cpspb.style.color = color(me.cpsAcceleration);

        }
    },

    button: function (config, texton, textoff) {
        const name = `BestDealHelper${config}button`;
        const callback = `BestDealHelper.buttonCallback('${config}', '${name}', '${texton}', '${textoff}');`;
        const value = MOD.config[config];
        return `<a class="${value ? "option" : "option off"}" id="${name}" ${Game.clickStr}="${callback}">${value ? texton : textoff}</a>`;
    },

    "buttonCallback": function (config, button, texton, textoff) {
        const value = !MOD.config[config];
        MOD.config[config] = value;
        l(button).innerHTML = value ? texton : textoff;
        l(button).className = value ? "option" : "option off";
        PlaySound("snd/tick.mp3");
    },
};

// Bind methods
for (func of Object.getOwnPropertyNames(BestDealHelper).filter(m => typeof BestDealHelper[m] === "function")) {
    /**
     * @typedef {string} func
     */
    BestDealHelper[func] = BestDealHelper[func].bind(BestDealHelper);
}

// Load mod
if (!BestDealHelper.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        BestDealHelper.register();
    } else {
        if (!CCSE) { // noinspection ES6ConvertVarToLetConst
            var CCSE = {}; // use var here, or it may cause loading error
        }
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(BestDealHelper.register);
    }
}
