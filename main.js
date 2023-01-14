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
 * @property {HTMLElement} l
 * @property {function} buy
 * @property {function} isVaulted
 * @property {function} getPrice
 * @property {number} amount
 * @property {number} BestBuyToAmount
 * @property {number} BestCpsAcceleration
 * @property {number} BestHelperOrder
 * @property {number} BestHelperAmount
 * @property {number} BestWaitTime
 * @property {number} bought
 * @property {number} id
 * @property {number} locked
 * @property {number} price
 * @property {number} SingleCps
 * @property {number} timeToTargetCookie
 * @property {string} name
 * @property {string} dname
 * @property {string} type
 * @property {string} pool
 * @property {string} waitingTime
 * @property {Upgrade[]} tieredUpgrades
 */
/**
 * @typedef Upgrade
 * @type {object}
 * @property {HTMLElement} l
 * @property {function} buy
 * @property {function} isVaulted
 * @property {function} getPrice
 * @property {number} amount
 * @property {number} BestBuyToAmount
 * @property {number} BestCpsAcceleration
 * @property {number} BestHelperOrder
 * @property {number} BestHelperAmount
 * @property {number} BestWaitTime
 * @property {number} bought
 * @property {number} id
 * @property {number} SingleCps
 * @property {number} tier
 * @property {number} timeToTargetCookie
 * @property {string} name
 * @property {string} dname
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
 * @property {Array} customOptionsMenu
 * @property {Array} Upgrades
 * @property {Array} customStatsMenu
 * @property {Building[]} ObjectsById
 * @property {function} CalculateGains
 * @property {function} ClickProduct
 * @property {function} Has
 * @property {function} Logic
 * @property {function} RebuildUpgrades
 * @property {function} RefreshStore
 * @property {function} registerMod
 * @property {function} Upgrade
 * @property {function} Win
 * @property {number} buyMode
 * @property {number} cookies
 * @property {number} cookiesPs
 * @property {number} cookiesPsRaw
 * @property {number} cookiesPsRawHighest
 * @property {number} globalCpsMult
 * @property {number} GrandmaSynergies.buildingTie.storedTotalCps
 * @property {number} storedCps
 * @property {number} unbuffedCps
 * @property {Object.<string, Building>} Objects
 * @property {Object.<string,Tier>} Tiers
 * @property {Object[]} CpsAchievements
 * @property {Object} GrandmaSynergies.buildingTie
 * @property {String[]} GrandmaSynergies
 * @property {string} clickStr
 * @property {string} pool
 * @property {Upgrade[]} UpgradesById
 * @property {Upgrade[]} UpgradesInStore
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
 * @property {function} AppendStatsVersionNumber
 * @property {boolean} isLoaded
 * @property {Object[]} postLoadHooks
 */
/**
 * @typedef SandBoxData
 * @type {Object}
 * @property {Building | Upgrade} item
 * @property {number} amount
 * @property {number} bought
 * @property {function} Logic
 * @property {function} Win
 * @property {number} cookiesPsRawHighest
 * @property {any[]} CpsAchievements
 */
/**
 * @typedef SimulateStatus
 * @type {Object}
 * @property {number} originalCookies
 * @property {number} currentCookies
 * @property {number} paidCookies
 * @property {number} waitTime
 */

/** @type {CCSE} */
var CCSE;
/** @type {App} */
var App;
/** @type {Game} */
var Game;

LoadScript(App.mods.BestDealHelper.dir + "/chroma.min.js");

