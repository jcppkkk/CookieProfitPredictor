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
 * @property {number} buyOneCps
 * @property {number} BestHelper
 * @property {number} cpsAcceleration
 * @property {Upgrade[]} tieredUpgrades
 * @property {number} tierPrice
 * @property {number} buyTierCps
 */
/**
 * @typedef {Object} Upgrade
 * @property {function} getPrice
 * @property {function} isVaulted
 * @property {number} bought
 * @property {number} timeToTargetCookie
 * @property {number} buyOneCps
 * @property {number} BestHelper
 * @property {number} cpsAcceleration
 * @property {number} tier
 * @property {number} tierPrice
 * @property {number} buyTierCps
 */
/**
 * @typedef {Object} Tier
 */
/**
 * @typedef {Object} Game
 * @property {function} Logic
 * @property {function} registerMod
 * @property {function} Has
 * @property {function} CalculateGains
 * @property {String[]} GrandmaSynergies
 * @property {Object} GrandmaSynergies.buildingTie
 * @property {number} GrandmaSynergies.buildingTie.storedTotalCps
 * @property {{string:Building}} Objects
 * @property {{number:Upgrade}} UpgradesById
 * @property {{string:Tier}} Tiers
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
        enableSort: 1,
        ignoreWizardTower: 0,
    },

    isLoaded: false,
    load_chroma: false,
    loopCount: 0,

    register: function () {
        Game.registerMod(this.name, this);
    },

    "init": function () {
        // configs
        BestDealHelper.last_cps = 0;
        BestDealHelper.last_buildings_order = [...Game.ObjectsById].map(e => e.id);
        BestDealHelper.last_config_enableSort = BestDealHelper.config.enableSort;
        BestDealHelper.last_config_ignoreWizardTower = BestDealHelper.config.ignoreWizardTower;

        // iterable Updates
        const buildMap = obj => Object.keys(obj).reduce((map, key) => map.set(key, obj[key]), new Map());
        BestDealHelper.Upgrades = buildMap(Game.UpgradesById);

        // UI: add menu
        Game.customOptionsMenu.push(BestDealHelper.addOptionsMenu);
        // UI: change building layout
        [...document.styleSheets[1].cssRules].filter(e => e.selectorText === ".product .content")[0].style.paddingTop = "0px";
        [...document.styleSheets[1].cssRules].filter(e => e.selectorText === ".price::before")[0].style.top = "0px";

        // Trigger: wrap GameRebuildUpgrades
        const GameRebuildUpgrades = Game.RebuildUpgrades;
        Game.RebuildUpgrades = function () {
            GameRebuildUpgrades();
            BestDealHelper.logicLoop();
        };
        // Trigger: checks from time to time
        setTimeout(function () {
            setInterval(BestDealHelper.logicLoop, 200);
        }, 500);
        BestDealHelper.isLoaded = true;
    },

    "load": function (str) {
        const config = JSON.parse(str);
        for (const c in config) BestDealHelper.config[c] = config[c];
        BestDealHelper.sortDeals();
    },

    "save": function () {
        return JSON.stringify(BestDealHelper.config);
    },


    addOptionsMenu: function () {
        const body = `
        <div class="listing">
            ${BestDealHelper.button("enableSort", "Sort ON (default)", "Sort OFF")}
        </div>
        <div class="listing">
            ${BestDealHelper.button("ignoreWizardTower", "Ignore Wizard Tower ON", "Ignore Wizard Tower OFF (default)")}
        </div>
        `;

        CCSE.AppendCollapsibleOptionsMenu(BestDealHelper.name, body);
    },

    logicLoop: function () {
        BestDealHelper.loopCount++;
        if (BestDealHelper.loopCount >= 20
            || BestDealHelper.last_cps !== Game.cookiesPs
            || BestDealHelper.config.enableSort !== BestDealHelper.last_config_enableSort
            || BestDealHelper.config.ignoreWizardTower !== BestDealHelper.last_config_ignoreWizardTower
            || !document.querySelector("#productAcc0")
            || (document.querySelector("#upgrade0") && !document.querySelector("#upgradeAcc0"))) {
            BestDealHelper.sortDeals();
            BestDealHelper.last_config_enableSort = BestDealHelper.config.enableSort;
            BestDealHelper.last_config_ignoreWizardTower = BestDealHelper.config.ignoreWizardTower;
            BestDealHelper.last_cps = Game.cookiesPs;
            BestDealHelper.loopCount = 0;
        }
    },

    insertAfter: function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    },

    getCpsAcceleration: function (price, cps, newCps) {
        const deltaCps = newCps - cps;
        if (deltaCps === 0) return 0;

        const deltaTime = Math.max(price - Game.cookies, 0) / cps + price / newCps;
        if (deltaTime === 0) return 0; // "Milk selector"

        return deltaCps / deltaTime;
    },

    findBestCpsAcceleration: function (me) {
        // Treat Grandmapocalypse upgrade as 0% temporary
        if (["One mind", "Communal brainsweep", "Elder pact"].includes(me.name)
            || (BestDealHelper.config.ignoreWizardTower && me === Game.Objects["Wizard tower"])
            || me.pool === "toggle"
            || (me.isVaulted && me.isVaulted())
            || Game.cookies === 0
        ) {
            return 0;
        }

        let amount;
        let nextTierUpgrade;
        if (me.type === "upgrade") {
            amount = 1;
        } else {
            // for buildings, find amount to unlock next tier
            const lockedTiers = me.tieredUpgrades.filter(e => Game.Tiers[e.tier].unlock !== -1 && e.buildingTie.bought < Game.Tiers[e.tier].unlock);
            if (lockedTiers.length) {
                amount = Game.Tiers[lockedTiers[0].tier].unlock - me.bought;
                nextTierUpgrade = lockedTiers[0];
            } else {
                amount = 1;
            }
        }
        const oldCps = Game.cookiesPs;
        let totalPrice = 0;
        let buyOneAcc = 0;


        // Backup before emulation
        Game.Logic_ = Game.Logic;
        Game.Logic = function () {};
        const oldCookiesPsRawHighest = Game.cookiesPsRawHighest;
        const oldAmount = me.amount;
        const oldBought = me.bought;

        for (let i = 0; i < amount; i++) {
            totalPrice += me.getPrice();
            me.amount++;
            me.bought++;
            if (i === 0) {
                // record cps after buy 1
                Game.CalculateGains();
                me.buyOneCps = Game.cookiesPs;
                buyOneAcc = BestDealHelper.getCpsAcceleration(totalPrice, oldCps, me.buyOneCps);
            }
        }
        let buyTierAcc = 0;
        me.tierPrice = 0;
        me.buyTierCps = 0;
        if (nextTierUpgrade) {
            totalPrice += nextTierUpgrade.getPrice();
            nextTierUpgrade.bought++;
            Game.CalculateGains();
            me.tierPrice = totalPrice;
            me.buyTierCps = Game.cookiesPs;
            buyTierAcc = BestDealHelper.getCpsAcceleration(totalPrice, oldCps, me.buyTierCps);
        }


        // Restore after emulation
        me.amount = oldAmount;
        me.bought = oldBought;
        if (nextTierUpgrade) nextTierUpgrade.bought--;
        Game.CalculateGains();
        Game.cookiesPsRawHighest = oldCookiesPsRawHighest;
        Game.Logic = Game.Logic_;

        return Math.max(buyOneAcc, buyTierAcc);
    },

    /**
     * @param {(Building|Upgrade)[]} all
     */
    findHelper: function (all) {
        all.forEach(e => e.BestHelper = 0);

        let i = 0;
        let target = all[0];

        function getTimeToTarget(helperPrice, helperCps, targetPrice, cookies) {
            let time = 0;
            if (cookies >= helperPrice) {
                cookies -= helperPrice;
            } else {
                time += (helperPrice - cookies) / Game.cookiesPs;
                cookies = 0;
            }
            time += (targetPrice - cookies) / helperCps;
            return time;
        }

        while (target.price > Game.cookies) {
            target.timeToTargetCookie = (target.price - Game.cookies) / Game.cookiesPs;
            let helpers = all.filter(me => me !== target && me.price < target.price);
            if (!helpers.length) return;

            helpers.forEach(function (me) {
                me.timeToTargetCookie = getTimeToTarget(me.price, me.buyOneCps, target.price, Game.cookies);
                if (me.tierPrice <= target.price) {
                    const timeBuyTier = getTimeToTarget(me.tierPrice, me.buyTierCps, target.price, Game.cookies);
                    me.timeToTargetCookie = Math.min(me.timeToTargetCookie, timeBuyTier);
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
        all.forEach(me => me.cpsAcceleration = BestDealHelper.findBestCpsAcceleration(me));
        // Sorting by cpsAcceleration
        all.sort((a, b) => b.cpsAcceleration - a.cpsAcceleration);

        // If the best cpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
        BestDealHelper.findHelper(all);

        // Determine colors
        let cpsAccList = [...new Set(all.map(e => e.cpsAcceleration))].sort((a, b) => b - a);
        const colorGroups = [
            ["#d82aff", cpsAccList[cpsAccList.length - 1]],
            ["#ff0000", cpsAccList[15]],
            ["#ffd939", cpsAccList[7]],
            ["#00ff00", cpsAccList[1]],
            ["#00ffff", cpsAccList[0]],
        ].filter(e => e[1] !== undefined);
        let color = chroma.scale(colorGroups.map(e => e[0])).mode("lab").domain(colorGroups.map(e => e[1]));

        // Normalized Notation by Mean
        let allAcc = all.map(e => e.cpsAcceleration).filter(e => e !== 0);
        if (allAcc.length === 0) return;
        const avg = allAcc.reduce((a, b) => a + b, 0) / allAcc.length;

        // Calculate waiting times
        all.forEach(function (me) {
            me.waitingTime = "";
            let waitCookie = me.getPrice() - Game.cookies;
            if (waitCookie < 0) return;

            const seconds = waitCookie / Game.cookiesPs;
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
                BestDealHelper.rainbow(span);
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
                BestDealHelper.insertAfter(span, l("productPrice" + me.id));
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
                BestDealHelper.rainbow(span);
            } else {
                try {span.style.color = color(me.cpsAcceleration);} catch (e) { }
            }
        }


        // Sort upgrades & buildings (or leave them as default)
        if (BestDealHelper.config.enableSort) {
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
            let buildUpgrades = document.querySelector("#upgrades");
            let techUpgrades = document.querySelector("#techUpgrades");
            upgrades.forEach(function (upgrade) {
                if (upgrade.pool === "toggle" || upgrade.isVaulted()) return;
                if (upgrade.pool === "tech") {
                    techUpgrades.appendChild(upgrade.l);
                } else {
                    buildUpgrades.appendChild(upgrade.l);
                }
            });
        }

        let buildings_order = buildings.map(e => e.id);
        // Only sort when the order is different
        if (!buildings_order.every((value, index) => value === BestDealHelper.last_buildings_order[index])) {
            let store = document.querySelector("#products");
            for (let i = 0; i < buildings.length; ++i) {
                store.appendChild(buildings[i].l);
            }
            BestDealHelper.last_buildings_order = buildings_order;
        }
    },

    button: function (config, texton, textoff) {
        const name = `BestDealHelper${config}button`;
        const callback = `BestDealHelper.buttonCallback('${config}', '${name}', '${texton}', '${textoff}');`;
        const value = BestDealHelper.config[config];
        return `<a class="${value ? "option" : "option off"}" id="${name}" ${Game.clickStr}="${callback}">${value ? texton : textoff}</a>`;
    },

    "buttonCallback": function (config, button, texton, textoff) {
        const value = !BestDealHelper.config[config];
        BestDealHelper.config[config] = value;
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

