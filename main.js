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
 * @property {DocumentFragment} l
 * @property {number} price
 * @property {number} timeToTargetCookie
 * @property {number} newCookiesPs
 * @property {number} BestHelper
 * @property {number} cpsAcceleration
 */
/**
 * @typedef {Object} Upgrade
 * @property {function} getPrice
 * @property {number} bought
 * @property {number} timeToTargetCookie
 * @property {number} newCookiesPs
 * @property {number} BestHelper
 * @property {number} cpsAcceleration
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
 * @property {string} pool
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
        [...document.styleSheets[1].cssRules].filter(e => e.selectorText === ".product .content")[0].style.paddingTop = "0px";
        [...document.styleSheets[1].cssRules].filter(e => e.selectorText === ".price::before")[0].style.top = "0px";

        // noinspection JSUndeclaredVariable
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
        if (MOD.loopCount >= 10
            || MOD.last_cps !== Game.cookiesPs
            || MOD.config.sortbuildings !== MOD.last_config_sortbuildings
            || !document.querySelector("#productAcc0")
            || (document.querySelector("#upgrade0") && !document.querySelector("#upgradeAcc0"))) {
            MOD.sortDeals();
            MOD.last_config_sortbuildings = MOD.config.sortbuildings;
            MOD.last_cps = Game.cookiesPs;
            MOD.loopCount = 0;
        }
    },

    insertAfter: function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    },

    getCpsAcceleration: function (me) {
        // Treat Grandmapocalypse upgrade as 0% temporary
        if (["One mind", "Communal brainsweep", "Elder pact"].includes(me.name)
            || me.pool === "toggle"
            || Game.cookies === 0) {
            return 0;
        }

        // Backup
        Game.Logic_ = Game.Logic;
        Game.Logic = function () {};
        let oldCookiesPsRawHighest = Game.cookiesPsRawHighest;

        if (me.type === "upgrade") me.bought++; else me.amount++;
        Game.CalculateGains();
        me.newCookiesPs = Game.cookiesPs;
        if (me.type === "upgrade") me.bought--; else me.amount--;
        Game.CalculateGains();

        // Restore
        Game.cookiesPsRawHighest = oldCookiesPsRawHighest;
        Game.Logic = Game.Logic_;

        let deltaCps = me.newCookiesPs - Game.cookiesPs;
        if (deltaCps === 0) return 0;

        let deltaTime;
        if (me.type === "upgrade") me.price = me.getPrice();
        if (me.price > Game.cookies) {
            deltaTime = me.price / me.newCookiesPs + (me.price - Game.cookies) / Game.cookiesPs;
        } else {
            deltaTime = me.price / me.newCookiesPs;
        }
        if (deltaTime === 0) return 0; // "Milk selector"


        return deltaCps / deltaTime;
    },

    /**
     * @param {(Building|Upgrade)[]} all
     */
    findHelper: function (all) {
        all.forEach(e => e.BestHelper = 0);

        let i = 0;
        let target = all[0];
        while (target.price > Game.cookies) {
            target.timeToTargetCookie = (target.price - Game.cookies) / Game.cookiesPs;
            let helpers = all.filter(me => me !== target && me.price < target.price);
            if (!helpers.length) return;

            helpers.forEach(function (me) {
                if (me.price > Game.cookies) {
                    me.timeToTargetCookie = (me.price - Game.cookies) / Game.cookiesPs + target.price / me.newCookiesPs;
                } else {
                    me.timeToTargetCookie = (target.price + me.price - Game.cookies) / me.newCookiesPs;
                }
            });
            helpers.sort((a, b) => a.timeToTargetCookie - b.timeToTargetCookie);
            if (helpers[0].timeToTargetCookie >= target.timeToTargetCookie) return;
            i++;
            helpers[0].BestHelper = i;
            target = helpers[0];
        }


    },

    rainbow: function (span) {
        let text = span.innerText;
        span.innerHTML = "";
        for (let i = 0; i < text.length; i++) {
            let charElem = document.createElement("span");
            charElem.style.color = "hsl(" + (360 * i / text.length) + ",90%,80%)";
            charElem.innerHTML = text[i];
            span.appendChild(charElem);
        }
    },

    sortDeals: function () {
        let enabledBuildings = Game.ObjectsById.map(e => +!e.locked).reduce((a, b) => a + b) + 2;
        let buildings = [...Game.ObjectsById].filter(o => o.id < enabledBuildings);
        let upgrades = [...Game.UpgradesInStore];
        let all = [...buildings, ...upgrades];

        // Calculate cpsAcceleration
        all.forEach(me => me.cpsAcceleration = MOD.getCpsAcceleration(me));
        // Sorting by cpsAcceleration
        all.sort((a, b) => b.cpsAcceleration - a.cpsAcceleration);

        // If the best cpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
        MOD.findHelper(all);

        // Determine colors
        all.forEach((e, index) => e.accRank = index);
        let palette = ["#00ffff"];
        let rank = 0;
        let domain = [all[rank].cpsAcceleration];
        rank++;
        while (rank < all.length && all[rank].cpsAcceleration === all[0].cpsAcceleration) rank++;
        if (rank < all.length) {
            palette.unshift("#00ff00");
            domain.unshift(all[rank].cpsAcceleration);
        }
        rank += 6;
        if (rank < all.length) {
            palette.unshift("#ffd939");
            domain.unshift(all[rank].cpsAcceleration);
        }
        rank += 8;
        if (rank < all.length) {
            palette.unshift("#ff0000");
            domain.unshift(all[rank].cpsAcceleration);
        }
        rank++;
        if (rank < all.length) {
            palette.unshift("#d82aff");
            domain.unshift(all[all.length - 1].cpsAcceleration);
        }

        let color = chroma.scale(palette).mode("lab").domain(domain);

        // Normalized Notation by Mean
        let allAcc = all.map(e => e.cpsAcceleration).filter(e => e !== 0);
        if (allAcc.length === 0) return;
        const avg = allAcc.reduce((a, b) => a + b, 0) / allAcc.length;

        // Calculate waiting times
        all.forEach(function (me) {
            me.waitingTime = "";
            if (me.price < Game.cookies) return;

            const seconds = (me.price - Game.cookies) / Game.cookiesPs;
            let a = [
                Math.floor(seconds / 60 / 60 / 24 / 365) + "y",
                Math.floor(seconds / 60 / 60 / 24 % 365) + "d",
                Math.floor(seconds / 60 / 60 % 24) + "h",
                Math.floor(seconds / 60 % 60) + "m",
                Math.floor(seconds % 60) + "s"];
            while (a.length && ["0y", "0d", "0m", "0h"].includes(a[0])) a.shift();
            if (Math.floor(seconds / 60 / 60 / 24 / 365) > 100) {
                me.waitingTime = ">100y";
            } else {
                me.waitingTime = a.slice(0, 2);
            }
        });

        // Notation for upgrades
        for (const i in upgrades) {
            let me = upgrades[i];
            me.l = document.querySelector("#upgrade" + i);
            // Node
            let span = document.querySelector("#upgradeAcc" + i);
            if (!span) {
                span = document.createElement("span");
                span.id = "upgradeAcc" + i;
                span.style.fontWeight = "bolder";
                span.style.position = "absolute";
                span.style.bottom = "0px";
                span.style.left = "-3px";
                span.style.textShadow = "0px 2px 6px #000, 0px 1px 1px #000";
                span.style.transform = "scale(0.8,1)";
                l("upgrade" + i).appendChild(span);
            }

            // Text
            if (me.cpsAcceleration === 0) {
                span.textContent = "";
                continue;
            }
            span.textContent = Beautify(me.cpsAcceleration * 100 / avg, 1) + "%";
            if (me.waitingTime) span.innerHTML = me.waitingTime + "<br>" + span.textContent;
            if (me.BestHelper) {
                MOD.rainbow(span);
            } else {
                try {span.style.color = color(me.cpsAcceleration);} catch (e) { }
            }
        }
        // Notation for buildings
        for (const i in buildings) {
            let me = buildings[i];
            // Node
            let span = document.querySelector("#productAcc" + me.id);
            if (!span) {
                span = document.createElement("span");
                span.id = "productAcc" + me.id;
                span.style.fontWeight = "bolder";
                span.style.display = "block";
                MOD.insertAfter(span, l("productPrice" + me.id));
            }

            // Text
            if (me.cpsAcceleration === 0) {
                span.textContent = "";
                continue;
            }
            // Auto increase decimalPlaces for small number
            let value;
            for (let i = 0; i < 15; i++) {
                value = Beautify(me.cpsAcceleration * 100 / avg, i);
                if (value !== "0") {
                    value = Beautify(me.cpsAcceleration * 100 / avg, i + 1);
                    break;
                }
            }
            span.textContent = " 💹" + value + "%";
            if (me.waitingTime) span.textContent += " ⏳" + me.waitingTime;
            if (me.BestHelper) {
                MOD.rainbow(span);
            } else {
                try {span.style.color = color(me.cpsAcceleration);} catch (e) { }
            }
        }


        // Sort upgrades & buildings (or leave them as default)
        if (MOD.config.sortbuildings) {
            upgrades.sort(function (a, b) {
                if (b.BestHelper !== a.BestHelper) {
                    return b.BestHelper - a.BestHelper;
                } else {
                    return b.cpsAcceleration - a.cpsAcceleration;
                }
            });
            buildings.sort(function (a, b) {
                if (b.BestHelper !== a.BestHelper) {
                    return b.BestHelper - a.BestHelper;
                } else {
                    return b.cpsAcceleration - a.cpsAcceleration;
                }
            });
        }

        let upgrades_order = upgrades.map(e => e.l.id);
        let current_upgrades_order = [...document.querySelector("#upgrades").children].map(e => e.id);
        // Only sort when the order is different
        if (!upgrades_order.every((value, index) => value === current_upgrades_order[index])) {
            let store = document.querySelector("#upgrades");
            for (let i = 0; i < upgrades.length; ++i) {
                if (["toggle", "tech"].includes(upgrades[i].pool)) continue;
                store.appendChild(upgrades[i].l);
            }
        }

        let buildings_order = buildings.map(e => e.id);
        // Only sort when the order is different
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