var PRM = {
    displayname: "Payback Rate Mod",
    name: "Best Deal Helper", // the original name of the mod, keep for save compatibility
    version: "2048.07",
    isLoaded: false,
    load_chroma: false,
    loopCount: 0,
    last_cps: 0,
    Upgrades: new Map(),
    default_config: {
        enableSort: 1,
        sortGrandmapocalypse: 1,
        sortWizardTower: 1,
        color0: "#00ffff",
        color1: "#00ff00",
        color7: "#ffd939",
        color15: "#ff4d4d",
        colorLast: "#de4dff",
        isBanking: 0,
        bankingSeconds: 0,
        updateMS: 1000,
    },

    register: function () {
        Game.registerMod(this.name, this);
    },

    init: function () {
        // iterable Updates
        const buildMap = (/** @type {Upgrade[]} */ obj) => Object.keys(obj).reduce((map, key) => map.set(key, obj[key]), new Map());
        PRM.Upgrades = buildMap(Game.UpgradesById);

        // UI: add Version to status page
        Game.customStatsMenu.push(function () {
            CCSE.AppendStatsVersionNumber(PRM.displayname, PRM.version);
        });

        // UI: add menu to config page
        Game.customOptionsMenu.push(PRM.addOptionsMenu);

        // UI: adjust building layout
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
        Game.RebuildUpgrades = function () {
            OriginalRebuildUpgrades();
            PRM.mainLoop();
        };

        // Hook: wrap Game.RefreshStore
        var OriginalRefreshStore = Game.RefreshStore;
        Game.RefreshStore = function () {
            OriginalRefreshStore();
            PRM.mainLoop();
        };

        // Hook: wrap Game.ClickProduct
        Game.ClickProduct = function (/** @type {Number} */ what) {
            if (!Game.ObjectsById[what].waitingTime || Game.buyMode == -1)
                Game.ObjectsById[what].buy();
        };

        // Hook: wrap Upgrade click
        Game.Upgrade.prototype.click2 = Game.Upgrade.prototype.click;
        Game.Upgrade.prototype.click = function (/** @type {any}*/e) {
            if (this.waitingTime && this.BestCpsAcceleration)
                return;
            else
                return this.click2(e);
        };
        // Check changes from time to time
        setTimeout(function () {
            setTimeout(PRM.tick, PRM.config.updateMS / 10);
        }, 500);

        PRM.config = { ...PRM.default_config};
        PRM.last_config = { ...PRM.default_config };
        PRM.isLoaded = true;
    },

    load: function (/** @type {string} */ str) {
        const config = JSON.parse(str);
        for (const c in config) {
            if (PRM.config.hasOwnProperty(c)) {
                PRM.config[c] = config[c];
            }
        }
        PRM.updateUI();
    },

    save: function () {
        return JSON.stringify(PRM.config);
    },

    tick: function () {
        PRM.loopCount++;
        PRM.mainLoop();
        setTimeout(PRM.tick, PRM.config.updateMS / 10);
    },

    mainLoop: function () {
        if (PRM.loopCount >= 10 ||
            PRM.last_cps !== Game.cookiesPs ||
            !document.querySelector("#productAcc0") ||
            (l("upgrade0") && !l("upgradeAcc0")) ||
            JSON.stringify(PRM.config) !== JSON.stringify(PRM.last_config)
        ) {
            PRM.updateUI();
            PRM.last_config = { ...PRM.config };
            PRM.last_cps = Game.cookiesPs;
            PRM.loopCount = 0;
        }
    },

    insertAfter: function (
        /** @type {any} */ newNode,
        /** @type {any} */ referenceNode
    ) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    },

    getBankCookies: function (){
        return PRM.config.isBanking * PRM.config.bankingSeconds * Game.cookiesPsRaw;
    },

    calcCookieTimesCost: function (
        /** @type {number} */ price,
        /** @type {number} */ oldCps,
        /** @type {SimulateStatus} */ sim
    ) {
        const bank = PRM.getBankCookies();
        if (sim.currentCookies >= (price + bank)) {
            sim.paidCookies += price;
            sim.currentCookies -= price;
        } else if (sim.currentCookies < (price + bank) && sim.currentCookies >= bank) {
            sim.waitTime += (price + bank - sim.currentCookies) / oldCps;
            sim.paidCookies += sim.currentCookies - bank;
            sim.currentCookies = bank;
        } else {
            sim.waitTime += (price + bank - sim.currentCookies) / oldCps;
            sim.currentCookies = bank;
        }
    },

    isIgnored: function (/** @type {(Building|Upgrade)} */ me) {
        return (
            (!PRM.config.sortGrandmapocalypse && ["One mind", "Communal brainsweep", "Elder Pact"].includes(me.name)) ||
            (!PRM.config.sortWizardTower && me.name == "Wizard tower") ||
            me.pool === "toggle" ||
            (me.isVaulted && me.isVaulted())
        );
    },

    enterSandBox: function (/** @type {(Building|Upgrade)} */me) {
        let /** @type {SandBoxData} */ save = {
            item: me,
            amount: me.amount,
            bought: me.bought,
            Logic: Game.Logic,
            Win: Game.Win,
            cookiesPsRawHighest: Game.cookiesPsRawHighest,
            CpsAchievements: Game.CpsAchievements
        };
        Game.Logic = function () { };
        Game.Win = function () { };
        return save;
    },

    leaveSandBox: function (/** @type {SandBoxData} */ save) {
        save.item.amount = save.amount;
        save.item.bought = save.bought;
        Game.CpsAchievements = save.CpsAchievements;
        Game.cookiesPsRawHighest = save.cookiesPsRawHighest;
        Game.Win = save.Win;
        Game.Logic = save.Logic;
        Game.CalculateGains();
    },

    initSimData: function () {
        var /** @type {SimulateStatus} */ sim = {
            originalCookies: Game.cookies,
            currentCookies: Game.cookies,
            paidCookies: 0,
            waitTime: 0,
        };
        return sim;
    },

    updateBestCpsAcceleration: function (/** @type {(Building|Upgrade)} */ me) {
        me.BestCpsAcceleration = 0;
        me.BestBuyToAmount = 0;
        me.BestWaitTime = Infinity;

        // Treat Grandmapocalypse upgrade as 0% temporary
        if (PRM.isIgnored(me) || Game.cookies === 0) return;

        const oldCps = Game.unbuffedCps;
        var /** @type {SimulateStatus} */ sim = PRM.initSimData();

        const save = PRM.enterSandBox(me);

        if (me.type == "upgrade") {
            // Simulate upgrade
            PRM.calcCookieTimesCost(me.getPrice(), Game.unbuffedCps, sim);
            me.amount++;
            me.bought++;
            Game.CalculateGains();
            me.BestWaitTime = sim.waitTime + sim.paidCookies / Game.unbuffedCps;
            me.BestCpsAcceleration = (Game.unbuffedCps - oldCps) / me.BestWaitTime;
        } else {
            // for buildings, find amount to unlock next tier
            let nextTierUpgrade = null;
            let amountToUnlockTier = 0;
            const lockedTiers = Object.values(me.tieredUpgrades).filter((e) => Game.Tiers[e.tier].unlock !== -1 && e.buildingTie.bought < Game.Tiers[e.tier].unlock);
            if (lockedTiers.length) {
                amountToUnlockTier = Game.Tiers[lockedTiers[0].tier].unlock;
                if (amountToUnlockTier <= me.bought + 15) {
                    nextTierUpgrade = lockedTiers[0];
                }
            }

            for (var buy = 0; buy < 50; buy++) {
                PRM.calcCookieTimesCost(me.getPrice(), Game.unbuffedCps, sim);
                me.amount++;
                me.bought++;
                Game.CalculateGains();
                if (nextTierUpgrade && me.amount == amountToUnlockTier) {
                    PRM.calcCookieTimesCost(nextTierUpgrade.getPrice(), Game.unbuffedCps, sim);
                    nextTierUpgrade.bought = 1;
                    Game.CalculateGains();
                }
                const waitTime = sim.waitTime + sim.paidCookies / Game.unbuffedCps;
                const cpsAcceleration = (Game.unbuffedCps - oldCps) / waitTime;
                if (cpsAcceleration > me.BestCpsAcceleration) {
                    me.BestCpsAcceleration = cpsAcceleration;
                    me.BestBuyToAmount = me.amount;
                    me.BestWaitTime = waitTime;
                } else if (nextTierUpgrade === null || me.amount > amountToUnlockTier) {
                    // if get CpsAcceleration worse & no pending tier upgrade, stop trying further
                    break;
                }
            }
            if (nextTierUpgrade) nextTierUpgrade.bought = 0;
        }
        PRM.leaveSandBox(save);
    },

    /**
     * If the best BestCpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
     */
    updateHelperOrder: function (/** @type {(Building | Upgrade)[]} */ all) {
        all.forEach(e => e.BestHelperOrder = 0);
        all = all.filter(e => !PRM.isIgnored(e));

        let helperOrder = 0;
        let target = all[0];

        while (target.getPrice() > Game.cookies) {
            target.timeToTargetCookie = (target.getPrice() - Game.cookies) / Game.unbuffedCps;
            /** @type {(Building | Upgrade)[]} */
            let helpers = [];
            for (let e of all) {
                if (e !== target && e.getPrice() < target.getPrice() && e.SingleCps != 0) {
                    helpers.push(e);
                }
            }
            if (!helpers.length) return;
            for (let me of helpers) {
                const save = PRM.enterSandBox(me);

                let /** @type {SimulateStatus} */ sim = PRM.initSimData();

                me.timeToTargetCookie = Infinity;
                for (var buy = 1; buy < Infinity; buy++) {
                    PRM.calcCookieTimesCost(me.getPrice(), Game.unbuffedCps, sim);
                    me.amount++;
                    me.bought++;
                    Game.CalculateGains();
                    // Calculate time to target with current deal stack
                    let simTarget = Object.assign({}, sim);
                    PRM.calcCookieTimesCost(target.getPrice(), Game.unbuffedCps, simTarget);
                    if (simTarget.waitTime >= target.timeToTargetCookie || simTarget.waitTime >= me.timeToTargetCookie) {
                        break;
                    } else {
                        me.timeToTargetCookie = simTarget.waitTime;
                        me.BestHelperAmount = me.amount;
                    }
                    // Skip calculate buying upgrade multiple times
                    if (me.type == "upgrade") break;
                }

                PRM.leaveSandBox(save);
            }

            helpers.sort((a, b) => a.timeToTargetCookie - b.timeToTargetCookie);
            if (helpers[0].timeToTargetCookie >= target.timeToTargetCookie) return;
            helperOrder++;
            helpers[0].BestHelperOrder = helperOrder;
            target = helpers[0];
        }
    },

    colorSpanInRainbow: function (/** @type {HTMLSpanElement} */ span) {
        let text = span.innerText;
        span.innerHTML = "";
        for (let i = 0; i < text.length; i++) {
            let charElem = document.createElement("span");
            charElem.style.color = "hsl(" + (360 * i / text.length) + ",90%,80%)";
            charElem.innerHTML = text[i];
            span.appendChild(charElem);
        }
    },

    colorSpanByValue: function (
        /** @type {HTMLSpanElement} */ span,
        /** @type {number} */ value
    ) {
        try {
            span.style.color = PRM.colorRender(value);
        } catch (e) { }
    },

    updateColorRender: function (
        /** @type {(Building|Upgrade)[]} */all
    ) {
        let cpsAccList = [...new Set(all.map(e => e.BestCpsAcceleration))].sort((a, b) => b - a);
        const colorGroups = [
            [PRM.config.colorLast, cpsAccList[cpsAccList.length - 1]],
            [PRM.config.color15, cpsAccList[15]],
            [PRM.config.color7, cpsAccList[7]],
            [PRM.config.color1, cpsAccList[1]],
            [PRM.config.color0, cpsAccList[0]],
        ].filter(e => e[1] !== undefined);
        // @ts-ignore
        PRM.colorRender = chroma.scale(colorGroups.map(e => e[0])).mode("lab").domain(colorGroups.map(e => e[1]));
    },


    calcWaitingTime: function (
        /** @type {(Building|Upgrade)}*/ me
        ) {
            const bank = PRM.getBankCookies();
        let waitCookie = me.getPrice() + bank - Game.cookies;
        if (waitCookie < 0) return "";

        const seconds = waitCookie / Game.cookiesPs;
        let a = [
            Math.floor(seconds / 60 / 60 / 24 / 30 / 12) + "y",
            Math.floor(seconds / 60 / 60 / 24 / 30 % 12) + "m",
            Math.floor(seconds / 60 / 60 / 24 % 30) + "d",
            Math.floor(seconds / 60 / 60 % 24) + "H",
            Math.floor(seconds / 60 % 60) + "M",
            Math.floor(seconds % 60) + "S"];
        while (a.length && ["0y", "0m", "0d", "0H", "0M"].includes(a[0])) a.shift();
        if (Math.floor(seconds / 60 / 60 / 24 / 30 / 12) > 1000) {
            return ">1000y";
        } else {
            return a.slice(0, 2).join();
        }
    },

    updateNotation: function (
        /** @type {(Building | Upgrade)} */ me,
        /** @type {number} */ avgAcc
    ) {
        me.waitingTime = PRM.calcWaitingTime(me);
        if (me.type == "upgrade") { /* Upgrade */
            // @ts-ignore
            var inStoreId = Game.UpgradesInStore.indexOf(me);
            me.l = l("upgrade" + inStoreId);
            // initialize span tag
            /** @type {HTMLSpanElement} */
            let span = document.querySelector("#upgradeAcc" + me.id);
            if (!span) {
                span = document.createElement("span");
                span.id = "upgradeAcc" + me.id;
                span.style.fontWeight = "bolder";
                span.style.position = "absolute";
                span.style.bottom = "0px";
                span.style.textShadow = "0px 2px 6px #000, 0px 1px 1px #000";
                span.style.fontSize = "0.7em";
                span.style.transform = "scale(1, 1.4) translate(3%, -13%)";
                span.style.display = "block";
                span.style.zIndex = "20";
                me.l.appendChild(span);
            }

            // Text
            if (me.BestCpsAcceleration === 0) {
                span.textContent = "";
            } else {
                span.textContent = Beautify(me.BestCpsAcceleration * 100 / avgAcc, 1) + "%";
                if (me.waitingTime) {
                    span.innerHTML = me.waitingTime + "<br>" + span.textContent;
                }
                if (me.waitingTime && Game.cookies >= me.getPrice()) {
                    me.l.style.opacity = "0.6";
                } else {
                    me.l.style.removeProperty("opacity");
                }
                if (me.BestHelperOrder) {
                    PRM.colorSpanInRainbow(span);
                } else {
                    PRM.colorSpanByValue(span, me.BestCpsAcceleration);
                }
            }

        } else { /* Building */
            // initialize span tag
            /** @type {HTMLSpanElement} */
            let span = document.querySelector("#productAcc" + me.id);
            if (!span) {
                span = document.createElement("span");
                span.id = "productAcc" + me.id;
                span.style.fontWeight = "bolder";
                span.style.display = "block";
                span.style.filter = "contrast(1.5)";
                PRM.insertAfter(span, l("productPrice" + me.id));
            }

            // Text
            if (me.BestCpsAcceleration === 0) {
                span.textContent = "";
            } else {
                // Auto increase decimalPlaces for small number
                let value;
                for (let i = 1; i < 20; i++) {
                    value = Beautify(me.BestCpsAcceleration * 100 / avgAcc, i);
                    if (value !== "0") {
                        break;
                    }
                }
                span.textContent = " 💹" + value + "%";
                if (me.BestHelperOrder) {
                    if (me.BestHelperAmount > me.amount + 1) {
                        span.textContent += " (to " + me.BestHelperAmount + ")";
                    }
                } else if (me.BestBuyToAmount > me.amount + 1) {
                    span.textContent += " (to " + me.BestBuyToAmount + ")";
                }
                if (me.waitingTime) {
                    span.textContent += " ⏳" + me.waitingTime;
                }
                if (me.waitingTime && Game.cookies >= me.getPrice()) {
                    me.l.style.opacity = "0.6";
                } else {
                    me.l.style.removeProperty("opacity");
                }
                if (me.BestHelperOrder) {
                    PRM.colorSpanInRainbow(span);
                } else {
                    PRM.colorSpanByValue(span, me.BestCpsAcceleration);
                }
            }
        }


    },

    arrayCommonInTheSameOrder: function (
        /** @type {*[]}*/ a,
        /** @type {*[]}*/ b
    ) {
        a = a.filter(e => b.includes(e));
        b = b.filter(e => a.includes(e));
        return a.every((value, index) => value === b[index]);
    },

    reorderUpgrades: function (/** @type {(Upgrade)[]} */ upgrades) {
        upgrades = upgrades.filter(e => !e.isVaulted() && e.pool !== "toggle");
        let upgrades_order = upgrades.map(e => e.l.id);
        let upgrades_order_on_page = [...document.querySelectorAll(".upgrade")].map(e => e.id).filter(e => e !== "storeBuyAll");

        if (PRM.arrayCommonInTheSameOrder(upgrades_order, upgrades_order_on_page))
            return;

        // Only sort when the order is different
        let divTechUpgrades = document.querySelector("#techUpgrades");
        let divUpgrades = document.querySelector("#upgrades");
        upgrades.reverse().forEach((upgrade) => {
            if (upgrade.pool === "tech")
                divTechUpgrades.prepend(upgrade.l);
            else { // "" | "cookie" | "debug" | "prestige"
                divUpgrades.prepend(upgrade.l);
            }
        });
        var buyAllBar = l("storeBuyAll");
        if (buyAllBar) divUpgrades.prepend(buyAllBar);
    },

    reorderBuildings: function (/** @type {Building[]} */ buildings) {
        let buildings_order = buildings.map(e => e.l.id);
        let building_order_on_page = [...document.querySelectorAll(".product:not(.toggledOff)")].map(e => e.id).filter(e => e !== "storeBulk");

        if (PRM.arrayCommonInTheSameOrder(buildings_order, building_order_on_page))
            return;

        // Only sort when the order is different
        var product = document.querySelector("#products");
        buildings.reverse().forEach((building) => {
            product.prepend(building.l);
        });
        var bulkBar = l("storeBulk");
        if (bulkBar) product.prepend(bulkBar);
    },

    updateUI: function () {
        // 2 locked buildings will shows on list, so they are included in the sort, too.
        let visibleBuildingSize = document.querySelectorAll(".product:not(.toggledOff)").length;
        let buildings = [...Game.ObjectsById].slice(0, visibleBuildingSize);
        let upgrades = [...Game.UpgradesInStore];
        let all = [...buildings, ...upgrades];

        // Calculate BestCpsAcceleration
        for (let me of all) PRM.updateBestCpsAcceleration(me);

        // Sorting by BestCpsAcceleration
        all.sort((a, b) => b.BestCpsAcceleration - a.BestCpsAcceleration);

        PRM.updateHelperOrder(all);

        // Build chroma color render function
        PRM.updateColorRender(all);

        // Normalized Notation by Mean
        let allAcc = all.map(e => e.BestCpsAcceleration).filter(e => e !== 0);
        if (allAcc.length === 0) return;
        const avg = allAcc.reduce((a, b) => a + b, 0) / allAcc.length;

        // Notation for upgrades & buildings
        all.forEach(me => PRM.updateNotation(me, avg));
        // if there is only non-acc upgrade(s), add empty element placeholder to avoid mainLoop trigger
        if (!l("upgradeAcc0")) {
            let span = document.createElement("span");
            span.id = "upgradeAcc0";
            l("upgrade0").appendChild(span);
        }


        // Sort upgrades & buildings (or leave them as default)
        if (PRM.config.enableSort) {
            var sortFunction = function ( /** @type {(Building | Upgrade)} */a, /** @type {(Building | Upgrade)} */b) {
                return (
                    +!PRM.isIgnored(b) - +!PRM.isIgnored(a) ||
                    b.BestHelperOrder - a.BestHelperOrder ||
                    b.BestCpsAcceleration - a.BestCpsAcceleration
                );
            };
            upgrades.sort(sortFunction);
            buildings.sort(sortFunction);
        }

        PRM.reorderUpgrades(upgrades);
        PRM.reorderBuildings(buildings);
    },

    addOptionsMenu: function () {
        const body = `
        <div class="listing">
            ${PRM.button("enableSort", "Sort by best deal ON", "Sort by best deal OFF")}
        </div>
        <div class="listing">
            ${PRM.button("sort Grandmapocalypse", 'Sort Grandmapocalypse ON', 'Sort Grandmapocalypse OFF')}
        </div>
        <div class="listing">
            ${PRM.button(
            "sortWizardTower",
            `Sort ${Game.Objects["Wizard tower"].dname} ON`,
            `Sort ${Game.Objects["Wizard tower"].dname} OFF`)}
        </div>
        <div class="listing">
            ${PRM.button("isBanking", "Banking cookies ON", "Banking cookies OFF")}
            ${PRM.numberInput("bankingSeconds")}<label>(items will get locked to keep at least X second of cookies in bank. 6000 CpS(42000 with Get Lucky upgrade) for maximum Lucky! payout; 43200 CpS(302400 with Get Lucky upgrade) for maximum Cookie chain payout)</label>
        </div>
        <div class="listing">
            ${PRM.intervalInput("updateMS", "Update Interval(ms)")}<label>(increase it if game lags)</label>
        </div>
        <div class="listing">
            ${PRM.colorPicker("color0")}<label>(best deal color)</label>
        </div>
        <div class="listing">
            ${PRM.colorPicker("color1")}<label>(2nd deal color)</label>
        </div>
        <div class="listing">
            ${PRM.colorPicker("color7")}<label>(8st deal color)</label>
        </div>
        <div class="listing">
            ${PRM.colorPicker("color15")}<label>(16st deal color)</label>
        </div>
        <div class="listing">
            ${PRM.colorPicker("colorLast")}<label>(worst deal color)</label>
        </div>`;

        CCSE.AppendCollapsibleOptionsMenu(PRM.displayname, body);
    },

    /**
     * 
     * @param {string} config 
     * @param {string} textOn 
     * @param {string} textOff 
     * @returns 
     */
    button: function (config, textOn, textOff) {
        const name = `PRM${config}Button`;
        const callback = `PRM.buttonCallback('${config}', '${name}', '${textOn}', '${textOff}');`;
        const value = PRM.config[config];
        return `<a class="smallFancyButton prefButton ${value ? "option" : "option off"}" id="${name}" ${Game.clickStr}="${callback}">${value ? textOn : textOff}</a>`;
    },

    /**
     * @param {string} config
     * @param {string} buttonID
     * @param {string} textOn
     * @param {string} textOff
     */
    buttonCallback: function (config, buttonID, textOn, textOff) {
        const value = !PRM.config[config];
        PRM.config[config] = value;
        l(buttonID).innerHTML = value ? textOn : textOff;
        l(buttonID).className = `smallFancyButton prefButton ${value ? "option" : "option off"}`;
        PlaySound("snd/tick.mp3");
    },

    /**
     * 
     * @param {string} config 
     * @returns {string}
     */
    numberInput: function (config) {
        const ID = `PRM${config}Input`;
        const callback = `PRM.textInputCallback('${config}', '${ID}');`;
        const value = PRM.config[config];
        return `<input type="number" min="0" style="width:6em;" id="${ID}" value="${value}" onchange="${callback}" onkeypress="this.onchange();" onpaste="this.onchange();" oninput="this.onchange();">`;
    },

    /**
     * 
     * @param {string} config
     * @param {string} name
     * @param {number} min
     * @param {number} step
     * @returns {string}
     */
    intervalInput: function (config, name, min = 500, max = 5000, step = 100) {
        const ID = `PRM${config}Input`;
        const callback = `PRM.textInputCallback('${config}', '${ID}Slider');` +
            `l('${ID}RightText').innerHTML=l('${ID}Slider').value+'ms';`;
        const value = PRM.config[config];
        return `<div class="sliderBox">
            <div id="${ID}" style="float:left;" class="smallFancyButton">${name}</div>
            <div id="${ID}RightText" style="float:right;" class="smallFancyButton">${value}ms</div>
            <input id="${ID}Slider" class="slider" style="clear:both;" type="range" min="${min}" max="${max}" step="${step}" value="${value}" onchange="${callback}" oninput="this.onchange();">
            </div>`;
    },

    /**
     * @param {string} config
     * @param {string} ID
     */
    textInputCallback: function (config, ID) {
        l(ID).value = l(ID).value.replace(/[^0-9]/g, "");
        const value = l(ID).value;
        PRM.config[config] = parseInt(value);
    },

    /**
     * 
     * @param {string} config 
     * @returns {string}
     */
    colorPicker: function (config) {
        const pickerID = `PRM${config}Picker`;
        const callback = `PRM.colorPickerCallback('${config}', '${pickerID}');`;
        const defaultColor = PRM.default_config[config];
        const reset = `PRM.config.${config}='${defaultColor}';l('${pickerID}').value='${defaultColor}';`;
        const value = PRM.config[config];
        return `<input type="color" id="${pickerID}" value=${value} oninput="${callback}"> <a class="option" ${Game.clickStr}="${reset}">Reset</a>`;
    },

    /** 
     * @param {string} config 
     * @param {string} pickerID
     */
    colorPickerCallback: function (config, pickerID) {
        const value = l(pickerID).value;
        PRM.config[config] = value;
    }
};

// Bind methods
const methods = Object.getOwnPropertyNames(PRM).filter(
    m => typeof PRM[m] === "function"
);
for (var func of methods) {
    PRM[func] = PRM[func].bind(PRM);
}

// Load mod
if (!PRM.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        PRM.register();
    } else {
        if (!CCSE) {
            // @ts-ignore
            var CCSE = {}; // use var here, or it may cause loading error
        }
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(PRM.register);
    }
}
