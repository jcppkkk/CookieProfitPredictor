/**
 * @type {function}
 * @param {string} url
 */
var LoadScript = (LoadScript === undefined) ? () => { } : LoadScript;
/**
 * @type {function}
 * @param {string} id
 * @returns {HTMLElement}
 */
var l;
/**
 * @type {function}
 * @param {number} number
 * @param {number} decimalPlaces
 * @returns {string}
 */
var Beautify = (Beautify === undefined) ? () => { } : Beautify;
/**
 * @type {function}
 */
var PlaySound = (PlaySound === undefined) ? () => { } : PlaySound;

/**
 * @typedef Building
 * @type {Object}
 * @property {Element} l
 * @property {function} isVaulted
 * @property {function} getPrice
 * @property {number} amount
 * @property {number} BestChainAmount
 * @property {number} BestCps
 * @property {number} BestCpsAcceleration
 * @property {number} BestHelper
 * @property {number} BestWaitTime
 * @property {number} bought
 * @property {number} id
 * @property {number} locked
 * @property {number} price
 * @property {number} SingleCps
 * @property {number} timeToTargetCookie
 * @property {string} name
 * @property {string} type
 * @property {string} pool
 * @property {string} waitingTime
 * @property {Upgrade[]} tieredUpgrades
 */
/**
 * @typedef Upgrade
 * @type {Object}
 * @property {Element} l
 * @property {function} isVaulted
 * @property {function} getPrice
 * @property {function} isVaulted
 * @property {number} amount
 * @property {number} BestChainAmount
 * @property {number} BestCps
 * @property {number} BestCpsAcceleration
 * @property {number} BestHelper
 * @property {number} BestWaitTime
 * @property {number} bought
 * @property {number} SingleCps
 * @property {number} tier
 * @property {number} timeToTargetCookie
 * @property {Object} Idleverse
 * @property {string} name
 * @property {string} type
 * @property {string} pool
 * @property {string} waitingTime
 * @property {Upgrade[]} tieredUpgrades // not actually used
 * @property {Building} buildingTie
 */
/**
 * @typedef Tier
 * @type {Object}
 * @property {number} unlock
 */
/**
 * @typedef Game
 * @type {Object}
 * @property {function} Logic
 * @property {function} registerMod
 * @property {function} Has
 * @property {function} CalculateGains
 * @property {function} RebuildUpgrades
 * @property {function} RefreshStore
 * @property {function} Win
 * @property {Object[]} cpsAchievements
 * @property {Object} GrandmaSynergies.buildingTie
 * @property {String[]} GrandmaSynergies
 * @property {number} GrandmaSynergies.buildingTie.storedTotalCps
 * @property {Object.<string, Building>} Objects
 * @property {Object.<string,Tier>} Tiers
 * @property {Upgrade[]} UpgradesById
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
 * @property {number} cookiesPsRawHighest
 */
/**
 * @typedef App
 * @type {Object}
 * @property {object} mods
 */
/**
 * @typedef CCSE
 * @type {Object}
 * @property {function} AppendCollapsibleOptionsMenu
 * @property {boolean} isLoaded
 * @property {Object[]} postLoadHooks
 */

/** @type {CCSE} */
var CCSE;
/** @type {App} */
var App;
/** @type {Game} */
var Game;

LoadScript(App.mods.BestDealHelper.dir + "/chroma.min.js");
var BestDealHelper_default_config = {
    enableSort: 1,
    ignoreWizardTower: 0,
    ignoreIdleverse: 0,
    color0: "#00ffff",
    color1: "#00ff00",
    color7: "#ffd939",
    color15: "#ff0000",
    colorLast: "#d82aff",
};

