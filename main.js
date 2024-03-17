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
 * @property {DOMTokenList} classList
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

/** @type {any} */
var CCSE;
/** @type {App} */
var App;
/** @type {Game} */
var Game;

LoadScript(App.mods.BestDealHelper.dir + "/chroma.min.js");

class PaybackRateMod {
    constructor() {
        this.displayname = "Payback Rate Mod";
        this.name = "Best Deal Helper"; // the original name of the mod, keep for save compatibility
        this.version = "2048.07";
        this.isLoaded = false;
        this.load_chroma = false;
        this.tickCount = 0;
        this.last_cps = 0;
        this.Upgrades = new Map();
        this.default_config = {
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
        };
    }

    register() {
        Game.registerMod(this.name, this);
    }

    init() {
        // iterable Updates
        const buildMap = (/** @type {Upgrade[]} */ obj) => Object.keys(obj).reduce((map, key) => map.set(key, obj[key]), new Map());
        this.Upgrades = buildMap(Game.UpgradesById);

        // UI: add Version to status page
        Game.customStatsMenu.push(() => {
            CCSE.AppendStatsVersionNumber(this.displayname, this.version);
        });

        // UI: add menu to config page
        Game.customOptionsMenu.push(this.addOptionsMenu.bind(this));

        // UI: patch building list layout
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
          .product .content {
            padding-top: 0px;
          }
          .price::before {
            top: 0px;
          }
        `;
        document.head.appendChild(styleElement);

        // Hook: wrap Game.RebuildUpgrades
        const OriginalRebuildUpgrades = Game.RebuildUpgrades;
        Game.RebuildUpgrades = () => {
            OriginalRebuildUpgrades();
            this.checkUpdateUI();
        };

        // Hook: wrap Game.RefreshStore
        const OriginalRefreshStore = Game.RefreshStore;
        Game.RefreshStore = () => {
            OriginalRefreshStore();
            this.checkUpdateUI();
        };

        // Hook: wrap Game.ClickProduct
        Game.ClickProduct = (/** @type {Number} */ what) => {
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

        this.config = { ...this.default_config };
        this.last_config = { ...this.default_config };
        this.isLoaded = true;

        // call this.tick after 500ms to avoid Game not fully loaded
        this.tick();
    }

    load(/** @type {string} */ str) {
        const config = JSON.parse(str);
        for (const c in config) {
            if (this.config.hasOwnProperty(c)) {
                this.config[c] = config[c];
            }
        }
        this.updateUI();
    }

    save() {
        return JSON.stringify(this.config);
    }
    checkUpdateUI() {
        if (this.last_cps !== Game.cookiesPs) {
            // console.log("PaybackRateMod cookiesPs changed");
            this.last_cps = Game.cookiesPs;
            this.updateUI();
        } else if (JSON.stringify(this.config) !== JSON.stringify(this.last_config)) {
            // console.log("PaybackRateMod config changed");
            this.last_config = { ...this.config };
            this.updateUI();
        } else if (!document.querySelector("#productAcc0") || (l("upgrade0") && !l("upgradeAcc0"))) {
            // console.log("PaybackRateMod UI init");
            this.updateUI();
        }
    }

    tick() {
        this.tickCount++;
        if (this.tickCount >= 10) {
            // console.log("PaybackRateMod updateMS triggered");
            this.updateUI();
        } else {
            this.checkUpdateUI();
        }
        setTimeout(this.tick.bind(this), this.config.updateMS / 10);
    }

    insertAfter(
        /** @type {any} */ newNode,
        /** @type {any} */ referenceNode
    ) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    getBankCookies() {
        return this.config.isBanking * this.config.bankingSeconds * Game.cookiesPsRaw;
    }

    calcCookieTimesCost(
        /** @type {number} */ price,
        /** @type {number} */ oldCps,
        /** @type {SimulateStatus} */ sim
    ) {
        const bank = this.getBankCookies();
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
    }

    isIgnored(/** @type {(Building|Upgrade)} */ me) {
        return (
            (!this.config.sortGrandmapocalypse && ["One mind", "Communal brainsweep", "Elder Pact"].includes(me.name)) ||
            (!this.config.sortWizardTower && me.name == "Wizard tower") ||
            me.pool === "toggle" ||
            (me.isVaulted && me.isVaulted())
        );
    }

    enterSandBox(/** @type {(Building|Upgrade)} */me) {
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
    }

    leaveSandBox(/** @type {SandBoxData} */ save) {
        save.item.amount = save.amount;
        save.item.bought = save.bought;
        Game.CpsAchievements = save.CpsAchievements;
        Game.cookiesPsRawHighest = save.cookiesPsRawHighest;
        Game.Win = save.Win;
        Game.Logic = save.Logic;
        Game.CalculateGains();
    }

    initSimData() {
        var /** @type {SimulateStatus} */ sim = {
            originalCookies: Game.cookies,
            currentCookies: Game.cookies,
            paidCookies: 0,
            waitTime: 0,
        };
        return sim;
    }

    updateBestCpsAcceleration(/** @type {(Building|Upgrade)} */ me) {
        me.BestCpsAcceleration = 0;
        me.BestBuyToAmount = 0;
        me.BestWaitTime = Infinity;

        // Treat Grandmapocalypse upgrade as 0% temporary
        if (this.isIgnored(me) || Game.cookies === 0) return;

        const oldCps = Game.unbuffedCps;
        var /** @type {SimulateStatus} */ sim = this.initSimData();

        const save = this.enterSandBox(me);

        if (me.type == "upgrade") {
            // Simulate upgrade
            this.calcCookieTimesCost(me.getPrice(), Game.unbuffedCps, sim);
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
                this.calcCookieTimesCost(me.getPrice(), Game.unbuffedCps, sim);
                me.amount++;
                me.bought++;
                Game.CalculateGains();
                if (nextTierUpgrade && me.amount == amountToUnlockTier) {
                    this.calcCookieTimesCost(nextTierUpgrade.getPrice(), Game.unbuffedCps, sim);
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
        this.leaveSandBox(save);
    }

    /**
     * If the best BestCpsAcceleration is not affordable, search pre-deals to help us get the best deal quicker.
     */
    updateHelperOrder(/** @type {(Building | Upgrade)[]} */ all) {
        all.forEach(e => e.BestHelperOrder = 0);
        all = all.filter(e => !this.isIgnored(e));

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
                const save = this.enterSandBox(me);

                let /** @type {SimulateStatus} */ sim = this.initSimData();

                me.timeToTargetCookie = Infinity;
                for (var buy = 1; buy < Infinity; buy++) {
                    this.calcCookieTimesCost(me.getPrice(), Game.unbuffedCps, sim);
                    me.amount++;
                    me.bought++;
                    Game.CalculateGains();
                    // Calculate time to target with current deal stack
                    let simTarget = Object.assign({}, sim);
                    this.calcCookieTimesCost(target.getPrice(), Game.unbuffedCps, simTarget);
                    if (simTarget.waitTime >= target.timeToTargetCookie || simTarget.waitTime >= me.timeToTargetCookie) {
                        break;
                    } else {
                        me.timeToTargetCookie = simTarget.waitTime;
                        me.BestHelperAmount = me.amount;
                    }
                    // Skip calculate buying upgrade multiple times
                    if (me.type == "upgrade") break;
                }

                this.leaveSandBox(save);
            }

            helpers.sort((a, b) => a.timeToTargetCookie - b.timeToTargetCookie);
            if (helpers[0].timeToTargetCookie >= target.timeToTargetCookie) return;
            helperOrder++;
            helpers[0].BestHelperOrder = helperOrder;
            target = helpers[0];
        }
    }

    colorSpanInRainbow(/** @type {HTMLSpanElement} */ span) {
        let text = span.innerText;
        span.innerHTML = "";
        for (let i = 0; i < text.length; i++) {
            let charElem = document.createElement("span");
            charElem.style.color = "hsl(" + (360 * i / text.length) + ",90%,80%)";
            charElem.innerHTML = text[i];
            span.appendChild(charElem);
        }
    }

    colorSpanByValue(
        /** @type {HTMLSpanElement} */ span,
        /** @type {number} */ value
    ) {
        try {
            span.style.color = this.colorRender(value);
        } catch (e) { }
    }

    updateColorRender(
        /** @type {(Building|Upgrade)[]} */all
    ) {
        let cpsAccList = [...new Set(all.map(e => e.BestCpsAcceleration))].sort((a, b) => b - a);
        const colorGroups = [
            [this.config.colorLast, cpsAccList[cpsAccList.length - 1]],
            [this.config.color15, cpsAccList[15]],
            [this.config.color7, cpsAccList[7]],
            [this.config.color1, cpsAccList[1]],
            [this.config.color0, cpsAccList[0]],
        ].filter(e => e[1] !== undefined);
        // @ts-ignore
        this.colorRender = chroma.scale(colorGroups.map(e => e[0])).mode("lab").domain(colorGroups.map(e => e[1]));
    }


    calcWaitingTime(
        /** @type {(Building|Upgrade)}*/ me
    ) {
        const bank = this.getBankCookies();
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
    }

    updateNotation(
        /** @type {(Building | Upgrade)} */ me,
        /** @type {number} */ avgAcc
    ) {
        me.waitingTime = this.calcWaitingTime(me);
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
                    this.colorSpanInRainbow(span);
                } else {
                    this.colorSpanByValue(span, me.BestCpsAcceleration);
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
                this.insertAfter(span, l("productPrice" + me.id));
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
                    this.colorSpanInRainbow(span);
                } else {
                    this.colorSpanByValue(span, me.BestCpsAcceleration);
                }
            }
        }


    }

    arrayCommonInTheSameOrder(
        /** @type {*[]}*/ a,
        /** @type {*[]}*/ b
    ) {
        a = a.filter(e => b.includes(e));
        b = b.filter(e => a.includes(e));
        return a.every((value, index) => value === b[index]);
    }

    reorderUpgrades(/** @type {(Upgrade)[]} */ upgrades) {
        upgrades = upgrades.filter(e => !e.isVaulted() && e.pool !== "toggle");
        let upgrades_order = upgrades.map(e => e.l.id);
        let upgrades_order_on_page = [...document.querySelectorAll(".upgrade")].map(e => e.id).filter(e => e !== "storeBuyAll");

        // Only sort when the order is different
        if (this.arrayCommonInTheSameOrder(upgrades_order, upgrades_order_on_page))
            return;

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
    }

    reorderBuildings(/** @type {Building[]} */ buildings) {
        let buildings_order = buildings.map(e => e.l.id);
        let building_order_on_page = [...document.querySelectorAll(".product:not(.toggledOff)")].map(e => e.id).filter(e => e !== "storeBulk");

        if (this.arrayCommonInTheSameOrder(buildings_order, building_order_on_page))
            return;

        // Only sort when the order is different
        var product = document.querySelector("#products");
        buildings.reverse().forEach((building) => {
            product.prepend(building.l);
        });
        var bulkBar = l("storeBulk");
        if (bulkBar) product.prepend(bulkBar);
    }

    updateUI() {
        this.tickCount = 0;
        // 2 locked buildings will shows on list, so they are included in the sort, too.
        let buildings = [];
        let upgrades = [...Game.UpgradesInStore];
        for (let building of Game.ObjectsById) {
            if (!building.l.classList.contains("toggledOff")) {
                buildings.push(building);
            }
        }
        let all = [...buildings, ...upgrades];

        // Calculate BestCpsAcceleration
        all.forEach(me => this.updateBestCpsAcceleration(me));

        // Sorting by BestCpsAcceleration
        all.sort((a, b) => {
            if (a.BestCpsAcceleration === b.BestCpsAcceleration) {
                return 0;
            }
            return b.BestCpsAcceleration - a.BestCpsAcceleration;
        });

        this.updateHelperOrder(all);

        // Build chroma color render function
        this.updateColorRender(all);

        // Normalized Notation by Mean
        let allAcc = all.map(e => e.BestCpsAcceleration).filter(e => e !== 0);
        if (allAcc.length === 0) {
            return;
        }
        const avg = allAcc.reduce((a, b) => a + b, 0) / allAcc.length;

        // Notation for upgrades & buildings
        all.forEach(me => this.updateNotation(me, avg));

        // if there is only non-acc upgrade(s), add empty element placeholder to avoid mainLoop trigger
        if (!l("upgradeAcc0")) {
            const spanElement = document.createElement('span');
            spanElement.id = 'upgradeAcc0';
            l("upgrade0").appendChild(spanElement);
        }

        // Sort upgrades & buildings (or leave them as default)
        if (this.config.enableSort) {
            var sortFunction = (a, b) => {
                return (
                    Number(!this.isIgnored(b)) - Number(!this.isIgnored(a)) ||
                    b.BestHelperOrder - a.BestHelperOrder ||
                    b.BestCpsAcceleration - a.BestCpsAcceleration
                );
            };
            upgrades.sort(sortFunction);
            buildings.sort(sortFunction);
        }

        this.reorderUpgrades(upgrades);
        this.reorderBuildings(buildings);

        // if (all[0].waitingTime === "") {
        //     all[0].buy();
        // }
    }

    /**
     * Adds an options menu to the game interface for the PaybackRateMod class.
     */
    addOptionsMenu() {
        const body = `
        <div class="listing">
          ${this.toggleButton("enableSort", "Sort by payback rate")}
          ${this.toggleButton("sortGrandmapocalypse", 'Grandmapocalypse')}
          ${this.toggleButton("sortWizardTower", Game.Objects["Wizard tower"].dname)}
        </div>
        <div class="listing"></div>
        <div class="listing"></div>
        <div class="listing">
          ${this.toggleButton("isBanking", "Banking cookies")}
          ${this.numberInput("bankingSeconds")}<br>
          <label>
            Items will get locked to keep at least X second of cookies in bank.<br>
            Maximum [Lucky!] payout requires 6000 CpS <br>
            Maximum [Lucky!] payout with [Get Lucky] upgrade requires 42000 CpS<br>
            Maximum [Cookie chain] payout requires 43200 CpS<br>
            Maximum [Cookie chain] payout with [Get Lucky] upgrade requires 302400 CpS
          </label>
        </div>
        <div class="listing">
          ${this.intervalInput("updateMS", "Update Interval(ms)")}<label>(increase it if game lags)</label>
        </div>
        <div class="listing">
          ${this.colorPicker("color0")}<label>(best payback rate color)</label>
        </div>
        <div class="listing">
          ${this.colorPicker("color1")}<label>(2nd payback rate color)</label>
        </div>
        <div class="listing">
          ${this.colorPicker("color7")}<label>(8st payback rate color)</label>
        </div>
        <div class="listing">
          ${this.colorPicker("color15")}<label>(16st payback rate color)</label>
        </div>
        <div class="listing">
          ${this.colorPicker("colorLast")}<label>(worst payback rate color)</label>
        </div>`;

        CCSE.AppendCollapsibleOptionsMenu(this.displayname, body);
    }
    /**
     * 
     * @param {string} config 
     * @param {string} text
     * @returns 
     */
    toggleButton(config, text) {
        const name = `PaybackRateModButton_${config}`;
        const callback = `paybackRateMod.toggleButtonCallback('${config}', '${name}', '${text}');`;
        const value = this.config[config];
        return `<a class="smallFancyButton prefButton ${value ? "option" : "option off"}" id="${name}" ${Game.clickStr}="${callback}">${text} ${value ? "On" : "Off"}</a>`;
    }

    /**
     * @param {string} config
     * @param {string} buttonID
     * @param {string} text
     */
    toggleButtonCallback(config, buttonID, text) {
        const value = !this.config[config];
        this.config[config] = value;
        l(buttonID).innerHTML = value ? `${text} On` : `${text} Off`;
        l(buttonID).className = `smallFancyButton prefButton ${value ? "option" : "option off"}`;
        PlaySound("snd/tick.mp3");
    }

    /**
     * 
     * @param {string} config 
     * @returns {string}
     */
    numberInput(config) {
        const ID = `PaybackRateMod${config}Input`;
        const callback = `paybackRateMod.textInputCallback('${config}', '${ID}');`;
        const value = this.config[config];
        return `<input type="number" min="0" style="width:6em;" id="${ID}" value="${value}" onchange="${callback}" onkeypress="this.onchange();" onpaste="this.onchange();" oninput="this.onchange();">`;
    }

    /**
     * 
     * @param {string} config
     * @param {string} name
     * @param {number} min
     * @param {number} step
     * @returns {string}
     */
    intervalInput(config, name, min = 500, max = 5000, step = 100) {
        const ID = `PaybackRateMod${config}Input`;
        const callback = `paybackRateMod.textInputCallback('${config}', '${ID}Slider');` +
            `l('${ID}RightText').innerHTML=l('${ID}Slider').value+'ms';`;
        const value = this.config[config];
        return `<div class="sliderBox">
            <div id="${ID}" style="float:left;" class="smallFancyButton">${name}</div>
            <div id="${ID}RightText" style="float:right;" class="smallFancyButton">${value}ms</div>
            <input id="${ID}Slider" class="slider" style="clear:both;" type="range" min="${min}" max="${max}" step="${step}" value="${value}" onchange="${callback}" oninput="this.onchange();">
            </div>`;
    }

    /**
     * @param {string} config
     * @param {string} ID
     */
    textInputCallback(config, ID) {
        l(ID).value = l(ID).value.replace(/[^0-9]/g, "");
        const value = l(ID).value;
        this.config[config] = parseInt(value);
    }

    /**
     * 
     * @param {string} config 
     * @returns {string}
     */
    colorPicker(config) {
        const pickerID = `PaybackRateMod${config}Picker`;
        const callback = `paybackRateMod.colorPickerCallback('${config}', '${pickerID}');`;
        const defaultColor = this.default_config[config];
        const reset = `paybackRateMod.config.${config}='${defaultColor}';l('${pickerID}').value='${defaultColor}';`;
        const value = this.config[config];
        return `<input type="color" id="${pickerID}" value=${value} oninput="${callback}"> <a class="option" ${Game.clickStr}="${reset}">Reset</a>`;
    }

    /** 
     * @param {string} config 
     * @param {string} pickerID
     */
    colorPickerCallback(config, pickerID) {
        const value = l(pickerID).value;
        this.config[config] = value;
    }
};

// Load mod
const paybackRateMod = new PaybackRateMod();
if (!paybackRateMod.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        paybackRateMod.register();
    } else {
        if (!CCSE) {
            CCSE = {};
        }
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(() => paybackRateMod.register());
    }
}