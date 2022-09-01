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
 * @property {Object[]} CpsAchievements
 * @property {Object} GrandmaSynergies.buildingTie
 * @property {String[]} GrandmaSynergies
 * @property {number} GrandmaSynergies.buildingTie.storedTotalCps
 * @property {Object.<string, Building>} Objects
 * @property {Object.<string,Tier>} Tiers
 * @property {Upgrade[]} UpgradesById
 * @property {Building[]} ObjectsById
 * @property {(Upgrade)[]} UpgradesInStore
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

var BestDealHelper_default_config = {
    enableSort: 1,
    sortGrandmapocalypse: 1,
    sortWizardTower: 1,
    sortIdleverse: 1,
    color0: "#00ffff",
    color1: "#00ff00",
    color7: "#ffd939",
    color15: "#ff4d4d",
    colorLast: "#de4dff",
    isBanking: 0,
    bankingSeconds: 0,
    updateMS: 1000,
};

var BestDealHelper = {
    name: "BestDealHelper",
    isLoaded: false,
    load_chroma: false,
    loopCount: 0,
    last_cps: 0,
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
        Game.RebuildUpgrades = function () { OriginalRebuildUpgrades(); BestDealHelper.mainLoop(); };
        // Hook: wrap Game.RefreshStore
        var OriginalRefreshStore = Game.RefreshStore;
        Game.RefreshStore = function () { OriginalRefreshStore(); BestDealHelper.mainLoop(); };
        // Check changes from time to time
        setTimeout(function () {
            setTimeout(BestDealHelper.tick, BestDealHelper.config.updateMS / 10);
        }, 500);
        BestDealHelper.isLoaded = true;
    },

    config: { ...BestDealHelper_default_config },
    last_config: { ...BestDealHelper_default_config },

    load: function (/** @type {string} */ str) {
        const config = JSON.parse(str);
        for (const c in config) {
            if (BestDealHelper.config.hasOwnProperty(c)) {
                BestDealHelper.config[c] = config[c];
            }
        }
        BestDealHelper.updateUI();
    },

    save: function () {
        return JSON.stringify(BestDealHelper.config);
    },

    tick: function () {
        BestDealHelper.loopCount++;
        BestDealHelper.mainLoop();
        setTimeout(BestDealHelper.tick, BestDealHelper.config.updateMS / 10);
    },

    mainLoop: function () {
        if (BestDealHelper.loopCount >= 10 ||
            BestDealHelper.last_cps !== Game.cookiesPs ||
            !document.querySelector("#productAcc0") ||
            (l("upgrade0") && !l("upgradeAcc0")) ||
            JSON.stringify(BestDealHelper.config) !== JSON.stringify(BestDealHelper.last_config)
        ) {
            BestDealHelper.updateUI();
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
        /** @type {SimulateStatus} */ sim
    ) {
        const bank = BestDealHelper.config.isBanking * BestDealHelper.config.bankingSeconds * oldCps;
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
            (!BestDealHelper.config.sortGrandmapocalypse && ["One mind", "Communal brainsweep", "Elder Pact"].includes(me.name)) ||
            (!BestDealHelper.config.sortWizardTower && me.name == "Wizard tower") ||
            (!BestDealHelper.config.sortIdleverse && me.name == "Idleverse") ||
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
        if (BestDealHelper.isIgnored(me) || Game.cookies === 0) return;

        const oldCps = Game.cookiesPs;
        var /** @type {SimulateStatus} */ sim = BestDealHelper.initSimData();

        const save = BestDealHelper.enterSandBox(me);

        if (me.type == "upgrade") {
            // Simulate upgrade
            BestDealHelper.calcCookieTimesCost(me.getPrice(), Game.cookiesPs, sim);
            me.amount++;
            me.bought++;
            Game.CalculateGains();
            me.BestWaitTime = sim.waitTime + sim.paidCookies / Game.cookiesPs;
            me.BestCpsAcceleration = (Game.cookiesPs - oldCps) / me.BestWaitTime;
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
                BestDealHelper.calcCookieTimesCost(me.getPrice(), Game.cookiesPs, sim);
                me.amount++;
                me.bought++;
                Game.CalculateGains();
                if (nextTierUpgrade && me.amount == amountToUnlockTier) {
                    BestDealHelper.calcCookieTimesCost(nextTierUpgrade.getPrice(), Game.cookiesPs, sim);
                    nextTierUpgrade.bought = 1;
                    Game.CalculateGains();
                }
                const waitTime = sim.waitTime + sim.paidCookies / Game.cookiesPs;
                const cpsAcceleration = (Game.cookiesPs - oldCps) / waitTime;
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
        BestDealHelper.leaveSandBox(save);
    },

    /**
     * If the best BestCpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
     */
    updateHelperOrder: function (/** @type {(Building | Upgrade)[]} */ all) {
        all.forEach(e => e.BestHelperOrder = 0);
        all = all.filter(e => !BestDealHelper.isIgnored(e));

        let helperOrder = 0;
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
                const save = BestDealHelper.enterSandBox(me);

                let /** @type {SimulateStatus} */ sim = BestDealHelper.initSimData();

                me.timeToTargetCookie = Infinity;
                for (var buy = 1; buy < Infinity; buy++) {
                    BestDealHelper.calcCookieTimesCost(me.getPrice(), Game.cookiesPs, sim);
                    me.amount++;
                    me.bought++;
                    Game.CalculateGains();
                    // Calculate time to target with current deal stack
                    let simTarget = Object.assign({}, sim);
                    BestDealHelper.calcCookieTimesCost(target.getPrice(), Game.cookiesPs, simTarget);
                    if (simTarget.waitTime >= target.timeToTargetCookie || simTarget.waitTime >= me.timeToTargetCookie) {
                        break;
                    } else {
                        me.timeToTargetCookie = simTarget.waitTime;
                        me.BestHelperAmount = me.amount;
                    }
                    // Skip calculate buying upgrade multiple times
                    if (me.type == "upgrade") break;
                }

                BestDealHelper.leaveSandBox(save);
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
            span.style.color = BestDealHelper.colorRender(value);
        } catch (e) { }
    },

    updateColorRender: function (
        /** @type {(Building|Upgrade)[]} */all
    ) {
        let cpsAccList = [...new Set(all.map(e => e.BestCpsAcceleration))].sort((a, b) => b - a);
        const colorGroups = [
            [BestDealHelper.config.colorLast, cpsAccList[cpsAccList.length - 1]],
            [BestDealHelper.config.color15, cpsAccList[15]],
            [BestDealHelper.config.color7, cpsAccList[7]],
            [BestDealHelper.config.color1, cpsAccList[1]],
            [BestDealHelper.config.color0, cpsAccList[0]],
        ].filter(e => e[1] !== undefined);
        // @ts-ignore
        BestDealHelper.colorRender = chroma.scale(colorGroups.map(e => e[0])).mode("lab").domain(colorGroups.map(e => e[1]));
    },


    calcWaitingTime: function (
        /** @type {(Building|Upgrade)}*/ me
    ) {
        const bank = BestDealHelper.config.isBanking * BestDealHelper.config.bankingSeconds * Game.cookiesPs;
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
        me.waitingTime = BestDealHelper.calcWaitingTime(me);
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
                span.style.left = "-3px";
                span.style.textShadow = "0px 2px 6px #000, 0px 1px 1px #000";
                span.style.transform = "scale(0.8,1)";
                span.style.zIndex = "20";
                me.l.appendChild(span);
            }

            // Text
            if (me.BestCpsAcceleration === 0) {
                span.textContent = "";
            } else {
                span.textContent = Beautify(me.BestCpsAcceleration * 100 / avgAcc, 1) + "%";
                if (me.waitingTime) span.innerHTML = me.waitingTime + "<br>" + span.textContent;
                if (me.BestHelperOrder) {
                    BestDealHelper.colorSpanInRainbow(span);
                } else {
                    BestDealHelper.colorSpanByValue(span, me.BestCpsAcceleration);
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
                BestDealHelper.insertAfter(span, l("productPrice" + me.id));
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
                if (me.waitingTime) span.textContent += " ⏳" + me.waitingTime;
                if (me.BestHelperOrder) {
                    BestDealHelper.colorSpanInRainbow(span);
                } else {
                    BestDealHelper.colorSpanByValue(span, me.BestCpsAcceleration);
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

        if (BestDealHelper.arrayCommonInTheSameOrder(upgrades_order, upgrades_order_on_page))
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

        if (BestDealHelper.arrayCommonInTheSameOrder(buildings_order, building_order_on_page))
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
        for (let me of all) BestDealHelper.updateBestCpsAcceleration(me);

        // Sorting by BestCpsAcceleration
        all.sort((a, b) => b.BestCpsAcceleration - a.BestCpsAcceleration);

        // If the best BestCpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
        BestDealHelper.updateHelperOrder(all);

        // Build chroma color render function
        BestDealHelper.updateColorRender(all);

        // Normalized Notation by Mean
        let allAcc = all.map(e => e.BestCpsAcceleration).filter(e => e !== 0);
        if (allAcc.length === 0) return;
        const avg = allAcc.reduce((a, b) => a + b, 0) / allAcc.length;

        // Notation for upgrades & buildings
        all.forEach(me => BestDealHelper.updateNotation(me, avg));
        // if there is only non-acc upgrade(s), add empty element placeholder to avoid mainLoop trigger
        if (!l("upgradeAcc0")) {
            let span = document.createElement("span");
            span.id = "upgradeAcc0";
            l("upgrade0").appendChild(span);
        }


        // Sort upgrades & buildings (or leave them as default)
        if (BestDealHelper.config.enableSort) {
            var sortFunction = function ( /** @type {(Building | Upgrade)} */a, /** @type {(Building | Upgrade)} */b) {
                return (
                    +!BestDealHelper.isIgnored(b) - +!BestDealHelper.isIgnored(a) ||
                    b.BestHelperOrder - a.BestHelperOrder ||
                    b.BestCpsAcceleration - a.BestCpsAcceleration
                );
            };
            upgrades.sort(sortFunction);
            buildings.sort(sortFunction);
        }

        BestDealHelper.reorderUpgrades(upgrades);
        BestDealHelper.reorderBuildings(buildings);
    },

    addOptionsMenu: function () {
        const body = `
        <div class="listing">
            ${BestDealHelper.button("enableSort", "Sort by best deal ON", "Sort by best deal OFF")}
        </div>
        <div class="listing">
            ${BestDealHelper.button("sortGrandmapocalypse", 'Sort grandmapocalypse ON', 'Sort grandmapocalypse OFF')}
        </div>
        <div class="listing">
            ${BestDealHelper.button("sortWizardTower", "Sort wizard tower ON", "Sort wizard tower OFF")}
        </div>
        <div class="listing">
            ${BestDealHelper.button("sortIdleverse", "Sort idleverse ON", "Sort idleverse OFF")}
        </div>
        <div class="listing">
            ${BestDealHelper.button("isBanking", "Banking cookies ON", "Banking cookies OFF")}
            ${BestDealHelper.numberInput("bankingSeconds")}<label>(seconds of cookies. 6000 without lucky upgrade; 42000 with luck upgrade)</label>
        </div>
        <div class="listing">
            ${BestDealHelper.intervalInput("updateMS", "Update Interval(ms)")}<label>(increase it if game lags)</label>
        </div>
        <div class="listing">
            ${BestDealHelper.colorPicker("color0")}<label>(best deal color)</label>
        </div>
        <div class="listing">
            ${BestDealHelper.colorPicker("color1")}<label>(2nd deal color)</label>
        </div>
        <div class="listing">
            ${BestDealHelper.colorPicker("color7")}<label>(8st deal color)</label>
        </div>
        <div class="listing">
            ${BestDealHelper.colorPicker("color15")}<label>(16st deal color)</label>
        </div>
        <div class="listing">
            ${BestDealHelper.colorPicker("colorLast")}<label>(worst deal color)</label>
        </div>`;

        CCSE.AppendCollapsibleOptionsMenu(BestDealHelper.name, body);
    },

    /**
     * 
     * @param {string} config 
     * @param {string} textOn 
     * @param {string} textOff 
     * @returns 
     */
    button: function (config, textOn, textOff) {
        const name = `BestDealHelper${config}Button`;
        const callback = `BestDealHelper.buttonCallback('${config}', '${name}', '${textOn}', '${textOff}');`;
        const value = BestDealHelper.config[config];
        return `<a class="smallFancyButton prefButton ${value ? "option" : "option off"}" id="${name}" ${Game.clickStr}="${callback}">${value ? textOn : textOff}</a>`;
    },

    /**
     * @param {string} config
     * @param {string} buttonID
     * @param {string} textOn
     * @param {string} textOff
     */
    buttonCallback: function (config, buttonID, textOn, textOff) {
        const value = !BestDealHelper.config[config];
        BestDealHelper.config[config] = value;
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
        const ID = `BestDealHelper${config}Input`;
        const callback = `BestDealHelper.textInputCallback('${config}', '${ID}');`;
        const value = BestDealHelper.config[config];
        return `<input type="number" min="0" style="width:4em;" id="${ID}" value="${value}" onchange="${callback}" onkeypress="this.onchange();" onpaste="this.onchange();" oninput="this.onchange();">`;
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
        const ID = `BestDealHelper${config}Input`;
        const callback = `BestDealHelper.textInputCallback('${config}', '${ID}Slider');` +
            `l('${ID}RightText').innerHTML=l('${ID}Slider').value+'ms';`;
        const value = BestDealHelper.config[config];
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
        BestDealHelper.config[config] = parseInt(value);
    },

    /**
     * 
     * @param {string} config 
     * @returns {string}
     */
    colorPicker: function (config) {
        const pickerID = `BestDealHelper${config}Picker`;
        const callback = `BestDealHelper.colorPickerCallback('${config}', '${pickerID}');`;
        const defaultColor = BestDealHelper_default_config[config];
        const reset = `BestDealHelper.config.${config}='${defaultColor}';l('${pickerID}').value='${defaultColor}';`;
        const value = BestDealHelper.config[config];
        return `<input type="color" id="${pickerID}" value=${value} oninput="${callback}"> <a class="option" ${Game.clickStr}="${reset}">Reset</a>`;
    },

    /** 
     * @param {string} config 
     * @param {string} pickerID
     */
    colorPickerCallback: function (config, pickerID) {
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