var BestDealHelper = {
    name: "BestDealHelper",
    isLoaded: false,
    load_chroma: false,
    loopCount: 0,
    last_cps: 0,
    last_buildings_order: [],
    Upgrades: new Map(),

    register: function () {
        Game.registerMod(this.name, this);
    },

    init: function () {
        // iterable Updates
        const buildMap = (/** @type {Upgrade[]} */ obj) => Object.keys(obj).reduce((map, key) => map.set(key, obj[key]), new Map());
        BestDealHelper.Upgrades = buildMap(Game.UpgradesById);
        // UI: add menu
        Game.customOptionsMenu.push(BestDealHelper.addOptionsMenu);
        // UI: change building layout
        [...document.styleSheets[1].cssRules].forEach(function (e) {
            if (e instanceof CSSStyleRule) {
                if (e.selectorText === ".product .content") {
                    e.style.paddingTop = "0px";
                } else if (e.selectorText === ".price::before") {
                    e.style.top = "0px";
                }

            }
        });

        // Hook: wrap Game.RebuildUpgrades
        var OriginalRebuildUpgrades = Game.RebuildUpgrades;
        Game.RebuildUpgrades = function () { OriginalRebuildUpgrades(); BestDealHelper.logicLoop(); };
        // Hook: wrap Game.RefreshStore
        var OriginalRefreshStore = Game.RefreshStore;
        Game.RefreshStore = function () { OriginalRefreshStore(); BestDealHelper.logicLoop(); };
        // Check changes from time to time
        setTimeout(function () {
            setInterval(BestDealHelper.logicLoop, 100);
        }, 500);
        BestDealHelper.isLoaded = true;
    },

    config: { ...BestDealHelper_default_config },
    last_config: { ...BestDealHelper_default_config },

    load: function (/** @type {string} */ str) {
        const config = JSON.parse(str);
        for (const c in config) BestDealHelper.config[c] = config[c];
        BestDealHelper.sortDeals();
    },

    save: function () {
        return JSON.stringify(BestDealHelper.config);
    },

    logicLoop: function () {
        BestDealHelper.loopCount++;
        if (BestDealHelper.loopCount >= 10 ||
            BestDealHelper.last_cps !== Game.cookiesPs ||
            JSON.stringify(BestDealHelper.config) !== JSON.stringify(BestDealHelper.last_config) ||
            !document.querySelector("#productAcc0") ||
            (document.querySelector("#upgrade0") && !document.querySelector("#upgradeAcc0"))
        ) {
            BestDealHelper.sortDeals();
            BestDealHelper.last_config = { ...BestDealHelper.config };
            BestDealHelper.last_cps = Game.cookiesPs;
            BestDealHelper.loopCount = 0;
        }
    },

    insertAfter: function (
        /** @type {any} */ newNode,
        /** @type {any} */ referenceNode
    ) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    },

    calcCookieTimesCost: function (
        /** @type {number} */ price,
        /** @type {number} */ oldCps,
        /** @type {number} */ cookies,
        /** @type {number} */ waitTime,
        /** @type {any} */ simCost
    ) {
        if (cookies >= price)
            return [cookies - price, waitTime, simCost + price];
        else
            return [0, waitTime + (price - cookies) / oldCps, simCost + cookies];
    },

    updateBestCpsAcceleration: function (/** @type {(Building|Upgrade)} */ me) {
        // Treat Grandmapocalypse upgrade as 0% temporary
        if (["Milk selector", "One mind", "Communal brainsweep", "Elder pact"].includes(me.name) ||
            (BestDealHelper.config.ignoreWizardTower && me === Game.Objects["Wizard tower"]) ||
            (BestDealHelper.config.ignoreIdleverse && me === Game.Objects.Idleverse) ||
            me.pool === "toggle" ||
            (me.isVaulted && me.isVaulted()) ||
            Game.cookies === 0
        ) {
            me.BestCpsAcceleration = 0;
            return;
        }

        let amount = 1;
        let nextTierUpgrade;
        if (me.type !== "upgrade") {
            // for buildings, find amount to unlock next tier
            const lockedTiers = me.tieredUpgrades.filter((e) => Game.Tiers[e.tier].unlock !== -1 && e.buildingTie.bought < Game.Tiers[e.tier].unlock);
            if (lockedTiers.length) {
                const amountToUnlockTier = Game.Tiers[lockedTiers[0].tier].unlock - me.bought;
                if (amountToUnlockTier < 15) {
                    amount = amountToUnlockTier;
                    nextTierUpgrade = lockedTiers[0];
                }
            }
        }
        const oldCps = Game.cookiesPs;
        let simCookies = Game.cookies;
        let simWaitTime = 0;
        let simCost = 0;

        // Backup before emulation
        const oldLogic = Game.Logic;
        Game.Logic = function () { };
        const oldWin = Game.Win;
        Game.Win = function () { };
        Game.cpsAchievements = [];
        const oldCookiesPsRawHighest = Game.cookiesPsRawHighest;
        const oldCpsAchievements = Game.cpsAchievements;
        const oldAmount = me.amount;
        const oldBought = me.bought;

        for (let i = 0; i < amount; i++) {
            [simCookies, simWaitTime, simCost] = BestDealHelper.calcCookieTimesCost(me.getPrice(), Game.cookiesPs, simCookies, simWaitTime, simCost);
            me.amount++;
            me.bought++;
            if (i === 0) {
                // record cps after buy 1
                Game.CalculateGains();
                me.BestChainAmount = 0;
                me.BestWaitTime = (simWaitTime + simCost / Game.cookiesPs);
                me.SingleCps = Game.cookiesPs;
                me.BestCps = Game.cookiesPs;
                me.BestCpsAcceleration = (Game.cookiesPs - oldCps) / me.BestWaitTime;
            }
        }
        // Evaluate multiple upgrades with tier unlock
        if (nextTierUpgrade) {
            [simCookies, simWaitTime, simCost] = BestDealHelper.calcCookieTimesCost(nextTierUpgrade.getPrice(), Game.cookiesPs, simCookies, simWaitTime, simCost);
            nextTierUpgrade.bought++;
            Game.CalculateGains();
            let tierChainAmount = me.amount;
            let tierWaitTime = (simWaitTime + simCost / Game.cookiesPs);
            let tierCps = Game.cookiesPs;
            let tierCpsAcceleration = (Game.cookiesPs - oldCps) / tierWaitTime;
            // Evaluate CpsAcc with more buildings after TierUpgrade
            while (true) {
                [simCookies, simWaitTime, simCost] = BestDealHelper.calcCookieTimesCost(me.getPrice(), Game.cookiesPs, simCookies, simWaitTime, simCost);
                me.amount++;
                me.bought++;
                Game.CalculateGains();
                let nextChainAmount = me.amount;
                let nextWaitTime = (simWaitTime + simCost / Game.cookiesPs);
                let nextCps = Game.cookiesPs;
                let nextCpsAcceleration = (Game.cookiesPs - oldCps) / nextWaitTime;
                if (nextCpsAcceleration > tierCpsAcceleration) {
                    tierChainAmount = nextChainAmount;
                    tierWaitTime = nextWaitTime;
                    tierCps = nextCps;
                    tierCpsAcceleration = nextCpsAcceleration;
                } else {
                    break;
                }
            }
            if (tierCpsAcceleration > me.BestCpsAcceleration) {
                me.BestChainAmount = tierChainAmount;
                me.BestWaitTime = tierWaitTime;
                me.BestCps = tierCps;
                me.BestCpsAcceleration = tierCpsAcceleration;
            }
        }

        // Restore after emulation
        if (nextTierUpgrade) nextTierUpgrade.bought--;
        me.amount = oldAmount;
        me.bought = oldBought;
        Game.cookiesPsRawHighest = oldCookiesPsRawHighest;
        Game.cpsAchievements = oldCpsAchievements;
        Game.Win = oldWin;
        Game.Logic = oldLogic;
        Game.CalculateGains();
    },

    /**
     * If the best BestCpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
     */
    findHelper: function (
        /** @type {(Building | Upgrade)[]} */ all
    ) {
        all.forEach(e => e.BestHelper = 0);

        let i = 0;
        let target = all[0];

        while (target.getPrice() > Game.cookies) {
            target.timeToTargetCookie = (target.getPrice() - Game.cookies) / Game.cookiesPs;
            /** @type {(Building | Upgrade)[]} */
            let helpers = [];
            for (let e of all) {
                if (e !== target && e.getPrice() < target.getPrice() && e.SingleCps != 0) {
                    helpers.push(e);
                }
            }
            if (!helpers.length) return;
            for (let me of helpers) {
                me.timeToTargetCookie = Math.max(0, me.getPrice() - Game.cookies) / Game.cookiesPs +
                    (target.getPrice() - Math.max(0, Game.cookies - me.getPrice())) / me.SingleCps;
            }
            helpers.sort((a, b) => a.timeToTargetCookie - b.timeToTargetCookie);
            if (helpers[0].timeToTargetCookie >= target.timeToTargetCookie) return;
            i++;
            helpers[0].BestHelper = i;
            target = helpers[0];
        }
    },

    rainbow: function (
        /** @type {HTMLSpanElement} */ span
    ) {
        let text = span.innerText;
        span.innerHTML = "";
        for (let i = 0; i < text.length; i++) {
            let charElem = document.createElement("span");
            charElem.style.color = "hsl(" + (360 * i / text.length) + ",90%,80%)";
            charElem.innerHTML = text[i];
            span.appendChild(charElem);
        }
    },
    calcWaitingTime: function (
        /** @type {(Building|Upgrade)}*/ me
    ) {
        let waitCookie = me.getPrice() - Game.cookies;
        if (waitCookie < 0) return "";

        const seconds = waitCookie / Game.cookiesPs;
        let a = [
            Math.floor(seconds / 60 / 60 / 24 / 365) + "y",
            Math.floor(seconds / 60 / 60 / 24 % 365) + "d",
            Math.floor(seconds / 60 / 60 % 24) + "h",
            Math.floor(seconds / 60 % 60) + "m",
            Math.floor(seconds % 60) + "s"];
        while (a.length && ["0y", "0d", "0m", "0h"].includes(a[0])) a.shift();
        if (Math.floor(seconds / 60 / 60 / 24 / 365) > 100) {
            return ">100y";
        } else {
            return a.slice(0, 2).join();
        }
    },

    sortDeals: function () {
        // 2 locked buildings will shows on list, so they are included in the sort, too.
        let enabledBuildings = Game.ObjectsById.map(e => +!e.locked).reduce((a, b) => a + b) + 2;
        let buildings = [...Game.ObjectsById].filter(o => o.id < enabledBuildings);
        let upgrades = [...Game.UpgradesInStore];
        let all = [...buildings, ...upgrades];

        // Calculate BestCpsAcceleration
        for (let me of all) BestDealHelper.updateBestCpsAcceleration(me);
        // Sorting by BestCpsAcceleration
        all.sort((a, b) => b.BestCpsAcceleration - a.BestCpsAcceleration);

        // If the best BestCpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
        BestDealHelper.findHelper(all);

        // Determine colors
        let cpsAccList = [...new Set(all.map(e => e.BestCpsAcceleration))].sort((a, b) => b - a);
        const colorGroups = [
            [BestDealHelper.config.colorLast, cpsAccList[cpsAccList.length - 1]],
            [BestDealHelper.config.color15, cpsAccList[15]],
            [BestDealHelper.config.color7, cpsAccList[7]],
            [BestDealHelper.config.color1, cpsAccList[1]],
            [BestDealHelper.config.color0, cpsAccList[0]],
        ].filter(e => e[1] !== undefined);

        // @ts-ignore
        let color = chroma.scale(colorGroups.map(e => e[0])).mode("lab").domain(colorGroups.map(e => e[1]));

        // Normalized Notation by Mean
        let allAcc = all.map(e => e.BestCpsAcceleration).filter(e => e !== 0);
        if (allAcc.length === 0) return;
        const avg = allAcc.reduce((a, b) => a + b, 0) / allAcc.length;

        // Calculate waiting times
        all.forEach(me => me.waitingTime = BestDealHelper.calcWaitingTime(me));

        // Notation for upgrades
        for (const i in upgrades) {
            let me = upgrades[i];
            me.l = document.querySelector("#upgrade" + i);
            /** @type {HTMLSpanElement} */
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
            if (me.BestCpsAcceleration === 0) {
                span.textContent = "";
                continue;
            }
            span.textContent = Beautify(me.BestCpsAcceleration * 100 / avg, 1) + "%";
            if (me.waitingTime) span.innerHTML = me.waitingTime + "<br>" + span.textContent;
            if (me.BestHelper) {
                BestDealHelper.rainbow(span);
            } else {
                try { span.style.color = color(me.BestCpsAcceleration); } catch (e) { }
            }
        }
        // Notation for buildings
        for (const i in buildings) {
            let me = buildings[i];
            /** @type {HTMLSpanElement} */
            let span = document.querySelector("#productAcc" + me.id);
            if (!span) {
                span = document.createElement("span");
                span.id = "productAcc" + me.id;
                span.style.fontWeight = "bolder";
                span.style.display = "block";
                BestDealHelper.insertAfter(span, l("productPrice" + me.id));
            }

            // Text
            if (me.BestCpsAcceleration === 0) {
                span.textContent = "";
                continue;
            }
            // Auto increase decimalPlaces for small number
            let value;
            for (let i = 0; i < 20; i++) {
                value = Beautify(me.BestCpsAcceleration * 100 / avg, i);
                if (value !== "0") {
                    value = Beautify(me.BestCpsAcceleration * 100 / avg, i + 1);
                    break;
                }
            }
            span.textContent = " 💹" + value + "%";
            if (me.BestChainAmount > 1) {
                span.textContent += " (buy to " + me.BestChainAmount + ")";
            }
            if (me.waitingTime) span.textContent += " ⏳" + me.waitingTime;
            if (me.BestHelper) {
                BestDealHelper.rainbow(span);
            } else {
                try { span.style.color = color(me.BestCpsAcceleration); } catch (e) { }
            }
        }


        // Sort upgrades & buildings (or leave them as default)
        if (BestDealHelper.config.enableSort) {
            upgrades.sort(function (a, b) {
                if (b.BestHelper !== a.BestHelper) {
                    return b.BestHelper - a.BestHelper;
                } else {
                    return b.BestCpsAcceleration - a.BestCpsAcceleration;
                }
            });
            buildings.sort(function (a, b) {
                if (b.BestHelper !== a.BestHelper) {
                    return b.BestHelper - a.BestHelper;
                } else {
                    return b.BestCpsAcceleration - a.BestCpsAcceleration;
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

    addOptionsMenu: function () {
        const body = `
        <div class="listing">
            ${BestDealHelper.button("enableSort", "Sort Buildings and Upgrades ON", "Sort Buildings and Upgrades OFF")}
        </div> <div class="listing">
            ${BestDealHelper.button("ignoreWizardTower", "Ignore Wizard Tower ON", "Ignore Wizard Tower OFF")}
        </div> <div class="listing">
            ${BestDealHelper.button("ignoreIdleverse", "Ignore Idleverse ON", "Ignore Idleverse OFF")}
        </div> <div class="listing">
            ${BestDealHelper.colorPicker("color0", "Best deal color")}
        </div> <div class="listing">
            ${BestDealHelper.colorPicker("color1", "2nd deal color")}
        </div> <div class="listing">
            ${BestDealHelper.colorPicker("color7", "8st deal color")}
        </div> <div class="listing">
            ${BestDealHelper.colorPicker("color15", "16st deal color")}
        </div> <div class="listing">
            ${BestDealHelper.colorPicker("colorLast", "Worst deal color")}
        </div>`;

        CCSE.AppendCollapsibleOptionsMenu(BestDealHelper.name, body);
    },

    button: function (
        /** @type {string | number} */ config,
        /** @type {any} */ textOn,
        /** @type {any} */ textOff
    ) {
        const name = `BestDealHelper${config}Button`;
        const callback = `BestDealHelper.buttonCallback('${config}', '${name}', '${textOn}', '${textOff}');`;
        const value = BestDealHelper.config[config];
        return `<a class="${value ? "option" : "option off"}" id="${name}" ${Game.clickStr}="${callback}">${value ? textOn : textOff}</a>`;
    },

    buttonCallback: function (
        /** @type {string | number} */ config,
        /** @type {any} */ button,
        /** @type {any} */ textOn,
        /** @type {any} */ textOff
    ) {
        const value = !BestDealHelper.config[config];
        BestDealHelper.config[config] = value;
        l(button).innerHTML = value ? textOn : textOff;
        l(button).className = value ? "option" : "option off";
        PlaySound("snd/tick.mp3");
    },

    colorPicker: function (
        /** @type {string} */ config,
        /** @type {string} */ text
    ) {
        const name = `BestDealHelper${config}Picker`;
        const callback = `BestDealHelper.colorPickerCallback('${config}', '${name}');`;
        const defaultColor = BestDealHelper_default_config[config];
        const reset = `BestDealHelper.config.${config}='${defaultColor}';l('${name}').value='${defaultColor}';`;
        const value = BestDealHelper.config[config];
        return `<input type="color" id="${name}" value=${value} oninput="${callback}"><label>${text}</label><a class="option" ${Game.clickStr}="${reset}">Reset</a>`;
    },

    colorPickerCallback: function (
        /** @type {string} */ config,
        /** @type {string} */ pickerID
    ) {
        const value = l(pickerID).value;
        BestDealHelper.config[config] = value;
    }
};

// Bind methods`
const methods = Object.getOwnPropertyNames(BestDealHelper).filter(
    m => typeof BestDealHelper[m] === "function"
);
for (var func of methods) {
    BestDealHelper[func] = BestDealHelper[func].bind(BestDealHelper);

}

// Load mod
if (!BestDealHelper.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        BestDealHelper.register();
    } else {
        if (!CCSE) {
            // @ts-ignore
            var CCSE = {}; // use var here, or it may cause loading error
        }
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(BestDealHelper.register);
    }
}
