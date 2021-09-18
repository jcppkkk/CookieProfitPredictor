/**
 * @typedef {function} LoadScript
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
 * @typedef {Object} Building
 * @property {number} price
 * @property {DocumentFragment} l
 */
/**
 * @typedef {Object} Upgrade
 * @property {function} getPrice
 * @property {number} bought
 */
/**
 * @typedef {Object} Game
 * @property {function} Logic
 * @property {function} registerMod
 * @property {function} Has
 * @property {function} CalculateGains
 * @property {Object[]} GrandmaSynergies
 * @property {Object} GrandmaSynergies.buildingTie
 * @property {number} GrandmaSynergies.buildingTie.storedTotalCps
 * @property {Object.<string, Building>} Objects
 * @property {Building[]} ObjectsById
 * @property {Upgrade[]} UpgradesInStore
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
        // change building layout
        [...document.getElementsByClassName("product")].forEach(e => e.style.lineHeight = "18px");
        [...document.getElementsByClassName("productName")].forEach(e => e.style.fontSize = "26px");

        MOD = this;
        Game.customOptionsMenu.push(MOD.addOptionsMenu);
        MOD.last_cps = 0;
        MOD.last_buildings_order = [...Game.ObjectsById].map(e => e.id);
        MOD.last_config_sortbuildings = MOD.config.sortbuildings;
        setTimeout(function () {
            setInterval(MOD.logicLoop, 200);
        }, 500);

        const GameRebuildUpgrades = Game.RebuildUpgrades;
        Game.RebuildUpgrades = function () {
            GameRebuildUpgrades();
            MOD.logicLoop();
        };

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
            MOD.loopCount >= 5
            || MOD.last_cps !== Game.cookiesPs
            || MOD.config.sortbuildings !== MOD.last_config_sortbuildings
            || !document.querySelector("#productAcc0")
            || (document.querySelector("#upgrade0") && !document.querySelector("#upgradeAcc0"))
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
        let upgrades = [...Game.UpgradesInStore];
        let all = [...buildings, ...upgrades];

        // Calculate cpsAcceleration
        all.forEach(function (me) {
            Game.Logic_ = Game.Logic;
            Game.Logic = function () {
            };
            if (me.type === "upgrade") me.bought++; else me.amount++;
            Game.CalculateGains();
            let newCookiesPs = Game.cookiesPs;
            if (me.type === "upgrade") me.bought--; else me.amount--;
            Game.CalculateGains();
            Game.Logic = Game.Logic_;

            let deltaTime;
            if (me.type === "upgrade") me.price = me.getPrice();
            if (me.price > Game.cookies) {
                deltaTime = (me.price - Game.cookies) / Game.cookiesPs + me.price / newCookiesPs;
            } else {
                deltaTime = me.price / newCookiesPs;
            }

            let deltaCps = newCookiesPs - Game.cookiesPs;
            return me.cpsAcceleration = deltaCps / deltaTime;
        });

        // determine colors
        all.sort((a, b) => a.cpsAcceleration - b.cpsAcceleration);
        all.forEach((e, index) => e.accRank = index);
        let palette = ["#00ffff"];
        let rank = all.length - 1;
        let domain = [all[rank].cpsAcceleration];
        rank--;
        if (rank >= 0) {
            palette.unshift("#00ff00");
            domain.unshift(all[rank].cpsAcceleration);
        }
        rank -= 6;
        if (rank >= 0) {
            palette.unshift("#ffd939");
            domain.unshift(all[rank].cpsAcceleration);
        }
        rank -= 8;
        if (rank >= 0) {
            palette.unshift("#ff0000");
            domain.unshift(all[rank].cpsAcceleration);
        }
        rank--;
        if (rank >= 0) {
            palette.unshift("#64007c");
            domain.unshift(all[0].cpsAcceleration);
        }

        let color = chroma.scale(palette).mode("lab").domain(domain);

        // Normalized Notation by Mean
        const avg = all.map(e => e.cpsAcceleration).reduce((a, b) => a + b, 0) / all.length;

        // Notation for upgrades
        for (const i in upgrades) {
            let me = upgrades[i];
            me.l = document.querySelector("#upgrade" + i);
            let span = document.querySelector("#upgradeAcc" + i);
            if (!span) {
                span = document.createElement("span");
                span.id = "upgradeAcc" + i;
                span.style.fontWeight = "bolder";
                span.style.position = "absolute";
                span.style.bottom = "0px";
                span.style.left = "-2px";
                span.style.textShadow = "0px 2px 6px #000, 0px 1px 1px #000";
                span.style.transform = "scale(0.8,1)";
                l("upgrade" + i).appendChild(span);
            }
            span.textContent = Beautify(me.cpsAcceleration * 100 / avg, 1) + "%";
            span.style.color = color(me.cpsAcceleration);
        }
        // Sort upgrades (or leave them as default)
        upgrades.sort((a, b) => b.cpsAcceleration - a.cpsAcceleration);
        // Only sort when the order is different
        let upgrades_order = upgrades.map(e => e.l.id);
        let current_upgrades_order = [...document.querySelector("#upgrades").children].map(e => e.id);
        if (!upgrades_order.every((value, index) => value === current_upgrades_order[index])) {
            let store = document.querySelector("#upgrades");
            for (let i = 0; i < upgrades.length; ++i) {
                store.appendChild(upgrades[i].l);
            }
        }

        // Notation for buildings
        for (const i in buildings) {
            let me = buildings[i];
            let span = document.querySelector("#productAcc" + me.id);
            if (!span) {
                span = document.createElement("span");
                span.id = "productAcc" + me.id;
                span.style.fontWeight = "bolder";
                span.style.display = "block";
                MOD.insertAfter(span, l("productPrice" + me.id));
            }
            span.textContent = " 💹" + Beautify(me.cpsAcceleration * 100 / avg, 2) + "%";
            span.style.color = color(me.cpsAcceleration);

        }

        // Sort buildings (or leave them as default)
        if (MOD.config.sortbuildings) {
            buildings.sort((a, b) => b.cpsAcceleration - a.cpsAcceleration);
        }
        // Only sort when the order is different
        let buildings_order = buildings.map(e => e.id);
        if (!buildings_order.every((value, index) => value === MOD.last_buildings_order[index])) {
            let store = document.querySelector("#products");
            for (let i = 0; i < buildings.length; ++i) {
                store.appendChild(buildings[i].l);
            }
            MOD.last_buildings_order = buildings_order;
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

